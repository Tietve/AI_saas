/**
 * Redis Client for Caching & Rate Limiting
 *
 * Uses Upstash Redis REST API for serverless compatibility
 * Provides caching layer for database queries and API responses
 */

import { Redis } from '@upstash/redis'
import type { RedisSimple } from '@/lib/rate-limit/redisFixedWindow'
import { logger } from './logger'

export const upstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        // Enable automatic retries
        retry: {
            retries: 3,
            backoff: (retryCount) => Math.min(retryCount * 50, 500),
        },
    })
    : null

export const redisSimple: RedisSimple | null = upstash ? {
    incr: (k) => upstash.incr(k) as any,
    pexpire: (k, ms) => upstash.pexpire(k, ms) as any,
    pttl: (k) => upstash.pttl(k) as any,
    get: (k) => upstash.get(k) as any,
    setex: (k, sec, val) => upstash.setex(k, sec, val) as any,
} : null

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
    if (!upstash) {
        logger.warn('Redis not configured - caching disabled')
    }
    return upstash
}

/**
 * Cache wrapper for functions
 *
 * @param key - Cache key
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param fn - Function to execute if cache miss
 * @returns Cached or fresh data
 */
export async function cacheGet<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>
): Promise<T> {
    const redis = getRedisClient()

    // If Redis not available, execute function directly
    if (!redis) {
        return fn()
    }

    try {
        // Try to get from cache
        const cached = await redis.get<T>(key)

        if (cached !== null && cached !== undefined) {
            logger.debug({ key }, '✅ Cache HIT')
            return cached
        }

        logger.debug({ key }, '❌ Cache MISS')

        // Execute function and cache result
        const result = await fn()

        // Cache the result (fire-and-forget)
        redis.setex(key, ttl, result).catch((err) => {
            logger.error({ err, key }, 'Failed to cache result')
        })

        return result
    } catch (error) {
        logger.error({ err: error, key }, 'Redis error - falling back to direct execution')
        return fn()
    }
}

/**
 * Set cache value
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds
 */
export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return

    try {
        await redis.setex(key, ttl, value)
        logger.debug({ key, ttl }, 'Cache SET')
    } catch (error) {
        logger.error({ err: error, key }, 'Failed to set cache')
    }
}

/**
 * Delete cache key
 *
 * @param key - Cache key
 */
export async function cacheDelete(key: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return

    try {
        await redis.del(key)
        logger.debug({ key }, 'Cache DELETE')
    } catch (error) {
        logger.error({ err: error, key }, 'Failed to delete cache')
    }
}

/**
 * Delete multiple cache keys
 *
 * @param keys - Array of cache keys
 */
export async function cacheDeleteMany(keys: string[]): Promise<void> {
    const redis = getRedisClient()
    if (!redis || keys.length === 0) return

    try {
        await redis.del(...keys)
        logger.debug({ count: keys.length }, 'Cache DELETE MANY')
    } catch (error) {
        logger.error({ err: error, keys }, 'Failed to delete cache keys')
    }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<{
    healthy: boolean
    latency: number
    error?: string
}> {
    const redis = getRedisClient()

    if (!redis) {
        return {
            healthy: false,
            latency: 0,
            error: 'Redis not configured',
        }
    }

    const startTime = Date.now()

    try {
        await redis.ping()
        const latency = Date.now() - startTime

        return {
            healthy: true,
            latency,
        }
    } catch (error) {
        const latency = Date.now() - startTime

        return {
            healthy: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
    VERY_SHORT: 60, // 1 minute
    SHORT: 300, // 5 minutes
    MEDIUM: 900, // 15 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
} as const

// Cache key prefixes
export const CacheKey = {
    USER: (userId: string) => `user:${userId}`,
    USER_SUBSCRIPTION: (userId: string) => `user:${userId}:subscription`,
    USER_SETTINGS: (userId: string) => `user:${userId}:settings`,
    CONVERSATION: (conversationId: string) => `conversation:${conversationId}`,
    CONVERSATION_MESSAGES: (conversationId: string) => `conversation:${conversationId}:messages`,
    TOKEN_USAGE: (userId: string) => `user:${userId}:token_usage`,
    RATE_LIMIT: (userId: string) => `rate_limit:${userId}`,
} as const
