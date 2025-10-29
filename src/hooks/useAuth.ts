'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type AllowedRole = 'client' | 'provider' | 'admin'

interface UseAuthOptions {
  requireAuth?: boolean
  allowedRoles?: Array<AllowedRole>
}

export function useAuth(options: UseAuthOptions = {}) {
  const { requireAuth = true, allowedRoles } = options
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const rolesKey = allowedRoles ? [...allowedRoles].sort().join(',') : 'ALL'

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const isAuthPage = pathname === '/login' || pathname === '/register'

    let parsedUser: any = null

    if (storedToken && storedUser) {
      try {
        parsedUser = JSON.parse(storedUser)
      } catch (error) {
        parsedUser = null
      }
    }

    const hasValidRole = parsedUser && allowedRoles ? allowedRoles.includes(parsedUser.role) : true

    if (requireAuth && (!storedToken || !parsedUser || !hasValidRole)) {
      setToken(null)
      setUser(null)
      setIsLoading(false)
      if (!isAuthPage) {
        router.replace('/login')
      }
      return
    }

    if (!requireAuth && storedToken && parsedUser && isAuthPage) {
      if (parsedUser.role === 'client') {
        router.replace('/dashboard/client')
      } else if (parsedUser.role === 'provider') {
        router.replace('/dashboard/provider')
      } else {
        router.replace('/dashboard')
      }
    }

    setToken(storedToken)
    setUser(parsedUser)
    setIsLoading(false)
  }, [rolesKey, pathname, requireAuth, router])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.replace('/login')
  }

  const getToken = () => token
  const getUser = () => user

  return {
    isLoading,
    isAuthenticated: Boolean(token && user),
    user,
    token,
    getToken,
    getUser,
    logout
  }
}
