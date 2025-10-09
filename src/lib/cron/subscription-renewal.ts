/**
 * Subscription Auto-Renewal Cron Job
 *
 * Runs daily at 00:00 UTC
 * Checks for expired subscriptions and handles auto-renewal
 *
 * Schedule: "0 0 * * *" (every day at midnight UTC)
 */

import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { logger, logBillingEvent, logError } from '@/lib/logger'
import { SubscriptionStatus, PlanTier } from '@prisma/client'

/**
 * Process subscription renewals
 */
export async function processSubscriptionRenewals() {
  const startTime = Date.now()

  try {
    logger.info('Starting subscription renewal process')

    const now = new Date()

    // Find subscriptions that are about to expire or have expired
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: {
          lte: now, // Already expired or expiring today
        },
        cancelAtPeriodEnd: false, // Not marked for cancellation
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            planTier: true,
          },
        },
      },
    })

    logger.info(
      { count: expiringSubscriptions.length },
      `Found ${expiringSubscriptions.length} subscriptions to process`
    )

    let renewed = 0
    let expired = 0
    let failed = 0

    for (const subscription of expiringSubscriptions) {
      try {
        // Check if user wants to auto-renew (you can add a flag to User model)
        // For now, we'll mark as expired if no payment is made
        // In a real implementation, you would:
        // 1. Create a new payment intent
        // 2. Charge the user
        // 3. If successful, extend the subscription
        // 4. If failed, mark as PAST_DUE or EXPIRED

        // For demonstration, let's mark subscriptions as EXPIRED
        // You should integrate with your payment provider here
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        })

        // Downgrade user to FREE tier
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            planTier: PlanTier.FREE,
          },
        })

        expired++

        logBillingEvent({
          event: 'subscription_created', // Reusing this event type
          userId: subscription.userId,
          planTier: subscription.planTier,
          metadata: {
            subscriptionId: subscription.id,
            reason: 'expired',
          },
        })

        logger.info(
          {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            planTier: subscription.planTier,
          },
          'Subscription expired and user downgraded to FREE'
        )
      } catch (error) {
        failed++

        logger.error(
          {
            err: error,
            subscriptionId: subscription.id,
            userId: subscription.userId,
          },
          'Failed to process subscription renewal'
        )

        if (error instanceof Error) {
          logError(error, {
            userId: subscription.userId,
            extra: {
              subscriptionId: subscription.id,
              operation: 'subscription_renewal',
            },
            tags: {
              component: 'cron',
              job: 'subscription-renewal',
            },
          })
        }
      }
    }

    const duration = Date.now() - startTime

    logger.info(
      {
        total: expiringSubscriptions.length,
        renewed,
        expired,
        failed,
        duration,
      },
      `Subscription renewal process completed in ${duration}ms`
    )

    return {
      success: true,
      total: expiringSubscriptions.length,
      renewed,
      expired,
      failed,
      duration,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error(
      {
        err: error,
        duration,
      },
      'Subscription renewal process failed'
    )

    if (error instanceof Error) {
      logError(error, {
        extra: { operation: 'subscription_renewal_process' },
        tags: { component: 'cron', job: 'subscription-renewal' },
      })
    }

    throw error
  }
}

/**
 * Schedule subscription renewal cron job
 *
 * Runs daily at 00:00 UTC
 */
export function scheduleSubscriptionRenewal() {
  // Validate environment
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping subscription renewal cron job in test environment')
    return null
  }

  // "0 0 * * *" = At 00:00 every day (UTC)
  const schedule = '0 0 * * *'

  logger.info({ schedule }, 'Scheduling subscription renewal cron job')

  const task = cron.schedule(
    schedule,
    async () => {
      logger.info('Subscription renewal cron job triggered')
      try {
        await processSubscriptionRenewals()
      } catch (error) {
        logger.error({ err: error }, 'Subscription renewal cron job failed')
      }
    },
    {
      timezone: 'UTC', // IMPORTANT: Use UTC timezone
      // scheduled: true, // Not supported in current node-cron version
    }
  )

  logger.info('Subscription renewal cron job scheduled successfully')

  return task
}

/**
 * Manual trigger for subscription renewal (useful for testing)
 */
export async function triggerSubscriptionRenewalManually() {
  logger.info('Manual subscription renewal triggered')
  return await processSubscriptionRenewals()
}
