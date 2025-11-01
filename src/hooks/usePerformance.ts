'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Debounce hook for delaying function execution
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay]) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// Throttle hook for limiting function execution frequency
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const callbackRef = useRef(callback)
  const lastRan = useRef(0)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRan.current >= limit) {
      callbackRef.current(...args)
      lastRan.current = Date.now()
    }
  }, [limit]) as T

  return throttledCallback
}

// Local storage hook with debouncing
export function useDebouncedLocalStorage<T>(
  key: string,
  initialValue: T,
  delay: number = 500
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : initialValue
      }
      return initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const debouncedValue = useDebounce(storedValue, delay)

  const setValue = useCallback((value: T) => {
    setStoredValue(value)
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(debouncedValue))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, debouncedValue])

  return [storedValue, setValue]
}

// Search hook with debouncing
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, delay)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    const executeSearch = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const searchResults = await searchFunction(debouncedQuery)
        setResults(searchResults)
      } catch (err: any) {
        setError(err.message || 'Search failed')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    executeSearch()
  }, [debouncedQuery, searchFunction])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasResults: results.length > 0
  }
}

// Async operation hook with debouncing
export function useDebouncedAsync<T, P extends any[]>(
  asyncFunction: (...args: P) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const execute = useCallback((...args: P) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      try {
        const result = await asyncFunction(...args)

        // Check if request was aborted
        if (!abortControllerRef.current.signal.aborted) {
          setData(result)
        }
      } catch (err: any) {
        if (!abortControllerRef.current.signal.aborted) {
          setError(err.message || 'Operation failed')
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, delay)
  }, [asyncFunction, delay])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setData(null)
    setIsLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    execute,
    reset
  }
}

// Window size hook with throttling
export function useWindowSize(throttleMs: number = 100) {
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }))

  const handleResize = useThrottledCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }, throttleMs)

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  return windowSize
}
