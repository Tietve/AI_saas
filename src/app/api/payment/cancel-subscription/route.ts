/**
 * @swagger
 * /api/payment/cancel-subscription:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Cancel subscription
 *     description: |
 *       Cancel user's active subscription.
 *       Subscription remains active until end of current period.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: "Too expensive"
 *               feedback:
 *                 type: string
 *                 description: Optional feedback
 *                 example: "Great service but out of budget"
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       400:
 *         description: No active subscription found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendAlert } from '@/lib/alerting/webhook'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // 1. Verify authentication
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.userId

    // 2. Get request body
    const body = await req.json()
    const reason = body.reason || 'Not specified'
    const feedback = body.feedback || ''

    logger.info({ userId, reason }, 'Subscription cancellation requested')

    // 3. Find active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // 4. Update subscription to cancel at period end
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      },
    })

    // 5. Log cancellation reason (for analytics)
    logger.info(
      {
        userId,
        subscriptionId: subscription.id,
        planTier: subscription.planTier,
        reason,
        feedback,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      'Subscription cancelled'
    )

    // 6. Send alert to monitor churn
    await sendAlert({
      title: '⚠️ Subscription Cancelled',
      message: `User cancelled ${subscription.planTier} subscription`,
      level: 'warning',
      tags: ['payment', 'churn', 'subscription'],
      metadata: {
        userId,
        email: session.email,
        plan: subscription.planTier,
        reason,
        feedback: feedback ? feedback.substring(0, 100) : 'None',
        endsAt: subscription.currentPeriodEnd?.toISOString() || 'Unknown',
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Subscription cancelled',
      subscription: {
        id: subscription.id,
        planTier: subscription.planTier,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd,
        remainingDays: subscription.currentPeriodEnd
          ? Math.ceil(
              (subscription.currentPeriodEnd.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to cancel subscription')

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/payment/cancel-subscription:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get cancellation status
 *     description: Check if current subscription is set to cancel
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cancellation status retrieved
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        planTier: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!subscription) {
      return NextResponse.json({
        ok: true,
        hasSubscription: false,
      })
    }

    return NextResponse.json({
      ok: true,
      hasSubscription: true,
      subscription: {
        planTier: subscription.planTier,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        remainingDays: subscription.currentPeriodEnd
          ? Math.ceil(
              (subscription.currentPeriodEnd.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to get cancellation status')
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
