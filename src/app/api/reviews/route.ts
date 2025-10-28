import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { z } from 'zod'

export const runtime = 'nodejs'

interface ReviewRow extends RowDataPacket {
  id: number
  provider_id: number
  client_id: number
  rating: number
  comment: string | null
  created_at: string
  client_name: string
}

const createReviewSchema = z.object({
  providerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const providerIdParam = searchParams.get('providerId')

    if (!providerIdParam) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    const providerId = Number(providerIdParam)
    if (Number.isNaN(providerId) || providerId <= 0) {
      return NextResponse.json({ error: 'Invalid providerId' }, { status: 400 })
    }

    const clientIdParam = searchParams.get('clientId')
    const params: any[] = [providerId]
    let query = `
      SELECT r.id, r.provider_id, r.client_id, r.rating, r.comment, r.created_at,
             u.name AS client_name
      FROM reviews r
      JOIN users u ON u.id = r.client_id
      WHERE r.provider_id = ?
    `

    if (clientIdParam) {
      const clientId = Number(clientIdParam)
      if (!Number.isNaN(clientId) && clientId > 0) {
        query += ' AND r.client_id = ?'
        params.push(clientId)
      }
    }

    query += ' ORDER BY r.created_at DESC'

    const [rows] = await pool.query<ReviewRow[]>(query, params)

    return NextResponse.json({ reviews: rows })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (user.role !== 'client') {
      return NextResponse.json({ error: 'Only clients can create reviews' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createReviewSchema.safeParse({
      providerId: body.provider_id ?? body.providerId,
      rating: body.rating,
      comment: body.comment ?? null
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { providerId, rating, comment } = parsed.data

    // Ensure the client has at least one completed request with this provider
    const [completedRequests] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM requests
       WHERE client_id = ? AND provider_id = ? AND status = 'completed'
       LIMIT 1`,
      [user.id, providerId]
    )

    if (!completedRequests.length) {
      return NextResponse.json({
        error: 'Você só pode avaliar prestadores após concluir um serviço'
      }, { status: 403 })
    }

    // Check if review already exists for this client/provider pair
    const [existingReviews] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE provider_id = ? AND client_id = ? LIMIT 1',
      [providerId, user.id]
    )

    if (existingReviews.length) {
      const reviewId = existingReviews[0].id

      await pool.query<ResultSetHeader>(
        'UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [rating, comment ?? null, reviewId]
      )

      return NextResponse.json({ message: 'Avaliação atualizada com sucesso' })
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)',
      [providerId, user.id, rating, comment ?? null]
    )

    return NextResponse.json({
      message: 'Avaliação criada com sucesso',
      reviewId: result.insertId
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
