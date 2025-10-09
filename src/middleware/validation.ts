/**
 * Input Validation Middleware
 *
 * Provides request validation and sanitization for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'
import { logger } from '@/lib/logger'

/**
 * Validation error response
 */
interface ValidationError {
  code: 'VALIDATION_ERROR'
  message: string
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * Create validation error response
 */
function validationError(errors: z.ZodError): NextResponse<ValidationError> {
  return NextResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: errors.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    },
    { status: 400 }
  )
}

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T> | NextResponse<ValidationError>> {
  try {
    const body = await req.json()
    const validated = schema.parse(body)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ errors: error.errors, path: req.nextUrl.pathname }, 'Request validation failed')
      return validationError(error)
    }

    // Invalid JSON
    return NextResponse.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON in request body',
        errors: []
      },
      { status: 400 }
    )
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): z.infer<T> | NextResponse<ValidationError> {
  try {
    const searchParams = req.nextUrl.searchParams
    const params = Object.fromEntries(searchParams.entries())
    const validated = schema.parse(params)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ errors: error.errors, path: req.nextUrl.pathname }, 'Query validation failed')
      return validationError(error)
    }
    throw error
  }
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Email validation
  email: z.string().email().toLowerCase().max(255),

  // Password validation (min 6 chars for compatibility, but recommend 8+)
  password: z.string().min(6).max(128),

  // Strong password (recommended)
  strongPassword: z.string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  // ID (UUID or cuid)
  id: z.string().min(1).max(50),

  // Text content
  text: z.string().max(10000).transform(sanitizeString),

  // Short text (titles, names)
  shortText: z.string().max(255).transform(sanitizeString),

  // URL
  url: z.string().url().max(2048),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // Search query
  searchQuery: z.string().max(255).optional().transform((val) =>
    val ? sanitizeString(val) : undefined
  ),

  // Integer
  positiveInt: z.coerce.number().int().min(1),

  // Boolean
  boolean: z.enum(['true', 'false']).transform(val => val === 'true'),
}

/**
 * Wrapper for API routes with validation
 */
export function withValidation<T extends ZodSchema>(
  schema: T,
  handler: (
    req: NextRequest,
    validated: z.infer<T>,
    context?: any
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const validated = await validateBody(req, schema)

    // If validation failed, return error response
    if (validated instanceof NextResponse) {
      return validated
    }

    // Call handler with validated data
    return handler(req, validated, context)
  }
}

/**
 * Request size limit middleware
 */
export function withSizeLimit(maxSizeBytes: number) {
  return async (req: NextRequest, handler: () => Promise<NextResponse>) => {
    const contentLength = req.headers.get('content-length')

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return NextResponse.json(
        {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body too large. Maximum size: ${maxSizeBytes} bytes`
        },
        { status: 413 }
      )
    }

    return handler()
  }
}

/**
 * Content-Type validation middleware
 */
export function withContentType(allowedTypes: string[]) {
  return async (req: NextRequest, handler: () => Promise<NextResponse>) => {
    const contentType = req.headers.get('content-type') || ''

    const isAllowed = allowedTypes.some(type =>
      contentType.toLowerCase().includes(type.toLowerCase())
    )

    if (!isAllowed) {
      return NextResponse.json(
        {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
        },
        { status: 415 }
      )
    }

    return handler()
  }
}
