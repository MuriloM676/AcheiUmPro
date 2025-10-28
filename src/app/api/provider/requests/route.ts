import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'provider') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/provider/${session.user.id}/requests`,
      {
        headers: {
          Authorization: `Bearer ${session.user.id}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch requests')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}