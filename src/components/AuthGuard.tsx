'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: ReactNode
  roles?: Array<'client' | 'provider' | 'admin'>
  fallback?: ReactNode
}

export function AuthGuard({ children, roles, fallback }: AuthGuardProps) {
  const { isLoading, isAuthenticated, user } = useAuth({ requireAuth: true, allowedRoles: roles })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-white text-lg">Verificando acesso...</div>
      </div>
    )
  }

  if (!isAuthenticated || (roles && user && !roles.includes(user.role))) {
    return fallback ?? null
  }

  return <>{children}</>
}
