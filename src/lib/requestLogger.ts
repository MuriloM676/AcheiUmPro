/**
 * Request Logging Middleware
 * Logs all HTTP requests and responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

export function requestLogger(request: NextRequest, handler: () => Promise<NextResponse>) {
  const start = Date.now()
  const requestId = crypto.randomUUID()

  // Create child logger with request context
  const requestLogger = logger.child({
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  })

  // Log incoming request
  requestLogger.request(request.method, request.nextUrl.pathname, {
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: {
      'content-type': request.headers.get('content-type'),
      'authorization': request.headers.get('authorization') ? 'Bearer ***' : undefined
    }
  })

  return handler()
    .then(response => {
      const duration = Date.now() - start
      requestLogger.response(
        request.method,
        request.nextUrl.pathname,
        response.status,
        duration
      )
      return response
    })
    .catch(error => {
      const duration = Date.now() - start
      requestLogger.error(`Request failed after ${duration}ms`, error)
      throw error
    })
}

