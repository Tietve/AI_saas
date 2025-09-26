/**
 * Auto-scaling Configuration and Management
 * Handles dynamic scaling based on metrics and policies
 */

export interface AutoScalingConfig {
  enabled: boolean
  minInstances: number
  maxInstances: number
  scaleUpThreshold: number
  scaleDownThreshold: number
  scaleUpCooldown: number
  scaleDownCooldown: number
  metrics: ScalingMetrics
  policies: ScalingPolicy[]
}

export interface ScalingMetrics {
  cpuThreshold: number
  memoryThreshold: number
  requestRateThreshold: number
  responseTimeThreshold: number
  errorRateThreshold: number
}

export interface ScalingPolicy {
  name: string
  condition: ScalingCondition
  action: ScalingAction
  priority: number
  enabled: boolean
}

export interface ScalingCondition {
  metric: 'cpu' | 'memory' | 'requestRate' | 'responseTime' | 'errorRate'
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  value: number
  duration: number // seconds
}

export interface ScalingAction {
  type: 'scaleUp' | 'scaleDown' | 'noop'
  adjustment: number
  minInstances?: number
  maxInstances?: number
}

export interface InstanceMetrics {
  instanceId: string
  timestamp: Date
  cpu: number
  memory: number
  requestRate: number
  responseTime: number
  errorRate: number
  activeConnections: number
}

export class AutoScaler {
  private config: AutoScalingConfig
  private currentInstances: number
  private lastScaleTime: number = 0
  private metricsHistory: InstanceMetrics[] = []
  private scalingHistory: ScalingEvent[] = []

  constructor(config: AutoScalingConfig) {
    this.config = config
    this.currentInstances = config.minInstances
    this.startMonitoring()
  }

  /**
   * Update metrics for an instance
   */
  updateMetrics(metrics: InstanceMetrics): void {
    this.metricsHistory.push(metrics)
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000)
    }

    // Check if scaling is needed
    this.evaluateScaling()
  }

  /**
   * Get current scaling status
   */
  getStatus(): ScalingStatus {
    const recentMetrics = this.getRecentMetrics(300) // Last 5 minutes
    const averages = this.calculateAverages(recentMetrics)

    return {
      currentInstances: this.currentInstances,
      minInstances: this.config.minInstances,
      maxInstances: this.config.maxInstances,
      recentMetrics: averages,
      canScaleUp: this.currentInstances < this.config.maxInstances,
      canScaleDown: this.currentInstances > this.config.minInstances,
      lastScaleTime: this.lastScaleTime,
      scalingHistory: this.scalingHistory.slice(-10) // Last 10 events
    }
  }

  /**
   * Force scale to specific number of instances
   */
  async forceScale(targetInstances: number): Promise<boolean> {
    if (targetInstances < this.config.minInstances || targetInstances > this.config.maxInstances) {
      console.warn(`[AutoScaler] Target instances ${targetInstances} is outside limits`)
      return false
    }

    const oldInstances = this.currentInstances
    this.currentInstances = targetInstances
    this.lastScaleTime = Date.now()

    const event: ScalingEvent = {
      timestamp: new Date(),
      type: 'manual',
      fromInstances: oldInstances,
      toInstances: targetInstances,
      reason: 'Manual scaling',
      success: true
    }

    this.scalingHistory.push(event)
    console.log(`[AutoScaler] Manually scaled from ${oldInstances} to ${targetInstances} instances`)

    return true
  }

  private startMonitoring(): void {
    if (!this.config.enabled) return

    // Check scaling every 30 seconds
    setInterval(() => {
      this.evaluateScaling()
    }, 30000)
  }

  private evaluateScaling(): void {
    if (!this.config.enabled) return

    // Check cooldown periods
    const now = Date.now()
    const timeSinceLastScale = now - this.lastScaleTime

    const recentMetrics = this.getRecentMetrics(60) // Last minute
    if (recentMetrics.length === 0) return

    const averages = this.calculateAverages(recentMetrics)

    // Evaluate each policy
    for (const policy of this.config.policies) {
      if (!policy.enabled) continue

      const shouldScale = this.evaluatePolicy(policy, averages, recentMetrics)
      if (shouldScale) {
        this.executeScalingAction(policy.action, timeSinceLastScale)
        break // Only execute one policy per evaluation
      }
    }
  }

  private evaluatePolicy(policy: ScalingPolicy, averages: InstanceMetrics, recentMetrics: InstanceMetrics[]): boolean {
    const condition = policy.condition
    const metricValue = this.getMetricValue(averages, condition.metric)
    
    if (metricValue === null) return false

    // Check if condition is met
    const conditionMet = this.evaluateCondition(metricValue, condition.operator, condition.value)
    
    if (!conditionMet) return false

    // Check if condition has been met for the required duration
    const durationMet = this.checkConditionDuration(recentMetrics, condition)
    
    return durationMet
  }

  private getMetricValue(metrics: InstanceMetrics, metric: string): number | null {
    switch (metric) {
      case 'cpu': return metrics.cpu
      case 'memory': return metrics.memory
      case 'requestRate': return metrics.requestRate
      case 'responseTime': return metrics.responseTime
      case 'errorRate': return metrics.errorRate
      default: return null
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold
      case 'lt': return value < threshold
      case 'gte': return value >= threshold
      case 'lte': return value <= threshold
      case 'eq': return Math.abs(value - threshold) < 0.01
      default: return false
    }
  }

  private checkConditionDuration(metrics: InstanceMetrics[], condition: ScalingCondition): boolean {
    const requiredDuration = condition.duration * 1000 // Convert to milliseconds
    const now = Date.now()
    const startTime = now - requiredDuration

    const relevantMetrics = metrics.filter(m => m.timestamp.getTime() >= startTime)
    
    if (relevantMetrics.length === 0) return false

    // Check if condition was met for all recent metrics
    return relevantMetrics.every(metric => {
      const value = this.getMetricValue(metric, condition.metric)
      return value !== null && this.evaluateCondition(value, condition.operator, condition.value)
    })
  }

  private async executeScalingAction(action: ScalingAction, timeSinceLastScale: number): Promise<void> {
    const cooldownPeriod = action.type === 'scaleUp' 
      ? this.config.scaleUpCooldown 
      : this.config.scaleDownCooldown

    if (timeSinceLastScale < cooldownPeriod) {
      console.log(`[AutoScaler] Scaling action blocked by cooldown period`)
      return
    }

    const oldInstances = this.currentInstances
    let newInstances = oldInstances

    switch (action.type) {
      case 'scaleUp':
        newInstances = Math.min(
          oldInstances + action.adjustment,
          action.maxInstances || this.config.maxInstances
        )
        break
      
      case 'scaleDown':
        newInstances = Math.max(
          oldInstances - action.adjustment,
          action.minInstances || this.config.minInstances
        )
        break
      
      case 'noop':
        return
    }

    if (newInstances === oldInstances) return

    // Execute scaling
    const success = await this.performScaling(oldInstances, newInstances)
    
    const event: ScalingEvent = {
      timestamp: new Date(),
      type: 'automatic',
      fromInstances: oldInstances,
      toInstances: newInstances,
      reason: `Auto-scaling based on ${action.type}`,
      success
    }

    this.scalingHistory.push(event)
    this.lastScaleTime = Date.now()

    if (success) {
      this.currentInstances = newInstances
      console.log(`[AutoScaler] Scaled from ${oldInstances} to ${newInstances} instances`)
    } else {
      console.error(`[AutoScaler] Failed to scale from ${oldInstances} to ${newInstances} instances`)
    }
  }

  private async performScaling(fromInstances: number, toInstances: number): Promise<boolean> {
    // This would integrate with your deployment platform (Kubernetes, Docker Swarm, etc.)
    // For now, we'll simulate the scaling operation
    
    try {
      console.log(`[AutoScaler] Scaling from ${fromInstances} to ${toInstances} instances`)
      
      // Simulate API call to scaling service
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (error) {
      console.error('[AutoScaler] Scaling failed:', error)
      return false
    }
  }

  private getRecentMetrics(seconds: number): InstanceMetrics[] {
    const cutoff = new Date(Date.now() - seconds * 1000)
    return this.metricsHistory.filter(m => m.timestamp >= cutoff)
  }

  private calculateAverages(metrics: InstanceMetrics[]): InstanceMetrics {
    if (metrics.length === 0) {
      return {
        instanceId: 'average',
        timestamp: new Date(),
        cpu: 0,
        memory: 0,
        requestRate: 0,
        responseTime: 0,
        errorRate: 0,
        activeConnections: 0
      }
    }

    const sums = metrics.reduce((acc, metric) => ({
      cpu: acc.cpu + metric.cpu,
      memory: acc.memory + metric.memory,
      requestRate: acc.requestRate + metric.requestRate,
      responseTime: acc.responseTime + metric.responseTime,
      errorRate: acc.errorRate + metric.errorRate,
      activeConnections: acc.activeConnections + metric.activeConnections
    }), { cpu: 0, memory: 0, requestRate: 0, responseTime: 0, errorRate: 0, activeConnections: 0 })

    const count = metrics.length

    return {
      instanceId: 'average',
      timestamp: new Date(),
      cpu: sums.cpu / count,
      memory: sums.memory / count,
      requestRate: sums.requestRate / count,
      responseTime: sums.responseTime / count,
      errorRate: sums.errorRate / count,
      activeConnections: Math.round(sums.activeConnections / count)
    }
  }
}

export interface ScalingEvent {
  timestamp: Date
  type: 'automatic' | 'manual'
  fromInstances: number
  toInstances: number
  reason: string
  success: boolean
}

export interface ScalingStatus {
  currentInstances: number
  minInstances: number
  maxInstances: number
  recentMetrics: InstanceMetrics
  canScaleUp: boolean
  canScaleDown: boolean
  lastScaleTime: number
  scalingHistory: ScalingEvent[]
}

// Default auto-scaling configuration
export const defaultAutoScalingConfig: AutoScalingConfig = {
  enabled: process.env.AUTO_SCALING_ENABLED === 'true',
  minInstances: parseInt(process.env.MIN_INSTANCES || '1'),
  maxInstances: parseInt(process.env.MAX_INSTANCES || '10'),
  scaleUpThreshold: 0.8,
  scaleDownThreshold: 0.3,
  scaleUpCooldown: 300000, // 5 minutes
  scaleDownCooldown: 600000, // 10 minutes
  metrics: {
    cpuThreshold: 80,
    memoryThreshold: 85,
    requestRateThreshold: 100,
    responseTimeThreshold: 2000,
    errorRateThreshold: 5
  },
  policies: [
    {
      name: 'Scale Up on High CPU',
      condition: {
        metric: 'cpu',
        operator: 'gt',
        value: 80,
        duration: 60
      },
      action: {
        type: 'scaleUp',
        adjustment: 1
      },
      priority: 1,
      enabled: true
    },
    {
      name: 'Scale Up on High Memory',
      condition: {
        metric: 'memory',
        operator: 'gt',
        value: 85,
        duration: 60
      },
      action: {
        type: 'scaleUp',
        adjustment: 1
      },
      priority: 2,
      enabled: true
    },
    {
      name: 'Scale Down on Low Usage',
      condition: {
        metric: 'cpu',
        operator: 'lt',
        value: 30,
        duration: 300
      },
      action: {
        type: 'scaleDown',
        adjustment: 1
      },
      priority: 3,
      enabled: true
    }
  ]
}


