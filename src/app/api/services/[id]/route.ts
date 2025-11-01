import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

// PATCH /api/services/[id] - Update service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can update services' }, { status: 403 });
    }

    const body = await request.json();
    const { name, price } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    // Get provider ID
    const [providerRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM providers WHERE user_id = ?',
      [user.id]
    );

    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    const providerId = providerRows[0].id;

    // Update service only if it belongs to this provider
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE services SET name = ?, price = ? WHERE id = ? AND provider_id = ?',
      [name.trim(), price || null, id, providerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Service not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can delete services' }, { status: 403 });
    }

    // Get provider ID
    const [providerRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM providers WHERE user_id = ?',
      [user.id]
    );

    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    const providerId = providerRows[0].id;

    // Delete service only if it belongs to this provider
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM services WHERE id = ? AND provider_id = ?',
      [id, providerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Service not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
