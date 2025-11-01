import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

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

    const unreadOnly = request.nextUrl.searchParams.get('status') === 'unread'

    let rows: RowDataPacket[] = []
    try {
      const [r] = await pool.query<RowDataPacket[]>(
        `SELECT id, channel, title, body, metadata, read_at, created_at
           FROM notifications
          WHERE user_id = ? ${unreadOnly ? 'AND read_at IS NULL' : ''}
          ORDER BY created_at DESC
          LIMIT 100`,
        [user.id]
      )
      rows = r
    } catch (err: any) {
      // If the notifications table doesn't exist, return empty list
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        rows = []
      } else {
        throw err
      }
    }

    return NextResponse.json({ notifications: rows })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const ids = Array.isArray(body.ids) ? body.ids : []

    if (!ids.length) {
      return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
    }

    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND id IN (?)`,
      [user.id, ids]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
