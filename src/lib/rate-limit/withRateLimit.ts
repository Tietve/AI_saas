
import { NextResponse } from 'next/server'
import { createRateLimiter, defaultKeyFn, getClientIp, toHeaders } from './index'
import { RateLimitOptions, RateLimiter } from './types'

export type WithRateLimitConfig = {
    
    scope?: string
    
    limit?: number
    windowMs?: number
    burst?: number
    
    limiter?: RateLimiter
    
}

export function withRateLimit<TBody = any>(
    handler: (req: Request) => Promise<Response>,
    cfg?: WithRateLimitConfig
) {
    const limiter = cfg?.limiter ?? createRateLimiter({ defaults: { limit: cfg?.limit ?? 20, windowMs: cfg?.windowMs ?? 60_000, burst: cfg?.burst ?? 20 } })
    const keyFn = defaultKeyFn(cfg?.scope ?? 'api')

    return async (req: Request): Promise<Response> => {
        const url = new URL(req.url)
        const ip = getClientIp(req)
        
        // Try to get user ID from session for better rate limiting
        let userId: string | null = null
        try {
            // Import here to avoid circular dependency
            const { getUserIdFromSession } = await import('@/lib/auth/session')
            userId = await getUserIdFromSession()
        } catch (error) {
            // Ignore auth errors, fallback to IP-based limiting
            console.warn('[RateLimit] Could not get user ID:', error)
        }
        
        const key = keyFn({ userId, ip, route: url.pathname })

        const res = await limiter.consume(key)
        if (!res.ok) {
            const headers = toHeaders(res)
            const retryAfter = Math.ceil((res.resetAt - Date.now()) / 1000)
            
            return new NextResponse(JSON.stringify({ 
                code: 'RATE_LIMITED', 
                message: 'Too many requests. Please try again later.',
                retryAfter,
                limit: res.limit,
                remaining: res.remaining
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Retry-After': retryAfter.toString(),
                    ...headers,
                }
            })
        }

        const out = await handler(req)
        
        // Only set headers if out is a Response object with headers
        if (out && typeof out === 'object' && 'headers' in out && out.headers && typeof out.headers.set === 'function') {
            const headers = toHeaders(res)
            Object.entries(headers).forEach(([k,v]) => {
                try {
                    out.headers.set(k, v)
                } catch (error) {
                    console.warn(`[RateLimit] Failed to set header ${k}:`, error)
                }
            })
        }
        return out
    }
}
