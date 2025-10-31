import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { triggerNotification } from '@/lib/notifications'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const resolved = await params
    const requestId = Number(resolved.id)
    if (!requestId) return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })

    // allow client (owner) or provider to view proposals
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT sp.id, sp.request_id, sp.provider_id, sp.proposed_price, sp.message, sp.status, sp.created_at, u.name as provider_name
       FROM service_proposals sp
       JOIN users u ON u.id = sp.provider_id
       WHERE sp.request_id = ?
       ORDER BY sp.created_at DESC`,
      [requestId]
    )

    // If client, ensure they own the request
    if (user.role === 'client') {
      const [rrows] = await pool.query<RowDataPacket[]>(`SELECT client_id FROM service_requests WHERE id = ?`, [requestId])
      if (!rrows.length || rrows[0].client_id !== user.id) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
      }
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error listing proposals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'provider') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolved = await params
    const requestId = Number(resolved.id)
    if (!requestId) return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })

    const body = await request.json()
    const { proposedPrice, message } = body
    if (!proposedPrice) return NextResponse.json({ error: 'Missing proposedPrice' }, { status: 400 })

    await pool.query<ResultSetHeader>(
      `INSERT INTO service_proposals (request_id, provider_id, proposed_price, message, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [requestId, user.id, proposedPrice, message || null]
    )

    // notify the client (request owner)
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`SELECT client_id FROM service_requests WHERE id = ? LIMIT 1`, [requestId])
      if (rows.length) {
        const clientId = rows[0].client_id
        await triggerNotification({
          userId: clientId,
          title: 'Nova proposta',
          body: `O prestador ${user.name} enviou uma proposta para sua solicitação.`,
          channels: ['in_app'],
          metadata: { requestId }
        })
      }
    } catch (err) {
      console.error('Failed to trigger notification after proposal creation', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
