import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { triggerNotification } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const paymentId = Number(params.id)
    if (!paymentId || Number.isNaN(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment id' }, { status: 400 })
    }

    const body = await request.json()
    const status = typeof body.status === 'string' ? body.status : ''

    if (!['awaiting_payment', 'paid', 'refused'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pay.id, pay.request_id, pay.provider_id, pay.client_id, p.user_id AS provider_user_id
         FROM payments pay
         JOIN providers p ON p.id = pay.provider_id
        WHERE pay.id = ?
        LIMIT 1`,
      [paymentId]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const payment = rows[0]

    if (user.role === 'client' && payment.client_id !== user.id) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    if (user.role === 'provider') {
      const [providerRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
        [user.id]
      )
      if (!providerRows.length || providerRows[0].id !== payment.provider_id) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, paymentId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

  const recipientId = user.id === payment.client_id ? payment.provider_user_id : payment.client_id
    const title = 'Atualização de pagamento'
    const messages: Record<string, string> = {
      awaiting_payment: 'O pagamento voltou para o status aguardando pagamento.',
      paid: 'O pagamento foi confirmado.',
      refused: 'O pagamento foi marcado como recusado.'
    }

    await triggerNotification({
      userId: recipientId,
      title,
      body: messages[status],
      channels: ['in_app', 'email'],
      metadata: { requestId: payment.request_id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
