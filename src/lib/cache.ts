// Simple in-memory cache with TTL support
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private timers = new Map<string, NodeJS.Timeout>()

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Clear existing timer if any
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set cache item
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    }

    this.cache.set(key, item)

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttlMs)

    this.timers.set(key, timer)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }

    return item.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }

    return this.cache.delete(key)
  }

  clear(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    const items = Array.from(this.cache.entries())

    return {
      totalItems: items.length,
      validItems: items.filter(([_, item]) => now - item.timestamp <= item.ttl).length,
      expiredItems: items.filter(([_, item]) => now - item.timestamp > item.ttl).length,
      oldestItem: items.reduce((oldest, [_, item]) =>
        !oldest || item.timestamp < oldest ? item.timestamp : oldest, null as number | null
      ),
      newestItem: items.reduce((newest, [_, item]) =>
        !newest || item.timestamp > newest ? item.timestamp : newest, null as number | null
      )
    }
  }
}

// Create singleton cache instance
export const cache = new MemoryCache()

// Cache decorator for functions
export function cached<T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  options: {
    keyGenerator?: (...args: T) => string
    ttl?: number
    prefix?: string
  } = {}
) {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    ttl = 5 * 60 * 1000, // 5 minutes default
    prefix = 'fn'
  } = options

  return async (...args: T): Promise<R> => {
    const key = `${prefix}:${keyGenerator(...args)}`

    // Try to get from cache first
    const cached = cache.get<R>(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)
    cache.set(key, result, ttl)

    return result
  }
}

// Hook for using cache in React components
import { useState, useEffect, useCallback } from 'react'

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Try cache first unless force refresh
      if (!forceRefresh) {
        const cached = cache.get<T>(key)
        if (cached !== null) {
          setData(cached)
          setLoading(false)
          return cached
        }
      }

      // Fetch fresh data
      const result = await fetcher()

      // Cache the result
      cache.set(key, result, ttl)
      setData(result)

      return result
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
      throw err
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  const invalidate = useCallback(() => {
    cache.delete(key)
  }, [key])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    refetch: fetchData
  }
}

// API response cache specifically for API calls
class ApiCache {
  private cache = new MemoryCache()

  async get<T>(
    url: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number
      forceRefresh?: boolean
      staleWhileRevalidate?: boolean
    } = {}
  ): Promise<T> {
    const {
      ttl = 5 * 60 * 1000,
      forceRefresh = false,
      staleWhileRevalidate = false
    } = options

    const key = `api:${url}`

    // Return cached data if not forcing refresh
    if (!forceRefresh) {
      const cached = this.cache.get<T>(key)
      if (cached !== null) {
        // If stale-while-revalidate, return cached data but fetch in background
        if (staleWhileRevalidate) {
          fetcher().then(fresh => this.cache.set(key, fresh, ttl)).catch(() => {})
        }
        return cached
      }
    }

    // Fetch fresh data
    const data = await fetcher()
    this.cache.set(key, data, ttl)

    return data
  }

  invalidate(url: string): void {
    this.cache.delete(`api:${url}`)
  }

  invalidatePattern(pattern: string): void {
    const keys = this.cache.keys()
    const regex = new RegExp(pattern)

    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const apiCache = new ApiCache()

// Browser storage cache (localStorage/sessionStorage)
class StorageCache {
  constructor(private storage: Storage) {}

  set<T>(key: string, data: T, ttlMs?: number): void {
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    }

    try {
      this.storage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to set storage cache:', error)
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key)
      if (!item) return null

      const parsed = JSON.parse(item)

      // Check expiration if TTL is set
      if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
        this.delete(key)
        return null
      }

      return parsed.data as T
    } catch (error) {
      console.warn('Failed to get storage cache:', error)
      return null
    }
  }

  delete(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.warn('Failed to delete storage cache:', error)
    }
  }

  clear(): void {
    try {
      this.storage.clear()
    } catch (error) {
      console.warn('Failed to clear storage cache:', error)
    }
  }

  keys(): string[] {
    try {
      return Object.keys(this.storage)
    } catch (error) {
      console.warn('Failed to get storage keys:', error)
      return []
    }
  }
}

// Create storage cache instances
export const localCache = typeof window !== 'undefined'
  ? new StorageCache(localStorage)
  : null

export const sessionCache = typeof window !== 'undefined'
  ? new StorageCache(sessionStorage)
  : null

// Cache key generators
export const cacheKeys = {
  user: (id: number) => `user:${id}`,
  userRequests: (userId: number) => `user:${userId}:requests`,
  userProposals: (userId: number) => `user:${userId}:proposals`,
  providerProfile: (id: number) => `provider:${id}`,
  serviceRequest: (id: number) => `request:${id}`,
  search: (query: string, filters: any) => `search:${query}:${JSON.stringify(filters)}`,
  analytics: (userId: number, period: string) => `analytics:${userId}:${period}`,
  appointments: (userId: number) => `appointments:${userId}`
}

// Cache invalidation helpers
export const invalidateUserCache = (userId: number) => {
  cache.delete(cacheKeys.user(userId))
  cache.delete(cacheKeys.userRequests(userId))
  cache.delete(cacheKeys.userProposals(userId))
  cache.delete(cacheKeys.appointments(userId))
}

export const invalidateRequestCache = (requestId: number) => {
  cache.delete(cacheKeys.serviceRequest(requestId))
  // Invalidate related caches that might contain this request
  apiCache.invalidatePattern('user:.*:requests')
  apiCache.invalidatePattern('search:.*')
}
