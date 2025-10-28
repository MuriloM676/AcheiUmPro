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

    // If scheduled_for provided, validate slot and conflicts
    let scheduledSqlValue: string | null = null
    let durationMinutes = 30 // default duration
    if (scheduled_for) {
      // parse date - accept ISO or local-like strings
      const scheduledDate = new Date(scheduled_for)
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduled_for datetime' }, { status: 400 })
      }

      // extract optional duration from body (default 30min)
      if (body.duration_minutes && typeof body.duration_minutes === 'number' && body.duration_minutes > 0) {
        durationMinutes = body.duration_minutes
      }

      // helper: format to local MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
      const pad = (n: number) => String(n).padStart(2, '0')
      const localYear = scheduledDate.getFullYear()
      const localMonth = pad(scheduledDate.getMonth() + 1)
      const localDay = pad(scheduledDate.getDate())
      const localHour = pad(scheduledDate.getHours())
      const localMin = pad(scheduledDate.getMinutes())
      const localSec = pad(scheduledDate.getSeconds())
      scheduledSqlValue = `${localYear}-${localMonth}-${localDay} ${localHour}:${localMin}:${localSec}`

      // derive weekday and time string in local time
      const weekday = scheduledDate.getDay()
      const timeStr = `${localHour}:${localMin}:${localSec}`
      const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000)
      const endHour = pad(endDate.getHours())
      const endMin = pad(endDate.getMinutes())
      const endSec = pad(endDate.getSeconds())
      const endTimeStr = `${endHour}:${endMin}:${endSec}`

      // Check provider availability slots
      const [availRows] = await queryWithRetry(pool, 'SELECT start_time, end_time FROM provider_availability WHERE provider_id = ? AND weekday = ?', [req.provider_id, weekday])
      let matchesSlot = false
      for (const slot of availRows as any[]) {
        // slot.start_time/end_time are stored as 'HH:MM:SS'
        if (slot.start_time <= timeStr && slot.end_time >= endTimeStr) {
          matchesSlot = true
          break
        }
      }
      if (!matchesSlot) {
        return NextResponse.json({ error: 'Scheduled time is outside provider availability' }, { status: 400 })
      }

      // Check conflicts: overlapping appointments (start before end, end after start)
      const endSqlValue = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())} ${endHour}:${endMin}:${endSec}`
      try {
        const [conflictsProv] = await queryWithRetry(pool, `SELECT id FROM appointments WHERE provider_id = ? AND status = "confirmed" AND scheduled_for < ? AND DATE_ADD(scheduled_for, INTERVAL 30 MINUTE) > ? LIMIT 1`, [req.provider_id, endSqlValue, scheduledSqlValue])
        if (conflictsProv.length) return NextResponse.json({ error: 'Provider has a conflicting appointment' }, { status: 409 })

        const [conflictsClient] = await queryWithRetry(pool, `SELECT id FROM appointments WHERE client_id = ? AND status = "confirmed" AND scheduled_for < ? AND DATE_ADD(scheduled_for, INTERVAL 30 MINUTE) > ? LIMIT 1`, [req.client_id, endSqlValue, scheduledSqlValue])
        if (conflictsClient.length) return NextResponse.json({ error: 'Client has a conflicting appointment' }, { status: 409 })
      } catch (err) {
        console.error('Error checking appointment conflicts:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // create or update appointment row
    try {
      const [res] = await queryWithRetry(pool, `INSERT INTO appointments (request_id, provider_id, client_id, scheduled_for, status)
        VALUES (?, ?, ?, ?, 'confirmed')
        ON DUPLICATE KEY UPDATE scheduled_for = VALUES(scheduled_for), status = VALUES(status)`, [request_id, req.provider_id, req.client_id, scheduledSqlValue || null])

      return NextResponse.json({ ok: true, appointmentId: (res as RowDataPacket).insertId || null })
    } catch (err) {
      console.error('Error during appointment DB insert:', err)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } catch (err) {
    console.error('Error creating appointment:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
