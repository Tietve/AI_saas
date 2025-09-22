
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'


const protectedRoutes = ['/chat', '/dashboard', '/settings']


const authRoutes = ['/auth/signin', '/auth/signup']


const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'


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

    
    if (pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.')) {
        return NextResponse.next()
    }

    
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

    
    if (isProtectedRoute && !isAuthenticated) {
        console.log(`[Middleware] Blocking ${pathname} - not authenticated`)
        const signinUrl = new URL('/auth/signin', request.url)
        signinUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(signinUrl)
    }

    
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