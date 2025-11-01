import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role === 'client') {
      // Get client's own requests with proposal count
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT sr.*, 
         COUNT(sp.id) as proposalCount
         FROM service_requests sr
         LEFT JOIN service_proposals sp ON sr.id = sp.request_id
         WHERE sr.client_id = ?
         GROUP BY sr.id
         ORDER BY sr.created_at DESC`,
        [user.id]
      )
      return NextResponse.json(rows)
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, category, location, budget, urgency } = await request.json()

    if (!title || !description || !category || !location || !urgency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO service_requests (client_id, title, description, category, location, budget, urgency, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [user.id, title, description, category, location, budget || null, urgency]
    )

    return NextResponse.json({ success: true, id: result.insertId })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
