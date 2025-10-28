import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { queryWithRetry } from '@/lib/dbHelpers'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export const runtime = 'nodejs'

// GET /api/appointments - list appointments for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // admins see all
    let rows: RowDataPacket[] = []
    if (user.role === 'admin') {
      const [r] = await queryWithRetry(pool, `SELECT a.*, r.description FROM appointments a JOIN requests r ON r.id = a.request_id ORDER BY a.scheduled_for DESC`)
      rows = r as RowDataPacket[]
    } else {
      const [r] = await queryWithRetry(pool, `SELECT a.* FROM appointments a WHERE a.provider_id = ? OR a.client_id = ? ORDER BY a.scheduled_for DESC`, [user.id, user.id])
      rows = r as RowDataPacket[]
    }

    return NextResponse.json({ appointments: rows })
  } catch (err) {
    console.error('Error fetching appointments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/appointments - create or update appointment (client requests scheduling)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { request_id, scheduled_for } = body
    if (!request_id) return NextResponse.json({ error: 'request_id required' }, { status: 400 })

    // find the request
    const [reqRows] = await queryWithRetry(pool, 'SELECT * FROM requests WHERE id = ? LIMIT 1', [request_id])
    if (!reqRows.length) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    const req = reqRows[0]

    // only client or admin can create appointment
    if (user.role !== 'client' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only client or admin can create appointment' }, { status: 403 })
    }

    // create or update appointment row
    const [res] = await queryWithRetry(pool, `INSERT INTO appointments (request_id, provider_id, client_id, scheduled_for, status)
      VALUES (?, ?, ?, ?, 'confirmed')
      ON DUPLICATE KEY UPDATE scheduled_for = VALUES(scheduled_for), status = VALUES(status)`, [request_id, req.provider_id, req.client_id, scheduled_for || null])

    return NextResponse.json({ ok: true, appointmentId: (res as RowDataPacket).insertId || null })
  } catch (err) {
    console.error('Error creating appointment:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

