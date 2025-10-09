
import { Redis } from '@upstash/redis'
import type { RedisSimple } from '@/lib/rate-limit/redisFixedWindow'

export const upstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
    : null

export const redisSimple: RedisSimple | null = upstash ? {
    incr: (k) => upstash.incr(k) as any,
    pexpire: (k, ms) => upstash.pexpire(k, ms) as any,
    pttl: (k) => upstash.pttl(k) as any,
    get: (k) => upstash.get(k) as any,
    setex: (k, sec, val) => upstash.setex(k, sec, val) as any,
} : null
