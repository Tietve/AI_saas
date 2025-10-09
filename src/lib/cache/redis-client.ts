import { Redis } from '@upstash/redis'

// Full Redis client for advanced caching operations
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ 
        url: process.env.UPSTASH_REDIS_REST_URL!, 
        token: process.env.UPSTASH_REDIS_REST_TOKEN! 
      })
    : null

// Enhanced cache operations
export class EnhancedQueryCache {
  private client = redis
  private defaultTtl = 300 // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null

    try {
      const cached = await this.client.get<T>(key)
      if (cached) {
        console.log(`[Enhanced Cache] Hit for key: ${key}`)
        return cached
      }
      return null
    } catch (error) {
      console.error('[Enhanced Cache] Get error:', error)
      return null
    }
  }

  async set<T>(key: string, data: T, ttl: number = this.defaultTtl): Promise<void> {
    if (!this.client) return

    try {
      await this.client.setex(key, ttl, data)
      console.log(`[Enhanced Cache] Set for key: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      console.error('[Enhanced Cache] Set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return

    try {
      await this.client.del(key)
      console.log(`[Enhanced Cache] Deleted key: ${key}`)
    } catch (error) {
      console.error('[Enhanced Cache] Delete error:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client) return

    try {
      // Note: Upstash Redis REST API doesn't support KEYS command
      // This is a limitation of the REST API
      console.log(`[Enhanced Cache] Pattern invalidation requested: ${pattern}`)
      console.log('[Enhanced Cache] Note: Pattern invalidation requires Redis CLI or Redis client')
    } catch (error) {
      console.error('[Enhanced Cache] Pattern invalidation error:', error)
    }
  }

  async clearAll(): Promise<void> {
    if (!this.client) return

    try {
      // Note: Upstash Redis REST API doesn't support FLUSHALL
      // This is a limitation of the REST API
      console.log('[Enhanced Cache] Clear all requested')
      console.log('[Enhanced Cache] Note: Clear all requires Redis CLI or Redis client')
    } catch (error) {
      console.error('[Enhanced Cache] Clear all error:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('[Enhanced Cache] Exists error:', error)
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) return -1

    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error('[Enhanced Cache] TTL error:', error)
      return -1
    }
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client) return keys.map(() => null)

    try {
      const result = await this.client.mget(...keys)
      return result as (T | null)[]
    } catch (error) {
      console.error('[Enhanced Cache] MGET error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    if (!this.client) return

    try {
      if (ttl) {
        // Set with TTL for each key
        const promises = Object.entries(keyValuePairs).map(([key, value]) =>
          this.client!.setex(key, ttl, value)
        )
        await Promise.all(promises)
      } else {
        await this.client.mset(keyValuePairs)
      }
      console.log(`[Enhanced Cache] MSET completed for ${Object.keys(keyValuePairs).length} keys`)
    } catch (error) {
      console.error('[Enhanced Cache] MSET error:', error)
    }
  }
}

// Singleton instance
export const enhancedCache = new EnhancedQueryCache()

// Cache key generators for common patterns
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userLimits: (userId: string) => `user:${userId}:limits`,
  dailyUsage: (userId: string, date: string) => `daily_usage:${userId}:${date}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  conversationMessages: (conversationId: string, limit: number = 50) => 
    `conversation:${conversationId}:messages:${limit}`,
  usageSummary: (userId: string) => `usage_summary:${userId}`,
  providerHealth: () => `provider_health`,
  rateLimit: (key: string) => `rate_limit:${key}`,
} as const

// Cache TTL constants
export const CacheTTL = {
  USER_DATA: 600, // 10 minutes
  CONVERSATION: 300, // 5 minutes
  USAGE_DATA: 60, // 1 minute
  PROVIDER_HEALTH: 30, // 30 seconds
  RATE_LIMIT: 60, // 1 minute
} as const


