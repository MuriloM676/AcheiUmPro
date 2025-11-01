import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// GET /api/appointments - List user's appointments
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, 
              CASE 
                WHEN a.client_id = ? THEN p.name 
                ELSE c.name 
              END as other_party_name,
              CASE 
                WHEN a.client_id = ? THEN 'provider' 
                ELSE 'client' 
              END as other_party_role
       FROM appointments a
       LEFT JOIN users c ON a.client_id = c.id
       LEFT JOIN users p ON a.provider_id = p.id
       WHERE a.client_id = ? OR a.provider_id = ?
       ORDER BY a.scheduled_date ASC`,
      [user.id, user.id, user.id, user.id]
    )

    const appointments = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      scheduled_date: row.scheduled_date,
      status: row.status,
      client_name: row.client_id === user.id ? null : row.other_party_name,
      provider_name: row.provider_id === user.id ? null : row.other_party_name
    }))

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, scheduled_date, provider_id, client_id } = await request.json()

    if (!title || !scheduled_date) {
      return NextResponse.json({ error: 'Title and scheduled_date are required' }, { status: 400 })
    }

    // If user is provider, they need client_id. If user is client, they need provider_id
    const finalClientId = user.role === 'client' ? user.id : client_id
    const finalProviderId = user.role === 'provider' ? user.id : provider_id

    if (!finalClientId || !finalProviderId) {
      return NextResponse.json({ error: 'Client and provider must be specified' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO appointments (title, description, scheduled_date, client_id, provider_id, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [title, description, scheduled_date, finalClientId, finalProviderId]
    )

    return NextResponse.json({
      id: result.insertId,
      message: 'Appointment created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
