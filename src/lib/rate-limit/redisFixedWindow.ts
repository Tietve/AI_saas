
import { RateLimiter, RateLimitOptions, RateLimitResult } from './types'

export interface RedisSimple {
    incr(key: string): Promise<number>
    pexpire(key: string, ms: number): Promise<number>
    pttl(key: string): Promise<number>
    get(key: string): Promise<string | null>
    setex(key: string, seconds: number, value: string): Promise<string>
}


export class RedisFixedWindow implements RateLimiter {
    constructor(
        private redis: RedisSimple,
        private prefix = 'rl',
        private base?: Partial<RateLimitOptions>,
    ) {}

    private defaults(opt?: Partial<RateLimitOptions>): Required<RateLimitOptions> {
        return {
            limit: opt?.limit ?? 60,
            windowMs: opt?.windowMs ?? 60_000,
            burst: opt?.burst ?? opt?.limit ?? 60, 
        }
    }

    async consume(key: string, o?: Partial<RateLimitOptions>): Promise<RateLimitResult> {
        const cfg = this.defaults({ ...this.base, ...o })
        const now = Date.now()
        const slot = Math.floor(now / cfg.windowMs)
        const redisKey = `${this.prefix}:${key}:${slot}`

        const count = await this.redis.incr(redisKey)
        if (count === 1) {
            
            await this.redis.pexpire(redisKey, cfg.windowMs)
        }
        const ttl = await this.redis.pttl(redisKey)
        const resetAt = now + (ttl > 0 ? ttl : cfg.windowMs)

        if (count > cfg.limit) {
            const retryAfterMs = ttl > 0 ? ttl : cfg.windowMs
            return { ok: false, limit: cfg.limit, remaining: 0, resetAt, retryAfterMs }
        }

        const remaining = Math.max(0, cfg.limit - count)
        return { ok: true, limit: cfg.limit, remaining, resetAt, retryAfterMs: 0 }
    }
}
