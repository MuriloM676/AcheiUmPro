import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ResultSetHeader } from 'mysql2'

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
