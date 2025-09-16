// src/lib/rate-limit/redisFixedWindow.ts
import { RateLimiter, RateLimitOptions, RateLimitResult } from './types'

export interface RedisSimple {
    incr(key: string): Promise<number>
    pexpire(key: string, ms: number): Promise<number>
    pttl(key: string): Promise<number>
}

/**
 * Fixed-Window trên Redis: đơn giản, ổn định, phù hợp production/multi-instance.
 * - Mỗi cửa sổ tạo 1 key: rl:{prefix}:{key}:{slot}
 * - Dùng INCR + PEXPIRE, PTTL để trả Retry-After.
 */
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
            burst: opt?.burst ?? opt?.limit ?? 60, // không dùng trong fixed-window, giữ để đồng bộ type
        }
    }

    async consume(key: string, o?: Partial<RateLimitOptions>): Promise<RateLimitResult> {
        const cfg = this.defaults({ ...this.base, ...o })
        const now = Date.now()
        const slot = Math.floor(now / cfg.windowMs)
        const redisKey = `${this.prefix}:${key}:${slot}`

        const count = await this.redis.incr(redisKey)
        if (count === 1) {
            // set TTL khi key mới tạo
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
