import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { triggerNotification } from '@/lib/notifications';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

// PATCH /api/requests/[id] - Update request status (providers only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (user.role !== 'provider' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only providers or admins can update requests' }, { status: 403 });
    }

    const body = await request.json();
    const { status, scheduled_at } = body;

    if (!status || !['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const resolvedParams = await params;
    const requestId = Number(resolvedParams.id);

    let providerId: number | null = null;

    if (user.role === 'provider') {
      const [providerRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ?',
        [user.id]
      );

      if (!providerRows.length) {
        return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
      }

      providerId = providerRows[0].id;
    }

    // Update request only if it belongs to this provider
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE requests
          SET status = ?,
              scheduled_at = COALESCE(?, scheduled_at)
        WHERE id = ? ${providerId ? 'AND provider_id = ?' : ''}`,
      providerId
        ? [status, scheduled_at || null, requestId, providerId]
        : [status, scheduled_at || null, requestId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Request not found or unauthorized' }, { status: 404 });
    }

    const [contextRows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.client_id, r.provider_id, u.email AS client_email, u.name AS client_name,
              p.user_id AS provider_user_id, pu.name AS provider_name
         FROM requests r
         JOIN users u ON u.id = r.client_id
         JOIN providers p ON p.id = r.provider_id
         JOIN users pu ON pu.id = p.user_id
        WHERE r.id = ?
        LIMIT 1`,
      [requestId]
    );

    const context = contextRows[0];

    if (context) {
      const recipientId = user.id === context.client_id ? context.provider_user_id : context.client_id;
      const title = 'Atualização de solicitação';
      const statusMessages: Record<string, string> = {
        pending: 'A solicitação foi marcada como pendente.',
        accepted: 'A solicitação foi aceita pelo prestador.',
        rejected: 'A solicitação foi recusada.',
        completed: 'O serviço foi concluído.'
      };

      await triggerNotification({
        userId: recipientId,
        title,
        body: statusMessages[status] || 'Uma solicitação foi atualizada.',
        channels: ['in_app', 'webpush'],
        metadata: { requestId: requestId }
      });

      if (status === 'accepted') {
        await pool.query(
          `INSERT INTO appointments (request_id, provider_id, client_id, scheduled_for, status)
           VALUES (?, ?, ?, COALESCE(?, NOW()), 'confirmed')
           ON DUPLICATE KEY UPDATE scheduled_for = COALESCE(VALUES(scheduled_for), scheduled_for), status = 'confirmed'`,
          [requestId, context.provider_id, context.client_id, scheduled_at || null]
        );
      }

      if (status === 'completed') {
        await pool.query(
          `UPDATE appointments SET status = 'completed' WHERE request_id = ?`,
          [requestId]
        );
      }
    }

    return NextResponse.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/requests/[id] - Details for request participants or admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const resolvedParams = await params;
    const requestId = Number(resolvedParams.id);

    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.client_id, r.provider_id, r.service_id, r.status, r.scheduled_at, r.description, r.created_at,
              c.name AS client_name, c.email AS client_email,
              pu.name AS provider_name, pu.id AS provider_user_id, pu.phone AS provider_phone,
              s.name AS service_name, s.price AS service_price,
              pay.id AS payment_id, pay.status AS payment_status, pay.amount AS payment_amount, pay.checkout_url,
              app.status AS appointment_status, app.scheduled_for
         FROM requests r
         JOIN users c ON c.id = r.client_id
         JOIN providers p ON p.id = r.provider_id
         JOIN users pu ON pu.id = p.user_id
         LEFT JOIN services s ON s.id = r.service_id
         LEFT JOIN appointments app ON app.request_id = r.id
         LEFT JOIN payments pay ON pay.request_id = r.id
        WHERE r.id = ?
        LIMIT 1`,
      [requestId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestRow = rows[0];
    const allowed = user.role === 'admin' || user.id === requestRow.client_id || user.id === requestRow.provider_user_id;

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    // Fetch proposals for this request
    const [proposalRows] = await pool.query<RowDataPacket[]>(
      `SELECT sp.id, sp.request_id, sp.provider_id, sp.proposed_price, sp.message, sp.status, sp.created_at,
              u.name AS provider_name, u.email AS provider_email
         FROM service_proposals sp
         JOIN users u ON u.id = sp.provider_id
        WHERE sp.request_id = ?
        ORDER BY sp.created_at DESC`,
      [requestId]
    );

    return NextResponse.json({ request: requestRow, proposals: proposalRows });
  } catch (error) {
    console.error('Error fetching request details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/requests/[id] - Delete a request (clients or admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const resolved = await params
    const requestId = Number(resolved.id)
    if (!requestId) return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })

    // Only client who owns the request or admin can delete
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT client_id FROM service_requests WHERE id = ? LIMIT 1`, [requestId])
    if (!rows.length) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    const clientId = rows[0].client_id
    if (!(user.role === 'admin' || (user.role === 'client' && user.id === clientId))) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    // delete request (cascade should remove proposals if FK configured)
    await pool.query<ResultSetHeader>(`DELETE FROM service_requests WHERE id = ?`, [requestId])

    // optionally notify providers who had proposals
    try {
      const [prs] = await pool.query<RowDataPacket[]>(`SELECT provider_id FROM service_proposals WHERE request_id = ?`, [requestId])
      for (const pr of prs) {
        await triggerNotification({
          userId: pr.provider_id,
          title: 'Solicitação removida',
          body: `A solicitação #${requestId} foi removida pelo cliente.`,
          channels: ['in_app'],
          metadata: { requestId }
        })
      }
    } catch (err) {
      // ignore notification errors
      console.error('Failed to notify providers on request delete:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
