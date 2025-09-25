/**
 * Performance Monitoring Dashboard
 * Real-time metrics collection and visualization
 */

export interface DashboardConfig {
  refreshInterval: number
  retentionPeriod: number
  alertThresholds: AlertThresholds
  widgets: DashboardWidget[]
  realTimeEnabled: boolean
}

export interface AlertThresholds {
  responseTime: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  cacheHitRate: number
  databaseConnections: number
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'alert'
  title: string
  dataSource: string
  config: WidgetConfig
  position: { x: number; y: number; width: number; height: number }
}

export interface WidgetConfig {
  metric?: string
  timeRange?: string
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count'
  chartType?: 'line' | 'bar' | 'pie' | 'area'
  thresholds?: { warning: number; critical: number }
  refreshRate?: number
}

export interface SystemMetrics {
  timestamp: Date
  instanceId: string
  cpu: {
    usage: number
    load: number[]
    cores: number
  }
  memory: {
    used: number
    total: number
    free: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    free: number
    percentage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
  }
  processes: {
    total: number
    running: number
    sleeping: number
    zombie: number
  }
}

export interface ApplicationMetrics {
  timestamp: Date
  instanceId: string
  requests: {
    total: number
    successful: number
    failed: number
    rate: number
  }
  responseTime: {
    average: number
    p50: number
    p95: number
    p99: number
    max: number
  }
  errors: {
    total: number
    rate: number
    byType: Record<string, number>
  }
  cache: {
    hits: number
    misses: number
    hitRate: number
    size: number
  }
  database: {
    connections: number
    queries: number
    slowQueries: number
    averageQueryTime: number
  }
}

export interface Alert {
  id: string
  timestamp: Date
  severity: 'info' | 'warning' | 'critical'
  category: string
  title: string
  description: string
  metric: string
  value: number
  threshold: number
  instanceId?: string
  resolved: boolean
  resolvedAt?: Date
}

export class PerformanceDashboard {
  private config: DashboardConfig
  private metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]> = new Map()
  private alerts: Alert[] = []
  private refreshInterval: NodeJS.Timeout | null = null
  private alertCheckInterval: NodeJS.Timeout | null = null

  constructor(config: DashboardConfig) {
    this.config = config
    this.startMetricsCollection()
    this.startAlertMonitoring()
  }

  /**
   * Add system metrics
   */
  addSystemMetrics(metrics: SystemMetrics): void {
    const key = `system_${metrics.instanceId}`
    this.addMetrics(key, metrics)
    this.checkSystemAlerts(metrics)
  }

  /**
   * Add application metrics
   */
  addApplicationMetrics(metrics: ApplicationMetrics): void {
    const key = `app_${metrics.instanceId}`
    this.addMetrics(key, metrics)
    this.checkApplicationAlerts(metrics)
  }

  /**
   * Get dashboard data
   */
  getDashboardData(timeRange: string = '1h'): DashboardData {
    const endTime = new Date()
    const startTime = this.getStartTime(timeRange, endTime)
    
    return {
      config: this.config,
      widgets: this.config.widgets,
      metrics: this.getFilteredMetrics(startTime, endTime),
      alerts: this.getActiveAlerts(),
      summary: this.calculateSummary(startTime, endTime),
      lastUpdated: endTime
    }
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): RealTimeMetrics {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)
    
    const recentMetrics = this.getFilteredMetrics(oneMinuteAgo, now)
    
    return {
      timestamp: now,
      instances: this.getInstancesStatus(),
      systemHealth: this.calculateSystemHealth(recentMetrics),
      applicationHealth: this.calculateApplicationHealth(recentMetrics),
      alerts: this.getActiveAlerts().slice(0, 10), // Last 10 alerts
      trends: this.calculateTrends(recentMetrics)
    }
  }

  /**
   * Get metrics for specific widget
   */
  getWidgetData(widgetId: string, timeRange: string = '1h'): WidgetData | null {
    const widget = this.config.widgets.find(w => w.id === widgetId)
    if (!widget) return null

    const endTime = new Date()
    const startTime = this.getStartTime(timeRange, endTime)
    const metrics = this.getFilteredMetrics(startTime, endTime)

    return {
      widget,
      data: this.processWidgetData(widget, metrics),
      timeRange: { start: startTime, end: endTime }
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) return false

    alert.resolved = true
    alert.resolvedAt = new Date()
    return true
  }

  /**
   * Get alert history
   */
  getAlertHistory(timeRange: string = '24h'): Alert[] {
    const endTime = new Date()
    const startTime = this.getStartTime(timeRange, endTime)
    
    return this.alerts.filter(alert => 
      alert.timestamp >= startTime && alert.timestamp <= endTime
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv', timeRange: string = '24h'): string {
    const endTime = new Date()
    const startTime = this.getStartTime(timeRange, endTime)
    const metrics = this.getFilteredMetrics(startTime, endTime)

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2)
    } else {
      return this.convertToCSV(metrics)
    }
  }

  private addMetrics(key: string, metrics: SystemMetrics | ApplicationMetrics): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    const metricsList = this.metrics.get(key)!
    metricsList.push(metrics)

    // Keep only recent metrics based on retention period
    const cutoff = new Date(Date.now() - this.config.retentionPeriod)
    const filtered = metricsList.filter(m => m.timestamp >= cutoff)
    this.metrics.set(key, filtered)
  }

  private getFilteredMetrics(startTime: Date, endTime: Date): Map<string, (SystemMetrics | ApplicationMetrics)[]> {
    const filtered = new Map<string, (SystemMetrics | ApplicationMetrics)[]>()
    
    for (const [key, metrics] of this.metrics) {
      const filteredMetrics = metrics.filter(m => 
        m.timestamp >= startTime && m.timestamp <= endTime
      )
      if (filteredMetrics.length > 0) {
        filtered.set(key, filteredMetrics)
      }
    }
    
    return filtered
  }

  private getStartTime(timeRange: string, endTime: Date): Date {
    const ranges: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }

    const rangeMs = ranges[timeRange] || ranges['1h']
    return new Date(endTime.getTime() - rangeMs)
  }

  private checkSystemAlerts(metrics: SystemMetrics): void {
    const thresholds = this.config.alertThresholds

    // CPU usage alert
    if (metrics.cpu.usage > thresholds.cpuUsage) {
      this.createAlert('cpu_high', 'critical', 'System', 
        'High CPU Usage', 
        `CPU usage is ${metrics.cpu.usage.toFixed(1)}% (threshold: ${thresholds.cpuUsage}%)`,
        'cpu.usage', metrics.cpu.usage, thresholds.cpuUsage, metrics.instanceId)
    }

    // Memory usage alert
    if (metrics.memory.percentage > thresholds.memoryUsage) {
      this.createAlert('memory_high', 'critical', 'System',
        'High Memory Usage',
        `Memory usage is ${metrics.memory.percentage.toFixed(1)}% (threshold: ${thresholds.memoryUsage}%)`,
        'memory.percentage', metrics.memory.percentage, thresholds.memoryUsage, metrics.instanceId)
    }
  }

  private checkApplicationAlerts(metrics: ApplicationMetrics): void {
    const thresholds = this.config.alertThresholds

    // Response time alert
    if (metrics.responseTime.average > thresholds.responseTime) {
      this.createAlert('response_time_high', 'warning', 'Application',
        'High Response Time',
        `Average response time is ${metrics.responseTime.average}ms (threshold: ${thresholds.responseTime}ms)`,
        'responseTime.average', metrics.responseTime.average, thresholds.responseTime, metrics.instanceId)
    }

    // Error rate alert
    if (metrics.errors.rate > thresholds.errorRate) {
      this.createAlert('error_rate_high', 'critical', 'Application',
        'High Error Rate',
        `Error rate is ${metrics.errors.rate.toFixed(2)}% (threshold: ${thresholds.errorRate}%)`,
        'errors.rate', metrics.errors.rate, thresholds.errorRate, metrics.instanceId)
    }

    // Cache hit rate alert
    if (metrics.cache.hitRate < thresholds.cacheHitRate) {
      this.createAlert('cache_hit_rate_low', 'warning', 'Cache',
        'Low Cache Hit Rate',
        `Cache hit rate is ${(metrics.cache.hitRate * 100).toFixed(1)}% (threshold: ${thresholds.cacheHitRate}%)`,
        'cache.hitRate', metrics.cache.hitRate, thresholds.cacheHitRate, metrics.instanceId)
    }

    // Database connections alert
    if (metrics.database.connections > thresholds.databaseConnections) {
      this.createAlert('db_connections_high', 'warning', 'Database',
        'High Database Connections',
        `Database connections: ${metrics.database.connections} (threshold: ${thresholds.databaseConnections})`,
        'database.connections', metrics.database.connections, thresholds.databaseConnections, metrics.instanceId)
    }
  }

  private createAlert(
    id: string, 
    severity: 'info' | 'warning' | 'critical',
    category: string,
    title: string,
    description: string,
    metric: string,
    value: number,
    threshold: number,
    instanceId?: string
  ): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a => 
      a.id === id && !a.resolved && a.instanceId === instanceId
    )
    
    if (existingAlert) return

    const alert: Alert = {
      id: `${id}_${Date.now()}`,
      timestamp: new Date(),
      severity,
      category,
      title,
      description,
      metric,
      value,
      threshold,
      instanceId,
      resolved: false
    }

    this.alerts.push(alert)
    console.log(`[Dashboard] Alert created: ${alert.title} - ${alert.description}`)
  }

  private getActiveAlerts(): Alert[] {
    return this.alerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private getInstancesStatus(): InstanceStatus[] {
    const instances: InstanceStatus[] = []
    
    for (const [key, metrics] of this.metrics) {
      if (key.startsWith('system_')) {
        const instanceId = key.replace('system_', '')
        const latestMetrics = metrics[metrics.length - 1] as SystemMetrics
        
        instances.push({
          id: instanceId,
          status: this.getInstanceStatus(latestMetrics),
          lastSeen: latestMetrics.timestamp,
          cpu: latestMetrics.cpu.usage,
          memory: latestMetrics.memory.percentage,
          uptime: this.calculateUptime(instanceId)
        })
      }
    }
    
    return instances
  }

  private getInstanceStatus(metrics: SystemMetrics): 'healthy' | 'warning' | 'critical' {
    if (metrics.cpu.usage > 90 || metrics.memory.percentage > 95) {
      return 'critical'
    } else if (metrics.cpu.usage > 80 || metrics.memory.percentage > 85) {
      return 'warning'
    }
    return 'healthy'
  }

  private calculateUptime(instanceId: string): number {
    // This would calculate actual uptime based on metrics history
    return Date.now() - (24 * 60 * 60 * 1000) // Placeholder: 24 hours
  }

  private calculateSystemHealth(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): SystemHealth {
    let totalCpu = 0
    let totalMemory = 0
    let instanceCount = 0

    for (const [key, metricList] of metrics) {
      if (key.startsWith('system_') && metricList.length > 0) {
        const latest = metricList[metricList.length - 1] as SystemMetrics
        totalCpu += latest.cpu.usage
        totalMemory += latest.memory.percentage
        instanceCount++
      }
    }

    return {
      averageCpu: instanceCount > 0 ? totalCpu / instanceCount : 0,
      averageMemory: instanceCount > 0 ? totalMemory / instanceCount : 0,
      instanceCount,
      status: this.getOverallSystemStatus(totalCpu / instanceCount, totalMemory / instanceCount)
    }
  }

  private calculateApplicationHealth(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): ApplicationHealth {
    let totalRequests = 0
    let totalErrors = 0
    let totalResponseTime = 0
    let totalCacheHits = 0
    let totalCacheRequests = 0
    let instanceCount = 0

    for (const [key, metricList] of metrics) {
      if (key.startsWith('app_') && metricList.length > 0) {
        const latest = metricList[metricList.length - 1] as ApplicationMetrics
        totalRequests += latest.requests.total
        totalErrors += latest.errors.total
        totalResponseTime += latest.responseTime.average
        totalCacheHits += latest.cache.hits
        totalCacheRequests += latest.cache.hits + latest.cache.misses
        instanceCount++
      }
    }

    return {
      totalRequests,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      averageResponseTime: instanceCount > 0 ? totalResponseTime / instanceCount : 0,
      cacheHitRate: totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0,
      instanceCount,
      status: this.getOverallApplicationStatus(totalErrors / totalRequests, totalResponseTime / instanceCount)
    }
  }

  private getOverallSystemStatus(avgCpu: number, avgMemory: number): 'healthy' | 'warning' | 'critical' {
    if (avgCpu > 90 || avgMemory > 95) return 'critical'
    if (avgCpu > 80 || avgMemory > 85) return 'warning'
    return 'healthy'
  }

  private getOverallApplicationStatus(errorRate: number, avgResponseTime: number): 'healthy' | 'warning' | 'critical' {
    if (errorRate > 0.1 || avgResponseTime > 5000) return 'critical'
    if (errorRate > 0.05 || avgResponseTime > 2000) return 'warning'
    return 'healthy'
  }

  private calculateTrends(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): Trends {
    // This would calculate trends based on historical data
    return {
      cpu: { direction: 'stable', change: 0 },
      memory: { direction: 'stable', change: 0 },
      responseTime: { direction: 'stable', change: 0 },
      errorRate: { direction: 'stable', change: 0 }
    }
  }

  private calculateSummary(startTime: Date, endTime: Date): DashboardSummary {
    const metrics = this.getFilteredMetrics(startTime, endTime)
    
    return {
      totalRequests: this.calculateTotalRequests(metrics),
      averageResponseTime: this.calculateAverageResponseTime(metrics),
      errorRate: this.calculateErrorRate(metrics),
      uptime: this.calculateSystemUptime(),
      activeInstances: this.getActiveInstancesCount(metrics)
    }
  }

  private calculateTotalRequests(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): number {
    let total = 0
    for (const [key, metricList] of metrics) {
      if (key.startsWith('app_')) {
        for (const metric of metricList) {
          const appMetric = metric as ApplicationMetrics
          total += appMetric.requests.total
        }
      }
    }
    return total
  }

  private calculateAverageResponseTime(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): number {
    let total = 0
    let count = 0
    for (const [key, metricList] of metrics) {
      if (key.startsWith('app_')) {
        for (const metric of metricList) {
          const appMetric = metric as ApplicationMetrics
          total += appMetric.responseTime.average
          count++
        }
      }
    }
    return count > 0 ? total / count : 0
  }

  private calculateErrorRate(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): number {
    let totalRequests = 0
    let totalErrors = 0
    for (const [key, metricList] of metrics) {
      if (key.startsWith('app_')) {
        for (const metric of metricList) {
          const appMetric = metric as ApplicationMetrics
          totalRequests += appMetric.requests.total
          totalErrors += appMetric.errors.total
        }
      }
    }
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
  }

  private calculateSystemUptime(): number {
    // This would calculate actual system uptime
    return 99.9 // Placeholder
  }

  private getActiveInstancesCount(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): number {
    const instanceIds = new Set<string>()
    for (const key of metrics.keys()) {
      const instanceId = key.split('_')[1]
      instanceIds.add(instanceId)
    }
    return instanceIds.size
  }

  private processWidgetData(widget: DashboardWidget, metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): any {
    // This would process data based on widget configuration
    return {
      labels: [],
      datasets: []
    }
  }

  private convertToCSV(metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>): string {
    // This would convert metrics to CSV format
    return 'timestamp,instanceId,metric,value\n'
  }

  private startMetricsCollection(): void {
    if (this.config.realTimeEnabled) {
      this.refreshInterval = setInterval(() => {
        // This would collect real-time metrics
      }, this.config.refreshInterval)
    }
  }

  private startAlertMonitoring(): void {
    this.alertCheckInterval = setInterval(() => {
      // This would check for alert conditions
    }, 30000) // Every 30 seconds
  }
}

// Types for dashboard data
export interface DashboardData {
  config: DashboardConfig
  widgets: DashboardWidget[]
  metrics: Map<string, (SystemMetrics | ApplicationMetrics)[]>
  alerts: Alert[]
  summary: DashboardSummary
  lastUpdated: Date
}

export interface RealTimeMetrics {
  timestamp: Date
  instances: InstanceStatus[]
  systemHealth: SystemHealth
  applicationHealth: ApplicationHealth
  alerts: Alert[]
  trends: Trends
}

export interface WidgetData {
  widget: DashboardWidget
  data: any
  timeRange: { start: Date; end: Date }
}

export interface InstanceStatus {
  id: string
  status: 'healthy' | 'warning' | 'critical'
  lastSeen: Date
  cpu: number
  memory: number
  uptime: number
}

export interface SystemHealth {
  averageCpu: number
  averageMemory: number
  instanceCount: number
  status: 'healthy' | 'warning' | 'critical'
}

export interface ApplicationHealth {
  totalRequests: number
  errorRate: number
  averageResponseTime: number
  cacheHitRate: number
  instanceCount: number
  status: 'healthy' | 'warning' | 'critical'
}

export interface Trends {
  cpu: { direction: 'up' | 'down' | 'stable'; change: number }
  memory: { direction: 'up' | 'down' | 'stable'; change: number }
  responseTime: { direction: 'up' | 'down' | 'stable'; change: number }
  errorRate: { direction: 'up' | 'down' | 'stable'; change: number }
}

export interface DashboardSummary {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  uptime: number
  activeInstances: number
}

// Default dashboard configuration
export const defaultDashboardConfig: DashboardConfig = {
  refreshInterval: 5000, // 5 seconds
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  alertThresholds: {
    responseTime: 2000,
    errorRate: 5,
    cpuUsage: 80,
    memoryUsage: 85,
    cacheHitRate: 70,
    databaseConnections: 80
  },
  widgets: [
    {
      id: 'system-overview',
      type: 'gauge',
      title: 'System Overview',
      dataSource: 'system',
      config: {
        metric: 'cpu',
        thresholds: { warning: 70, critical: 90 }
      },
      position: { x: 0, y: 0, width: 4, height: 3 }
    },
    {
      id: 'response-time-chart',
      type: 'chart',
      title: 'Response Time',
      dataSource: 'application',
      config: {
        metric: 'responseTime',
        chartType: 'line',
        timeRange: '1h'
      },
      position: { x: 4, y: 0, width: 8, height: 3 }
    },
    {
      id: 'error-rate-chart',
      type: 'chart',
      title: 'Error Rate',
      dataSource: 'application',
      config: {
        metric: 'errorRate',
        chartType: 'area',
        timeRange: '1h'
      },
      position: { x: 0, y: 3, width: 6, height: 3 }
    },
    {
      id: 'active-alerts',
      type: 'table',
      title: 'Active Alerts',
      dataSource: 'alerts',
      config: {
        timeRange: '24h'
      },
      position: { x: 6, y: 3, width: 6, height: 3 }
    }
  ],
  realTimeEnabled: true
}
