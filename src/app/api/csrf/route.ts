/**
 * CSRF Token Generation Endpoint
 *
 * GET /api/csrf
 *
 * Returns a CSRF token that must be included in subsequent state-changing requests
 * The token is also set as an httpOnly cookie for double-submit validation
 */

import { NextResponse } from 'next/server'
import { generateCsrfToken, getCsrfCookieConfig } from '@/lib/security/csrf'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const { token, cookieValue } = await generateCsrfToken()
    const csrfConfig = getCsrfCookieConfig()

    const response = NextResponse.json({
      token,
      expiresIn: 86400, // 24 hours
    })

    response.cookies.set(csrfConfig.name, cookieValue, csrfConfig.options)

    logger.debug('CSRF token generated')

    return response
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate CSRF token')

    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
