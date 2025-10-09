/**
 * ProviderMetricsRepository
 *
 * Handles database operations for AI provider metrics tracking.
 * Records latency, cost, error rates, and success metrics per provider/model.
 */

import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { AIProvider, ModelId, ProviderMetrics } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface CreateMetricInput {
  provider: AIProvider
  model: ModelId
  latencyMs: number
  costUsd?: number
  success: boolean
  errorCode?: string
  errorMessage?: string
  userId?: string
  requestId?: string
  tokensIn?: number
  tokensOut?: number
}

export interface ProviderStatsOutput {
  provider: AIProvider
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  avgLatencyMs: number
  totalCostUsd: number
  totalTokensIn: number
  totalTokensOut: number
}

export interface ModelStatsOutput {
  model: ModelId
  provider: AIProvider
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  avgLatencyMs: number
  totalCostUsd: number
}

@injectable()
export class ProviderMetricsRepository {
  /**
   * Record a new metric entry
   */
  async create(data: CreateMetricInput): Promise<ProviderMetrics> {
    try {
      return await prisma.providerMetrics.create({
        data: {
          provider: data.provider,
          model: data.model,
          latencyMs: data.latencyMs,
          costUsd: data.costUsd ?? 0,
          success: data.success,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
          userId: data.userId,
          requestId: data.requestId,
          tokensIn: data.tokensIn,
          tokensOut: data.tokensOut,
        },
      })
    } catch (error) {
      logger.error({ err: error, data }, 'Failed to create provider metric')
      throw error
    }
  }

  /**
   * Find metric by request ID (for idempotency)
   */
  async findByRequestId(requestId: string): Promise<ProviderMetrics | null> {
    try {
      return await prisma.providerMetrics.findFirst({
        where: { requestId },
      })
    } catch (error) {
      logger.error({ err: error, requestId }, 'Failed to find metric by requestId')
      throw error
    }
  }

  /**
   * Get aggregated statistics for a provider within a time range
   */
  async getProviderStats(
    provider: AIProvider,
    startDate: Date,
    endDate: Date
  ): Promise<ProviderStatsOutput | null> {
    try {
      const stats = await prisma.providerMetrics.aggregate({
        where: {
          provider,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
        _avg: { latencyMs: true },
        _sum: {
          costUsd: true,
          tokensIn: true,
          tokensOut: true,
        },
      })

      const successCount = await prisma.providerMetrics.count({
        where: {
          provider,
          success: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      const totalRequests = stats._count.id
      if (totalRequests === 0) return null

      return {
        provider,
        totalRequests,
        successfulRequests: successCount,
        failedRequests: totalRequests - successCount,
        errorRate: ((totalRequests - successCount) / totalRequests) * 100,
        avgLatencyMs: Math.round(stats._avg.latencyMs ?? 0),
        totalCostUsd: stats._sum.costUsd ?? 0,
        totalTokensIn: stats._sum.tokensIn ?? 0,
        totalTokensOut: stats._sum.tokensOut ?? 0,
      }
    } catch (error) {
      logger.error({ err: error, provider }, 'Failed to get provider stats')
      throw error
    }
  }

  /**
   * Get aggregated statistics for a specific model within a time range
   */
  async getModelStats(
    provider: AIProvider,
    model: ModelId,
    startDate: Date,
    endDate: Date
  ): Promise<ModelStatsOutput | null> {
    try {
      const stats = await prisma.providerMetrics.aggregate({
        where: {
          provider,
          model,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
        _avg: { latencyMs: true },
        _sum: { costUsd: true },
      })

      const successCount = await prisma.providerMetrics.count({
        where: {
          provider,
          model,
          success: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      const totalRequests = stats._count.id
      if (totalRequests === 0) return null

      return {
        model,
        provider,
        totalRequests,
        successfulRequests: successCount,
        failedRequests: totalRequests - successCount,
        errorRate: ((totalRequests - successCount) / totalRequests) * 100,
        avgLatencyMs: Math.round(stats._avg.latencyMs ?? 0),
        totalCostUsd: stats._sum.costUsd ?? 0,
      }
    } catch (error) {
      logger.error({ err: error, provider, model }, 'Failed to get model stats')
      throw error
    }
  }

  /**
   * Get recent errors for debugging
   */
  async getRecentErrors(
    provider?: AIProvider,
    limit = 50
  ): Promise<ProviderMetrics[]> {
    try {
      return await prisma.providerMetrics.findMany({
        where: {
          success: false,
          provider,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      logger.error({ err: error, provider }, 'Failed to get recent errors')
      throw error
    }
  }

  /**
   * Get latency percentiles for a provider/model
   */
  async getLatencyPercentiles(
    provider: AIProvider,
    model?: ModelId,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ p50: number; p95: number; p99: number } | null> {
    try {
      const where = {
        provider,
        model,
        success: true, // Only successful requests for accurate latency
        createdAt:
          startDate && endDate
            ? {
                gte: startDate,
                lte: endDate,
              }
            : undefined,
      }

      // Get raw latency values ordered
      const metrics = await prisma.providerMetrics.findMany({
        where,
        select: { latencyMs: true },
        orderBy: { latencyMs: 'asc' },
      })

      if (metrics.length === 0) return null

      const latencies = metrics.map((m) => m.latencyMs)
      const len = latencies.length

      const p50Index = Math.floor(len * 0.5)
      const p95Index = Math.floor(len * 0.95)
      const p99Index = Math.floor(len * 0.99)

      return {
        p50: latencies[p50Index],
        p95: latencies[p95Index],
        p99: latencies[p99Index],
      }
    } catch (error) {
      logger.error({
        err: error,
        provider,
        model,
      }, 'Failed to get latency percentiles')
      throw error
    }
  }

  /**
   * Get hourly error rate trend
   */
  async getHourlyErrorRate(
    provider: AIProvider,
    hoursBack = 24
  ): Promise<Array<{ hour: Date; errorRate: number; totalRequests: number }>> {
    try {
      const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

      // Group by hour using raw SQL for better performance
      const result = await prisma.$queryRaw<
        Array<{
          hour: Date
          total: bigint
          errors: bigint
        }>
      >`
        SELECT
          DATE_TRUNC('hour', "createdAt") as hour,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = false) as errors
        FROM "ProviderMetrics"
        WHERE provider = ${provider}
          AND "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY hour DESC
      `

      return result.map((r) => ({
        hour: r.hour,
        totalRequests: Number(r.total),
        errorRate: (Number(r.errors) / Number(r.total)) * 100,
      }))
    } catch (error) {
      logger.error({ err: error, provider }, 'Failed to get hourly error rate')
      throw error
    }
  }
}
