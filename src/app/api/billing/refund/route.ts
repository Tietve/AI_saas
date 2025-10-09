/**
 * Refund API Endpoint
 *
 * POST /api/billing/refund
 *
 * Process a refund for a payment
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { processRefund, isRefundEligible } from '@/lib/billing/refund'
import { getUserIdFromSession } from '@/lib/auth/session'
import { validateRequest, withErrorHandler } from '@/lib/validation/middleware'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().int().positive().optional(),
  reason: z.enum([
    'customer_request',
    'service_issue',
    'accidental_payment',
    'fraud',
    'duplicate_payment',
    'other',
  ]),
  description: z.string().max(500).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  // Get authenticated user
  const userId = await getUserIdFromSession()

  if (!userId) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
  }

  // Validate request body
  const body = await validateRequest(req, refundSchema)

  // Verify payment belongs to user
  const payment = await prisma.payment.findUnique({
    where: { id: body.paymentId },
    select: { userId: true },
  })

  if (!payment) {
    return NextResponse.json({ code: 'NOT_FOUND', message: 'Payment not found' }, { status: 404 })
  }

  if (payment.userId !== userId) {
    return NextResponse.json({ code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 })
  }

  // Check refund eligibility
  const eligibility = await isRefundEligible(body.paymentId)

  if (!eligibility.eligible) {
    logger.warn(
      { userId, paymentId: body.paymentId, reason: eligibility.reason },
      'Refund request denied - not eligible'
    )

    return NextResponse.json(
      {
        code: 'REFUND_NOT_ELIGIBLE',
        message: eligibility.reason || 'This payment is not eligible for refund',
      },
      { status: 400 }
    )
  }

  // Process refund
  const result = await processRefund({
    paymentId: body.paymentId,
    amount: body.amount,
    reason: body.reason,
    metadata: {
      description: body.description,
      requestedBy: userId,
    },
  })

  if (!result.success) {
    return NextResponse.json(
      {
        code: 'REFUND_FAILED',
        message: result.error || 'Failed to process refund',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    refundId: result.refundId,
    amount: result.amount,
  })
})

/**
 * GET /api/billing/refund/history
 *
 * Get refund history for the authenticated user
 */
export const GET = withErrorHandler(async (req: Request) => {
  const userId = await getUserIdFromSession()

  if (!userId) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
  }

  const { getRefundHistory } = await import('@/lib/billing/refund')
  const refunds = await getRefundHistory(userId)

  return NextResponse.json({ refunds })
})
