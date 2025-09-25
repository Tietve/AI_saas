import { performance } from 'perf_hooks'

export interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
  success: boolean
  error?: string
}

export interface DatabaseMetrics {
  query: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

export interface ApiMetrics {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  timestamp: number
  userId?: string
  ip?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private dbMetrics: DatabaseMetrics[] = []
  private apiMetrics: ApiMetrics[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics

  /**
   * Measure execution time of an async function
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now()
    const timestamp = Date.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.recordMetric({
        operation,
        duration,
        timestamp,
        metadata,
        success: true
      })
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`[Performance] Slow operation: ${operation} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.recordMetric({
        operation,
        duration,
        timestamp,
        metadata,
        success: false,
        error: errorMessage
      })
      
      console.error(`[Performance] Error in ${operation} after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  /**
   * Measure database query performance
   */
  async measureDbQuery<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    const timestamp = Date.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.recordDbMetric({
        query,
        duration,
        timestamp,
        success: true
      })
      
      // Log slow queries
      if (duration > 500) {
        console.warn(`[DB Performance] Slow query: ${query.substring(0, 100)}... took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.recordDbMetric({
        query,
        duration,
        timestamp,
        success: false,
        error: errorMessage
      })
      
      console.error(`[DB Performance] Error in query after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  /**
   * Measure API endpoint performance
   */
  async measureApi<T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>,
    userId?: string,
    ip?: string
  ): Promise<T> {
    const start = performance.now()
    const timestamp = Date.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.recordApiMetric({
        endpoint,
        method,
        duration,
        statusCode: 200,
        timestamp,
        userId,
        ip
      })
      
      // Log slow API calls
      if (duration > 2000) {
        console.warn(`[API Performance] Slow API: ${method} ${endpoint} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500
      
      this.recordApiMetric({
        endpoint,
        method,
        duration,
        statusCode,
        timestamp,
        userId,
        ip
      })
      
      console.error(`[API Performance] Error in ${method} ${endpoint} after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)
    
    // Keep only last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  private recordDbMetric(metric: DatabaseMetrics): void {
    this.dbMetrics.push(metric)
    
    // Keep only last maxMetrics
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics)
    }
  }

  private recordApiMetric(metric: ApiMetrics): void {
    this.apiMetrics.push(metric)
    
    // Keep only last maxMetrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    operations: {
      total: number
      successful: number
      failed: number
      avgDuration: number
      slowOperations: PerformanceMetrics[]
    }
    database: {
      total: number
      successful: number
      failed: number
      avgDuration: number
      slowQueries: DatabaseMetrics[]
    }
    api: {
      total: number
      avgDuration: number
      statusCodes: Record<number, number>
      slowEndpoints: ApiMetrics[]
    }
  } {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)
    
    // Filter metrics from last 24 hours
    const recentMetrics = this.metrics.filter(m => m.timestamp > last24h)
    const recentDbMetrics = this.dbMetrics.filter(m => m.timestamp > last24h)
    const recentApiMetrics = this.apiMetrics.filter(m => m.timestamp > last24h)
    
    // Operations stats
    const successfulOps = recentMetrics.filter(m => m.success)
    const failedOps = recentMetrics.filter(m => !m.success)
    const avgDuration = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
      : 0
    const slowOperations = recentMetrics.filter(m => m.duration > 1000)
    
    // Database stats
    const successfulDb = recentDbMetrics.filter(m => m.success)
    const failedDb = recentDbMetrics.filter(m => !m.success)
    const avgDbDuration = recentDbMetrics.length > 0
      ? recentDbMetrics.reduce((sum, m) => sum + m.duration, 0) / recentDbMetrics.length
      : 0
    const slowQueries = recentDbMetrics.filter(m => m.duration > 500)
    
    // API stats
    const avgApiDuration = recentApiMetrics.length > 0
      ? recentApiMetrics.reduce((sum, m) => sum + m.duration, 0) / recentApiMetrics.length
      : 0
    const statusCodes: Record<number, number> = {}
    recentApiMetrics.forEach(m => {
      statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1
    })
    const slowEndpoints = recentApiMetrics.filter(m => m.duration > 2000)
    
    return {
      operations: {
        total: recentMetrics.length,
        successful: successfulOps.length,
        failed: failedOps.length,
        avgDuration: Math.round(avgDuration * 100) / 100,
        slowOperations
      },
      database: {
        total: recentDbMetrics.length,
        successful: successfulDb.length,
        failed: failedDb.length,
        avgDuration: Math.round(avgDbDuration * 100) / 100,
        slowQueries
      },
      api: {
        total: recentApiMetrics.length,
        avgDuration: Math.round(avgApiDuration * 100) / 100,
        statusCodes,
        slowEndpoints
      }
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.dbMetrics = []
    this.apiMetrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Helper decorators
export function withPerformanceMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return performanceMonitor.measure(operation, () => fn(...args))
  }
}

export function withDbMonitoring<T>(
  query: string,
  fn: () => Promise<T>
) {
  return async (): Promise<T> => {
    return performanceMonitor.measureDbQuery(query, fn)
  }
}

export function withApiMonitoring<T>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>,
  userId?: string,
  ip?: string
) {
  return async (): Promise<T> => {
    return performanceMonitor.measureApi(endpoint, method, fn, userId, ip)
  }
}
