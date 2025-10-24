/**
 * Redis Cache Helper with Environment Guards
 *
 * This module provides a centralized Redis client with proper error handling
 * and fallback mechanisms. All cache operations should use this module.
 */

import { Redis } from '@upstash/redis'

// Environment variable validation
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client with graceful fallback (Azure-compatible)
export const redis = REDIS_URL && REDIS_TOKEN
  ? new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(retryCount * 50, 500),
      },
    })
  : null

// Log Redis configuration status
if (!redis) {
  console.warn('[Cache] Redis not configured - caching disabled')
  console.warn('[Cache] To enable caching, set:')
  console.warn('  - UPSTASH_REDIS_REST_URL')
  console.warn('  - UPSTASH_REDIS_REST_TOKEN')
} else {
  console.log('[Cache] Redis client initialized')
}

/**
 * Set a value in cache with TTL
 * @param key Cache key
 * @param value Value to cache (will be JSON serialized)
 * @param ttlSec Time to live in seconds (default: 600)
 */
export async function cacheSet(key: string, value: unknown, ttlSec = 600): Promise<void> {
  if (!redis) {
    console.warn(`[Cache] Redis not available, skipping set for key: ${key}`)
    return
  }

  try {
    await redis.setex(key, ttlSec, JSON.stringify(value))
    console.log(`[Cache] Set key: ${key} (TTL: ${ttlSec}s)`)
  } catch (error) {
    console.error(`[Cache] Error setting key ${key}:`, error)
    // Don't throw error - graceful degradation
  }
}

/**
 * Get a value from cache
 * @param key Cache key
 * @returns Parsed value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) {
    console.warn(`[Cache] Redis not available, returning null for key: ${key}`)
    return null
  }

  try {
    const raw = await redis.get<string>(key)
    if (!raw) {
      console.log(`[Cache] Miss for key: ${key}`)
      return null
    }
    console.log(`[Cache] Hit for key: ${key}`)
    return JSON.parse(raw) as T
  } catch (error) {
    console.error(`[Cache] Error getting key ${key}:`, error)
    return null
  }
}

/**
 * Delete a value from cache
 * @param key Cache key
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
    console.log(`[Cache] Deleted key: ${key}`)
  } catch (error) {
    console.error(`[Cache] Error deleting key ${key}:`, error)
  }
}

/**
 * Check if a key exists in cache
 * @param key Cache key
 * @returns true if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key)
    return result === 1
  } catch (error) {
    console.error(`[Cache] Error checking existence of key ${key}:`, error)
    return false
  }
}

/**
 * Get TTL for a key
 * @param key Cache key
 * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
 */
export async function cacheTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key)
  } catch (error) {
    console.error(`[Cache] Error getting TTL for key ${key}:`, error)
    return -2
  }
}

/**
 * Increment a counter in cache
 * @param key Cache key
 * @param increment Amount to increment (default: 1)
 * @returns New value after increment
 */
export async function cacheIncr(key: string, increment = 1): Promise<number> {
  try {
    const result = await redis.incrby(key, increment)
    console.log(`[Cache] Incremented ${key} by ${increment}, new value: ${result}`)
    return result
  } catch (error) {
    console.error(`[Cache] Error incrementing key ${key}:`, error)
    throw error
  }
}

/**
 * Set multiple values at once
 * @param keyValuePairs Object with key-value pairs
 * @param ttlSec TTL in seconds for all keys
 */
export async function cacheMSet(keyValuePairs: Record<string, any>, ttlSec?: number): Promise<void> {
  try {
    const promises = Object.entries(keyValuePairs).map(([key, value]) =>
      ttlSec ? redis.setex(key, ttlSec, JSON.stringify(value)) : redis.set(key, JSON.stringify(value))
    )
    await Promise.all(promises)
    console.log(`[Cache] Set ${Object.keys(keyValuePairs).length} keys`)
  } catch (error) {
    console.error(`[Cache] Error setting multiple keys:`, error)
    throw error
  }
}

/**
 * Get multiple values at once
 * @param keys Array of cache keys
 * @returns Array of values (null for missing keys)
 */
export async function cacheMGet<T = any>(keys: string[]): Promise<(T | null)[]> {
  try {
    const values = await redis.mget(...keys) as (string | null)[]
    return values.map((v) => v ? JSON.parse(v) as T : null)
  } catch (error) {
    console.error(`[Cache] Error getting multiple keys:`, error)
    return keys.map(() => null)
  }
}

/**
 * Common cache key patterns
 */
export const CacheKeys = {
  // User-related keys
  user: (userId: string) => `user:${userId}`,
  userSession: (userId: string) => `session:${userId}`,
  userLimits: (userId: string) => `limits:${userId}`,
  userUsage: (userId: string, date: string) => `usage:${userId}:${date}`,

  // Conversation-related keys
  conversation: (id: string) => `conv:${id}`,
  conversationMessages: (id: string, page = 1) => `conv:${id}:msgs:${page}`,

  // Rate limiting keys
  rateLimit: (key: string) => `rl:${key}`,
  rateLimitAuth: (ip: string) => `rl:auth:${ip}`,
  rateLimitApi: (ip: string) => `rl:api:${ip}`,

  // Provider health keys
  providerHealth: (provider: string) => `health:provider:${provider}`,
  systemHealth: () => `health:system`,

  // Cache invalidation patterns
  userPattern: (userId: string) => `user:${userId}:*`,
  conversationPattern: (id: string) => `conv:${id}:*`,
} as const

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  DEFAULT: 600,     // 10 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours

  // Specific TTLs for different data types
  USER_DATA: 600,        // 10 minutes
  SESSION: 3600,         // 1 hour
  CONVERSATION: 300,     // 5 minutes
  RATE_LIMIT: 60,        // 1 minute
  PROVIDER_HEALTH: 30,   // 30 seconds
} as const

/**
 * Test Redis connection
 * @returns true if Redis is healthy
 */
export async function testRedisConnection(): Promise<boolean> {
  if (!redis) {
    console.warn('[Cache] Redis not configured - skipping connection test')
    return false
  }

  try {
    const result = await redis.ping()
    if (result !== 'PONG') {
      console.error('[Cache] Redis ping failed, expected PONG but got:', result)
      return false
    }
    console.log('[Cache] Redis connection healthy')
    return true
  } catch (error) {
    console.error('[Cache] Redis connection test failed:', error)
    return false
  }
}

// Note: Redis connection test is performed on-demand in health checks
// to avoid blocking application startup