import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { verifyCsrfToken, requiresCsrfProtection, isCsrfExempt, generateCsrfToken, getCsrfCookieConfig } from '@/lib/security/csrf'
import { applySecurityHeaders } from '@/middleware/security-headers'
import { createRateLimiter, getClientIp, toHeaders } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { redis } from '@/lib/cache/redis-client'

export const runtime = 'nodejs'

const protectedRoutes = ['/chat', '/dashboard', '/settings', '/admin']
const authRoutes = ['/auth/signin', '/auth/signup']
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'

// Ensure Redis is configured
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn('Redis not configured for rate limiting, falling back to in-memory')
}

// Global rate limiters with Redis backend
const globalApiLimiter = createRateLimiter({
    backend: redis ? 'redis' : 'memory',
    redis: redis,
    prefix: 'rl:api',
    defaults: { limit: 100, windowMs: 60_000, burst: 100 } // 100 req/min
})

const authLimiter = createRateLimiter({
    backend: redis ? 'redis' : 'memory',
    redis: redis,
    prefix: 'rl:auth',
    defaults: { limit: 10, windowMs: 60_000, burst: 15 } // 10 req/min for auth routes
})

const rateLimitExemptPaths = ['/api/health', '/api/csrf', '/api/docs', '/api/api-docs']


function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 32) {
        console.warn('[Middleware] AUTH_SECRET missing or too short, using fallback')
        const fallback = 'dev-secret-key-min-32-characters-long-fallback'
        return new TextEncoder().encode(fallback)
    }
    return new TextEncoder().encode(secret)
}

async function verifySessionToken(token: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256']
        })

        const userId = payload.uid || payload.sub || (payload as any).userId

        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
            logger.debug('Token expired')
            return false
        }

        return !!userId
    } catch (error) {
        logger.warn({ err: error }, 'Token verification failed')
        return false
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const method = request.method

    // Skip middleware for static files and Next.js internals
    if (pathname.startsWith('/_next/') || pathname.includes('.')) {
        const response = NextResponse.next()
        return applySecurityHeaders(response)
    }

    // Rate Limiting for API routes
    if (pathname.startsWith('/api/')) {
        // Check if path is exempt from rate limiting
        const isRateLimitExempt = rateLimitExemptPaths.some(exemptPath =>
            pathname.startsWith(exemptPath)
        )

        if (!isRateLimitExempt) {
            const ip = getClientIp(request) || 'unknown'

            // Choose limiter based on route type
            const isAuthRoute = pathname.startsWith('/api/auth/')
            const limiter = isAuthRoute ? authLimiter : globalApiLimiter

            // Create rate limit key
            const key = isAuthRoute
                ? `auth:ip:${ip}:${pathname}`
                : `api:ip:${ip}`

            const rateLimitResult = await limiter.consume(key)

            if (!rateLimitResult.ok) {
                const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
                logger.warn({ pathname, ip, limit: rateLimitResult.limit }, 'Rate limit exceeded')

                const response = NextResponse.json(
                    {
                        code: 'RATE_LIMITED',
                        message: 'Too many requests. Please try again later.',
                        retryAfter,
                        limit: rateLimitResult.limit,
                        remaining: 0
                    },
                    { status: 429 }
                )

                // Set rate limit headers
                const headers = toHeaders(rateLimitResult)
                Object.entries(headers).forEach(([key, value]) => {
                    response.headers.set(key, value)
                })
                response.headers.set('Retry-After', retryAfter.toString())

                return applySecurityHeaders(response)
            }
        }
    }

    // CSRF Protection for API routes
    if (pathname.startsWith('/api/')) {
        // Check if this method requires CSRF protection
        if (requiresCsrfProtection(method) && !isCsrfExempt(pathname)) {
            const isValidCsrf = await verifyCsrfToken(request)

            if (!isValidCsrf) {
                logger.warn({ pathname, method }, 'CSRF token validation failed')
                const response = NextResponse.json(
                    { code: 'CSRF_TOKEN_INVALID', message: 'Invalid CSRF token' },
                    { status: 403 }
                )
                return applySecurityHeaders(response)
            }
        }

        // Generate CSRF token for GET requests to /api/csrf
        if (method === 'GET' && pathname === '/api/csrf') {
            const { token, cookieValue } = await generateCsrfToken()
            const csrfConfig = getCsrfCookieConfig()

            const response = NextResponse.json({ token })
            response.cookies.set(csrfConfig.name, cookieValue, csrfConfig.options)

            return applySecurityHeaders(response)
        }

        const apiResponse = NextResponse.next()
        return applySecurityHeaders(apiResponse)
    }

    // Authentication check for page routes
    const sessionCookie = request.cookies.get(COOKIE_NAME)

    let isAuthenticated = false
    if (sessionCookie?.value) {
        isAuthenticated = await verifySessionToken(sessionCookie.value)
    }

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )

    const isAuthRoute = authRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !isAuthenticated) {
        logger.debug({ pathname }, 'Blocking unauthenticated access to protected route')
        const signinUrl = new URL('/auth/signin', request.url)
        signinUrl.searchParams.set('from', pathname)
        const redirectResponse = NextResponse.redirect(signinUrl)
        return applySecurityHeaders(redirectResponse)
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && isAuthenticated) {
        logger.debug({ pathname }, 'Redirecting authenticated user from auth route')
        const redirectResponse = NextResponse.redirect(new URL('/chat', request.url))
        return applySecurityHeaders(redirectResponse)
    }

    const pageResponse = NextResponse.next()
    return applySecurityHeaders(pageResponse)
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
}