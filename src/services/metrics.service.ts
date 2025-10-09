/**
 * MetricsService
 *
 * Provides high-level analytics and insights for AI provider performance.
 * Aggregates metrics for dashboards, alerts, and monitoring.
 */

import { injectable, inject } from 'tsyringe'
import {
  ProviderMetricsRepository,
  CreateMetricInput,
  ProviderStatsOutput,
  ModelStatsOutput,
} from '@/repositories/provider-metrics.repository'
import { AIProvider, ModelId } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface ProviderHealthStatus {
  provider: AIProvider
  status: 'healthy' | 'degraded' | 'down'
  errorRate: number
  avgLatencyMs: number
  recentErrorCount: number
  lastChecked: Date
}

export interface DashboardMetrics {
  timeRange: {
    start: Date
    end: Date
  }
  providers: ProviderStatsOutput[]
  topModels: ModelStatsOutput[]
  overallStats: {
    totalRequests: number
    totalCost: number
    avgLatency: number
    errorRate: number
  }
}

export interface AlertThresholds {
  errorRatePercent: number // Alert if error rate exceeds this
  latencyMs: number // Alert if p95 latency exceeds this
  enabled: boolean
}

@injectable()
export class MetricsService {
  constructor(
    @inject(ProviderMetricsRepository)
    private metricsRepo: ProviderMetricsRepository
  ) {}

  /**
   * Record a new metric entry (called by AI gateway)
   */
  async recordMetric(data: CreateMetricInput): Promise<void> {
    try {
      // Check for duplicate request
      if (data.requestId) {
        const existing = await this.metricsRepo.findByRequestId(data.requestId)
        if (existing) {
          logger.warn({
            requestId: data.requestId,
          }, 'Duplicate metric recording skipped')
          return
        }
      }

      await this.metricsRepo.create(data)

      // Log successful recording
      logger.debug({
        provider: data.provider,
        model: data.model,
        success: data.success,
        latencyMs: data.latencyMs,
      }, 'Metric recorded')
    } catch (error) {
      logger.error({ err: error, data }, 'Failed to record metric')
      // Don't throw - metrics recording should not break main flow
    }
  }

  /**
   * Get health status for all providers
   */
  async getProviderHealth(
    lookbackMinutes = 15
  ): Promise<ProviderHealthStatus[]> {
    try {
      const startDate = new Date(Date.now() - lookbackMinutes * 60 * 1000)
      const endDate = new Date()

      const providers = [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.GOOGLE,
      ]

      const healthStatuses = await Promise.all(
        providers.map(async (provider) => {
          const stats = await this.metricsRepo.getProviderStats(
            provider,
            startDate,
            endDate
          )

          if (!stats || stats.totalRequests === 0) {
            return {
              provider,
              status: 'healthy' as const,
              errorRate: 0,
              avgLatencyMs: 0,
              recentErrorCount: 0,
              lastChecked: endDate,
            }
          }

          // Determine health status based on error rate
          let status: 'healthy' | 'degraded' | 'down' = 'healthy'
          if (stats.errorRate > 50) {
            status = 'down'
          } else if (stats.errorRate > 10) {
            status = 'degraded'
          }

          return {
            provider,
            status,
            errorRate: stats.errorRate,
            avgLatencyMs: stats.avgLatencyMs,
            recentErrorCount: stats.failedRequests,
            lastChecked: endDate,
          }
        })
      )

      return healthStatuses
    } catch (error) {
      logger.error({ err: error }, 'Failed to get provider health')
      throw error
    }
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(hoursBack = 24): Promise<DashboardMetrics> {
    try {
      const endDate = new Date()
      const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

      // Get stats for each provider
      const providers = [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.GOOGLE,
      ]

      const providerStats = (
        await Promise.all(
          providers.map((provider) =>
            this.metricsRepo.getProviderStats(provider, startDate, endDate)
          )
        )
      ).filter((s): s is ProviderStatsOutput => s !== null)

      // Get top models by request count
      const topModels = await this.getTopModels(startDate, endDate, 5)

      // Calculate overall stats
      const overallStats = {
        totalRequests: providerStats.reduce(
          (sum, s) => sum + s.totalRequests,
          0
        ),
        totalCost: providerStats.reduce((sum, s) => sum + s.totalCostUsd, 0),
        avgLatency:
          providerStats.reduce(
            (sum, s) => sum + s.avgLatencyMs * s.totalRequests,
            0
          ) / Math.max(1, providerStats.reduce((sum, s) => sum + s.totalRequests, 0)),
        errorRate:
          (providerStats.reduce((sum, s) => sum + s.failedRequests, 0) /
            Math.max(1, providerStats.reduce((sum, s) => sum + s.totalRequests, 0))) *
          100,
      }

      return {
        timeRange: { start: startDate, end: endDate },
        providers: providerStats,
        topModels,
        overallStats,
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to get dashboard metrics')
      throw error
    }
  }

  /**
   * Get top models by usage
   */
  private async getTopModels(
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<ModelStatsOutput[]> {
    try {
      const providers = [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.GOOGLE,
      ]

      const allModelStats: ModelStatsOutput[] = []

      // Get stats for all models from all providers
      for (const provider of providers) {
        const models = this.getModelsForProvider(provider)

        for (const model of models) {
          const stats = await this.metricsRepo.getModelStats(
            provider,
            model,
            startDate,
            endDate
          )
          if (stats) {
            allModelStats.push(stats)
          }
        }
      }

      // Sort by total requests and return top N
      return allModelStats
        .sort((a, b) => b.totalRequests - a.totalRequests)
        .slice(0, limit)
    } catch (error) {
      logger.error({ err: error }, 'Failed to get top models')
      return []
    }
  }

  /**
   * Get models for a specific provider
   */
  private getModelsForProvider(provider: AIProvider): ModelId[] {
    switch (provider) {
      case AIProvider.OPENAI:
        return [
          ModelId.gpt_4_turbo,
          ModelId.gpt_4o,
          ModelId.gpt_4o_mini,
          ModelId.gpt_3_5_turbo,
          ModelId.gpt_5,
          ModelId.gpt_5_mini,
          ModelId.gpt_5_nano,
        ]
      case AIProvider.ANTHROPIC:
        return [
          ModelId.claude_3_opus,
          ModelId.claude_3_5_sonnet,
          ModelId.claude_3_5_haiku,
        ]
      case AIProvider.GOOGLE:
        return [
          ModelId.gemini_1_5_pro,
          ModelId.gemini_1_5_flash,
          ModelId.gemini_2_0_flash,
        ]
      default:
        return []
    }
  }

  /**
   * Check if any alerts should be triggered
   */
  async checkAlerts(
    thresholds: AlertThresholds
  ): Promise<Array<{ provider: AIProvider; reason: string; severity: string }>> {
    if (!thresholds.enabled) return []

    try {
      const alerts: Array<{
        provider: AIProvider
        reason: string
        severity: string
      }> = []

      const healthStatuses = await this.getProviderHealth(15)

      for (const health of healthStatuses) {
        // Check error rate
        if (health.errorRate > thresholds.errorRatePercent) {
          alerts.push({
            provider: health.provider,
            reason: `Error rate ${health.errorRate.toFixed(1)}% exceeds threshold ${thresholds.errorRatePercent}%`,
            severity: health.status === 'down' ? 'critical' : 'warning',
          })
        }

        // Check latency
        if (health.avgLatencyMs > thresholds.latencyMs) {
          alerts.push({
            provider: health.provider,
            reason: `Average latency ${health.avgLatencyMs}ms exceeds threshold ${thresholds.latencyMs}ms`,
            severity: 'warning',
          })
        }
      }

      if (alerts.length > 0) {
        logger.warn({ alerts }, 'Alerts triggered')
      }

      return alerts
    } catch (error) {
      logger.error({ err: error }, 'Failed to check alerts')
      return []
    }
  }

  /**
   * Get cost breakdown by provider and model
   */
  async getCostBreakdown(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{ provider: AIProvider; model: ModelId; cost: number; requests: number }>
  > {
    try {
      const providers = [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.GOOGLE,
      ]

      const breakdown: Array<{
        provider: AIProvider
        model: ModelId
        cost: number
        requests: number
      }> = []

      for (const provider of providers) {
        const models = this.getModelsForProvider(provider)

        for (const model of models) {
          const stats = await this.metricsRepo.getModelStats(
            provider,
            model,
            startDate,
            endDate
          )

          if (stats && stats.totalRequests > 0) {
            breakdown.push({
              provider,
              model,
              cost: stats.totalCostUsd,
              requests: stats.totalRequests,
            })
          }
        }
      }

      // Sort by cost descending
      return breakdown.sort((a, b) => b.cost - a.cost)
    } catch (error) {
      logger.error({ err: error }, 'Failed to get cost breakdown')
      throw error
    }
  }

  /**
   * Get latency trends over time
   */
  async getLatencyTrends(
    provider: AIProvider,
    hoursBack = 24
  ): Promise<Array<{ hour: Date; errorRate: number; totalRequests: number }>> {
    try {
      return await this.metricsRepo.getHourlyErrorRate(provider, hoursBack)
    } catch (error) {
      logger.error({ err: error, provider }, 'Failed to get latency trends')
      throw error
    }
  }
}
