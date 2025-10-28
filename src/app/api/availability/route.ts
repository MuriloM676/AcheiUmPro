import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

interface AvailabilitySlot {
  weekday: number
  start_time: string
  end_time: string
}

async function getProviderIdForUser(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
    [userId]
  )
  return rows.length ? rows[0].id : null
}

export async function GET(request: NextRequest) {
  try {
    const providerIdParam = request.nextUrl.searchParams.get('providerId')
    let providerId: number | null = providerIdParam ? Number(providerIdParam) : null

    if (providerIdParam && (!providerId || Number.isNaN(providerId))) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    if (!providerId) {
      const authHeader = request.headers.get('authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await getUserFromToken(token)
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      providerId = await getProviderIdForUser(user.id)
      if (!providerId) {
        return NextResponse.json({ slots: [] })
      }
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT weekday, start_time, end_time
         FROM provider_availability
        WHERE provider_id = ?
        ORDER BY weekday, start_time`,
      [providerId]
    )

    return NextResponse.json({ slots: rows })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can update availability' }, { status: 403 })
    }

    const providerId = await getProviderIdForUser(user.id)
    if (!providerId) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const slots = Array.isArray(body.slots) ? (body.slots as AvailabilitySlot[]) : []

    const validSlots = slots.filter((slot): slot is AvailabilitySlot =>
      typeof slot.weekday === 'number'
      && slot.weekday >= 0
      && slot.weekday <= 6
      && typeof slot.start_time === 'string'
      && typeof slot.end_time === 'string'
    )

    await pool.query('DELETE FROM provider_availability WHERE provider_id = ?', [providerId])

    if (validSlots.length) {
      const values = validSlots.map((slot) => [providerId, slot.weekday, slot.start_time, slot.end_time])
      await pool.query(
        'INSERT INTO provider_availability (provider_id, weekday, start_time, end_time) VALUES ?'
      , [values]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
