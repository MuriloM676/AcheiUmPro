import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { triggerNotification } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let query = ''
    let params: any[] = []

    if (user.role === 'client') {
      query = `SELECT pay.id, pay.request_id, pay.amount, pay.currency, pay.status, pay.checkout_url,
                      pu.name AS provider_name, r.description, pay.created_at, pay.updated_at
                 FROM payments pay
                 JOIN requests r ON r.id = pay.request_id
                 JOIN providers p ON p.id = pay.provider_id
                 JOIN users pu ON pu.id = p.user_id
                WHERE pay.client_id = ?
                ORDER BY pay.created_at DESC`
      params = [user.id]
    } else if (user.role === 'provider') {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
        [user.id]
      )
      if (!rows.length) {
        return NextResponse.json({ payments: [] })
      }
      const providerId = rows[0].id
      query = `SELECT pay.id, pay.request_id, pay.amount, pay.currency, pay.status, pay.checkout_url,
                      uc.name AS client_name, r.description, pay.created_at, pay.updated_at
                 FROM payments pay
                 JOIN requests r ON r.id = pay.request_id
                 JOIN users uc ON uc.id = pay.client_id
                WHERE pay.provider_id = ?
                ORDER BY pay.created_at DESC`
      params = [providerId]
    } else {
      query = `SELECT pay.id, pay.request_id, pay.amount, pay.currency, pay.status, pay.checkout_url,
                      pay.provider_id, pay.client_id, pay.created_at, pay.updated_at
                 FROM payments pay
                ORDER BY pay.created_at DESC
                LIMIT 200`
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params)

    return NextResponse.json({ payments: rows })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can create payments' }, { status: 403 })
    }

    const body = await request.json()
    const requestId = Number(body.request_id)
    const amount = Number(body.amount)
    const checkoutUrl = typeof body.checkout_url === 'string' ? body.checkout_url : null

    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const [providerRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
      [user.id]
    )

    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    const providerId = providerRows[0].id

    const [requestRows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.client_id
         FROM requests r
        WHERE r.id = ? AND r.provider_id = ?
        LIMIT 1`,
      [requestId, providerId]
    )

    if (!requestRows.length) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const clientId = requestRows[0].client_id

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO payments (request_id, provider_id, client_id, amount, currency, status, checkout_url)
       VALUES (?, ?, ?, ?, 'BRL', 'awaiting_payment', ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = 'awaiting_payment', checkout_url = VALUES(checkout_url)` ,
      [requestId, providerId, clientId, amount, checkoutUrl]
    )

    let paymentId = result.insertId

    if (!paymentId) {
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM payments WHERE request_id = ? LIMIT 1',
        [requestId]
      )
      if (existing.length) {
        paymentId = existing[0].id
      }
    }

    await triggerNotification({
      userId: clientId,
      title: 'Novo pagamento disponível',
      body: 'Um novo pagamento foi gerado para sua solicitação.',
      channels: ['in_app', 'email'],
      metadata: { requestId }
    })

    return NextResponse.json({ paymentId: paymentId || null })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
