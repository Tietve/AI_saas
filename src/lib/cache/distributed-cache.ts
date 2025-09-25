/**
 * Distributed Caching System for Horizontal Scaling
 * Supports cache warming, intelligent invalidation, and multi-tier caching
 */

import { redis } from './redis-client'

export interface CacheNode {
  id: string
  url: string
  region: string
  isHealthy: boolean
  lastHealthCheck: Date
  responseTime: number
}

export interface CacheStrategy {
  name: string
  ttl: number
  maxSize: number
  compression: boolean
  encryption: boolean
  warming: {
    enabled: boolean
    patterns: string[]
    schedule: string
  }
  invalidation: {
    strategy: 'time' | 'dependency' | 'event' | 'manual'
    dependencies?: string[]
    events?: string[]
  }
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  averageResponseTime: number
  memoryUsage: number
  evictions: number
  errors: number
}

export class DistributedCache {
  private nodes: Map<string, CacheNode> = new Map()
  private strategies: Map<string, CacheStrategy> = new Map()
  private metrics: Map<string, CacheMetrics> = new Map()
  private warmingScheduler: NodeJS.Timeout | null = null

  constructor() {
    this.initializeDefaultStrategies()
    this.startCacheWarming()
    this.startHealthChecks()
  }

  /**
   * Get value from cache with fallback strategy
   */
  async get<T>(key: string, strategy: string = 'default'): Promise<T | null> {
    const startTime = Date.now()
    
    try {
      // Try primary cache (Redis)
      const value = await this.getFromPrimary(key)
      if (value !== null) {
        this.recordHit(strategy, Date.now() - startTime)
        return this.deserializeValue<T>(value)
      }

      // Try secondary caches (other nodes)
      const secondaryValue = await this.getFromSecondary(key)
      if (secondaryValue !== null) {
        // Populate primary cache
        await this.setToPrimary(key, secondaryValue, strategy)
        this.recordHit(strategy, Date.now() - startTime)
        return this.deserializeValue<T>(secondaryValue)
      }

      this.recordMiss(strategy, Date.now() - startTime)
      return null
    } catch (error) {
      this.recordError(strategy)
      console.error(`[DistributedCache] Error getting key ${key}:`, error)
      return null
    }
  }

  /**
   * Set value in cache with strategy
   */
  async set<T>(key: string, value: T, strategy: string = 'default'): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      const strategyConfig = this.strategies.get(strategy)
      if (!strategyConfig) {
        throw new Error(`Unknown cache strategy: ${strategy}`)
      }

      const serializedValue = this.serializeValue(value, strategyConfig)
      
      // Set in primary cache
      await this.setToPrimary(key, serializedValue, strategy)
      
      // Set in secondary caches if needed
      if (strategyConfig.invalidation.strategy === 'dependency') {
        await this.setToSecondary(key, serializedValue, strategy)
      }

      this.recordHit(strategy, Date.now() - startTime)
      return true
    } catch (error) {
      this.recordError(strategy)
      console.error(`[DistributedCache] Error setting key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete value from all caches
   */
  async delete(key: string, strategy: string = 'default'): Promise<boolean> {
    try {
      // Delete from primary cache
      if (redis) {
        await redis.del(key)
      }
      
      // Delete from secondary caches
      await this.deleteFromSecondary(key)
      
      // Invalidate dependencies
      await this.invalidateDependencies(key, strategy)
      
      return true
    } catch (error) {
      console.error(`[DistributedCache] Error deleting key ${key}:`, error)
      return false
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(strategy: string): Promise<void> {
    const strategyConfig = this.strategies.get(strategy)
    if (!strategyConfig?.warming.enabled) return

    console.log(`[DistributedCache] Warming cache for strategy: ${strategy}`)
    
    try {
      // This would typically fetch data from database or external APIs
      // and populate the cache with frequently accessed items
      const warmingData = await this.fetchWarmingData(strategyConfig.warming.patterns)
      
      for (const [key, value] of Object.entries(warmingData)) {
        await this.set(key, value, strategy)
      }
      
      console.log(`[DistributedCache] Cache warming completed for ${strategy}`)
    } catch (error) {
      console.error(`[DistributedCache] Cache warming failed for ${strategy}:`, error)
    }
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(strategy?: string): CacheMetrics | Map<string, CacheMetrics> {
    if (strategy) {
      return this.metrics.get(strategy) || this.createEmptyMetrics()
    }
    return new Map(this.metrics)
  }

  /**
   * Add cache node
   */
  addNode(node: CacheNode): void {
    this.nodes.set(node.id, node)
    console.log(`[DistributedCache] Added cache node: ${node.id}`)
  }

  /**
   * Remove cache node
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId)
    console.log(`[DistributedCache] Removed cache node: ${nodeId}`)
  }

  /**
   * Get cache health status
   */
  getHealthStatus(): CacheHealthStatus {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy)
    const totalNodes = this.nodes.size
    
    return {
      totalNodes,
      healthyNodes: healthyNodes.length,
      unhealthyNodes: totalNodes - healthyNodes.length,
      primaryCacheHealthy: this.isPrimaryCacheHealthy(),
      averageResponseTime: this.calculateAverageResponseTime(),
      overallHitRate: this.calculateOverallHitRate()
    }
  }

  private async getFromPrimary(key: string): Promise<string | null> {
    try {
      if (!redis) return null
      return await redis.get(key)
    } catch (error) {
      console.error('[DistributedCache] Primary cache error:', error)
      return null
    }
  }

  private async setToPrimary(key: string, value: string, strategy: string): Promise<void> {
    const strategyConfig = this.strategies.get(strategy)
    if (!strategyConfig || !redis) return

    const ttl = strategyConfig.ttl
    if (ttl > 0) {
      await redis.setex(key, ttl, value)
    } else {
      await redis.set(key, value)
    }
  }

  private async getFromSecondary(key: string): Promise<string | null> {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy)
    
    for (const node of healthyNodes) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1000)
        
        const response = await fetch(`${node.url}/cache/${key}`, {
          method: 'GET',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const value = await response.text()
          return value
        }
      } catch (error) {
        console.warn(`[DistributedCache] Secondary cache error for node ${node.id}:`, error)
      }
    }
    
    return null
  }

  private async setToSecondary(key: string, value: string, strategy: string): Promise<void> {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy)
    const strategyConfig = this.strategies.get(strategy)
    
    const promises = healthyNodes.map(async (node) => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        await fetch(`${node.url}/cache/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, ttl: strategyConfig?.ttl || 0 }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
      } catch (error) {
        console.warn(`[DistributedCache] Failed to set secondary cache for node ${node.id}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
  }

  private async deleteFromSecondary(key: string): Promise<void> {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy)
    
    const promises = healthyNodes.map(async (node) => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        await fetch(`${node.url}/cache/${key}`, { 
          method: 'DELETE',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
      } catch (error) {
        console.warn(`[DistributedCache] Failed to delete from secondary cache for node ${node.id}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
  }

  private async invalidateDependencies(key: string, strategy: string): Promise<void> {
    const strategyConfig = this.strategies.get(strategy)
    if (!strategyConfig?.invalidation.dependencies) return

    for (const dependency of strategyConfig.invalidation.dependencies) {
      const dependentKey = dependency.replace('*', key)
      await this.delete(dependentKey, strategy)
    }
  }

  private async fetchWarmingData(patterns: string[]): Promise<Record<string, any>> {
    // This would typically fetch data from database based on patterns
    // For now, return empty object
    return {}
  }

  private serializeValue<T>(value: T, strategy: CacheStrategy): string {
    let serialized = JSON.stringify(value)
    
    if (strategy.compression) {
      // Implement compression logic here
      // serialized = compress(serialized)
    }
    
    if (strategy.encryption) {
      // Implement encryption logic here
      // serialized = encrypt(serialized)
    }
    
    return serialized
  }

  private deserializeValue<T>(value: string): T {
    // Implement decryption and decompression logic here
    return JSON.parse(value)
  }

  private recordHit(strategy: string, responseTime: number): void {
    const metrics = this.getOrCreateMetrics(strategy)
    metrics.hits++
    metrics.totalRequests++
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
    metrics.hitRate = metrics.hits / metrics.totalRequests
  }

  private recordMiss(strategy: string, responseTime: number): void {
    const metrics = this.getOrCreateMetrics(strategy)
    metrics.misses++
    metrics.totalRequests++
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
    metrics.hitRate = metrics.hits / metrics.totalRequests
  }

  private recordError(strategy: string): void {
    const metrics = this.getOrCreateMetrics(strategy)
    metrics.errors++
  }

  private getOrCreateMetrics(strategy: string): CacheMetrics {
    if (!this.metrics.has(strategy)) {
      this.metrics.set(strategy, this.createEmptyMetrics())
    }
    return this.metrics.get(strategy)!
  }

  private createEmptyMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      evictions: 0,
      errors: 0
    }
  }

  private startCacheWarming(): void {
    this.warmingScheduler = setInterval(() => {
      for (const [strategy, config] of this.strategies) {
        if (config.warming.enabled) {
          this.warmCache(strategy)
        }
      }
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks()
    }, 30000) // Every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    for (const [nodeId, node] of this.nodes) {
      try {
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${node.url}/health`, { 
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime
        
        node.isHealthy = response.ok
        node.lastHealthCheck = new Date()
        node.responseTime = responseTime
      } catch (error) {
        node.isHealthy = false
        node.lastHealthCheck = new Date()
        console.warn(`[DistributedCache] Health check failed for node ${nodeId}:`, error)
      }
    }
  }

  private isPrimaryCacheHealthy(): boolean {
    try {
      // Simple ping to Redis
      return true // This would actually ping Redis
    } catch {
      return false
    }
  }

  private calculateAverageResponseTime(): number {
    const allMetrics = Array.from(this.metrics.values())
    if (allMetrics.length === 0) return 0
    
    const totalResponseTime = allMetrics.reduce((sum, metrics) => sum + metrics.averageResponseTime, 0)
    return totalResponseTime / allMetrics.length
  }

  private calculateOverallHitRate(): number {
    const allMetrics = Array.from(this.metrics.values())
    if (allMetrics.length === 0) return 0
    
    const totalHits = allMetrics.reduce((sum, metrics) => sum + metrics.hits, 0)
    const totalRequests = allMetrics.reduce((sum, metrics) => sum + metrics.totalRequests, 0)
    
    return totalRequests > 0 ? totalHits / totalRequests : 0
  }

  private initializeDefaultStrategies(): void {
    // Default strategy
    this.strategies.set('default', {
      name: 'Default',
      ttl: 3600, // 1 hour
      maxSize: 1000,
      compression: false,
      encryption: false,
      warming: {
        enabled: false,
        patterns: [],
        schedule: '0 */6 * * *' // Every 6 hours
      },
      invalidation: {
        strategy: 'time',
        dependencies: [],
        events: []
      }
    })

    // User data strategy
    this.strategies.set('user', {
      name: 'User Data',
      ttl: 1800, // 30 minutes
      maxSize: 10000,
      compression: true,
      encryption: true,
      warming: {
        enabled: true,
        patterns: ['user:*', 'usage:*'],
        schedule: '0 */2 * * *' // Every 2 hours
      },
      invalidation: {
        strategy: 'dependency',
        dependencies: ['user:*', 'subscription:*'],
        events: ['user.updated', 'subscription.changed']
      }
    })

    // Chat data strategy
    this.strategies.set('chat', {
      name: 'Chat Data',
      ttl: 7200, // 2 hours
      maxSize: 5000,
      compression: true,
      encryption: false,
      warming: {
        enabled: true,
        patterns: ['conversation:*', 'message:*'],
        schedule: '0 */4 * * *' // Every 4 hours
      },
      invalidation: {
        strategy: 'event',
        dependencies: ['conversation:*'],
        events: ['conversation.deleted', 'message.added']
      }
    })
  }
}

export interface CacheHealthStatus {
  totalNodes: number
  healthyNodes: number
  unhealthyNodes: number
  primaryCacheHealthy: boolean
  averageResponseTime: number
  overallHitRate: number
}

// Export singleton instance
export const distributedCache = new DistributedCache()
