/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Implementation:
 * - Double Submit Cookie pattern
 * - Signed tokens with JWT
 * - Automatic verification for state-changing operations (POST, PUT, DELETE, PATCH)
 *
 * Usage in middleware:
 *   import { verifyCsrfToken, generateCsrfToken } from '@/lib/security/csrf'
 *
 *   // In middleware
 *   const isValid = await verifyCsrfToken(req)
 *   if (!isValid) throw new Error('Invalid CSRF token')
 */

import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

const CSRF_COOKIE_NAME = '__Host-csrf' // Prefix for secure cookies
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 // 24 hours in seconds

/**
 * Get CSRF secret key
 */
function getCsrfSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.CSRF_SECRET
  if (!secret || secret.length < 32) {
    logger.warn('CSRF_SECRET or AUTH_SECRET missing or too short, using fallback')
    const fallback = 'csrf-secret-key-minimum-32-characters-long'
    return new TextEncoder().encode(fallback)
  }
  return new TextEncoder().encode(secret)
}

/**
 * Generate a CSRF token
 *
 * @returns Object with token and cookie value
 */
export async function generateCsrfToken(): Promise<{
  token: string
  cookieValue: string
}> {
  const secret = getCsrfSecret()
  const nonce = crypto.randomBytes(32).toString('hex')

  // Create signed JWT token
  const token = await new SignJWT({ nonce, type: 'csrf' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${CSRF_TOKEN_EXPIRY}s`)
    .sign(secret)

  return {
    token, // Send in response body/header
    cookieValue: token, // Set as httpOnly cookie
  }
}

/**
 * Verify CSRF token from request
 *
 * Checks both the cookie and header to prevent CSRF attacks
 */
export async function verifyCsrfToken(req: Request): Promise<boolean> {
  try {
    const cookieHeader = req.headers.get('cookie')
    const csrfHeader = req.headers.get(CSRF_HEADER_NAME)

    if (!cookieHeader || !csrfHeader) {
      logger.debug('Missing CSRF token in cookie or header')
      return false
    }

    // Extract CSRF cookie
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((cookie) => {
        const [key, value] = cookie.trim().split('=')
        return [key, value]
      })
    )

    const csrfCookie = cookies[CSRF_COOKIE_NAME]
    if (!csrfCookie) {
      logger.debug('CSRF cookie not found')
      return false
    }

    // Both cookie and header must match
    if (csrfCookie !== csrfHeader) {
      logger.warn('CSRF token mismatch between cookie and header')
      return false
    }

    // Verify token signature
    const secret = getCsrfSecret()
    const { payload } = await jwtVerify(csrfCookie, secret, {
      algorithms: ['HS256'],
    })

    // Verify token type
    if (payload.type !== 'csrf') {
      logger.warn('Invalid CSRF token type')
      return false
    }

    return true
  } catch (error) {
    if (error instanceof Error) {
      logger.warn({ err: error }, 'CSRF token verification failed')
    }
    return false
  }
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  return protectedMethods.includes(method.toUpperCase())
}

/**
 * Get CSRF cookie configuration
 */
export function getCsrfCookieConfig() {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    name: CSRF_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict' as const,
      path: '/',
      maxAge: CSRF_TOKEN_EXPIRY,
    },
  }
}

/**
 * Extract CSRF token from response headers for client
 */
export function extractCsrfToken(headers: Headers): string | null {
  return headers.get(CSRF_HEADER_NAME)
}

/**
 * CSRF exempted paths (public endpoints that don't need CSRF)
 */
export const CSRF_EXEMPT_PATHS = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/verify-email',
  '/api/auth/reset',
  '/api/webhook/payos', // Webhooks use signature verification
  '/api/health',
]

/**
 * Check if path is exempt from CSRF protection
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exemptPath) => pathname.startsWith(exemptPath))
}
