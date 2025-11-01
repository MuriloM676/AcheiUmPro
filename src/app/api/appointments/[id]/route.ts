import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// PATCH /api/appointments/[id] - Update appointment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if user has permission to update this appointment
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM appointments WHERE id = ? AND (client_id = ? OR provider_id = ?)',
      [id, user.id, user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found or access denied' }, { status: 404 })
    }

    await pool.query<ResultSetHeader>(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    )

    return NextResponse.json({ message: 'Appointment updated successfully' })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete this appointment
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM appointments WHERE id = ? AND (client_id = ? OR provider_id = ?)',
      [id, user.id, user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found or access denied' }, { status: 404 })
    }

    await pool.query<ResultSetHeader>(
      'DELETE FROM appointments WHERE id = ?',
      [id]
    )

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
