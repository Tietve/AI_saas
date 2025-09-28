/**
 * Load Balancer Configuration for Horizontal Scaling
 * Supports multiple deployment strategies and health checks
 */

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash'
  healthCheck: {
    enabled: boolean
    interval: number
    timeout: number
    path: string
    expectedStatus: number
  }
  instances: InstanceConfig[]
  failover: {
    enabled: boolean
    maxFailures: number
    recoveryTime: number
  }
  stickySessions: {
    enabled: boolean
    cookieName: string
    maxAge: number
  }
}

export interface InstanceConfig {
  id: string
  url: string
  weight: number
  maxConnections: number
  healthStatus: 'healthy' | 'unhealthy' | 'unknown'
  lastHealthCheck: Date
  responseTime: number
  errorCount: number
}

export class LoadBalancer {
  private config: LoadBalancerConfig
  private currentIndex: number = 0
  private instanceStats: Map<string, InstanceStats> = new Map()

  constructor(config: LoadBalancerConfig) {
    this.config = config
    this.startHealthChecks()
  }

  /**
   * Select the best instance based on the configured strategy
   */
  selectInstance(sessionId?: string): InstanceConfig | null {
    const healthyInstances = this.config.instances.filter(
      instance => instance.healthStatus === 'healthy'
    )

    if (healthyInstances.length === 0) {
      console.warn('[LoadBalancer] No healthy instances available')
      return null
    }

    // Sticky sessions
    if (this.config.stickySessions.enabled && sessionId) {
      const hash = this.hashString(sessionId)
      const index = hash % healthyInstances.length
      return healthyInstances[index]
    }

    switch (this.config.strategy) {
      case 'round-robin':
        return this.roundRobinSelection(healthyInstances)
      
      case 'least-connections':
        return this.leastConnectionsSelection(healthyInstances)
      
      case 'weighted':
        return this.weightedSelection(healthyInstances)
      
      case 'ip-hash':
        return this.ipHashSelection(healthyInstances)
      
      default:
        return healthyInstances[0]
    }
  }

  /**
   * Record instance performance metrics
   */
  recordMetrics(instanceId: string, responseTime: number, success: boolean): void {
    const stats = this.instanceStats.get(instanceId) || {
      totalRequests: 0,
      successfulRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      errorRate: 0
    }

    stats.totalRequests++
    if (success) {
      stats.successfulRequests++
    }
    stats.totalResponseTime += responseTime
    stats.averageResponseTime = stats.totalResponseTime / stats.totalRequests
    stats.errorRate = (stats.totalRequests - stats.successfulRequests) / stats.totalRequests

    this.instanceStats.set(instanceId, stats)
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    const instances = this.config.instances.map(instance => ({
      ...instance,
      stats: this.instanceStats.get(instance.id) || {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        errorRate: 0
      }
    }))

    return {
      totalInstances: this.config.instances.length,
      healthyInstances: instances.filter(i => i.healthStatus === 'healthy').length,
      strategy: this.config.strategy,
      instances,
      overallStats: this.calculateOverallStats()
    }
  }

  private roundRobinSelection(instances: InstanceConfig[]): InstanceConfig {
    const instance = instances[this.currentIndex % instances.length]
    this.currentIndex++
    return instance
  }

  private leastConnectionsSelection(instances: InstanceConfig[]): InstanceConfig {
    return instances.reduce((min, current) => {
      const minStats = this.instanceStats.get(min.id)
      const currentStats = this.instanceStats.get(current.id)
      
      const minConnections = minStats?.totalRequests || 0
      const currentConnections = currentStats?.totalRequests || 0
      
      return currentConnections < minConnections ? current : min
    })
  }

  private weightedSelection(instances: InstanceConfig[]): InstanceConfig {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0)
    let random = Math.random() * totalWeight

    for (const instance of instances) {
      random -= instance.weight
      if (random <= 0) {
        return instance
      }
    }

    return instances[0]
  }

  private ipHashSelection(instances: InstanceConfig[]): InstanceConfig {
    // This would typically use the client's IP address
    // For now, we'll use a random hash
    const hash = this.hashString(Math.random().toString())
    const index = hash % instances.length
    return instances[index]
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private startHealthChecks(): void {
    if (!this.config.healthCheck.enabled) return

    setInterval(async () => {
      await this.performHealthChecks()
    }, this.config.healthCheck.interval)
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = this.config.instances.map(async (instance) => {
      try {
        const startTime = Date.now()
        const response = await fetch(`${instance.url}${this.config.healthCheck.path}`, {
          method: 'GET',
          timeout: this.config.healthCheck.timeout
        })
        const responseTime = Date.now() - startTime

        const isHealthy = response.status === this.config.healthCheck.expectedStatus
        
        if (isHealthy) {
          instance.healthStatus = 'healthy'
          instance.responseTime = responseTime
          instance.errorCount = 0
        } else {
          instance.healthStatus = 'unhealthy'
          instance.errorCount++
        }

        instance.lastHealthCheck = new Date()
      } catch (error) {
        instance.healthStatus = 'unhealthy'
        instance.errorCount++
        instance.lastHealthCheck = new Date()
        console.warn(`[LoadBalancer] Health check failed for ${instance.id}:`, error)
      }
    })

    await Promise.all(healthCheckPromises)
  }

  private calculateOverallStats(): OverallStats {
    const allStats = Array.from(this.instanceStats.values())
    
    if (allStats.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        overallErrorRate: 0,
        throughput: 0
      }
    }

    const totalRequests = allStats.reduce((sum, stats) => sum + stats.totalRequests, 0)
    const totalSuccessful = allStats.reduce((sum, stats) => sum + stats.successfulRequests, 0)
    const totalResponseTime = allStats.reduce((sum, stats) => sum + stats.totalResponseTime, 0)

    return {
      totalRequests,
      averageResponseTime: totalResponseTime / totalRequests || 0,
      overallErrorRate: (totalRequests - totalSuccessful) / totalRequests || 0,
      throughput: totalRequests / (Date.now() / 1000 / 60) // requests per minute
    }
  }
}

export interface InstanceStats {
  totalRequests: number
  successfulRequests: number
  totalResponseTime: number
  averageResponseTime: number
  errorRate: number
}

export interface LoadBalancerStats {
  totalInstances: number
  healthyInstances: number
  strategy: string
  instances: (InstanceConfig & { stats: InstanceStats })[]
  overallStats: OverallStats
}

export interface OverallStats {
  totalRequests: number
  averageResponseTime: number
  overallErrorRate: number
  throughput: number
}

// Default configuration
export const defaultLoadBalancerConfig: LoadBalancerConfig = {
  strategy: 'round-robin',
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    path: '/api/health',
    expectedStatus: 200
  },
  instances: [
    {
      id: 'instance-1',
      url: process.env.INSTANCE_1_URL || 'http://localhost:3000',
      weight: 1,
      maxConnections: 100,
      healthStatus: 'unknown',
      lastHealthCheck: new Date(),
      responseTime: 0,
      errorCount: 0
    }
  ],
  failover: {
    enabled: true,
    maxFailures: 3,
    recoveryTime: 60000 // 1 minute
  },
  stickySessions: {
    enabled: false,
    cookieName: 'lb_session',
    maxAge: 3600000 // 1 hour
  }
}



