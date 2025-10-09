/**
 * Validation middleware for API routes
 *
 * Usage in API routes:
 *   export async function POST(req: Request) {
 *     const body = await validateRequest(req, chatSendSchema)
 *     // body is now fully typed and validated
 *   }
 */

import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { logger } from '@/lib/logger'

/**
 * Validate request body against a Zod schema
 *
 * @throws ValidationError with formatted error messages
 */
export async function validateRequest<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json()
    const validated = schema.parse(body)
    return validated
  } catch (error) {
    if (error instanceof ZodError) {
      // Format error message from issues
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')

      logger.warn({ error: message }, 'Request validation failed')

      throw new ValidationError(message, error.errors)
    }

    // If JSON parsing failed
    if (error instanceof SyntaxError) {
      logger.warn({ error: error.message }, 'Invalid JSON in request body')
      throw new ValidationError('Invalid JSON in request body')
    }

    throw error
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const validated = schema.parse(params)
    return validated
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')

      logger.warn({ error: message }, 'Query validation failed')

      throw new ValidationError(message, error.errors)
    }

    throw error
  }
}

/**
 * Validate URL parameters
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): T {
  try {
    const validated = schema.parse(params)
    return validated
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')

      logger.warn({ error: message }, 'Params validation failed')

      throw new ValidationError(message, error.errors)
    }

    throw error
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly statusCode = 400
  public readonly code = 'VALIDATION_ERROR'
  public readonly issues?: any[]

  constructor(message: string, issues?: any[]) {
    super(message)
    this.name = 'ValidationError'
    this.issues = issues
    Object.setPrototypeOf(this, ValidationError.prototype)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      issues: this.issues,
    }
  }
}

/**
 * Handle errors in API routes with proper logging and responses
 */
export function handleApiError(error: unknown): NextResponse {
  // Validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json(error.toJSON(), { status: 400 })
  }

  // Known application errors
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Unauthorized') || error.message.includes('UNAUTHENTICATED')) {
      logger.warn({ error: error.message }, 'Unauthorized request')
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error.message.includes('Forbidden') || error.message.includes('FORBIDDEN')) {
      logger.warn({ error: error.message }, 'Forbidden request')
      return NextResponse.json(
        { code: 'FORBIDDEN', message: 'Access denied' },
        { status: 403 }
      )
    }

    if (error.message.includes('Not found') || error.message.includes('NOT_FOUND')) {
      logger.warn({ error: error.message }, 'Resource not found')
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Resource not found' },
        { status: 404 }
      )
    }

    // Log unexpected errors
    logger.error({ err: error }, 'API error')
  }

  // Default server error
  logger.error({ error }, 'Unexpected API error')

  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : String(error))
        : 'An unexpected error occurred',
    },
    { status: 500 }
  )
}

/**
 * Wrap API route handler with error handling
 *
 * @example
 * export const POST = withErrorHandler(async (req) => {
 *   const body = await validateRequest(req, chatSendSchema)
 *   // ... handle request
 *   return NextResponse.json({ success: true })
 * })
 */
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
