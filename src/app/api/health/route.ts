/**
 * Health Check API for Load Balancing
 * Provides system health status for load balancer health checks
 *
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get system health status
 *     description: Returns comprehensive health check for load balancers and monitoring
 *     responses:
 *       200:
 *         description: System is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, degraded]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 instanceId:
 *                   type: string
 *                 version:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       $ref: '#/components/schemas/CheckResult'
 *                     cache:
 *                       $ref: '#/components/schemas/CheckResult'
 *                     memory:
 *                       $ref: '#/components/schemas/CheckResult'
 *                     disk:
 *                       $ref: '#/components/schemas/CheckResult'
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     cpu:
 *                       type: number
 *                     memory:
 *                       type: number
 *                     disk:
 *                       type: number
 *                     activeConnections:
 *                       type: number
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upstash as redis } from '@/lib/redis'

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'

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
    // Critical services: database and cache
    // Non-critical services: memory and disk
    const criticalChecks = [healthStatus.checks.database, healthStatus.checks.cache]
    const nonCriticalChecks = [healthStatus.checks.memory, healthStatus.checks.disk]

    const criticalFailed = criticalChecks.filter(check => check.status === 'fail')
    const criticalWarning = criticalChecks.filter(check => check.status === 'warn')
    const nonCriticalFailed = nonCriticalChecks.filter(check => check.status === 'fail')

    // Only mark as unhealthy if critical services fail
    if (criticalFailed.length > 0) {
      healthStatus.status = 'unhealthy'
    } else if (nonCriticalFailed.length > 0 || criticalWarning.length > 0) {
      // Degraded if non-critical services fail or critical services have warnings
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

  if (!redis) {
    return {
      status: 'warn',
      message: 'Cache not configured',
      details: { type: 'None' }
    }
  }

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
 * Uses RSS (Resident Set Size) instead of heap for more accurate memory usage
 */
async function checkMemory(): Promise<CheckResult> {
  try {
    const memUsage = process.memoryUsage()

    // Get memory limits from env or use defaults
    const MEMORY_LIMIT_MB = parseInt(process.env.HEALTH_MEMORY_LIMIT_MB || '1024')
    const MEMORY_WARN_PCT = parseInt(process.env.HEALTH_MEMORY_WARN_PCT || '85')
    const MEMORY_FAIL_PCT = parseInt(process.env.HEALTH_MEMORY_FAIL_PCT || '97')
    const MIN_FAIL_RSS_MB = parseInt(process.env.HEALTH_MEMORY_MIN_FAIL_RSS_MB || '600')

    // Use RSS (Resident Set Size) for actual memory usage
    const rssInMB = memUsage.rss / (1024 * 1024)
    const totalMemoryMB = MEMORY_LIMIT_MB // Use configured limit
    const memoryPercentage = (rssInMB / totalMemoryMB) * 100

    // Also calculate heap usage for reference
    const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100

    let status: 'pass' | 'warn' | 'fail' = 'pass'
    let message = 'Memory usage healthy'

    // Only fail if both percentage is high AND absolute RSS is above minimum
    if (memoryPercentage > MEMORY_FAIL_PCT && rssInMB > MIN_FAIL_RSS_MB) {
      status = 'fail'
      message = `Memory usage critical: ${rssInMB.toFixed(1)}MB (${memoryPercentage.toFixed(1)}%)`
    } else if (memoryPercentage > MEMORY_WARN_PCT) {
      status = 'warn'
      message = `Memory usage high: ${rssInMB.toFixed(1)}MB (${memoryPercentage.toFixed(1)}%)`
    }

    return {
      status,
      message,
      details: {
        rss: {
          bytes: memUsage.rss,
          mb: rssInMB,
          percentage: memoryPercentage,
          limit_mb: totalMemoryMB
        },
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: heapPercentage
        },
        external: memUsage.external,
        thresholds: {
          warn_pct: MEMORY_WARN_PCT,
          fail_pct: MEMORY_FAIL_PCT,
          min_fail_rss_mb: MIN_FAIL_RSS_MB
        }
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
    const MEMORY_LIMIT_MB = parseInt(process.env.HEALTH_MEMORY_LIMIT_MB || '1024')
    const rssInMB = memUsage.rss / (1024 * 1024)
    return (rssInMB / MEMORY_LIMIT_MB) * 100
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



