/**
 * @swagger
 * /api/user/delete-account:
 *   delete:
 *     tags:
 *       - User Management
 *     summary: Delete user account (GDPR compliant)
 *     description: |
 *       Permanently delete user account and all associated data.
 *       Compliant with GDPR Article 17 (Right to Erasure).
 *
 *       Data deleted:
 *       - User profile and credentials
 *       - All chat messages and conversations
 *       - Payment history and subscription data
 *       - Uploaded files and documents
 *       - Session data and cache
 *
 *       This action is IRREVERSIBLE.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmation
 *             properties:
 *               confirmation:
 *                 type: string
 *                 description: Must be "DELETE_MY_ACCOUNT" to confirm
 *                 example: "DELETE_MY_ACCOUNT"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid confirmation
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { upstash as redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { sendAlert } from '@/lib/alerting/webhook'

export const runtime = 'nodejs'

export async function DELETE(req: Request) {
  try {
    // 1. Verify authentication
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.userId

    // 2. Verify confirmation
    const body = await req.json()
    if (body.confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        {
          error:
            'Invalid confirmation. Type "DELETE_MY_ACCOUNT" to confirm deletion.',
        },
        { status: 400 }
      )
    }

    logger.warn({ userId }, 'Starting account deletion (GDPR)')

    // 3. Fetch user email for notification (before deletion)
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Delete all user data (cascading deletes via Prisma schema)
    await prisma.$transaction(async (tx) => {
      // Delete conversations (this will cascade delete messages, attachments via schema)
      await tx.conversation.deleteMany({ where: { userId: userId as string } })

      // Delete subscriptions
      await tx.subscription.deleteMany({ where: { userId: userId as string } })

      // Delete payments
      await tx.payment.deleteMany({ where: { userId: userId as string } })

      // Delete verification tokens
      await tx.emailVerificationToken.deleteMany({ where: { userId: userId as string } })
      await tx.passwordResetToken.deleteMany({ where: { userId: userId as string } })

      // Delete projects
      await tx.project.deleteMany({ where: { userId: userId as string } })

      // Delete usage records
      await tx.dailyUsageRecord.deleteMany({ where: { userId: userId as string } })

      // Delete token usage
      await tx.tokenUsage.deleteMany({ where: { userId: userId as string } })

      // Delete invoices
      await tx.invoice.deleteMany({ where: { userId: userId as string } })

      // Delete feedbacks
      await tx.messageFeedback.deleteMany({ where: { userId: userId as string } })

      // Delete settings
      const settings = await tx.userSetting.findUnique({ where: { userId: userId as string } })
      if (settings) {
        await tx.userSetting.delete({ where: { userId: userId as string } })
      }

      // Finally, delete user
      await tx.user.delete({ where: { id: userId as string } })
    })

    // 5. Clear Redis cache and sessions
    try {
      if (redis) {
        // Clear user cache
        await redis.del(`user:${userId}`)
        await redis.del(`user:${userId}:subscription`)

        // Clear all user sessions
        const sessionKeys = await redis.keys(`session:${userId}:*`)
        if (sessionKeys.length > 0) {
          await redis.del(...sessionKeys)
        }

        // Clear rate limiting data
        await redis.del(`ratelimit:${userId}`)
        await redis.del(`lockout:${user.email.toLowerCase()}`)
        await redis.del(`lock:${user.email.toLowerCase()}`)
      }
    } catch (redisError) {
      logger.error({ err: redisError, userId }, 'Failed to clear Redis data')
      // Continue even if Redis cleanup fails
    }

    // 6. Send notification alert
    await sendAlert({
      title: '🗑️ Account Deleted (GDPR)',
      message: `User account deleted: ${user.email}`,
      level: 'info',
      tags: ['gdpr', 'account-deletion'],
      metadata: {
        userId,
        email: user.email,
        deletedAt: new Date().toISOString(),
      },
    })

    logger.info({ userId, email: user.email }, 'Account deleted successfully (GDPR)')

    // 7. Clear session cookie
    const response = NextResponse.json({
      ok: true,
      message: 'Account deleted successfully',
    })

    response.cookies.delete('session')

    return response
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete account')

    // Alert on deletion failure
    await sendAlert({
      title: '❌ Account Deletion Failed',
      message: 'Failed to delete user account - manual intervention may be required',
      level: 'error',
      tags: ['gdpr', 'error'],
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
