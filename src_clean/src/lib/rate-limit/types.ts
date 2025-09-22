
export type RateLimitOptions = {
    
    limit: number
    
    windowMs: number
    
    burst?: number
}

export type RateLimitResult = {
    ok: boolean
    
    limit: number
    
    remaining: number
    
    resetAt: number
    
    retryAfterMs: number
}

export interface RateLimiter {
    consume(key: string, opts?: Partial<RateLimitOptions>): Promise<RateLimitResult>
}

export type KeyInput = { userId?: string | null; ip?: string | null; route?: string }
export type KeyFn = (i: KeyInput) => string

export function toHeaders(res: RateLimitResult): Record<string, string> {
    const retrySec = Math.max(0, Math.ceil(res.retryAfterMs / 1000))
    return {
        'X-RateLimit-Limit': String(res.limit),
        'X-RateLimit-Remaining': String(Math.max(0, res.remaining)),
        'X-RateLimit-Reset': String(Math.floor(res.resetAt / 1000)),
        ...(retrySec > 0 ? { 'Retry-After': String(retrySec) } : {})
    }
}
