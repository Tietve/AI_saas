/**
 * API Versioning Middleware
 *
 * Handles API versioning via URL path (/api/v1/*, /api/v2/*, etc.)
 * - Validates API version
 * - Sets version headers
 * - Handles deprecation warnings
 * - Routes to appropriate handler
 *
 * FREE - no cost, just better architecture!
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2', // Future version
} as const

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS]

export const CURRENT_VERSION: ApiVersion = API_VERSIONS.V1
export const DEPRECATED_VERSIONS: ApiVersion[] = []

/**
 * Extract API version from request path
 */
export function getApiVersion(pathname: string): ApiVersion | null {
  const match = pathname.match(/^\/api\/(v\d+)\//)
  return match ? (match[1] as ApiVersion) : null
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  return DEPRECATED_VERSIONS.includes(version)
}

/**
 * API versioning middleware
 */
export function apiVersionMiddleware(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return null
  }

  // Skip versioning for certain paths
  const skipPaths = ['/api/health', '/api/swagger', '/api/docs']
  if (skipPaths.some((path) => pathname.startsWith(path))) {
    return null
  }

  const version = getApiVersion(pathname)

  // If no version specified, redirect to current version
  if (!version && !pathname.includes('/v')) {
    // Legacy route without version - allow but add header
    const response = NextResponse.next()
    response.headers.set('X-API-Version', CURRENT_VERSION)
    response.headers.set('X-API-Version-Warning', 'Please use versioned endpoints: /api/v1/*')
    return response
  }

  // If version specified, validate it
  if (version) {
    const validVersions = Object.values(API_VERSIONS)
    if (!validVersions.includes(version)) {
      logger.warn({ version, pathname }, 'Invalid API version requested')
      return NextResponse.json(
        {
          error: 'Invalid API version',
          validVersions,
          currentVersion: CURRENT_VERSION,
        },
        { status: 400 }
      )
    }

    // Add version headers
    const response = NextResponse.next()
    response.headers.set('X-API-Version', version)

    // Warn if deprecated
    if (isVersionDeprecated(version)) {
      response.headers.set(
        'X-API-Version-Deprecation',
        `API ${version} is deprecated. Please migrate to ${CURRENT_VERSION}.`
      )
      logger.warn({ version, pathname }, 'Deprecated API version used')
    }

    return response
  }

  return null
}

/**
 * Create versioned API response with appropriate headers
 */
export function versionedApiResponse(
  data: any,
  version: ApiVersion = CURRENT_VERSION,
  status = 200
): NextResponse {
  const response = NextResponse.json(data, { status })

  response.headers.set('X-API-Version', version)
  response.headers.set('Content-Type', 'application/json')

  if (isVersionDeprecated(version)) {
    response.headers.set(
      'X-API-Version-Deprecation',
      `API ${version} is deprecated. Please migrate to ${CURRENT_VERSION}.`
    )
  }

  return response
}

/**
 * Helper to create API error response with version
 */
export function versionedApiError(
  error: string,
  version: ApiVersion = CURRENT_VERSION,
  status = 400
): NextResponse {
  return versionedApiResponse({ error }, version, status)
}
