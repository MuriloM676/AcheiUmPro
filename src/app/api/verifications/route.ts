import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

async function resolveProviderId(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
    [userId]
  )
  return rows.length ? rows[0].id : null
}

export async function GET(request: NextRequest) {
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

    let query = ''
    let params: any[] = []

    if (user.role === 'provider') {
      const providerId = await resolveProviderId(user.id)
      if (!providerId) {
        return NextResponse.json({ verifications: [] })
      }
      query = `SELECT id, document_type, document_url, status, notes, reviewed_by, reviewed_at, created_at
                 FROM provider_verifications
                WHERE provider_id = ?
                ORDER BY created_at DESC`
      params = [providerId]
    } else if (user.role === 'admin') {
      const statusFilter = request.nextUrl.searchParams.get('status')
      if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
        query = `SELECT pv.*, u.name AS provider_name
                   FROM provider_verifications pv
                   JOIN providers p ON p.id = pv.provider_id
                   JOIN users u ON u.id = p.user_id
                  WHERE pv.status = ?
                  ORDER BY pv.created_at DESC`
        params = [statusFilter]
      } else {
        query = `SELECT pv.*, u.name AS provider_name
                   FROM provider_verifications pv
                   JOIN providers p ON p.id = pv.provider_id
                   JOIN users u ON u.id = p.user_id
                  ORDER BY pv.created_at DESC
                  LIMIT 200`
      }
    } else {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    return NextResponse.json({ verifications: rows })
  } catch (error) {
    console.error('Error fetching verifications:', error)
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
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can submit verifications' }, { status: 403 })
    }

    const providerId = await resolveProviderId(user.id)
    if (!providerId) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const documentUrl = typeof body.document_url === 'string' ? body.document_url.trim() : ''
    const documentType = typeof body.document_type === 'string' ? body.document_type.trim() : 'documento'

    if (!documentUrl) {
      return NextResponse.json({ error: 'Informe a URL do documento' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO provider_verifications (provider_id, document_type, document_url, status)
       VALUES (?, ?, ?, 'pending')`,
      [providerId, documentType, documentUrl]
    )

    return NextResponse.json({ verificationId: result.insertId })
  } catch (error) {
    console.error('Error submitting verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
