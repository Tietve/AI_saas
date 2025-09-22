
import { RateLimiter, RateLimitOptions, RateLimitResult } from './types'

type Bucket = { tokens: number; last: number; limit: number; burst: number; windowMs: number }
const STORE = new Map<string, Bucket>()

function nowMs() { return Date.now() }

function defaults(opt?: Partial<RateLimitOptions>): Required<RateLimitOptions> {
    return {
        limit: opt?.limit ?? 60,          
        windowMs: opt?.windowMs ?? 60_000,
        burst: opt?.burst ?? opt?.limit ?? 60
    }
}


export class InMemoryTokenBucket implements RateLimiter {
    constructor(private base?: Partial<RateLimitOptions>) {}

    async consume(key: string, o?: Partial<RateLimitOptions>): Promise<RateLimitResult> {
        const cfg = defaults({ ...this.base, ...o })
        const ratePerMs = cfg.limit / cfg.windowMs 
        const cap = Math.max(1, cfg.burst)

        const t = nowMs()
        let b = STORE.get(key)
        if (!b) {
            b = { tokens: cap, last: t, limit: cfg.limit, burst: cap, windowMs: cfg.windowMs }
            STORE.set(key, b)
        }

        
        const elapsed = Math.max(0, t - b.last)
        b.tokens = Math.min(cap, b.tokens + elapsed * ratePerMs)
        b.last = t

        if (b.tokens < 1) {
            const need = 1 - b.tokens
            const retryAfterMs = Math.ceil(need / ratePerMs)
            const resetAt = t + retryAfterMs
            return { ok: false, limit: cfg.limit, remaining: Math.floor(Math.max(0, b.tokens)), resetAt, retryAfterMs }
        }

        b.tokens -= 1
        
        const nextMs = b.tokens < 1 ? Math.ceil((1 - b.tokens) / ratePerMs) : 0
        const resetAt = t + nextMs
        return { ok: true, limit: cfg.limit, remaining: Math.floor(b.tokens), resetAt, retryAfterMs: 0 }
    }
}
