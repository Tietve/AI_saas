/**
 * FREE Health Monitoring Script
 *
 * Run this via cron to monitor your app and send alerts
 * Cost: $0 (uses free webhooks)
 *
 * Usage:
 *   npm run monitor:health
 *
 * Cron setup (every 5 minutes):
 *   Star-slash-5 star star star star cd /path/to/project && npm run monitor:health
 *   (Replace "Star-slash-5" with the actual cron pattern)
 */

import { sendAlert, AlertTemplates } from './free-alerting-webhook'
import { logger } from '@/lib/logger'

interface HealthCheckResult {
  ok: boolean
  checks: {
    database: boolean
    redis: boolean
    api: boolean
  }
  metrics: {
    dbResponseTime: number
    redisResponseTime: number
    apiResponseTime: number
  }
  errors: string[]
}

const HEALTH_URL =
  process.env.HEALTH_CHECK_URL ||
  'https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/health'

const THRESHOLDS = {
  errorRate: 5, // 5% error rate
  dbResponseTime: 100, // 100ms
  apiResponseTime: 2000, // 2000ms
  redisResponseTime: 100, // 100ms
}

async function checkHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const apiResponseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        ok: false,
        checks: { database: false, redis: false, api: false },
        metrics: { dbResponseTime: 0, redisResponseTime: 0, apiResponseTime },
        errors: [`API returned ${response.status}`],
      }
    }

    const data = await response.json()

    return {
      ok: data.ok,
      checks: {
        database: data.checks?.database || false,
        redis: data.checks?.redis || false,
        api: true,
      },
      metrics: {
        dbResponseTime: data.metrics?.dbResponseTime || 0,
        redisResponseTime: data.metrics?.redisResponseTime || 0,
        apiResponseTime,
      },
      errors: data.errors || [],
    }
  } catch (error) {
    logger.error({ err: error }, 'Health check failed')
    return {
      ok: false,
      checks: { database: false, redis: false, api: false },
      metrics: { dbResponseTime: 0, redisResponseTime: 0, apiResponseTime: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

async function analyzeAndAlert(result: HealthCheckResult) {
  // Critical: Database down
  if (!result.checks.database) {
    await sendAlert(AlertTemplates.databaseDown())
  }

  // Warning: Slow database response
  if (
    result.checks.database &&
    result.metrics.dbResponseTime > THRESHOLDS.dbResponseTime
  ) {
    await sendAlert({
      title: '⚠️ Slow Database Response',
      message: `Database response time is ${result.metrics.dbResponseTime}ms (threshold: ${THRESHOLDS.dbResponseTime}ms)`,
      level: 'warning',
      tags: ['database', 'performance'],
      metadata: {
        responseTime: `${result.metrics.dbResponseTime}ms`,
        threshold: `${THRESHOLDS.dbResponseTime}ms`,
      },
    })
  }

  // Warning: Slow API response
  if (result.metrics.apiResponseTime > THRESHOLDS.apiResponseTime) {
    await sendAlert(
      AlertTemplates.slowResponse('/api/health', result.metrics.apiResponseTime)
    )
  }

  // Critical: Redis down
  if (!result.checks.redis) {
    await sendAlert({
      title: '🚨 REDIS CONNECTION FAILED',
      message: 'Cannot connect to Redis. Caching and rate limiting may be affected!',
      level: 'critical',
      tags: ['redis', 'critical'],
    })
  }

  // Info: System healthy but slow
  if (
    result.ok &&
    result.metrics.apiResponseTime > THRESHOLDS.apiResponseTime * 0.7
  ) {
    await sendAlert({
      title: 'ℹ️ Performance Degradation',
      message: `API response time is elevated at ${result.metrics.apiResponseTime}ms`,
      level: 'info',
      tags: ['performance', 'monitoring'],
      metadata: {
        dbTime: `${result.metrics.dbResponseTime}ms`,
        redisTime: `${result.metrics.redisResponseTime}ms`,
        apiTime: `${result.metrics.apiResponseTime}ms`,
      },
    })
  }

  // Error: Any errors reported
  if (result.errors.length > 0) {
    await sendAlert({
      title: '❌ Health Check Errors',
      message: `Health check reported ${result.errors.length} error(s)`,
      level: 'error',
      tags: ['errors', 'monitoring'],
      metadata: {
        errors: result.errors.join(', '),
      },
    })
  }
}

async function main() {
  logger.info('Starting health monitoring check...')

  const result = await checkHealth()

  logger.info({
    ok: result.ok,
    checks: result.checks,
    metrics: result.metrics,
  }, 'Health check result')

  if (!result.ok || result.errors.length > 0) {
    await analyzeAndAlert(result)
  } else {
    logger.info('System is healthy - no alerts needed')
  }

  logger.info('Health monitoring check completed')
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      logger.error({ err: error }, 'Health monitoring failed')
      process.exit(1)
    })
}

export { checkHealth, analyzeAndAlert }
