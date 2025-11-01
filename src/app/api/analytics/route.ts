import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/analytics - Get analytics data for user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const period = parseInt(url.searchParams.get('period') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Get total earnings and services for provider
    let totalEarnings = 0
    let totalServices = 0
    let averageRating = 0

    if (user.role === 'provider') {
      // Get completed proposals (earnings)
      const [earningsRows] = await pool.query<RowDataPacket[]>(
        `SELECT SUM(sp.proposed_price) as total_earnings, COUNT(*) as total_services
         FROM service_proposals sp
         JOIN service_requests sr ON sp.request_id = sr.id
         WHERE sp.provider_id = ? AND sp.status = 'accepted' 
         AND sr.created_at >= ? AND sr.created_at <= ?`,
        [user.id, startDate, endDate]
      )

      totalEarnings = earningsRows[0]?.total_earnings || 0
      totalServices = earningsRows[0]?.total_services || 0

      // Get average rating (mock data for now)
      averageRating = 4.5 // This would come from a reviews table
    }

    // Get monthly earnings
    const [monthlyRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         DATE_FORMAT(sr.created_at, '%Y-%m') as month,
         SUM(sp.proposed_price) as earnings
       FROM service_proposals sp
       JOIN service_requests sr ON sp.request_id = sr.id
       WHERE sp.provider_id = ? AND sp.status = 'accepted'
       AND sr.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(sr.created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      [user.id]
    )

    const monthlyEarnings = monthlyRows.map(row => ({
      month: new Date(row.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      earnings: parseFloat(row.earnings || 0)
    }))

    // Get services by category
    const [categoryRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         sr.category,
         COUNT(*) as count
       FROM service_proposals sp
       JOIN service_requests sr ON sp.request_id = sr.id
       WHERE sp.provider_id = ? AND sp.status = 'accepted'
       AND sr.created_at >= ? AND sr.created_at <= ?
       GROUP BY sr.category
       ORDER BY count DESC`,
      [user.id, startDate, endDate]
    )

    const servicesByCategory = categoryRows.map(row => ({
      category: row.category,
      count: row.count
    }))

    // Get recent services
    const [recentRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         sr.id,
         sr.title,
         sp.proposed_price as amount,
         sr.created_at as date,
         sp.status
       FROM service_proposals sp
       JOIN service_requests sr ON sp.request_id = sr.id
       WHERE sp.provider_id = ?
       AND sr.created_at >= ? AND sr.created_at <= ?
       ORDER BY sr.created_at DESC
       LIMIT 10`,
      [user.id, startDate, endDate]
    )

    const recentServices = recentRows.map(row => ({
      id: row.id,
      title: row.title,
      amount: parseFloat(row.amount || 0),
      date: row.date,
      status: row.status === 'accepted' ? 'completed' : row.status
    }))

    const analytics = {
      totalEarnings,
      totalServices,
      averageRating,
      monthlyEarnings,
      servicesByCategory,
      recentServices
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
