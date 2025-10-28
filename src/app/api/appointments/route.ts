import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

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
    let params: Array<number> = []

    if (user.role === 'client') {
      query = `SELECT a.id, a.request_id, a.provider_id, a.client_id, a.scheduled_for, a.status,
                      pu.name AS provider_name, pu.phone AS provider_phone
                 FROM appointments a
                 JOIN providers p ON p.id = a.provider_id
                 JOIN users pu ON pu.id = p.user_id
                WHERE a.client_id = ?
                ORDER BY a.scheduled_for DESC`
      params = [user.id]
    } else if (user.role === 'provider') {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
        [user.id]
      )
      if (!rows.length) {
        return NextResponse.json({ appointments: [] })
      }
      const providerId = rows[0].id
      query = `SELECT a.id, a.request_id, a.provider_id, a.client_id, a.scheduled_for, a.status,
                      uc.name AS client_name, uc.phone AS client_phone
                 FROM appointments a
                 JOIN users uc ON uc.id = a.client_id
                WHERE a.provider_id = ?
                ORDER BY a.scheduled_for DESC`
      params = [providerId]
    } else {
      query = `SELECT a.id, a.request_id, a.provider_id, a.client_id, a.scheduled_for, a.status
                 FROM appointments a
                ORDER BY a.scheduled_for DESC
                LIMIT 200`
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params)

    return NextResponse.json({ appointments: rows })
  } catch (error) {
    console.error('Error fetching appointments:', error)
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
    const appointmentId = Number(body.id)
    const status = typeof body.status === 'string' ? body.status : ''

    if (!appointmentId || Number.isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment id' }, { status: 400 })
    }

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    let conditions = ''
    const params: Array<string | number> = [status, appointmentId]

    if (user.role === 'provider') {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
        [user.id]
      )
      if (!rows.length) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
      }
      conditions = ' AND provider_id = ?'
      params.push(rows[0].id)
    } else if (user.role === 'client') {
      conditions = ' AND client_id = ?'
      params.push(user.id)
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE appointments SET status = ? WHERE id = ?${conditions}`,
      params
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
