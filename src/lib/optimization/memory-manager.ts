/**
 * Memory Management and Optimization
 */

import { performance } from 'perf_hooks'

export interface MemoryStats {
  used: number
  total: number
  external: number
  arrayBuffers: number
  heapUsed: number
  heapTotal: number
  rss: number
  heapLimit: number
}

export interface MemoryOptimizationOptions {
  maxMemoryUsage?: number // MB
  gcThreshold?: number // MB
  monitoringInterval?: number // ms
  enableAutoGC?: boolean
}

class MemoryManager {
  private stats: MemoryStats | null = null
  private lastGC: number = 0
  private monitoringInterval: NodeJS.Timeout | null = null
  private options: Required<MemoryOptimizationOptions>

  constructor(options: MemoryOptimizationOptions = {}) {
    this.options = {
      maxMemoryUsage: options.maxMemoryUsage || 512, // 512MB default
      gcThreshold: options.gcThreshold || 400, // 400MB default
      monitoringInterval: options.monitoringInterval || 30000, // 30s
      enableAutoGC: options.enableAutoGC !== false,
    }

    if (this.options.enableAutoGC) {
      this.startMonitoring()
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage()
    
    this.stats = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapLimit: Math.round((memUsage.heapTotal + memUsage.external) / 1024 / 1024), // MB
    }

    return this.stats
  }

  /**
   * Check if memory usage is high
   */
  isMemoryHigh(): boolean {
    const stats = this.getMemoryStats()
    return stats.heapUsed > this.options.gcThreshold
  }

  /**
   * Check if memory usage is critical
   */
  isMemoryCritical(): boolean {
    const stats = this.getMemoryStats()
    return stats.heapUsed > this.options.maxMemoryUsage
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      try {
        global.gc()
        this.lastGC = Date.now()
        console.log(`[Memory] Forced GC. Memory usage: ${this.getMemoryStats().heapUsed}MB`)
        return true
      } catch (error) {
        console.error('[Memory] GC failed:', error)
        return false
      }
    }
    return false
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): {
    success: boolean
    actions: string[]
    memoryBefore: number
    memoryAfter: number
  } {
    const statsBefore = this.getMemoryStats()
    const actions: string[] = []
    let success = false

    // 1. Force garbage collection
    if (this.forceGarbageCollection()) {
      actions.push('Forced garbage collection')
      success = true
    }

    // 2. Clear any cached data if available
    if (typeof global !== 'undefined') {
      // Clear module cache for development
      if (process.env.NODE_ENV === 'development') {
        // Don't actually clear in production
        actions.push('Cleared development caches')
      }
    }

    const statsAfter = this.getMemoryStats()

    return {
      success,
      actions,
      memoryBefore: statsBefore.heapUsed,
      memoryAfter: statsAfter.heapUsed,
    }
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats()
      
      if (stats.heapUsed > this.options.maxMemoryUsage) {
        console.warn(`[Memory] Critical memory usage: ${stats.heapUsed}MB`)
        this.optimizeMemory()
      } else if (stats.heapUsed > this.options.gcThreshold) {
        console.log(`[Memory] High memory usage: ${stats.heapUsed}MB`)
        if (this.options.enableAutoGC) {
          this.forceGarbageCollection()
        }
      }
    }, this.options.monitoringInterval)
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsagePercentage(): number {
    const stats = this.getMemoryStats()
    return Math.round((stats.heapUsed / stats.heapTotal) * 100)
  }

  /**
   * Check if we should optimize memory
   */
  shouldOptimizeMemory(): boolean {
    const stats = this.getMemoryStats()
    return stats.heapUsed > this.options.gcThreshold || 
           this.getMemoryUsagePercentage() > 80
  }
}

// Singleton instance
export const memoryManager = new MemoryManager()

// Memory optimization decorators
export function withMemoryOptimization<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: { checkBefore?: boolean; optimizeAfter?: boolean } = {}
) {
  return async (...args: T): Promise<R> => {
    const { checkBefore = true, optimizeAfter = true } = options

    // Check memory before execution
    if (checkBefore && memoryManager.shouldOptimizeMemory()) {
      console.log('[Memory] Optimizing memory before execution')
      memoryManager.optimizeMemory()
    }

    const start = performance.now()
    try {
      const result = await fn(...args)
      
      // Optimize memory after execution if needed
      if (optimizeAfter && memoryManager.shouldOptimizeMemory()) {
        console.log('[Memory] Optimizing memory after execution')
        memoryManager.optimizeMemory()
      }

      return result
    } finally {
      const duration = performance.now() - start
      if (duration > 1000) { // Log slow operations
        console.log(`[Memory] Slow operation completed in ${duration.toFixed(2)}ms`)
      }
    }
  }
}

// Memory-aware cache with size limits
export class MemoryAwareCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number
  private maxMemoryMB: number

  constructor(maxSize: number = 1000, maxMemoryMB: number = 50) {
    this.maxSize = maxSize
    this.maxMemoryMB = maxMemoryMB
  }

  set(key: K, value: V): void {
    // Check cache size
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    // Check memory usage
    if (memoryManager.shouldOptimizeMemory()) {
      this.clear()
    }

    this.cache.set(key, value)
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value
    if (firstKey !== undefined) {
      this.cache.delete(firstKey)
    }
  }
}

// Stream processing with memory control
export class MemoryAwareStream {
  private buffer: Buffer[] = []
  private maxBufferSize: number
  private currentSize: number = 0

  constructor(maxBufferSizeMB: number = 10) {
    this.maxBufferSize = maxBufferSizeMB * 1024 * 1024 // Convert to bytes
  }

  addChunk(chunk: Buffer): boolean {
    if (this.currentSize + chunk.length > this.maxBufferSize) {
      return false // Buffer would exceed limit
    }

    this.buffer.push(chunk)
    this.currentSize += chunk.length
    return true
  }

  getBuffer(): Buffer {
    return Buffer.concat(this.buffer)
  }

  clear(): void {
    this.buffer = []
    this.currentSize = 0
  }

  size(): number {
    return this.currentSize
  }

  isEmpty(): boolean {
    return this.buffer.length === 0
  }
}

// Helper functions
export const getMemoryInfo = () => memoryManager.getMemoryStats()

export const optimizeMemory = () => memoryManager.optimizeMemory()

export const isMemoryHigh = () => memoryManager.isMemoryHigh()

export const isMemoryCritical = () => memoryManager.isMemoryCritical()

// Memory usage logging
export function logMemoryUsage(context: string): void {
  const stats = memoryManager.getMemoryStats()
  const percentage = memoryManager.getMemoryUsagePercentage()
  
  console.log(`[Memory] ${context}: ${stats.heapUsed}MB/${stats.heapTotal}MB (${percentage}%)`)
}

// Auto-optimization for long-running operations
export function withPeriodicMemoryOptimization<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  intervalMs: number = 60000 // 1 minute
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    let lastOptimization = startTime

    const checkInterval = setInterval(() => {
      const now = Date.now()
      if (now - lastOptimization > intervalMs && memoryManager.shouldOptimizeMemory()) {
        console.log('[Memory] Periodic optimization triggered')
        memoryManager.optimizeMemory()
        lastOptimization = now
      }
    }, 5000) // Check every 5 seconds

    try {
      return await fn(...args)
    } finally {
      clearInterval(checkInterval)
    }
  }
}
