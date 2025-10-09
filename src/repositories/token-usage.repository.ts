/**
 * Token Usage Repository
 *
 * Handles all database operations related to token usage tracking.
 */

import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { TokenUsage, ModelId } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface CreateTokenUsageInput {
  userId: string
  model: ModelId
  tokensIn: number
  tokensOut: number
  costUsd: number
  meta?: any
}

export interface UsageStats {
  total: {
    tokensIn: number
    tokensOut: number
    costUsd: number
    requests: number
  }
  byModel: {
    model: ModelId
    tokensIn: number
    tokensOut: number
    costUsd: number
    requests: number
  }[]
}

@injectable()
export class TokenUsageRepository {
  /**
   * Create token usage record
   */
  async create(data: CreateTokenUsageInput): Promise<TokenUsage> {
    try {
      return await prisma.tokenUsage.create({
        data: {
          userId: data.userId,
          model: data.model,
          tokensIn: data.tokensIn,
          tokensOut: data.tokensOut,
          costUsd: data.costUsd,
          meta: data.meta ?? {},
        },
      })
    } catch (error) {
      logger.error({ err: error, userId: data.userId }, 'Failed to create token usage')
      throw error
    }
  }

  /**
   * Get usage statistics for user
   */
  async getStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStats> {
    try {
      const where: any = { userId }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
      }

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
            _count: {
              model: 'desc',
            },
          },
        }),
      ])

      return {
        total: {
          tokensIn: totalUsage._sum.tokensIn || 0,
          tokensOut: totalUsage._sum.tokensOut || 0,
          costUsd: totalUsage._sum.costUsd || 0,
          requests: totalUsage._count,
        },
        byModel: usageByModel.map((item) => ({
          model: item.model,
          tokensIn: item._sum.tokensIn || 0,
          tokensOut: item._sum.tokensOut || 0,
          costUsd: item._sum.costUsd || 0,
          requests: item._count,
        })),
      }
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get usage stats')
      throw error
    }
  }

  /**
   * Find usage records by user ID
   */
  async findByUserId(
    userId: string,
    options: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    } = {}
  ): Promise<TokenUsage[]> {
    try {
      const { limit = 100, offset = 0, startDate, endDate } = options

      const where: any = { userId }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
      }

      return await prisma.tokenUsage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find usage records')
      throw error
    }
  }

  /**
   * Check for duplicate by request ID
   */
  async findByRequestId(userId: string, requestId: string): Promise<TokenUsage | null> {
    try {
      return await prisma.tokenUsage.findFirst({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 60_000) }, // Last minute
          meta: { path: ['requestId'], equals: requestId } as any,
        },
      })
    } catch (error) {
      logger.error({ err: error, userId, requestId }, 'Failed to find usage by request ID')
      throw error
    }
  }

  /**
   * Get total usage for current month
   */
  async getMonthlyUsage(userId: string): Promise<number> {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const result = await prisma.tokenUsage.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          tokensIn: true,
          tokensOut: true,
        },
      })

      return (result._sum.tokensIn || 0) + (result._sum.tokensOut || 0)
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get monthly usage')
      throw error
    }
  }
}
