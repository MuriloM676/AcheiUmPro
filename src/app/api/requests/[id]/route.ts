import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

// PATCH /api/requests/[id] - Update request status (providers only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      return NextResponse.json({ error: 'Only providers can update requests' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get provider ID for this user
    const [providerRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM providers WHERE user_id = ?',
      [user.id]
    );

    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    const providerId = providerRows[0].id;

    // Update request only if it belongs to this provider
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE requests SET status = ? WHERE id = ? AND provider_id = ?',
      [status, params.id, providerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Request not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
