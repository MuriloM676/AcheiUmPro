import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ResultSetHeader } from 'mysql2'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const verificationId = parseInt(id)
    if (!verificationId || Number.isNaN(verificationId)) {
      return NextResponse.json({ error: 'Invalid verification id' }, { status: 400 })
    }

    const body = await request.json()
    const status = typeof body.status === 'string' ? body.status : ''
    const notes = typeof body.notes === 'string' ? body.notes : null

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE provider_verifications
          SET status = ?,
              notes = ?,
              reviewed_by = ?,
              reviewed_at = NOW()
        WHERE id = ?`,
      [status, notes, user.id, verificationId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
