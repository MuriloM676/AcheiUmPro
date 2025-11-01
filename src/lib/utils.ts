/**
 * Utility Functions
 * Common utilities used across the application
 */

export { logger } from './logger'

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    ...(message && { message }),
    data
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: string, code?: string, details?: any) {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details })
  }
}

/**
 * Handle database errors and convert to user-friendly messages
 */
export function handleDatabaseError(error: any): string {
  if (!error || typeof error !== 'object') {
    return 'Database operation failed'
  }

  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return 'Duplicate entry. This record already exists.'

    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return 'Referenced resource not found'

    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return 'Cannot delete. Record is referenced by other resources.'

    case 'ER_NO_SUCH_TABLE':
      return 'Database table not found. Please run migrations.'

    case 'ER_BAD_FIELD_ERROR':
      return 'Invalid database field'

    case 'ER_PARSE_ERROR':
      return 'Database query syntax error'

    case 'ECONNREFUSED':
      return 'Cannot connect to database'

    case 'ER_ACCESS_DENIED_ERROR':
      return 'Database access denied'

    default:
      return error.message || 'Database operation failed'
  }
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: any): string {
  if (!error) return 'Authentication failed'

  if (typeof error === 'string') return error

  if (error.message) return error.message

  return 'Authentication failed'
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    factor?: number
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2
  } = options

  let lastError: any
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts) {
        throw error
      }

      await sleep(Math.min(delay, maxDelay))
      delay *= factor
    }
  }

  throw lastError
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Parse pagination parameters from request
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 10))))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

/**
 * Get safe error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Check if code is running on server
 */
export const isServer = typeof window === 'undefined'

/**
 * Check if code is running on client
 */
export const isClient = typeof window !== 'undefined'

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  return process.env[key] || fallback || ''
}

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production'

