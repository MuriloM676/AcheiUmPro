import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { queryWithRetry } from '@/lib/dbHelpers'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export const runtime = 'nodejs'

// GET /api/availability?provider_id=1
export async function GET(request: NextRequest) {
  try {
    const providerId = request.nextUrl.searchParams.get('provider_id')
    if (!providerId) return NextResponse.json({ error: 'provider_id required' }, { status: 400 })

    const [rows] = await queryWithRetry(pool, 'SELECT id, provider_id, weekday, start_time, end_time FROM provider_availability WHERE provider_id = ? ORDER BY weekday, start_time', [Number(providerId)])
    return NextResponse.json({ availability: rows })
  } catch (err) {
    console.error('Error fetching availability:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/availability - create slot (provider only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (user.role !== 'provider' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only providers can add availability' }, { status: 403 })
    }

    const body = await request.json()
    const { weekday, start_time, end_time } = body
    if (weekday === undefined || !start_time || !end_time) return NextResponse.json({ error: 'weekday, start_time, end_time required' }, { status: 400 })

    // ensure provider profile exists for this user
    const [providerRows] = await queryWithRetry(pool, 'SELECT id FROM providers WHERE user_id = ? LIMIT 1', [user.id])
    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }
    const providerId = providerRows[0].id

    // Insert
    const [res] = await queryWithRetry(pool, 'INSERT INTO provider_availability (provider_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)', [providerId, Number(weekday), start_time, end_time])
    return NextResponse.json({ ok: true, id: (res as ResultSetHeader).insertId })
  } catch (err) {
    console.error('Error creating availability:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/availability - body { id }
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (user.role !== 'provider' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only providers can delete availability' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Ensure ownership
    const [rows] = await queryWithRetry(pool, 'SELECT provider_id FROM provider_availability WHERE id = ? LIMIT 1', [id])
    if (!rows.length) return NextResponse.json({ error: 'Availability not found' }, { status: 404 })
    // Check ownership by mapping user -> provider
    const [provRow] = await queryWithRetry(pool, 'SELECT id FROM providers WHERE user_id = ? LIMIT 1', [user.id])
    const ownerProviderId = provRow.length ? provRow[0].id : null
    if (rows[0].provider_id !== ownerProviderId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    await queryWithRetry(pool, 'DELETE FROM provider_availability WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error deleting availability:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/availability - update slot (body { id, weekday, start_time, end_time })
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (user.role !== 'provider' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only providers can update availability' }, { status: 403 })
    }

    const body = await request.json()
    const { id, weekday, start_time, end_time } = body
    if (!id || weekday === undefined || !start_time || !end_time) return NextResponse.json({ error: 'id, weekday, start_time, end_time required' }, { status: 400 })

    const [rows] = await queryWithRetry(pool, 'SELECT provider_id FROM provider_availability WHERE id = ? LIMIT 1', [id])
    if (!rows.length) return NextResponse.json({ error: 'Availability not found' }, { status: 404 })
    const [provRow2] = await queryWithRetry(pool, 'SELECT id FROM providers WHERE user_id = ? LIMIT 1', [user.id])
    const ownerProviderId2 = provRow2.length ? provRow2[0].id : null
    if (rows[0].provider_id !== ownerProviderId2 && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    await queryWithRetry(pool, 'UPDATE provider_availability SET weekday = ?, start_time = ?, end_time = ? WHERE id = ?', [Number(weekday), start_time, end_time, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error updating availability:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
