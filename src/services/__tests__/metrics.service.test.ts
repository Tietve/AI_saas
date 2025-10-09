/**
 * Unit tests for MetricsService
 *
 * Tests business logic for metrics aggregation in isolation.
 */

import 'reflect-metadata'
import { MetricsService } from '../metrics.service'
import { ProviderMetricsRepository } from '@/repositories/provider-metrics.repository'
import { AIProvider, ModelId } from '@prisma/client'

// Mock repository
jest.mock('@/repositories/provider-metrics.repository')

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('MetricsService', () => {
  let metricsService: MetricsService
  let mockMetricsRepo: jest.Mocked<ProviderMetricsRepository>

  beforeEach(() => {
    mockMetricsRepo =
      new ProviderMetricsRepository() as jest.Mocked<ProviderMetricsRepository>
    metricsService = new MetricsService(mockMetricsRepo)
    jest.clearAllMocks()
  })

  describe('recordMetric', () => {
    it('should record a new metric', async () => {
      mockMetricsRepo.findByRequestId.mockResolvedValue(null)
      mockMetricsRepo.create.mockResolvedValue({
        id: 'metric-123',
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o_mini,
        latencyMs: 500,
        costUsd: 0.001,
        success: true,
        errorCode: null,
        errorMessage: null,
        userId: 'user-123',
        requestId: 'req-123',
        tokensIn: 100,
        tokensOut: 50,
        createdAt: new Date(),
      })

      await metricsService.recordMetric({
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o_mini,
        latencyMs: 500,
        costUsd: 0.001,
        success: true,
        userId: 'user-123',
        requestId: 'req-123',
        tokensIn: 100,
        tokensOut: 50,
      })

      expect(mockMetricsRepo.findByRequestId).toHaveBeenCalledWith('req-123')
      expect(mockMetricsRepo.create).toHaveBeenCalled()
    })

    it('should skip duplicate requests', async () => {
      mockMetricsRepo.findByRequestId.mockResolvedValue({
        id: 'metric-123',
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o_mini,
        latencyMs: 500,
        costUsd: 0.001,
        success: true,
        errorCode: null,
        errorMessage: null,
        userId: 'user-123',
        requestId: 'req-123',
        tokensIn: 100,
        tokensOut: 50,
        createdAt: new Date(),
      })

      await metricsService.recordMetric({
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o_mini,
        latencyMs: 500,
        success: true,
        requestId: 'req-123',
      })

      expect(mockMetricsRepo.findByRequestId).toHaveBeenCalledWith('req-123')
      expect(mockMetricsRepo.create).not.toHaveBeenCalled()
    })

    it('should not throw when recording fails', async () => {
      mockMetricsRepo.findByRequestId.mockResolvedValue(null)
      mockMetricsRepo.create.mockRejectedValue(
        new Error('Database connection failed')
      )

      // Should not throw
      await expect(
        metricsService.recordMetric({
          provider: AIProvider.OPENAI,
          model: ModelId.gpt_4o_mini,
          latencyMs: 500,
          success: true,
        })
      ).resolves.not.toThrow()
    })
  })

  describe('getProviderHealth', () => {
    it('should return health status for all providers', async () => {
      mockMetricsRepo.getProviderStats
        .mockResolvedValueOnce({
          provider: AIProvider.OPENAI,
          totalRequests: 100,
          successfulRequests: 95,
          failedRequests: 5,
          errorRate: 5,
          avgLatencyMs: 500,
          totalCostUsd: 1.5,
          totalTokensIn: 10000,
          totalTokensOut: 5000,
        })
        .mockResolvedValueOnce({
          provider: AIProvider.ANTHROPIC,
          totalRequests: 50,
          successfulRequests: 40,
          failedRequests: 10,
          errorRate: 20,
          avgLatencyMs: 800,
          totalCostUsd: 2.0,
          totalTokensIn: 5000,
          totalTokensOut: 2500,
        })
        .mockResolvedValueOnce(null) // No data for GOOGLE

      const result = await metricsService.getProviderHealth(15)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        provider: AIProvider.OPENAI,
        status: 'healthy',
        errorRate: 5,
        avgLatencyMs: 500,
        recentErrorCount: 5,
        lastChecked: expect.any(Date),
      })
      expect(result[1]).toEqual({
        provider: AIProvider.ANTHROPIC,
        status: 'degraded', // 20% error rate
        errorRate: 20,
        avgLatencyMs: 800,
        recentErrorCount: 10,
        lastChecked: expect.any(Date),
      })
      expect(result[2].status).toBe('healthy') // No data = healthy
    })
  })

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', async () => {
      mockMetricsRepo.getProviderStats
        .mockResolvedValueOnce({
          provider: AIProvider.OPENAI,
          totalRequests: 100,
          successfulRequests: 95,
          failedRequests: 5,
          errorRate: 5,
          avgLatencyMs: 500,
          totalCostUsd: 1.5,
          totalTokensIn: 10000,
          totalTokensOut: 5000,
        })
        .mockResolvedValueOnce(null) // ANTHROPIC
        .mockResolvedValueOnce(null) // GOOGLE

      mockMetricsRepo.getModelStats.mockResolvedValue({
        model: ModelId.gpt_4o_mini,
        provider: AIProvider.OPENAI,
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        errorRate: 5,
        avgLatencyMs: 500,
        totalCostUsd: 1.5,
      })

      const result = await metricsService.getDashboardMetrics(24)

      expect(result).toHaveProperty('timeRange')
      expect(result).toHaveProperty('providers')
      expect(result).toHaveProperty('topModels')
      expect(result).toHaveProperty('overallStats')
      expect(result.overallStats.totalRequests).toBe(100)
      expect(result.overallStats.totalCost).toBe(1.5)
    })
  })

  describe('checkAlerts', () => {
    it('should return alerts when thresholds exceeded', async () => {
      mockMetricsRepo.getProviderStats.mockResolvedValue({
        provider: AIProvider.OPENAI,
        totalRequests: 100,
        successfulRequests: 80,
        failedRequests: 20,
        errorRate: 20,
        avgLatencyMs: 6000,
        totalCostUsd: 1.5,
        totalTokensIn: 10000,
        totalTokensOut: 5000,
      })

      const result = await metricsService.checkAlerts({
        errorRatePercent: 10,
        latencyMs: 5000,
        enabled: true,
      })

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('provider')
      expect(result[0]).toHaveProperty('reason')
      expect(result[0]).toHaveProperty('severity')
    })

    it('should return empty array when alerts disabled', async () => {
      const result = await metricsService.checkAlerts({
        errorRatePercent: 10,
        latencyMs: 5000,
        enabled: false,
      })

      expect(result).toEqual([])
    })
  })

  describe('getCostBreakdown', () => {
    it('should return cost breakdown sorted by cost', async () => {
      mockMetricsRepo.getModelStats
        .mockResolvedValueOnce({
          model: ModelId.gpt_4o,
          provider: AIProvider.OPENAI,
          totalRequests: 50,
          successfulRequests: 50,
          failedRequests: 0,
          errorRate: 0,
          avgLatencyMs: 1000,
          totalCostUsd: 5.0,
        })
        .mockResolvedValueOnce({
          model: ModelId.gpt_4o_mini,
          provider: AIProvider.OPENAI,
          totalRequests: 100,
          successfulRequests: 100,
          failedRequests: 0,
          errorRate: 0,
          avgLatencyMs: 500,
          totalCostUsd: 1.0,
        })
        .mockResolvedValueOnce(null)

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-02')

      const result = await metricsService.getCostBreakdown(startDate, endDate)

      expect(result.length).toBeGreaterThan(0)
      // Should be sorted by cost descending
      expect(result[0].cost).toBeGreaterThanOrEqual(
        result[result.length - 1].cost
      )
    })
  })
})
