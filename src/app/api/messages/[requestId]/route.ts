import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { triggerNotification } from '@/lib/notifications'
import { queryWithRetry } from '@/lib/dbHelpers'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

interface RequestContextRow extends RowDataPacket {
  id: number
  client_id: number
  provider_id: number
  provider_user_id: number
}

interface MessageRow extends RowDataPacket {
  id: number
  request_id: number
  sender_id: number
  recipient_id: number
  content: string | null
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
  sender_name: string
}

async function resolveRequestContext(requestId: number) {
  const [rows] = await pool.query<RequestContextRow[]>(
    `SELECT r.id, r.client_id, r.provider_id, p.user_id AS provider_user_id
       FROM requests r
       JOIN providers p ON p.id = r.provider_id
      WHERE r.id = ?
      LIMIT 1`,
    [requestId]
  )

  if (!rows.length) {
    return null
  }

  return rows[0]
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
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

    const resolvedParams = await params
    const requestId = Number(resolvedParams.requestId)
    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }

    const context = await resolveRequestContext(requestId)
    if (!context) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const isParticipant = user.id === context.client_id || user.id === context.provider_user_id
    const isAdmin = user.role === 'admin'

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    let messages: MessageRow[] = [] as any
    try {
      const [mRows] = await queryWithRetry(pool, `SELECT m.id, m.request_id, m.sender_id, m.recipient_id, m.content, m.attachment_url, m.attachment_type, m.created_at,
                u.name AS sender_name
           FROM messages m
           JOIN users u ON u.id = m.sender_id
          WHERE m.request_id = ?
          ORDER BY m.created_at ASC`, [requestId])
      messages = mRows as MessageRow[]
    } catch (err: any) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        messages = [] as any
      } else {
        throw err
      }
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
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

    const resolvedParams = await params
    const requestId = Number(resolvedParams.requestId)
    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
    }

    const context = await resolveRequestContext(requestId)
    if (!context) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const isClient = user.id === context.client_id
    const isProvider = user.id === context.provider_user_id

    if (!isClient && !isProvider && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const attachmentUrl = typeof body.attachment_url === 'string' ? body.attachment_url : null
    const attachmentType = typeof body.attachment_type === 'string' ? body.attachment_type : null

    if (!content && !attachmentUrl) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    const recipientId = isClient ? context.provider_user_id : context.client_id

    let result: ResultSetHeader
    try {
      const [r] = await queryWithRetry(pool, `INSERT INTO messages (request_id, sender_id, recipient_id, content, attachment_url, attachment_type)
         VALUES (?, ?, ?, ?, ?, ?)`, [requestId, user.id, recipientId, content || null, attachmentUrl, attachmentType])
      result = r
    } catch (err: any) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({ error: 'Messaging store not available' }, { status: 503 })
      }
      throw err
    }

    const [storedMessages] = await queryWithRetry(pool, `SELECT m.id, m.request_id, m.sender_id, m.recipient_id, m.content, m.attachment_url, m.attachment_type, m.created_at,
               u.name AS sender_name
          FROM messages m
          JOIN users u ON u.id = m.sender_id
         WHERE m.id = ?
         LIMIT 1`, [result.insertId])

    const savedMessage = storedMessages[0]
    if (!savedMessage) {
      return NextResponse.json({ error: 'Falha ao salvar mensagem' }, { status: 500 })
    }

    if (recipientId !== user.id) {
      try {
        await triggerNotification({
          userId: recipientId,
          title: 'Nova mensagem',
          body: content || 'Você recebeu um novo anexo.',
          channels: ['in_app', 'webpush'],
          metadata: { requestId }
        })
      } catch (err) {
        console.error('Failed to trigger notification for message (non-fatal):', err)
      }
    }

    return NextResponse.json({ message: savedMessage })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
