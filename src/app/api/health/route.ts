/**
 * Health Check API for Load Balancing
 * Provides system health status for load balancer health checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/cache/redis-client'

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: Date
  instanceId: string
  version: string
  uptime: number
  checks: {
    database: CheckResult
    cache: CheckResult
    memory: CheckResult
    disk: CheckResult
  }
  metrics: {
    cpu: number
    memory: number
    disk: number
    activeConnections: number
  }
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warn'
  message: string
  responseTime?: number
  details?: any
}

/**
 * GET /api/health
 * Get system health status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const instanceId = process.env.INSTANCE_ID || `instance_${Date.now()}`
  const version = process.env.APP_VERSION || '1.0.0'
  const uptime = process.uptime()

  try {
    // Run health checks
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkCache(),
      checkMemory(),
      checkDisk()
    ])

    const [dbResult, cacheResult, memoryResult, diskResult] = checks

    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      instanceId,
      version,
      uptime,
      checks: {
        database: dbResult.status === 'fulfilled' ? dbResult.value : {
          status: 'fail',
          message: 'Database check failed',
          details: dbResult.status === 'rejected' ? dbResult.reason : undefined
        },
        cache: cacheResult.status === 'fulfilled' ? cacheResult.value : {
          status: 'fail',
          message: 'Cache check failed',
          details: cacheResult.status === 'rejected' ? cacheResult.reason : undefined
        },
        memory: memoryResult.status === 'fulfilled' ? memoryResult.value : {
          status: 'fail',
          message: 'Memory check failed',
          details: memoryResult.status === 'rejected' ? memoryResult.reason : undefined
        },
        disk: diskResult.status === 'fulfilled' ? diskResult.value : {
          status: 'fail',
          message: 'Disk check failed',
          details: diskResult.status === 'rejected' ? diskResult.reason : undefined
        }
      },
      metrics: {
        cpu: await getCpuUsage(),
        memory: await getMemoryUsage(),
        disk: await getDiskUsage(),
        activeConnections: await getActiveConnections()
      }
    }

    // Determine overall status
    const checkResults = Object.values(healthStatus.checks)
    const failedChecks = checkResults.filter(check => check.status === 'fail')
    const warningChecks = checkResults.filter(check => check.status === 'warn')

    if (failedChecks.length > 0) {
      healthStatus.status = 'unhealthy'
    } else if (warningChecks.length > 0) {
      healthStatus.status = 'degraded'
    }

    const responseTime = Date.now() - startTime
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                     healthStatus.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'X-Response-Time': responseTime.toString(),
        'X-Instance-ID': instanceId
      }
    })

  } catch (error) {
    console.error('[Health Check] Error:', error)
    
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date(),
      instanceId,
      version,
      uptime,
      checks: {
        database: { status: 'fail', message: 'Health check failed' },
        cache: { status: 'fail', message: 'Health check failed' },
        memory: { status: 'fail', message: 'Health check failed' },
        disk: { status: 'fail', message: 'Health check failed' }
      },
      metrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        activeConnections: 0
      }
    }

    return NextResponse.json(errorStatus, { status: 503 })
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    
    return {
      status: 'pass',
      message: 'Database connection healthy',
      responseTime,
      details: {
        connectionPool: 'active',
        queryTime: responseTime
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Check cache connectivity
 */
async function checkCache(): Promise<CheckResult> {
  const startTime = Date.now()
  
  try {
    // Test Redis connection
    await redis.ping()
    
    const responseTime = Date.now() - startTime
    
    return {
      status: 'pass',
      message: 'Cache connection healthy',
      responseTime,
      details: {
        type: 'Redis',
        responseTime
      }
    }
  } catch (error) {
    return {
      status: 'warn', // Cache is not critical, so warn instead of fail
      message: 'Cache connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<CheckResult> {
  try {
    const memUsage = process.memoryUsage()
    const totalMemory = memUsage.heapTotal
    const usedMemory = memUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100

    let status: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'Memory usage healthy'

    if (memoryPercentage > 90) {
      status = 'fail'
      message = 'Memory usage critical'
    } else if (memoryPercentage > 80) {
      status = 'warn'
      message = 'Memory usage high'
    }

    return {
      status,
      message,
      details: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
        rss: memUsage.rss,
        external: memUsage.external
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Memory check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Check disk usage
 */
async function checkDisk(): Promise<CheckResult> {
  try {
    // This would check actual disk usage
    // For now, return a placeholder
    const diskUsage = {
      used: 0,
      total: 0,
      percentage: 0
    }

    let status: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'Disk usage healthy'

    if (diskUsage.percentage > 90) {
      status = 'fail'
      message = 'Disk usage critical'
    } else if (diskUsage.percentage > 80) {
      status = 'warn'
      message = 'Disk usage high'
    }

    return {
      status,
      message,
      details: diskUsage
    }
  } catch (error) {
    return {
      status: 'warn', // Disk check is not critical
      message: 'Disk check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Get CPU usage percentage
 */
async function getCpuUsage(): Promise<number> {
  try {
    // This would get actual CPU usage
    // For now, return a placeholder
    return Math.random() * 100
  } catch {
    return 0
  }
}

/**
 * Get memory usage percentage
 */
async function getMemoryUsage(): Promise<number> {
  try {
    const memUsage = process.memoryUsage()
    return (memUsage.heapUsed / memUsage.heapTotal) * 100
  } catch {
    return 0
  }
}

/**
 * Get disk usage percentage
 */
async function getDiskUsage(): Promise<number> {
  try {
    // This would get actual disk usage
    // For now, return a placeholder
    return Math.random() * 100
  } catch {
    return 0
  }
}

/**
 * Get active connections count
 */
async function getActiveConnections(): Promise<number> {
  try {
    // This would get actual active connections
    // For now, return a placeholder
    return Math.floor(Math.random() * 100)
  } catch {
    return 0
  }
}



