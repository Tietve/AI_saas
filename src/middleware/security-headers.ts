/**
 * Security Headers Middleware
 *
 * Adds security headers to all responses
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  // Content Security Policy
  contentSecurityPolicy?: string | false
  // X-Frame-Options
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false
  // X-Content-Type-Options
  contentTypeOptions?: boolean
  // Referrer-Policy
  referrerPolicy?: string
  // Permissions-Policy
  permissionsPolicy?: string | false
  // Strict-Transport-Security
  strictTransportSecurity?: string | false
}

/**
 * Default security headers configuration
 */
const defaultConfig: Required<SecurityHeadersConfig> = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload'
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const finalConfig = { ...defaultConfig, ...config }

  // Content-Security-Policy
  if (finalConfig.contentSecurityPolicy !== false) {
    response.headers.set('Content-Security-Policy', finalConfig.contentSecurityPolicy)
  }

  // X-Frame-Options
  if (finalConfig.frameOptions !== false) {
    response.headers.set('X-Frame-Options', finalConfig.frameOptions)
  }

  // X-Content-Type-Options
  if (finalConfig.contentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer-Policy
  if (finalConfig.referrerPolicy) {
    response.headers.set('Referrer-Policy', finalConfig.referrerPolicy)
  }

  // Permissions-Policy
  if (finalConfig.permissionsPolicy !== false) {
    response.headers.set('Permissions-Policy', finalConfig.permissionsPolicy)
  }

  // Strict-Transport-Security (only in production with HTTPS)
  if (
    process.env.NODE_ENV === 'production' &&
    finalConfig.strictTransportSecurity !== false
  ) {
    response.headers.set('Strict-Transport-Security', finalConfig.strictTransportSecurity)
  }

  // X-XSS-Protection (legacy, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Remove X-Powered-By header
  response.headers.delete('X-Powered-By')

  return response
}

/**
 * Middleware wrapper to add security headers
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: SecurityHeadersConfig
) {
  return async (req: NextRequest) => {
    const response = await handler(req)
    return applySecurityHeaders(response, config)
  }
}

/**
 * Relaxed CSP for development
 */
export const developmentCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' ws: wss: http://localhost:* https://*",
  "frame-ancestors 'none'"
].join('; ')

/**
 * API-specific security headers (less restrictive CSP)
 */
export const apiSecurityConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: false, // APIs don't need CSP
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'no-referrer',
  permissionsPolicy: false
}
