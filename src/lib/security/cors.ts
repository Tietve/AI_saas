/**
 * CORS Configuration for Multi-Cloud Setup
 *
 * Supports:
 * - Vercel (FE)
 * - Azure App Service (API)
 * - Cloudflare CDN
 *
 * Origins configured via CORS_ALLOWED_ORIGINS env var
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCorsOrigins } from '@/config/env.server'

// ============================================
// ALLOWED ORIGINS
// ============================================

/**
 * Get allowed origins for CORS
 * Includes production domains from env
 */
function getAllowedOrigins(): string[] {
  const origins = getCorsOrigins()

  // Always include common production domains
  const defaultOrigins = [
    'https://firbox.net',
    'https://www.firbox.net',
  ]

  // Combine and deduplicate
  const allOrigins = [...new Set([...defaultOrigins, ...origins])]

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allOrigins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    )
  }

  return allOrigins
}

// ============================================
// CORS HEADERS
// ============================================

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false

  const allowedOrigins = getAllowedOrigins()

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Check wildcard patterns (if configured)
  // e.g., "*.firbox.net" → matches "app.firbox.net", "api.firbox.net", etc.
  const wildcardOrigins = allowedOrigins.filter(o => o.includes('*'))
  for (const pattern of wildcardOrigins) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
    if (regex.test(origin)) {
      return true
    }
  }

  return false
}

/**
 * Get CORS headers for response
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {}

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow any origin
    headers['Access-Control-Allow-Origin'] = origin || '*'
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  headers['Access-Control-Allow-Headers'] = [
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'X-CSRF-Token',
    'X-Requested-With',
    'Authorization',
  ].join(', ')

  headers['Access-Control-Max-Age'] = '86400' // 24 hours

  return headers
}

/**
 * Apply CORS headers to NextResponse
 */
export function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  const corsHeaders = getCorsHeaders(origin)

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Handle CORS preflight (OPTIONS) request
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')

  const response = new NextResponse(null, { status: 204 })
  return applyCorsHeaders(response, origin)
}

/**
 * Create CORS middleware
 */
export function createCorsMiddleware() {
  return (request: NextRequest, response: NextResponse): NextResponse => {
    const origin = request.headers.get('origin')

    // Check if origin is allowed
    if (origin && !isOriginAllowed(origin) && process.env.NODE_ENV === 'production') {
      // Block in production
      return new NextResponse('Forbidden: Invalid origin', { status: 403 })
    }

    // Apply CORS headers
    return applyCorsHeaders(response, origin)
  }
}

/**
 * Validate CORS for API route
 */
export function validateCors(request: NextRequest): { allowed: boolean; origin: string | null } {
  const origin = request.headers.get('origin')

  // No origin header = same-origin request (allowed)
  if (!origin) {
    return { allowed: true, origin: null }
  }

  // Check if origin is in allowed list
  const allowed = isOriginAllowed(origin) || process.env.NODE_ENV === 'development'

  return { allowed, origin }
}

/**
 * Create CORS response for API route
 */
export function createCorsResponse(
  data: any,
  request: NextRequest,
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const { status = 200, headers = {} } = options || {}

  const response = NextResponse.json(data, { status, headers })

  const origin = request.headers.get('origin')
  return applyCorsHeaders(response, origin)
}

// ============================================
// LOGGING
// ============================================

if (process.env.NODE_ENV !== 'test') {
  const origins = getAllowedOrigins()
  console.log('🌐 CORS Configuration:')
  console.log(`   - Allowed origins: ${origins.length}`)
  origins.forEach(o => console.log(`     • ${o}`))
}

export { getAllowedOrigins }
