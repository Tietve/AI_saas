/**
 * Advanced Caching Strategies
 */

import { enhancedCache, CacheKeys, CacheTTL } from './redis-client'
import { performanceMonitor } from '@/lib/monitoring/performance'

export interface CacheStrategy {
  name: string
  ttl: number
  maxSize?: number
  invalidateOn?: string[]
  preload?: boolean
  compression?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  metadata?: Record<string, any>
}

export interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
  averageResponseTime: number
}

class AdvancedCacheManager {
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    totalResponseTime: 0,
  }

  private strategies = new Map<string, CacheStrategy>()
  private dependencies = new Map<string, Set<string>>() // key -> dependencies
  private reverseDependencies = new Map<string, Set<string>>() // dependency -> keys

  constructor() {
    this.initializeDefaultStrategies()
  }

  /**
   * Initialize default caching strategies
   */
  private initializeDefaultStrategies(): void {
    this.addStrategy('user_data', {
      name: 'User Data',
      ttl: CacheTTL.USER_DATA,
      maxSize: 1000,
      invalidateOn: ['user_update'],
    })

    this.addStrategy('conversation', {
      name: 'Conversation',
      ttl: CacheTTL.CONVERSATION,
      maxSize: 5000,
      invalidateOn: ['message_create', 'conversation_update'],
    })

    this.addStrategy('usage_data', {
      name: 'Usage Data',
      ttl: CacheTTL.USAGE_DATA,
      maxSize: 2000,
      invalidateOn: ['token_usage_create'],
    })

    this.addStrategy('ai_response', {
      name: 'AI Response',
      ttl: 1800, // 30 minutes
      maxSize: 10000,
      compression: true,
    })

    this.addStrategy('static_content', {
      name: 'Static Content',
      ttl: 3600, // 1 hour
      maxSize: 1000,
      preload: true,
    })
  }

  /**
   * Add a new caching strategy
   */
  addStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy)
  }

  /**
   * Get cached data with strategy-based TTL and invalidation
   */
  async get<T>(
    key: string,
    strategy: string = 'default',
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    const start = performance.now()
    const strategyConfig = this.strategies.get(strategy)

    try {
      const cached = await enhancedCache.get<CacheEntry<T>>(key)
      
      if (cached) {
        // Check if cache entry is still valid
        if (this.isCacheValid(cached, strategyConfig)) {
          this.metrics.hits++
          this.updateCacheMetrics(cached)
          
          const duration = performance.now() - start
          this.metrics.totalResponseTime += duration
          
          console.log(`[Advanced Cache] Hit for key: ${key} (strategy: ${strategy})`)
          return cached.data
        } else {
          // Cache expired, remove it
          await this.delete(key)
        }
      }

      this.metrics.misses++
      
      // Try fallback if provided
      if (fallback) {
        console.log(`[Advanced Cache] Miss for key: ${key}, using fallback`)
        const data = await fallback()
        await this.set(key, data, strategy)
        return data
      }

      return null
    } catch (error) {
      console.error(`[Advanced Cache] Error getting key ${key}:`, error)
      return null
    }
  }

  /**
   * Set cached data with strategy-based configuration
   */
  async set<T>(
    key: string,
    data: T,
    strategy: string = 'default',
    metadata?: Record<string, any>
  ): Promise<void> {
    const start = performance.now()
    const strategyConfig = this.strategies.get(strategy)

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: strategyConfig?.ttl || 300,
        hits: 0,
        metadata,
      }

      await enhancedCache.set(key, entry, entry.ttl)
      this.metrics.sets++

      const duration = performance.now() - start
      this.metrics.totalResponseTime += duration

      console.log(`[Advanced Cache] Set key: ${key} (strategy: ${strategy}, TTL: ${entry.ttl}s)`)
    } catch (error) {
      console.error(`[Advanced Cache] Error setting key ${key}:`, error)
    }
  }

  /**
   * Delete cached data and invalidate dependencies
   */
  async delete(key: string): Promise<void> {
    try {
      await enhancedCache.del(key)
      this.metrics.deletes++

      // Invalidate dependent keys
      const dependents = this.reverseDependencies.get(key)
      if (dependents) {
        for (const dependentKey of dependents) {
          await enhancedCache.del(dependentKey)
          console.log(`[Advanced Cache] Invalidated dependent key: ${dependentKey}`)
        }
      }

      console.log(`[Advanced Cache] Deleted key: ${key}`)
    } catch (error) {
      console.error(`[Advanced Cache] Error deleting key ${key}:`, error)
    }
  }

  /**
   * Invalidate cache by pattern or dependency
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      // This would need Redis pattern matching in production
      console.log(`[Advanced Cache] Invalidation requested for pattern: ${pattern}`)
      
      // For now, we'll track invalidation events
      this.trackInvalidation(pattern)
    } catch (error) {
      console.error(`[Advanced Cache] Error invalidating pattern ${pattern}:`, error)
    }
  }

  /**
   * Preload data based on strategy
   */
  async preload<T>(
    keys: string[],
    loader: (key: string) => Promise<T>,
    strategy: string = 'default'
  ): Promise<void> {
    const strategyConfig = this.strategies.get(strategy)
    
    if (!strategyConfig?.preload) {
      return
    }

    console.log(`[Advanced Cache] Preloading ${keys.length} keys with strategy: ${strategy}`)

    const promises = keys.map(async (key) => {
      try {
        const data = await loader(key)
        await this.set(key, data, strategy)
      } catch (error) {
        console.error(`[Advanced Cache] Preload failed for key ${key}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0
    const averageResponseTime = total > 0 ? this.metrics.totalResponseTime / total : 0

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      hitRate: Math.round(hitRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    }
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalResponseTime: 0,
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid<T>(entry: CacheEntry<T>, strategy?: CacheStrategy): boolean {
    const now = Date.now()
    const age = now - entry.timestamp
    const maxAge = (strategy?.ttl || entry.ttl) * 1000

    return age < maxAge
  }

  /**
   * Update cache entry metrics
   */
  private updateCacheMetrics<T>(entry: CacheEntry<T>): void {
    entry.hits++
  }

  /**
   * Track cache invalidation events
   */
  private trackInvalidation(pattern: string): void {
    // This could be expanded to track invalidation patterns
    console.log(`[Advanced Cache] Tracked invalidation: ${pattern}`)
  }

  /**
   * Add dependency relationship between cache keys
   */
  addDependency(key: string, dependency: string): void {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Set())
    }
    this.dependencies.get(key)!.add(dependency)

    if (!this.reverseDependencies.has(dependency)) {
      this.reverseDependencies.set(dependency, new Set())
    }
    this.reverseDependencies.get(dependency)!.add(key)
  }

  /**
   * Remove dependency relationship
   */
  removeDependency(key: string, dependency: string): void {
    this.dependencies.get(key)?.delete(dependency)
    this.reverseDependencies.get(dependency)?.delete(key)
  }
}

// Singleton instance
export const advancedCache = new AdvancedCacheManager()

// Cache decorators
export function withCache<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  strategy: string = 'default',
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: T) {
      const key = keyGenerator(...args)
      
      return advancedCache.get<R>(
        key,
        strategy,
        () => method.apply(this, args)
      )
    }
  }
}

// Cache warming strategies
export class CacheWarmer {
  /**
   * Warm user-related caches
   */
  static async warmUserCaches(userIds: string[]): Promise<void> {
    console.log(`[Cache Warmer] Warming caches for ${userIds.length} users`)
    
    // Preload user limits
    const limitKeys = userIds.map(id => CacheKeys.userLimits(id))
    await advancedCache.preload(
      limitKeys,
      async (key) => {
        const userId = key.replace('user:', '').replace(':limits', '')
        // This would call the actual function to get user limits
        return null // Placeholder
      },
      'user_data'
    )

    // Preload usage summaries
    const usageKeys = userIds.map(id => CacheKeys.usageSummary(id))
    await advancedCache.preload(
      usageKeys,
      async (key) => {
        const userId = key.replace('usage_summary:', '')
        // This would call the actual function to get usage summary
        return null // Placeholder
      },
      'usage_data'
    )
  }

  /**
   * Warm conversation caches
   */
  static async warmConversationCaches(conversationIds: string[]): Promise<void> {
    console.log(`[Cache Warmer] Warming caches for ${conversationIds.length} conversations`)
    
    const conversationKeys = conversationIds.map(id => CacheKeys.conversation(id))
    await advancedCache.preload(
      conversationKeys,
      async (key) => {
        const conversationId = key.replace('conversation:', '')
        // This would call the actual function to get conversation
        return null // Placeholder
      },
      'conversation'
    )
  }
}

// Helper functions
export const getCacheMetrics = () => advancedCache.getMetrics()

export const resetCacheMetrics = () => advancedCache.resetMetrics()

export const warmCaches = {
  users: CacheWarmer.warmUserCaches,
  conversations: CacheWarmer.warmConversationCaches,
}

// Cache invalidation helpers
export const invalidateUserCache = (userId: string) => {
  advancedCache.delete(CacheKeys.user(userId))
  advancedCache.delete(CacheKeys.userLimits(userId))
  advancedCache.delete(CacheKeys.usageSummary(userId))
}

export const invalidateConversationCache = (conversationId: string) => {
  advancedCache.delete(CacheKeys.conversation(conversationId))
  advancedCache.delete(CacheKeys.conversationMessages(conversationId))
}
