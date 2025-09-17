// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that require authentication
const protectedRoutes = ['/chat', '/dashboard', '/settings']

// Routes that should redirect to chat if already authenticated
const authRoutes = ['/auth/signin', '/auth/signup']

// Helper để lấy secret key (copy từ session.ts)
function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 32) {
        // Fallback cho development
        const fallback = 'dev-secret-key-min-32-characters-long-fallback'
        return new TextEncoder().encode(fallback)
    }
    return new TextEncoder().encode(secret)
}

// Verify session token (copy logic từ session.ts)
async function verifySessionToken(token: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256']
        })

        // Check for user ID in various fields
        const userId = payload.uid || payload.sub || (payload as any).userId

        console.log('[Middleware] Token payload:', {
            uid: payload.uid,
            sub: payload.sub,
            userId: (payload as any).userId,
            email: (payload as any).email
        })

        return !!userId
    } catch (error) {
        console.error('[Middleware] Token verification error:', error)
        return false
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip middleware for API routes và static files
    if (pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname === '/favicon.ico') {
        return NextResponse.next()
    }

    const sessionCookie = request.cookies.get('session')

    console.log(`[Middleware] Checking path: ${pathname}`)
    console.log(`[Middleware] Session cookie exists: ${!!sessionCookie?.value}`)

    // Check if user is authenticated
    let isAuthenticated = false

    if (sessionCookie?.value) {
        isAuthenticated = await verifySessionToken(sessionCookie.value)
    }

    console.log(`[Middleware] Path: ${pathname}, Authenticated: ${isAuthenticated}`)

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    )

    // Check if route is auth route
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    )

    // Redirect to signin if accessing protected route without auth
    if (isProtectedRoute && !isAuthenticated) {
        console.log(`[Middleware] Redirecting to signin (protected route without auth)`)
        const signinUrl = new URL('/auth/signin', request.url)
        signinUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(signinUrl)
    }

    // Redirect to chat if accessing auth routes while authenticated
    if (isAuthRoute && isAuthenticated) {
        console.log(`[Middleware] Redirecting to chat (auth route while authenticated)`)
        return NextResponse.redirect(new URL('/chat', request.url))
    }

    return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes (handled above)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}