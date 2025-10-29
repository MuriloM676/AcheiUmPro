'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth({ requireAuth: true })

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'client') {
        router.replace('/dashboard/client')
      } else if (user.role === 'provider') {
        router.replace('/dashboard/provider')
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
