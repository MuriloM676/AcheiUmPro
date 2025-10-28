import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

interface Service extends RowDataPacket {
  id: number;
  provider_id: number;
  name: string;
  price: number | null;
  created_at: string;
}

// GET /api/services - List services for authenticated provider
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only providers can access services' }, { status: 403 });
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

    // Get services
    const [services] = await pool.query<Service[]>(
      'SELECT id, provider_id, name, price, created_at FROM services WHERE provider_id = ? ORDER BY created_at DESC',
      [providerId]
    );

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/services - Create new service
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only providers can create services' }, { status: 403 });
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

    // Create service
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO services (provider_id, name, price) VALUES (?, ?, ?)',
      [providerId, name.trim(), price || null]
    );

    return NextResponse.json({ 
      message: 'Service created successfully',
      serviceId: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
