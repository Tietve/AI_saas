/**
 * Cron Jobs Initialization
 *
 * Centralizes all cron job scheduling
 */

import { scheduleMonthlyQuotaReset } from './quota-reset'
import { scheduleSubscriptionRenewal } from './subscription-renewal'
import { logger } from '@/lib/logger'

/**
 * Initialize all cron jobs
 *
 * Called once when the server starts (from instrumentation.ts)
 */
export function initializeCronJobs() {
  try {
    logger.info('Initializing cron jobs')

    // Schedule monthly quota reset (1st of every month at 00:00 UTC)
    const quotaResetTask = scheduleMonthlyQuotaReset()

    // Schedule subscription renewal check (daily at 00:00 UTC)
    const renewalTask = scheduleSubscriptionRenewal()

    logger.info('All cron jobs initialized successfully')

    return {
      quotaResetTask,
      renewalTask,
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize cron jobs')
    throw error
  }
}

// Export individual schedulers for manual control
export { scheduleMonthlyQuotaReset, scheduleSubscriptionRenewal }

// Export manual triggers for testing
export { triggerQuotaResetManually } from './quota-reset'
export { triggerSubscriptionRenewalManually } from './subscription-renewal'
