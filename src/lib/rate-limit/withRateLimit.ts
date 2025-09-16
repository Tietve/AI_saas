// src/lib/rate-limit/withRateLimit.ts
import { NextResponse } from 'next/server'
import { createRateLimiter, defaultKeyFn, getClientIp, toHeaders } from './index'
import { RateLimitOptions, RateLimiter } from './types'

export type WithRateLimitConfig = {
    /** Scope hiển thị trong key (vd: 'chat-send') */
    scope?: string
    /** Mặc định: 20 req/phút */
    limit?: number
    windowMs?: number
    burst?: number
    /** Tự tạo limiter hay truyền sẵn (dùng chung giữa routes) */
    limiter?: RateLimiter
    /** Tuỳ chọn backend (memory/redis) và cấu hình redis truyền qua createRateLimiter ở ngoài nếu cần */
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
        // ⚠️ ở đây bạn nên đổi sang lấy userId thực từ session/next-auth
        const userId = null
        const key = keyFn({ userId, ip, route: url.pathname })

        const res = await limiter.consume(key)
        if (!res.ok) {
            const headers = toHeaders(res)
            return new NextResponse(JSON.stringify({ code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    ...headers,
                }
            })
        }

        const out = await handler(req)
        // Gắn headers thông tin rate limit cho response thành công
        const headers = toHeaders(res)
        Object.entries(headers).forEach(([k,v]) => out.headers.set(k, v))
        return out
    }
}
