import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ResultSetHeader } from 'mysql2'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const reviewId = Number(params.id)
    if (!reviewId || Number.isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM reviews WHERE id = ? LIMIT 1',
      [reviewId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
