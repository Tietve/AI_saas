/**
 * JWT Token Refresh API
 *
 * Refreshes a user's session token with a new expiration time
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { refreshSession, verifySession, createSessionCookie } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'

export async function POST(request: NextRequest) {
    try {
        // Get current session token
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(COOKIE_NAME)

        if (!sessionCookie?.value) {
            logger.debug('No session cookie found for refresh')
            return NextResponse.json(
                { code: 'NO_SESSION', message: 'No active session to refresh' },
                { status: 401 }
            )
        }

        // Verify current token is valid
        try {
            await verifySession(sessionCookie.value)
        } catch (error) {
            logger.warn({ err: error }, 'Invalid session token for refresh')
            return NextResponse.json(
                { code: 'INVALID_SESSION', message: 'Session token is invalid or expired' },
                { status: 401 }
            )
        }

        // Refresh the token
        const newToken = await refreshSession(sessionCookie.value)

        // Get session cookie config
        const newCookieConfig = await createSessionCookie(
            '', // userId not needed, refreshSession preserves payload
            {}
        )

        // Create response with new token
        const response = NextResponse.json({
            success: true,
            message: 'Session refreshed successfully',
            expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        })

        // Set new session cookie
        response.cookies.set(COOKIE_NAME, newToken, newCookieConfig.options)

        logger.info('Session refreshed successfully')

        return response

    } catch (error: any) {
        logger.error({ err: error }, 'Session refresh failed')

        return NextResponse.json(
            {
                code: 'REFRESH_FAILED',
                message: 'Failed to refresh session',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}
