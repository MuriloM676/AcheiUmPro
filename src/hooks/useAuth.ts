'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@/types'
import { logger } from '@/lib/utils'

type AllowedRole = 'client' | 'provider' | 'admin'

interface UseAuthOptions {
  requireAuth?: boolean
  allowedRoles?: Array<AllowedRole>
  redirectTo?: string
}

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

const AUTH_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user'
} as const

export function useAuth(options: UseAuthOptions = {}) {
  const {
    requireAuth = true,
    allowedRoles,
    redirectTo
  } = options

  const router = useRouter()
  const pathname = usePathname()

  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null
  })

  // Memoize auth page check
  const isAuthPage = useMemo(() =>
    pathname === '/login' || pathname === '/register',
    [pathname]
  )

  // Memoize role validation
  const hasValidRole = useCallback((user: User | null): boolean => {
    if (!user || !allowedRoles) return true
    return allowedRoles.includes(user.role)
  }, [allowedRoles])

  // Get stored auth data
  const getStoredAuthData = useCallback((): { token: string | null; user: User | null } => {
    try {
      if (typeof window === 'undefined') {
        return { token: null, user: null }
      }

      const storedToken = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
      const storedUserStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER)

      let parsedUser: User | null = null
      if (storedUserStr) {
        try {
          parsedUser = JSON.parse(storedUserStr)
        } catch (error) {
          logger.warn('Failed to parse stored user data:', error)
          localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
        }
      }

      return { token: storedToken, user: parsedUser }
    } catch (error) {
      logger.error('Error accessing localStorage:', error)
      return { token: null, user: null }
    }
  }, [])

  // Clear auth data
  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN)
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
    } catch (error) {
      logger.warn('Failed to clear auth data:', error)
    }
  }, [])

  // Get redirect path based on user role
  const getRedirectPath = useCallback((user: User): string => {
    if (redirectTo) return redirectTo

    switch (user.role) {
      case 'client':
        return '/dashboard/client'
      case 'provider':
        return '/dashboard/provider'
      case 'admin':
        return '/dashboard'
      default:
        return '/dashboard'
    }
  }, [redirectTo])

  // Logout function
  const logout = useCallback(() => {
    clearAuthData()
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null
    })
    router.replace('/login')
  }, [clearAuthData, router])

  // Main auth effect
  useEffect(() => {
    const { token, user } = getStoredAuthData()

    const isValidAuth = Boolean(token && user && hasValidRole(user))

    // Handle authentication requirements
    if (requireAuth && !isValidAuth) {
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      })

      if (!isAuthPage) {
        logger.info('Redirecting to login - auth required but not authenticated')
        router.replace('/login')
      }
      return
    }

    // Handle authenticated users on auth pages
    if (!requireAuth && isValidAuth && isAuthPage) {
      const redirectPath = getRedirectPath(user!)
      logger.info(`Redirecting authenticated user to ${redirectPath}`)
      router.replace(redirectPath)
      return
    }

    // Set authenticated state
    setAuthState({
      isLoading: false,
      isAuthenticated: isValidAuth,
      user: isValidAuth ? user : null,
      token: isValidAuth ? token : null
    })
  }, [
    requireAuth,
    isAuthPage,
    hasValidRole,
    getStoredAuthData,
    getRedirectPath,
    router
  ])

  // Return memoized values to prevent unnecessary re-renders
  return useMemo(() => ({
    ...authState,
    logout,
    // Convenience getters
    getToken: () => authState.token,
    getUser: () => authState.user,
    // Role checks
    isClient: authState.user?.role === 'client',
    isProvider: authState.user?.role === 'provider',
    isAdmin: authState.user?.role === 'admin'
  }), [authState, logout])
}
