
import { createRateLimiter } from '@/lib/rate-limit'
import { redisSimple } from '@/lib/redis'

export const globalLimiter = createRateLimiter({
    backend: redisSimple ? 'redis' : 'memory',
    redis: redisSimple ?? undefined,
    defaults: { limit: 60, windowMs: 60_000 }
})
