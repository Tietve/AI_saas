/**
 * Database Query Optimization Helpers
 *
 * Utilities to prevent N+1 queries and optimize database access
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Common query patterns with optimized includes
 */

/**
 * Get user with active subscription (optimized)
 *
 * Prevents N+1: Fetches user + subscription in one query
 */
export async function getUserWithSubscription(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * Get conversation with messages (optimized with pagination)
 *
 * Prevents N+1: Fetches conversation + messages + attachments in one query
 */
export async function getConversationWithMessages(
  conversationId: string,
  options: {
    limit?: number
    offset?: number
    includeAttachments?: boolean
  } = {}
) {
  const { limit = 20, offset = 0, includeAttachments = true } = options

  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: includeAttachments
          ? {
              attachments: {
                select: {
                  kind: true,
                  url: true,
                  meta: true,
                },
              },
            }
          : undefined,
      },
    },
  })
}

/**
 * Get user conversations list (optimized)
 *
 * Prevents N+1: Fetches conversations + last message in one query
 */
export async function getUserConversations(
  userId: string,
  options: {
    limit?: number
    offset?: number
    includeLastMessage?: boolean
    projectId?: string
  } = {}
) {
  const { limit = 50, offset = 0, includeLastMessage = true, projectId } = options

  const where: any = { userId }

  if (projectId) {
    where.projectId = projectId
  }

  return await prisma.conversation.findMany({
    where,
    orderBy: [
      { pinned: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: limit,
    skip: offset,
    include: includeLastMessage
      ? {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              role: true,
              content: true,
              createdAt: true,
            },
          },
        }
      : undefined,
  })
}

/**
 * Get usage statistics (optimized with aggregation)
 */
export async function getUserUsageStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { userId }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  // Use aggregation instead of loading all records
  const [totalUsage, usageByModel] = await Promise.all([
    prisma.tokenUsage.aggregate({
      where,
      _sum: {
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
      },
      _count: true,
    }),

    prisma.tokenUsage.groupBy({
      by: ['model'],
      where,
      _sum: {
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
      },
      _count: true,
      orderBy: {
        model: 'desc',
      } as any,
    }),
  ])

  return {
    total: {
      tokensIn: totalUsage._sum.tokensIn || 0,
      tokensOut: totalUsage._sum.tokensOut || 0,
      costUsd: totalUsage._sum.costUsd || 0,
      requests: totalUsage._count,
    },
    byModel: usageByModel.map((item: any) => ({
      model: item.model,
      tokensIn: item._sum.tokensIn || 0,
      tokensOut: item._sum.tokensOut || 0,
      costUsd: item._sum.costUsd || 0,
      requests: item._count,
    })),
  }
}

/**
 * Batch load users (for reducing N+1 in loops)
 */
export async function batchLoadUsers(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      email: true,
      planTier: true,
    },
  })

  // Create map for O(1) lookup
  const userMap = new Map(users.map((u) => [u.id, u]))
  return userMap
}

/**
 * Batch load conversations (for reducing N+1 in loops)
 */
export async function batchLoadConversations(conversationIds: string[]) {
  const conversations = await prisma.conversation.findMany({
    where: {
      id: { in: conversationIds },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  const conversationMap = new Map(conversations.map((c) => [c.id, c]))
  return conversationMap
}

/**
 * Check for N+1 queries in development
 *
 * Note: This function is deprecated because Prisma $use middleware is no longer supported.
 * Query monitoring is now handled via $extends in src/lib/prisma.ts
 * For N+1 detection, consider using external tools like:
 * - Prisma Studio
 * - npx prisma-query-log
 * - Application Performance Monitoring (APM) tools
 */
export function enableN1Detection() {
  logger.warn(
    'enableN1Detection() is deprecated. Query monitoring is now built into prisma client via $extends. ' +
    'For N+1 detection, use external tools like Prisma Studio or APM.'
  )

  // Feature disabled - $use middleware is no longer supported in Prisma v5+
  // Query performance monitoring is now handled in src/lib/prisma.ts using $extends
  return
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`

    const latency = Date.now() - startTime

    return {
      healthy: true,
      latency,
    }
  } catch (error) {
    const latency = Date.now() - startTime

    logger.error({ err: error }, 'Database health check failed')

    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
