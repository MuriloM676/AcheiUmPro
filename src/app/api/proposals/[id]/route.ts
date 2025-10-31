import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { triggerNotification } from '@/lib/notifications'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const resolved = await params
    const proposalId = Number(resolved.id)
    if (!proposalId) return NextResponse.json({ error: 'Invalid proposal id' }, { status: 400 })

    const body = await request.json()
    const { action } = body // action: accept | reject
    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Fetch proposal and its request
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT sp.*, sr.client_id FROM service_proposals sp JOIN service_requests sr ON sp.request_id = sr.id WHERE sp.id = ? LIMIT 1`,
      [proposalId]
    )

    if (!rows.length) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

    const proposal = rows[0]

    // Only client who owns the request or admin can accept/reject
    const isOwner = user.role === 'admin' || (user.role === 'client' && user.id === proposal.client_id)
    if (!isOwner) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

    if (action === 'accept') {
      // Start transaction: mark this proposal accepted and others rejected, update request
      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()
        await conn.query<ResultSetHeader>(`UPDATE service_proposals SET status = 'rejected' WHERE request_id = ?`, [proposal.request_id])
        await conn.query<ResultSetHeader>(`UPDATE service_proposals SET status = 'accepted' WHERE id = ?`, [proposalId])
        await conn.query<ResultSetHeader>(`UPDATE service_requests SET status = 'in_progress' WHERE id = ?`, [proposal.request_id])
        await conn.commit()
      } catch (err) {
        try { await conn.rollback() } catch(e) {}
        throw err
      } finally {
        conn.release()
      }

      // notify the provider
      try {
        await triggerNotification({
          userId: proposal.provider_id,
          title: 'Proposta aceita',
          body: `Sua proposta para a solicitação #${proposal.request_id} foi aceita.`,
          channels: ['in_app'],
          metadata: { requestId: proposal.request_id, proposalId }
        })
      } catch (err) {
        console.error('Failed to trigger notification after proposal accepted', err)
      }

      return NextResponse.json({ success: true })
    }

    // Reject
    await pool.query<ResultSetHeader>(`UPDATE service_proposals SET status = 'rejected' WHERE id = ?`, [proposalId])

    // notify provider about rejection
    try {
      await triggerNotification({
        userId: proposal.provider_id,
        title: 'Proposta rejeitada',
        body: `Sua proposta para a solicitação #${proposal.request_id} foi rejeitada.`,
        channels: ['in_app'],
        metadata: { requestId: proposal.request_id, proposalId }
      })
    } catch (err) {
      console.error('Failed to trigger notification after proposal rejected', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const resolved = await params
    const proposalId = Number(resolved.id)
    if (!proposalId) return NextResponse.json({ error: 'Invalid proposal id' }, { status: 400 })

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM service_proposals WHERE id = ? LIMIT 1`, [proposalId])
    if (!rows.length) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

    const proposal = rows[0]

    // Only provider who created the proposal or admin can delete
    if (!(user.role === 'admin' || (user.role === 'provider' && user.id === proposal.provider_id))) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    await pool.query<ResultSetHeader>(`DELETE FROM service_proposals WHERE id = ?`, [proposalId])

    // notify client owner about deletion
    try {
      const [reqRows] = await pool.query<RowDataPacket[]>(`SELECT client_id FROM service_requests WHERE id = ? LIMIT 1`, [proposal.request_id])
      if (reqRows.length) {
        await triggerNotification({
          userId: reqRows[0].client_id,
          title: 'Proposta removida',
          body: `Uma proposta para sua solicitação #${proposal.request_id} foi removida.`,
          channels: ['in_app'],
          metadata: { requestId: proposal.request_id }
        })
      }
    } catch (err) {
      console.error('Failed to notify client after proposal delete', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
