import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

interface MetricRow extends RowDataPacket {
  total_users?: number
  total_providers?: number
  open_requests?: number
  pending_verifications?: number
}

interface TopProviderRow extends RowDataPacket {
  name: string
  avg_rating: number
  total_reviews: number
}

interface RecentReviewRow extends RowDataPacket {
  id: number
  rating: number
  comment: string | null
  created_at: string
  client_name: string
  provider_name: string
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const [[usersCount]] = await pool.query<MetricRow[]>(
      'SELECT COUNT(*) AS total_users FROM users'
    )

    const [[providersCount]] = await pool.query<MetricRow[]>(
      `SELECT COUNT(*) AS total_providers FROM providers`
    )

    const [[activeRequests]] = await pool.query<MetricRow[]>(
      `SELECT COUNT(*) AS open_requests FROM requests WHERE status IN ('pending', 'accepted')`
    )

    const [[pendingVerifications]] = await pool.query<MetricRow[]>(
      `SELECT COUNT(*) AS pending_verifications FROM provider_verifications WHERE status = 'pending'`
    )

    const [topProviders] = await pool.query<TopProviderRow[]>(
      `SELECT u.name, AVG(r.rating) AS avg_rating, COUNT(r.id) AS total_reviews
         FROM providers p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN reviews r ON r.provider_id = p.id
        GROUP BY p.id, u.name
        HAVING total_reviews > 0
        ORDER BY avg_rating DESC, total_reviews DESC
        LIMIT 5`
    )

    const [recentReviews] = await pool.query<RecentReviewRow[]>(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at,
              c.name AS client_name, pu.name AS provider_name
         FROM reviews rv
         JOIN users c ON c.id = rv.client_id
         JOIN providers p ON p.id = rv.provider_id
         JOIN users pu ON pu.id = p.user_id
        ORDER BY rv.created_at DESC
        LIMIT 10`
    )

    return NextResponse.json({
      metrics: {
        total_users: usersCount?.total_users || 0,
        total_providers: providersCount?.total_providers || 0,
        open_requests: activeRequests?.open_requests || 0,
        pending_verifications: pendingVerifications?.pending_verifications || 0
      },
      topProviders,
      recentReviews
    })
  } catch (error) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
