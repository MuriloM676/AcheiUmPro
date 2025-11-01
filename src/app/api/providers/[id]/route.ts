import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

interface ProviderRow extends RowDataPacket {
  provider_id: number
  user_id: number
  name: string
  email: string
  phone: string | null
  location: string | null
  description: string | null
  photo_url: string | null
  avg_rating: number
  reviews_count: number
  verified_count: number
}

interface ServiceRow extends RowDataPacket {
  id: number
  provider_id: number
  name: string
  price: number | null
  created_at: string
}

interface ReviewRow extends RowDataPacket {
  id: number
  provider_id: number
  client_id: number
  rating: number
  comment: string | null
  created_at: string
  client_name: string
}

interface AvailabilityRow extends RowDataPacket {
  weekday: number
  start_time: string
  end_time: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const providerId = Number(id)

    if (!providerId || Number.isNaN(providerId) || providerId <= 0) {
      return NextResponse.json({ error: 'Invalid provider id' }, { status: 400 })
    }

    const [providerRows] = await pool.query<ProviderRow[]>(
      `SELECT 
          p.id AS provider_id,
          u.id AS user_id,
          u.name,
          u.email,
          u.phone,
          u.location,
          p.description,
          p.photo_url,
          IFNULL(AVG(r.rating), 0) AS avg_rating,
          COUNT(r.id) AS reviews_count,
          (SELECT COUNT(*) FROM provider_verifications pv WHERE pv.provider_id = p.id AND pv.status = 'approved') AS verified_count
        FROM providers p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN reviews r ON r.provider_id = p.id
        WHERE p.id = ?
        GROUP BY p.id, u.id
      `,
      [providerId]
    )

    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const provider = providerRows[0]

    const [servicesRows] = await pool.query<ServiceRow[]>(
      `SELECT id, provider_id, name, price, created_at
         FROM services
        WHERE provider_id = ?
        ORDER BY name ASC`,
      [providerId]
    )

    const [reviewsRows] = await pool.query<ReviewRow[]>(
      `SELECT r.id, r.provider_id, r.client_id, r.rating, r.comment, r.created_at,
              u.name AS client_name
         FROM reviews r
         JOIN users u ON u.id = r.client_id
        WHERE r.provider_id = ?
        ORDER BY r.created_at DESC
        LIMIT 50`,
      [providerId]
    )

    const [availabilityRows] = await pool.query<AvailabilityRow[]>(
      `SELECT weekday, start_time, end_time
         FROM provider_availability
        WHERE provider_id = ?
        ORDER BY weekday, start_time`,
      [providerId]
    )

    let nextAvailability: string | null = null

    if (availabilityRows.length) {
      const weekdayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const now = new Date()
      const nowDay = now.getDay()
      const upcoming = availabilityRows
        .map((slot) => {
          const dayDiff = (slot.weekday - nowDay + 7) % 7
          return { slot, dayDiff }
        })
        .sort((a, b) => {
          if (a.dayDiff === b.dayDiff) {
            return a.slot.start_time.localeCompare(b.slot.start_time)
          }
          return a.dayDiff - b.dayDiff
        })

      if (upcoming.length) {
        const first = upcoming[0]
        nextAvailability = `${weekdayLabels[first.slot.weekday]} às ${first.slot.start_time.slice(0, 5)}`
      }
    }

    return NextResponse.json({
      provider: {
        provider_id: provider.provider_id,
        user_id: provider.user_id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        location: provider.location,
        description: provider.description,
        photo_url: provider.photo_url,
        avg_rating: Number(provider.avg_rating || 0),
        reviews_count: Number(provider.reviews_count || 0),
        is_verified: Number(provider.verified_count || 0) > 0,
        next_availability: nextAvailability
      },
      services: servicesRows,
      reviews: reviewsRows,
      availability: availabilityRows
    })
  } catch (error) {
    console.error('Error fetching provider details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
