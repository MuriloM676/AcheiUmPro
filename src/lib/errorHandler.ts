/**
 * Error Handler Middleware
 * Centralizes error handling and logging across all API routes
 */

import { NextResponse } from 'next/server'
import { logger } from './utils'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT_ERROR', details)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(500, 'Database operation failed', 'DATABASE_ERROR', { message, ...details })
    this.name = 'DatabaseError'
  }
}

/**
 * Global error handler function
 */
export function handleError(error: unknown, context?: string): NextResponse {
  // Log the error
  if (context) {
    logger.error(`[${context}]`, error)
  } else {
    logger.error('Unhandled error:', error)
  }

  // Handle known AppError types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && error.details && { details: error.details })
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as any).issues
      },
      { status: 400 }
    )
  }

  // Handle MySQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const mysqlError = error as any
    
    switch (mysqlError.code) {
      case 'ER_DUP_ENTRY':
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            code: 'DUPLICATE_ENTRY'
          },
          { status: 409 }
        )
      
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        return NextResponse.json(
          {
            success: false,
            error: 'Referenced resource not found',
            code: 'INVALID_REFERENCE'
          },
          { status: 400 }
        )
      
      case 'ER_NO_SUCH_TABLE':
        return NextResponse.json(
          {
            success: false,
            error: 'Database table not found',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        )
    }
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'Internal server error'
  
  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
        stack: error.stack
      })
    },
    { status: 500 }
  )
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error, context)
    }
  }) as T
}

/**
 * Try-catch wrapper with automatic error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<[T | null, NextResponse | null]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    return [null, handleError(error, context)]
  }
}

