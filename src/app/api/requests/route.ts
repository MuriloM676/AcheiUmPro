import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromToken, User } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

interface RequestRow extends RowDataPacket {
  id: number;
  client_id: number;
  provider_id: number;
  service_id: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduled_at: string | null;
  description: string | null;
  created_at: string;
  client_name: string;
  client_email: string;
  provider_name: string;
  provider_phone: string | null;
  service_name: string | null;
  service_price: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_sender_name: string | null;
}

// GET /api/requests - List requests for authenticated user
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

    let query = '';
    let params: any[] = [];

    if (user.role === 'client') {
      // For clients: show their requests
      query = `
        SELECT 
          r.id, r.client_id, r.provider_id, r.service_id, r.status, 
          r.scheduled_at, r.description, r.created_at,
          u.name as client_name, u.email as client_email,
          pu.name as provider_name, pu.phone as provider_phone,
          s.name as service_name, s.price as service_price,
          (
            SELECT CASE
                     WHEN (m.content IS NULL OR m.content = '') AND m.attachment_url IS NOT NULL THEN 'Anexo enviado'
                     ELSE m.content
                   END
              FROM messages m
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ) AS last_message,
          (
            SELECT m.created_at FROM messages m
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ) AS last_message_at,
          (
            SELECT u2.name FROM messages m
             JOIN users u2 ON u2.id = m.sender_id
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ) AS last_sender_name
        FROM requests r
        JOIN users u ON r.client_id = u.id
        JOIN providers p ON r.provider_id = p.id
        JOIN users pu ON p.user_id = pu.id
        LEFT JOIN services s ON r.service_id = s.id
        WHERE r.client_id = ?
        ORDER BY COALESCE(
          (
            SELECT m.created_at FROM messages m
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ),
          r.created_at
        ) DESC
      `;
      params = [user.id];
    } else if (user.role === 'provider') {
      // For providers: show requests sent to them
      const [providerRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ?',
        [user.id]
      );
      
      if (!providerRows.length) {
        return NextResponse.json({ requests: [] });
      }

      const providerId = providerRows[0].id;
      
      query = `
        SELECT 
          r.id, r.client_id, r.provider_id, r.service_id, r.status, 
          r.scheduled_at, r.description, r.created_at,
          u.name as client_name, u.email as client_email,
          pu.name as provider_name, pu.phone as provider_phone,
          s.name as service_name, s.price as service_price,
          (
            SELECT CASE
                     WHEN (m.content IS NULL OR m.content = '') AND m.attachment_url IS NOT NULL THEN 'Anexo enviado'
                     ELSE m.content
                   END
              FROM messages m
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ) AS last_message,
          (
            SELECT m.created_at FROM messages m
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ) AS last_message_at,
          (
            SELECT u2.name FROM messages m
             JOIN users u2 ON u2.id = m.sender_id
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ) AS last_sender_name
        FROM requests r
        JOIN users u ON r.client_id = u.id
        JOIN providers p ON r.provider_id = p.id
        JOIN users pu ON p.user_id = pu.id
        LEFT JOIN services s ON r.service_id = s.id
        WHERE r.provider_id = ?
        ORDER BY COALESCE(
          (
            SELECT m.created_at FROM messages m
             WHERE m.request_id = r.id
             ORDER BY m.created_at DESC
             LIMIT 1
          ),
          r.created_at
        ) DESC
      `;
      params = [providerId];
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    const [rows] = await pool.query<RequestRow[]>(query, params);

    return NextResponse.json({ requests: rows });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/requests - Create new request (clients only)
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

    if (user.role !== 'client') {
      return NextResponse.json({ error: 'Only clients can create requests' }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id, service_id, scheduled_at, description } = body;

    if (!provider_id) {
      return NextResponse.json({ error: 'provider_id is required' }, { status: 400 });
    }

    // Validate provider exists
    const [providerRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM providers WHERE id = ?',
      [provider_id]
    );

    if (!providerRows.length) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO requests (client_id, provider_id, service_id, scheduled_at, description) VALUES (?, ?, ?, ?, ?)',
      [user.id, provider_id, service_id || null, scheduled_at || null, description || null]
    );

    return NextResponse.json({ 
      message: 'Request created', 
      requestId: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
