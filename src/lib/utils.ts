import { ApiError } from '@/types'

// Environment-based logging
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = isProduction ? LogLevel.ERROR : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    return levels.indexOf(level) <= levels.indexOf(this.logLevel)
  }

  private formatMessage(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (data) {
      console[level](prefix, message, data)
    } else {
      console[level](prefix, message)
    }
  }

  error(message: string, error?: any): void {
    this.formatMessage(LogLevel.ERROR, message, error)
  }

  warn(message: string, data?: any): void {
    this.formatMessage(LogLevel.WARN, message, data)
  }

  info(message: string, data?: any): void {
    this.formatMessage(LogLevel.INFO, message, data)
  }

  debug(message: string, data?: any): void {
    this.formatMessage(LogLevel.DEBUG, message, data)
  }
}

export const logger = new Logger()

// Error handling utilities
export class AppError extends Error {
  public statusCode: number
  public code?: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const createApiError = (
  message: string,
  status: number = 500,
  code?: string
): ApiError => ({
  status,
  message,
  code
})

// Common error handlers
export const handleDatabaseError = (error: any): ApiError => {
  logger.error('Database error:', error)

  if (error.code === 'ER_DUP_ENTRY') {
    return createApiError('Duplicate entry detected', 409, 'DUPLICATE_ENTRY')
  }

  if (error.code === 'ER_NO_SUCH_TABLE') {
    return createApiError('Database table not found', 500, 'TABLE_NOT_FOUND')
  }

  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return createApiError('Invalid database field', 500, 'INVALID_FIELD')
  }

  if (error.code === 'ECONNREFUSED') {
    return createApiError('Database connection refused', 503, 'DB_CONNECTION_ERROR')
  }

  return createApiError('Database operation failed', 500, 'DATABASE_ERROR')
}

export const handleAuthError = (error: any): ApiError => {
  logger.error('Authentication error:', error)

  if (error.message?.includes('invalid token')) {
    return createApiError('Invalid authentication token', 401, 'INVALID_TOKEN')
  }

  if (error.message?.includes('expired')) {
    return createApiError('Authentication token expired', 401, 'TOKEN_EXPIRED')
  }

  return createApiError('Authentication failed', 401, 'AUTH_ERROR')
}

export const handleValidationError = (error: any): ApiError => {
  logger.warn('Validation error:', error)

  if (error.name === 'ZodError') {
    const firstError = error.errors?.[0]
    const message = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation failed'
    return createApiError(message, 400, 'VALIDATION_ERROR')
  }

  return createApiError('Invalid input data', 400, 'VALIDATION_ERROR')
}

// Async error wrapper
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      logger.error('Unhandled async error:', error)
      throw error
    })
  }
}

// Retry utility for database operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error)

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError
}

// Response helpers
export const createSuccessResponse = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message
})

export const createErrorResponse = (error: ApiError | string, details?: any) => {
  if (typeof error === 'string') {
    return {
      success: false,
      error,
      details
    }
  }

  return {
    success: false,
    error: error.message,
    code: error.code,
    details
  }
}

// Sanitize sensitive data from logs
export const sanitizeForLogging = (data: any): any => {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data }
  const sensitiveFields = ['password', 'token', 'auth', 'authorization', 'secret', 'key']

  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj

    const result = Array.isArray(obj) ? [] : {}

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()

      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        (result as any)[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        (result as any)[key] = sanitizeObject(value)
      } else {
        (result as any)[key] = value
      }
    }

    return result
  }

  return sanitizeObject(sanitized)
}
