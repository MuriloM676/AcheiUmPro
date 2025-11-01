import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'
import { getUserFromRequest } from '@/lib/auth'
import { User } from '@/types'
import { logger, createErrorResponse, createSuccessResponse, handleValidationError, handleAuthError } from '@/lib/utils'

export interface ApiContext {
  user: User
  params?: Record<string, string>
  query?: Record<string, string>
}

export interface ApiHandlerOptions {
  requireAuth?: boolean
  allowedRoles?: ('client' | 'provider' | 'admin')[]
  bodySchema?: ZodSchema
  querySchema?: ZodSchema
  paramsSchema?: ZodSchema
}

type ApiHandler<T = any> = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse<T>>

export function createApiHandler<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = true,
    allowedRoles,
    bodySchema,
    querySchema,
    paramsSchema
  } = options

  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // Parse params if provided
      let params: Record<string, string> = {}
      if (context?.params) {
        params = await context.params
      }

      // Parse query parameters
      const url = new URL(request.url)
      const query = Object.fromEntries(url.searchParams.entries())

      // Validate params
      if (paramsSchema) {
        try {
          params = paramsSchema.parse(params)
        } catch (error) {
          logger.warn('Invalid params:', error)
          return NextResponse.json(
            createErrorResponse(handleValidationError(error)),
            { status: 400 }
          )
        }
      }

      // Validate query
      if (querySchema) {
        try {
          querySchema.parse(query)
        } catch (error) {
          logger.warn('Invalid query parameters:', error)
          return NextResponse.json(
            createErrorResponse(handleValidationError(error)),
            { status: 400 }
          )
        }
      }

      // Handle authentication
      let user: User | null = null
      if (requireAuth) {
        user = await getUserFromRequest(request)
        if (!user) {
          return NextResponse.json(
            createErrorResponse('Authentication required'),
            { status: 401 }
          )
        }

        // Check role permissions
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return NextResponse.json(
            createErrorResponse('Insufficient permissions'),
            { status: 403 }
          )
        }
      }

      // Validate request body for non-GET requests
      let body: any = undefined
      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const rawBody = await request.json()
          body = bodySchema.parse(rawBody)

          // Create new request with validated body
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body)
          }) as NextRequest

          // Copy NextRequest specific properties
          Object.setPrototypeOf(newRequest, NextRequest.prototype)

          request = newRequest
        } catch (error) {
          logger.warn('Invalid request body:', error)
          return NextResponse.json(
            createErrorResponse(handleValidationError(error)),
            { status: 400 }
          )
        }
      }

      // Execute handler
      const apiContext: ApiContext = {
        user: user!,
        params,
        query
      }

      const result = await handler(request, apiContext)
      return result

    } catch (error: any) {
      logger.error('API handler error:', error)

      if (error.name === 'ZodError') {
        return NextResponse.json(
          createErrorResponse(handleValidationError(error)),
          { status: 400 }
        )
      }

      if (error.message?.includes('authentication') || error.message?.includes('token')) {
        return NextResponse.json(
          createErrorResponse(handleAuthError(error)),
          { status: 401 }
        )
      }

      return NextResponse.json(
        createErrorResponse('Internal server error'),
        { status: 500 }
      )
    }
  }
}

// Validation schemas for common use cases
export const commonSchemas = {
  id: z.object({
    id: z.string().regex(/^\d+$/).transform(Number)
  }),

  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  serviceRequest: z.object({
    title: z.string().min(10).max(200),
    description: z.string().min(20).max(1000),
    category: z.string().min(1),
    location: z.string().min(5),
    budget: z.string().optional(),
    urgency: z.enum(['low', 'medium', 'high'])
  }),

  proposal: z.object({
    proposedPrice: z.number().min(0),
    message: z.string().optional()
  }),

  appointment: z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(1000).optional(),
    scheduled_date: z.string().datetime(),
    provider_id: z.number().optional(),
    client_id: z.number().optional()
  }),

  updateStatus: z.object({
    status: z.string()
  })
}

// Convenience functions for common patterns
export const withAuth = (handler: ApiHandler, allowedRoles?: ('client' | 'provider' | 'admin')[]) =>
  createApiHandler(handler, { requireAuth: true, allowedRoles })

export const withValidation = (handler: ApiHandler, schema: ZodSchema) =>
  createApiHandler(handler, { bodySchema: schema })

export const withAuthAndValidation = (
  handler: ApiHandler,
  schema: ZodSchema,
  allowedRoles?: ('client' | 'provider' | 'admin')[]
) =>
  createApiHandler(handler, {
    requireAuth: true,
    allowedRoles,
    bodySchema: schema
  })

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (handler: ApiHandler) =>
    createApiHandler(async (request, context) => {
      const clientId = context.user?.id.toString() ||
                      request.headers.get('x-forwarded-for') ||
                      'anonymous'

      const now = Date.now()
      const userLimit = rateLimitMap.get(clientId)

      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= maxRequests) {
            return NextResponse.json(
              createErrorResponse('Rate limit exceeded'),
              { status: 429 }
            )
          }
          userLimit.count++
        } else {
          userLimit.count = 1
          userLimit.resetTime = now + windowMs
        }
      } else {
        rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs })
      }

      return handler(request, context)
    })
}
