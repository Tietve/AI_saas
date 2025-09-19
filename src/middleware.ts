// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that require authentication
const protectedRoutes = ['/chat', '/dashboard', '/settings']

// Routes that should redirect to chat if already authenticated
const authRoutes = ['/auth/signin', '/auth/signup']

// QUAN TRỌNG: Dùng cùng cookie name với session.ts
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'

// Helper để lấy secret key (QUAN TRỌNG: phải giống với session.ts)
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

        // Check for user ID in various fields
        const userId = payload.uid || payload.sub || (payload as any).userId

        // Check if token is not expired
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
            console.log('[Middleware] Token expired')
            return false
        }

        return !!userId
    } catch (error) {
        console.error('[Middleware] Token verification failed:', error)
        return false
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip middleware for API routes và static files
    if (pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.')) {
        return NextResponse.next()
    }

    // Lấy session cookie với đúng tên
    const sessionCookie = request.cookies.get(COOKIE_NAME)

    // Check if user is authenticated
    let isAuthenticated = false
    if (sessionCookie?.value) {
        isAuthenticated = await verifySessionToken(sessionCookie.value)
    }

    // Check protected routes
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )

    // Check auth routes
    const isAuthRoute = authRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )

    // QUAN TRỌNG: Chặn protected routes khi không có auth
    if (isProtectedRoute && !isAuthenticated) {
        console.log(`[Middleware] Blocking ${pathname} - not authenticated`)
        const signinUrl = new URL('/auth/signin', request.url)
        signinUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(signinUrl)
    }

    // Redirect authenticated users từ auth pages về chat
    if (isAuthRoute && isAuthenticated) {
        console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /chat`)
        return NextResponse.redirect(new URL('/chat', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
}