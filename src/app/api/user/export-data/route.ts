/**
 * @swagger
 * /api/user/export-data:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Export user data (GDPR compliant)
 *     description: |
 *       Export all user data in JSON format.
 *       Compliant with GDPR Article 20 (Right to Data Portability).
 *
 *       Exported data includes:
 *       - User profile information
 *       - All chat messages and conversations
 *       - Subscription and payment history
 *       - Usage statistics
 *       - Account creation and activity dates
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportDate:
 *                   type: string
 *                   format: date-time
 *                 user:
 *                   type: object
 *                 chats:
 *                   type: array
 *                 messages:
 *                   type: array
 *                 subscriptions:
 *                   type: array
 *                 payments:
 *                   type: array
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

export async function GET() {
  try {
    // 1. Verify authentication
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.userId

    logger.info({ userId }, 'Starting data export (GDPR)')

    // 2. Fetch all user data
    const [user, conversations, messages, subscriptions, payments, projects] =
      await Promise.all([
        // User profile (exclude sensitive fields)
        prisma.user.findUnique({
          where: { id: userId as string },
          select: {
            id: true,
            email: true,
            emailVerifiedAt: true,
            planTier: true,
            monthlyTokenUsed: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Conversations (chats)
        prisma.conversation.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Messages
        prisma.message.findMany({
          where: {
            conversation: {
              userId,
            },
          },
          select: {
            id: true,
            conversationId: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Subscriptions
        prisma.subscription.findMany({
          where: { userId },
          select: {
            id: true,
            planTier: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Payments
        prisma.payment.findMany({
          where: { userId },
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            description: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Projects
        prisma.project.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ])

    // 3. Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      gdprCompliance: {
        article20: 'Right to Data Portability',
        dataController: 'Firbox',
        contactEmail: process.env.SUPPORT_EMAIL || 'support@firbox.net',
      },
      user: user || null,
      statistics: {
        totalConversations: conversations.length,
        totalMessages: messages.length,
        totalPayments: payments.length,
        totalProjects: projects.length,
        accountAge: user
          ? Math.floor(
              (Date.now() - new Date(user.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      },
      conversations,
      messages,
      subscriptions,
      payments,
      projects,
    }

    // 4. Log export
    logger.info({ userId, dataSize: JSON.stringify(exportData).length }, 'Data exported successfully (GDPR)')

    // 5. Send notification (optional, for audit trail)
    await sendAlert({
      title: '📦 Data Export Requested (GDPR)',
      message: `User exported their data: ${user?.email}`,
      level: 'info',
      tags: ['gdpr', 'data-export'],
      metadata: {
        userId,
        email: user?.email || 'unknown',
        exportedAt: new Date().toISOString(),
        dataSize: `${(JSON.stringify(exportData).length / 1024).toFixed(2)} KB`,
      },
    })

    // 6. Return data with appropriate headers
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="firbox-data-export-${userId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to export data')

    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
