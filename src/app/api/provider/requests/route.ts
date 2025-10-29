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

    // For providers: get available requests that they haven't already bid on
    if (user.role === 'provider') {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT sr.*, u.name as client_name, u.phone as client_phone 
         FROM service_requests sr 
         JOIN users u ON sr.client_id = u.id 
         WHERE sr.status = 'pending' 
         AND sr.id NOT IN (
           SELECT request_id FROM service_proposals WHERE provider_id = ?
         )
         ORDER BY sr.created_at DESC`,
        [user.id]
      )
      return NextResponse.json(rows)
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching provider requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, proposedPrice } = await request.json()

    if (!requestId || !proposedPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert proposal
    await pool.query<ResultSetHeader>(
      `INSERT INTO service_proposals (request_id, provider_id, proposed_price, status) 
       VALUES (?, ?, ?, 'pending')`,
      [requestId, user.id, proposedPrice]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
