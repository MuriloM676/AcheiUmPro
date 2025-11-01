import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    if (user.role === 'client') {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT sr.* FROM service_requests sr WHERE sr.client_id = ? ORDER BY sr.created_at DESC LIMIT 200`,
        [user.id]
      )
      return NextResponse.json({ requests: rows })
    }

    if (user.role === 'provider') {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT sr.* FROM service_requests sr WHERE sr.provider_id IN (
           SELECT id FROM providers WHERE user_id = ?
         ) ORDER BY sr.created_at DESC LIMIT 200`,
        [user.id]
      )
      return NextResponse.json({ requests: rows })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

