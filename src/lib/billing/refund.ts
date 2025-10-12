/**
 * Refund Service
 *
 * Handles subscription refunds and related operations
 */

import { prisma } from '@/lib/prisma'
import { PaymentStatus, SubscriptionStatus, PlanTier, Prisma } from '@prisma/client'
import { logger, logBillingEvent, logError } from '@/lib/logger'

export type RefundReason =
  | 'customer_request'
  | 'service_issue'
  | 'accidental_payment'
  | 'fraud'
  | 'duplicate_payment'
  | 'other'

export type RefundResult = {
  success: boolean
  refundId?: string
  amount?: number
  error?: string
}

/**
 * Process a refund for a payment
 *
 * @param paymentId - Payment ID to refund
 * @param amount - Amount to refund (in smallest currency unit, e.g., cents). If not provided, full refund.
 * @param reason - Reason for refund
 * @param metadata - Additional metadata
 */
export async function processRefund(params: {
  paymentId: string
  amount?: number
  reason: RefundReason
  metadata?: Record<string, unknown>
}): Promise<RefundResult> {
  const { paymentId, amount, reason, metadata = {} } = params

  try {
    logger.info(
      { paymentId, amount, reason },
      `Processing refund for payment ${paymentId}`
    )

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: true,
        user: {
          select: {
            id: true,
            email: true,
            planTier: true,
          },
        },
      },
    })

    if (!payment) {
      logger.warn({ paymentId }, 'Payment not found for refund')
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    // Validate payment status
    if (payment.status !== PaymentStatus.SUCCESS) {
      logger.warn(
        { paymentId, status: payment.status },
        'Payment is not in SUCCESS status'
      )
      return {
        success: false,
        error: `Payment status is ${payment.status}, cannot refund`,
      }
    }

    // Calculate refund amount
    const refundAmount = amount || payment.amount

    if (refundAmount > payment.amount) {
      logger.warn(
        { paymentId, refundAmount, paymentAmount: payment.amount },
        'Refund amount exceeds payment amount'
      )
      return {
        success: false,
        error: 'Refund amount exceeds payment amount',
      }
    }

    // TODO: Integrate with PayOS or your payment provider's refund API
    // For now, we'll simulate the refund process

    // Start transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          metadata: {
            ...(payment.metadata as object),
            refundReason: reason,
            refundAmount,
            refundedAt: new Date().toISOString(),
            ...metadata,
          },
        },
      })

      // If full refund, cancel subscription
      if (refundAmount === payment.amount && payment.subscriptionId) {
        await tx.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: SubscriptionStatus.CANCELLED,
            canceledAt: new Date(),
            cancelAtPeriodEnd: true,
          },
        })

        // Downgrade user to FREE tier
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            planTier: PlanTier.FREE,
          },
        })
      }

      return updatedPayment
    })

    // Log billing event
    logBillingEvent({
      event: 'refund',
      userId: payment.userId,
      amount: refundAmount,
      planTier: payment.subscription?.planTier || 'UNKNOWN',
      paymentId,
      reason,
      metadata,
    })

    logger.info(
      {
        paymentId,
        refundAmount,
        reason,
        userId: payment.userId,
      },
      `Refund processed successfully for payment ${paymentId}`
    )

    return {
      success: true,
      refundId: result.id,
      amount: refundAmount,
    }
  } catch (error) {
    logger.error({ err: error, paymentId }, 'Failed to process refund')

    if (error instanceof Error) {
      logError(error, {
        extra: {
          paymentId,
          amount,
          reason,
          operation: 'process_refund',
        },
        tags: {
          component: 'billing',
          operation: 'refund',
        },
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if a payment is eligible for refund
 */
export async function isRefundEligible(paymentId: string): Promise<{
  eligible: boolean
  reason?: string
}> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        status: true,
        paidAt: true,
        amount: true,
      },
    })

    if (!payment) {
      return { eligible: false, reason: 'Payment not found' }
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      return { eligible: false, reason: `Payment status is ${payment.status}` }
    }

    // Check if payment is too old (e.g., 30 days refund window)
    const refundWindow = 30 * 24 * 60 * 60 * 1000 // 30 days
    const now = Date.now()
    const paidAt = payment.paidAt?.getTime() || 0

    if (now - paidAt > refundWindow) {
      return {
        eligible: false,
        reason: 'Payment is outside the refund window (30 days)',
      }
    }

    return { eligible: true }
  } catch (error) {
    logger.error({ err: error, paymentId }, 'Failed to check refund eligibility')
    return { eligible: false, reason: 'Error checking eligibility' }
  }
}

/**
 * Get refund history for a user
 */
export async function getRefundHistory(userId: string) {
  try {
    const refunds = await prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.REFUNDED,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        updatedAt: true,
        metadata: true,
        subscription: {
          select: {
            planTier: true,
          },
        },
      },
    })

    return refunds
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to fetch refund history')
    throw error
  }
}
