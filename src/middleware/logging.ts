/**
 * Logging Middleware
 *
 * Automatically logs all API requests with:
 * - Request method, path, headers
 * - Response status, duration
 * - User context (if authenticated)
 * - Error details (if failed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, logApiRequest, logError } from '@/lib/logger'
import { randomUUID } from 'crypto'

/**
 * Logging middleware for Next.js API routes
 *
 * Usage in API route:
 *
 * export async function GET(req: NextRequest) {
 *   return withLogging(req, async () => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true })
 *   })
 * }
 */
export async function withLogging(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now()
  const requestId = req.headers.get('x-request-id') || randomUUID()

  // Extract request info
  const method = req.method
  const path = new URL(req.url).pathname
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // Create request logger with context
  const requestLogger = logger.child({
    requestId,
    method,
    path,
    userAgent: userAgent.slice(0, 100), // Truncate long user agents
  })

  // Log request start
  requestLogger.info('API request started')

  try {
    // Execute handler
    const response = await handler()

    // Calculate duration
    const duration = Date.now() - startTime

    // Add request ID to response headers
    response.headers.set('x-request-id', requestId)

    // Log API request
    logApiRequest({
      method,
      path,
      duration,
      statusCode: response.status,
    })

    return response
  } catch (error) {
    const duration = Date.now() - startTime

    // Log error
    logError(error as Error, {
      extra: {
        method,
        path,
        duration,
        requestId,
      },
      tags: {
        api_route: path,
        method,
      },
    })

    // Log API request with error
    logApiRequest({
      method,
      path,
      duration,
      statusCode: 500,
      error: error as Error,
    })

    // Return error response
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        requestId,
        message: process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : 'An unexpected error occurred',
      },
      {
        status: 500,
        headers: {
          'x-request-id': requestId,
        },
      }
    )
  }
}

/**
 * Extract user ID from request (if authenticated)
 * This is a helper function - implement based on your auth system
 */
export function getUserIdFromRequest(req: NextRequest): string | undefined {
  // Example: Extract from JWT token or session
  // You'll need to implement this based on your auth system

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return undefined

  try {
    // Decode JWT or session to get user ID
    // This is pseudocode - implement your actual auth logic
    // const token = authHeader.replace('Bearer ', '')
    // const decoded = verifyJWT(token)
    // return decoded.userId
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Log slow requests (> 3 seconds)
 */
export function logSlowRequest(data: {
  method: string
  path: string
  duration: number
  userId?: string
}) {
  if (data.duration > 3000) {
    logger.warn(
      {
        method: data.method,
        path: data.path,
        duration: data.duration,
        userId: data.userId,
      },
      `Slow API request: ${data.method} ${data.path} - ${data.duration}ms`
    )
  }
}
