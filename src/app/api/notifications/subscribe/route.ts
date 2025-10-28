import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { registerWebPushSubscription } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    if (!body || !body.endpoint || !body.keys?.auth || !body.keys?.p256dh) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
    }

    await registerWebPushSubscription(user.id, body)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error registering push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
