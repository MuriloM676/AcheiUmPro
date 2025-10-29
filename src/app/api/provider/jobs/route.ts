import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get jobs where this provider has submitted proposals
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT sr.*, sp.proposed_price, sp.status as proposal_status, u.name as client_name, u.phone as client_phone
       FROM service_proposals sp
       JOIN service_requests sr ON sp.request_id = sr.id
       JOIN users u ON sr.client_id = u.id
       WHERE sp.provider_id = ?
       ORDER BY sp.created_at DESC`,
      [user.id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching provider jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
