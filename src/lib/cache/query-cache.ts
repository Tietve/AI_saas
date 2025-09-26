import { redisSimple } from '@/lib/redis'
import crypto from 'crypto'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string // Custom cache key
  skipCache?: boolean // Skip cache for this query
}

export class QueryCache {
  private redis = redisSimple
  private defaultTtl = 300 // 5 minutes

  /**
   * Generate cache key from query parameters
   */
  private generateKey(query: string, params?: any): string {
    const normalizedQuery = query.toLowerCase().trim()
    const paramsStr = params ? JSON.stringify(params) : ''
    const hash = crypto
      .createHash('sha256')
      .update(normalizedQuery + paramsStr)
      .digest('hex')
      .substring(0, 16)
    
    return `cache:query:${hash}`
  }

  /**
   * Get cached result
   */
  async get<T>(query: string, params?: any): Promise<T | null> {
    if (!this.redis) return null

    try {
      const key = this.generateKey(query, params)
      const cached = await this.redis.get(key)
      
      if (cached) {
        console.log(`[Cache] Hit for query: ${query.substring(0, 50)}...`)
        return JSON.parse(cached)
      }
      
      return null
    } catch (error) {
      console.error('[Cache] Get error:', error)
      return null
    }
  }

  /**
   * Set cache result
   */
  async set<T>(
    query: string, 
    data: T, 
    params?: any, 
    ttl: number = this.defaultTtl
  ): Promise<void> {
    if (!this.redis) return

    try {
      const key = this.generateKey(query, params)
      const serialized = JSON.stringify(data)
      
      // Set with expiration
      await this.redis.setex(key, ttl, serialized)
      console.log(`[Cache] Set for query: ${query.substring(0, 50)}... (TTL: ${ttl}s)`)
    } catch (error) {
      console.error('[Cache] Set error:', error)
    }
  }

  /**
   * Cache wrapper for database queries
   */
  async cached<T>(
    query: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTtl, key, skipCache = false } = options

    if (skipCache || !this.redis) {
      return await queryFn()
    }

    // Try to get from cache
    const cacheKey = key || this.generateKey(query)
    const cached = await this.get(query, undefined)
    
    if (cached) {
      return cached as T
    }

    // Execute query and cache result
    const result = await queryFn()
    await this.set(query, result, undefined, ttl)
    
    return result
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string): Promise<void> {
    if (!this.redis) return

    try {
      // Note: Redis simple doesn't have pattern matching
      // This would need to be implemented with full Redis client
      console.log(`[Cache] Invalidate requested for pattern: ${pattern}`)
    } catch (error) {
      console.error('[Cache] Invalidate error:', error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.redis) return

    try {
      // Note: Redis simple doesn't have flushall
      // This would need to be implemented with full Redis client
      console.log('[Cache] Clear requested')
    } catch (error) {
      console.error('[Cache] Clear error:', error)
    }
  }
}

// Singleton instance
export const queryCache = new QueryCache()

// Helper function for common caching patterns
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  return queryCache.cached(key, fn, { ttl })
}


