
import { InMemoryTokenBucket } from './memory'
import { RedisFixedWindow, RedisSimple } from './redisFixedWindow'
import { KeyFn, KeyInput, RateLimiter, RateLimitOptions, RateLimitResult, toHeaders } from './types'

export type Backend = 'memory' | 'redis'

export type RateLimiterConfig = {
    backend?: Backend                
    
    defaults?: Partial<RateLimitOptions>
    
    redis?: RedisSimple | null
    
    prefix?: string
}

export function createRateLimiter(cfg?: RateLimiterConfig): RateLimiter {
    const backend: Backend = cfg?.backend ?? (process.env.RATE_LIMIT_BACKEND as Backend) ?? 'memory'
    if (backend === 'redis' && cfg?.redis) {
        return new RedisFixedWindow(cfg.redis, cfg.prefix ?? 'rl', cfg.defaults)
    }
    
    return new InMemoryTokenBucket(cfg?.defaults)
}

export function defaultKeyFn(scope = 'global'): KeyFn {
    return ({ userId, ip, route }: KeyInput) =>
        userId ? `${scope}:user:${userId}` :
            ip     ? `${scope}:ip:${ip}` :
                `${scope}:anon:${route ?? 'unknown'}`
}


export function getClientIp(req: Request): string | null {
    const h = (k: string) => req.headers.get(k) || ''
    const xff = h('x-forwarded-for')
    if (xff) return xff.split(',')[0].trim()
    return h('cf-connecting-ip') || h('x-real-ip') || null
}

export { type RateLimiter, type RateLimitResult, type RateLimitOptions, toHeaders }
