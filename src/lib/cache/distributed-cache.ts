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
  // Store these in Redis instead of in-memory Maps
  private readonly NODES_KEY = 'cache:nodes'
  private readonly STRATEGIES_KEY = 'cache:strategies'
  private readonly METRICS_KEY = 'cache:metrics'
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
  async getMetrics(strategy?: string): Promise<CacheMetrics | Record<string, CacheMetrics>> {
    try {
      const metricsData = await redis?.get(this.METRICS_KEY)
      const metrics: Record<string, CacheMetrics> = metricsData ? JSON.parse(metricsData as string) : {}

      if (strategy) {
        return metrics[strategy] || this.createEmptyMetrics()
      }
      return metrics
    } catch (error) {
      console.error('[DistributedCache] Error getting metrics:', error)
      return strategy ? this.createEmptyMetrics() : {}
    }
  }

  /**
   * Add cache node
   */
  async addNode(node: CacheNode): Promise<void> {
    try {
      const nodesData = await redis?.get(this.NODES_KEY)
      const nodes: Record<string, CacheNode> = nodesData ? JSON.parse(nodesData as string) : {}
      nodes[node.id] = node
      await redis?.set(this.NODES_KEY, JSON.stringify(nodes))
      console.log(`[DistributedCache] Added cache node: ${node.id}`)
    } catch (error) {
      console.error(`[DistributedCache] Error adding node ${node.id}:`, error)
    }
  }

  /**
   * Remove cache node
   */
  async removeNode(nodeId: string): Promise<void> {
    try {
      const nodesData = await redis?.get(this.NODES_KEY)
      const nodes: Record<string, CacheNode> = nodesData ? JSON.parse(nodesData as string) : {}
      delete nodes[nodeId]
      await redis?.set(this.NODES_KEY, JSON.stringify(nodes))
      console.log(`[DistributedCache] Removed cache node: ${nodeId}`)
    } catch (error) {
      console.error(`[DistributedCache] Error removing node ${nodeId}:`, error)
    }
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<CacheHealthStatus> {
    try {
      const nodesData = await redis?.get(this.NODES_KEY)
      const nodes: Record<string, CacheNode> = nodesData ? JSON.parse(nodesData as string) : {}
      const nodeArray = Object.values(nodes)
      const healthyNodes = nodeArray.filter(node => node.isHealthy)
      const totalNodes = nodeArray.length

      return {
        totalNodes,
        healthyNodes: healthyNodes.length,
        unhealthyNodes: totalNodes - healthyNodes.length,
        primaryCacheHealthy: await this.isPrimaryCacheHealthy(),
        averageResponseTime: await this.calculateAverageResponseTime(),
        overallHitRate: await this.calculateOverallHitRate()
      }
    } catch (error) {
      console.error('[DistributedCache] Error getting health status:', error)
      return {
        totalNodes: 0,
        healthyNodes: 0,
        unhealthyNodes: 0,
        primaryCacheHealthy: false,
        averageResponseTime: 0,
        overallHitRate: 0
      }
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

  private async recordHit(strategy: string, responseTime: number): Promise<void> {
    try {
      const metrics = await this.getOrCreateMetrics(strategy)
      metrics.hits++
      metrics.totalRequests++
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
      metrics.hitRate = metrics.hits / metrics.totalRequests
      await this.saveMetrics(strategy, metrics)
    } catch (error) {
      console.error('[DistributedCache] Error recording hit:', error)
    }
  }

  private async recordMiss(strategy: string, responseTime: number): Promise<void> {
    try {
      const metrics = await this.getOrCreateMetrics(strategy)
      metrics.misses++
      metrics.totalRequests++
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
      metrics.hitRate = metrics.hits / metrics.totalRequests
      await this.saveMetrics(strategy, metrics)
    } catch (error) {
      console.error('[DistributedCache] Error recording miss:', error)
    }
  }

  private async recordError(strategy: string): Promise<void> {
    try {
      const metrics = await this.getOrCreateMetrics(strategy)
      metrics.errors++
      await this.saveMetrics(strategy, metrics)
    } catch (error) {
      console.error('[DistributedCache] Error recording error:', error)
    }
  }

  private async getOrCreateMetrics(strategy: string): Promise<CacheMetrics> {
    try {
      const metricsData = await redis?.get(this.METRICS_KEY)
      const metrics: Record<string, CacheMetrics> = metricsData ? JSON.parse(metricsData as string) : {}
      if (!metrics[strategy]) {
        metrics[strategy] = this.createEmptyMetrics()
      }
      return metrics[strategy]
    } catch {
      return this.createEmptyMetrics()
    }
  }

  private async saveMetrics(strategy: string, metricsData: CacheMetrics): Promise<void> {
    try {
      const allMetricsData = await redis?.get(this.METRICS_KEY)
      const allMetrics: Record<string, CacheMetrics> = allMetricsData ? JSON.parse(allMetricsData as string) : {}
      allMetrics[strategy] = metricsData
      await redis?.set(this.METRICS_KEY, JSON.stringify(allMetrics))
    } catch (error) {
      console.error('[DistributedCache] Error saving metrics:', error)
    }
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

  private async isPrimaryCacheHealthy(): Promise<boolean> {
    try {
      if (!redis) return false
      const result = await redis.ping()
      return result === 'PONG'
    } catch {
      return false
    }
  }

  private async calculateAverageResponseTime(): Promise<number> {
    try {
      const metricsData = await redis?.get(this.METRICS_KEY)
      const metrics: Record<string, CacheMetrics> = metricsData ? JSON.parse(metricsData as string) : {}
      const allMetrics = Object.values(metrics)
      if (allMetrics.length === 0) return 0

      const totalResponseTime = allMetrics.reduce((sum, metric) => sum + metric.averageResponseTime, 0)
      return totalResponseTime / allMetrics.length
    } catch {
      return 0
    }
  }

  private async calculateOverallHitRate(): Promise<number> {
    try {
      const metricsData = await redis?.get(this.METRICS_KEY)
      const metrics: Record<string, CacheMetrics> = metricsData ? JSON.parse(metricsData as string) : {}
      const allMetrics = Object.values(metrics)
      if (allMetrics.length === 0) return 0

      const totalHits = allMetrics.reduce((sum, metric) => sum + metric.hits, 0)
      const totalRequests = allMetrics.reduce((sum, metric) => sum + metric.totalRequests, 0)

      return totalRequests > 0 ? totalHits / totalRequests : 0
    } catch {
      return 0
    }
  }

  private async initializeDefaultStrategies(): Promise<void> {
    const strategies: Record<string, CacheStrategy> = {
      'default': {
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
    },
    'user': {
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
    },
    'chat': {
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
    }
    }

    // Save all strategies to Redis
    try {
      await redis?.set(this.STRATEGIES_KEY, JSON.stringify(strategies))
      console.log('[DistributedCache] Initialized default strategies')
    } catch (error) {
      console.error('[DistributedCache] Error initializing strategies:', error)
    }
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
