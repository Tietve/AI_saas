/**
 * Centralized logging service using Pino
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Payment failed', { error, orderId })
 *   logger.debug('Cache hit', { key })
 *
 * Features:
 *   - Structured JSON logging in production
 *   - Pretty formatted logs in development
 *   - Automatic error serialization
 *   - Request ID tracking
 *   - Performance-optimized (async logging)
 */

import pino from 'pino'
import * as Sentry from '@sentry/nextjs'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Disable logging in test environment
  enabled: !isTest,

  // Base configuration
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },

  // Error serialization
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Pretty printing for development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{levelLabel} - {msg}',
        },
      }
    : undefined,

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Format options for production
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
})

/**
 * Create a child logger with additional context
 *
 * @example
 * const requestLogger = createLogger({ requestId: '123', userId: 'abc' })
 * requestLogger.info('Processing request')
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Log API request with timing
 *
 * @example
 * const start = Date.now()
 * // ... process request
 * logApiRequest({
 *   method: 'POST',
 *   path: '/api/chat',
 *   userId: '123',
 *   duration: Date.now() - start,
 *   statusCode: 200
 * })
 */
export function logApiRequest(data: {
  method: string
  path: string
  userId?: string
  duration: number
  statusCode: number
  error?: Error
}) {
  const { error, ...rest } = data

  if (error) {
    logger.error({ ...rest, err: error }, `API ${data.method} ${data.path} failed`)
  } else if (data.statusCode >= 400) {
    logger.warn(rest, `API ${data.method} ${data.path} returned ${data.statusCode}`)
  } else {
    logger.info(rest, `API ${data.method} ${data.path} - ${data.duration}ms`)
  }
}

/**
 * Log database query with timing
 *
 * @example
 * const start = Date.now()
 * const result = await prisma.user.findMany()
 * logDbQuery({
 *   operation: 'findMany',
 *   model: 'User',
 *   duration: Date.now() - start,
 *   count: result.length
 * })
 */
export function logDbQuery(data: {
  operation: string
  model: string
  duration: number
  count?: number
  error?: Error
}) {
  const { error, ...rest } = data

  if (error) {
    logger.error({ ...rest, err: error }, `DB ${data.model}.${data.operation} failed`)
  } else if (data.duration > 1000) {
    logger.warn(rest, `Slow DB query: ${data.model}.${data.operation} - ${data.duration}ms`)
  } else {
    logger.debug(rest, `DB ${data.model}.${data.operation} - ${data.duration}ms`)
  }
}

/**
 * Log AI provider request with cost and latency
 */
export function logAiRequest(data: {
  provider: string
  model: string
  userId?: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  latency: number
  cached?: boolean
  error?: Error
}) {
  const { error, ...rest } = data

  if (error) {
    logger.error({ ...rest, err: error }, `AI ${data.provider}/${data.model} failed`)
  } else {
    logger.info(
      rest,
      `AI ${data.provider}/${data.model} - ${data.latency}ms, $${data.costUsd.toFixed(4)}`
    )
  }
}

/**
 * Log quota/billing events
 */
export function logBillingEvent(data: {
  event: 'quota_exceeded' | 'subscription_created' | 'payment_success' | 'payment_failed' | 'refund'
  userId: string
  amount?: number
  planTier?: string
  error?: Error
  [key: string]: unknown
}) {
  const { error, event, ...rest } = data

  if (error) {
    logger.error({ event, ...rest, err: error }, `Billing event: ${event} failed`)
  } else {
    logger.info({ event, ...rest }, `Billing event: ${event}`)
  }
}

/**
 * Log error to both logger and Sentry
 */
export function logError(
  error: Error,
  context?: {
    userId?: string
    extra?: Record<string, unknown>
    tags?: Record<string, string>
  }
) {
  // Log to Pino
  logger.error({ err: error, ...context?.extra }, error.message)

  // Send to Sentry (only in production)
  if (!isDevelopment && !isTest) {
    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId })
      }

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }

      if (context?.extra) {
        scope.setContext('extra', context.extra)
      }

      Sentry.captureException(error)
    })
  }
}

/**
 * Type-safe logger exports
 */
export default logger
