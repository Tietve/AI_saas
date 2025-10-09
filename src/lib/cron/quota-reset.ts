/**
 * Monthly Quota Reset Cron Job
 *
 * Runs on the 1st day of each month at 00:00 UTC
 * Resets monthlyTokenUsed for all users
 *
 * Schedule: "0 0 1 * *" (minute hour day-of-month month day-of-week)
 */

import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { logger, logBillingEvent } from '@/lib/logger'
import { logError } from '@/lib/logger'

/**
 * Reset monthly token usage for all users
 */
export async function resetMonthlyQuota() {
  const startTime = Date.now()

  try {
    logger.info('Starting monthly quota reset')

    // Count users before reset
    const userCount = await prisma.user.count()

    // Reset all users' monthly token usage to 0
    const result = await prisma.user.updateMany({
      data: {
        monthlyTokenUsed: 0,
      },
    })

    const duration = Date.now() - startTime

    logger.info(
      {
        usersReset: result.count,
        totalUsers: userCount,
        duration,
      },
      `Monthly quota reset completed: ${result.count} users reset in ${duration}ms`
    )

    logBillingEvent({
      event: 'quota_exceeded', // Reusing this event type
      userId: 'system',
      amount: result.count,
      planTier: 'ALL',
    })

    return {
      success: true,
      usersReset: result.count,
      duration,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error(
      {
        err: error,
        duration,
      },
      'Monthly quota reset failed'
    )

    if (error instanceof Error) {
      logError(error, {
        extra: { operation: 'monthly_quota_reset' },
        tags: { component: 'cron', job: 'quota-reset' },
      })
    }

    throw error
  }
}

/**
 * Schedule the monthly quota reset cron job
 *
 * Runs at 00:00 UTC on the 1st of every month
 */
export function scheduleMonthlyQuotaReset() {
  // Validate environment
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping quota reset cron job in test environment')
    return null
  }

  // "0 0 1 * *" = At 00:00 on day 1 of every month (UTC)
  const schedule = '0 0 1 * *'

  logger.info({ schedule }, 'Scheduling monthly quota reset cron job')

  const task = cron.schedule(
    schedule,
    async () => {
      logger.info('Monthly quota reset cron job triggered')
      try {
        await resetMonthlyQuota()
      } catch (error) {
        logger.error({ err: error }, 'Monthly quota reset cron job failed')
      }
    },
    {
      timezone: 'UTC', // IMPORTANT: Use UTC timezone
      // scheduled: true, // Not supported in current node-cron version
    }
  )

  logger.info('Monthly quota reset cron job scheduled successfully')

  return task
}

/**
 * Manual trigger for quota reset (useful for testing)
 */
export async function triggerQuotaResetManually() {
  logger.info('Manual quota reset triggered')
  return await resetMonthlyQuota()
}
