/**
 * Azure-Optimized Health Check Endpoint
 *
 * This endpoint is designed specifically for Azure App Service health checks.
 * It provides a robust health assessment that works reliably in production.
 *
 * Features:
 * - Fast response time (< 5 seconds)
 * - Graceful degradation when services are unavailable
 * - Detailed health status for debugging
 * - Azure-specific optimizations
 */

import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/prisma'
import { checkRedisHealth } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Health check timeout (Azure expects response within 5 seconds)
const HEALTH_CHECK_TIMEOUT = 4000

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'pass' | 'fail' | 'warn'
      latency: number
      error?: string
    }
    redis: {
      status: 'pass' | 'fail' | 'warn'
      latency: number
      error?: string
    }
    application: {
      status: 'pass'
      memory: {
        used: number
        total: number
        percentage: number
      }
      node_version: string
      environment: string
    }
  }
  version: string
}

export async function GET() {
  const startTime = Date.now()

  try {
    // Run health checks with timeout
    const healthPromise = performHealthChecks()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT)
    })

    const healthStatus = await Promise.race([healthPromise, timeoutPromise])

    // Determine overall status
    const { database, redis } = healthStatus.checks
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'

    if (database.status === 'pass' && redis.status === 'pass') {
      overallStatus = 'healthy'
    } else if (database.status === 'pass' && redis.status === 'warn') {
      overallStatus = 'degraded' // App can work without Redis
    } else if (database.status === 'fail') {
      overallStatus = 'unhealthy' // App cannot work without database
    } else {
      overallStatus = 'degraded'
    }

    healthStatus.status = overallStatus

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    // Fallback response for critical errors
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: 'fail', latency: 0, error: 'Health check failed' },
        redis: { status: 'fail', latency: 0, error: 'Health check failed' },
        application: {
          status: 'pass',
          memory: getMemoryUsage(),
          node_version: process.version,
          environment: process.env.NODE_ENV || 'unknown'
        }
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

async function performHealthChecks(): Promise<HealthStatus> {
  // Run checks in parallel for speed
  const [dbHealth, redisHealth] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth()
  ])

  // Process database health
  const databaseCheck = dbHealth.status === 'fulfilled'
    ? {
        status: dbHealth.value.healthy ? 'pass' as const : 'fail' as const,
        latency: dbHealth.value.latency,
        error: dbHealth.value.error
      }
    : {
        status: 'fail' as const,
        latency: 0,
        error: dbHealth.reason?.message || 'Database check failed'
      }

  // Process Redis health (Redis is optional, so failures are warnings)
  const redisCheck = redisHealth.status === 'fulfilled'
    ? {
        status: redisHealth.value.healthy ? 'pass' as const : 'warn' as const,
        latency: redisHealth.value.latency,
        error: redisHealth.value.error
      }
    : {
        status: 'warn' as const,
        latency: 0,
        error: redisHealth.reason?.message || 'Redis not available'
      }

  return {
    status: 'healthy', // Will be determined by caller
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: databaseCheck,
      redis: redisCheck,
      application: {
        status: 'pass',
        memory: getMemoryUsage(),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'unknown'
      }
    },
    version: process.env.npm_package_version || '1.0.0'
  }
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage()
  const totalMem = memUsage.heapTotal
  const usedMem = memUsage.heapUsed

  return {
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
    percentage: Math.round((usedMem / totalMem) * 100)
  }
}