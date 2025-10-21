/**
 * Debug Environment Variables Endpoint
 * 
 * Helps verify that environment variables are set correctly in production
 * SECURITY: Remove or protect this endpoint in production!
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
    // Only show in development or with debug key
    const isDev = process.env.NODE_ENV === 'development'
    const debugKey = process.env.DEBUG_SECRET_KEY
    
    // In production, require DEBUG_SECRET_KEY to be set
    // if (!isDev && !debugKey) {
    //     return NextResponse.json({ error: 'Not available' }, { status: 404 })
    // }
    
    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION,
            AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
            AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'session',
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            REDIS_URL_SET: !!process.env.REDIS_URL,
        },
        computed: {
            requireVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
            isProduction: process.env.NODE_ENV === 'production',
            cookieShouldBeSecure: process.env.NODE_ENV === 'production',
        },
        note: 'Remove this endpoint in production or protect with DEBUG_SECRET_KEY'
    })
}

