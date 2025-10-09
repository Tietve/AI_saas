/**
 * Unit tests for ProviderMetricsRepository
 *
 * Tests database operations for provider metrics tracking in isolation.
 */

import { ProviderMetricsRepository } from '../provider-metrics.repository'
import { prisma } from '@/lib/prisma'
import { AIProvider, ModelId } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    providerMetrics: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('ProviderMetricsRepository', () => {
  let repository: ProviderMetricsRepository

  beforeEach(() => {
    repository = new ProviderMetricsRepository()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new metric entry', async () => {
      const mockMetric = {
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
      }

      ;(prisma.providerMetrics.create as jest.Mock).mockResolvedValue(
        mockMetric
      )

      const result = await repository.create({
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

      expect(result).toEqual(mockMetric)
      expect(prisma.providerMetrics.create).toHaveBeenCalledWith({
        data: {
          provider: AIProvider.OPENAI,
          model: ModelId.gpt_4o_mini,
          latencyMs: 500,
          costUsd: 0.001,
          success: true,
          errorCode: undefined,
          errorMessage: undefined,
          userId: 'user-123',
          requestId: 'req-123',
          tokensIn: 100,
          tokensOut: 50,
        },
      })
    })

    it('should create metric with error information', async () => {
      const mockMetric = {
        id: 'metric-123',
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o,
        latencyMs: 1000,
        costUsd: 0,
        success: false,
        errorCode: 'RATE_LIMIT',
        errorMessage: 'Rate limit exceeded',
        userId: 'user-123',
        requestId: 'req-456',
        tokensIn: null,
        tokensOut: null,
        createdAt: new Date(),
      }

      ;(prisma.providerMetrics.create as jest.Mock).mockResolvedValue(
        mockMetric
      )

      const result = await repository.create({
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o,
        latencyMs: 1000,
        success: false,
        errorCode: 'RATE_LIMIT',
        errorMessage: 'Rate limit exceeded',
        userId: 'user-123',
        requestId: 'req-456',
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('RATE_LIMIT')
    })
  })

  describe('findByRequestId', () => {
    it('should find metric by request ID', async () => {
      const mockMetric = {
        id: 'metric-123',
        requestId: 'req-123',
        provider: AIProvider.OPENAI,
        model: ModelId.gpt_4o_mini,
        latencyMs: 500,
        costUsd: 0.001,
        success: true,
        errorCode: null,
        errorMessage: null,
        userId: 'user-123',
        tokensIn: 100,
        tokensOut: 50,
        createdAt: new Date(),
      }

      ;(prisma.providerMetrics.findFirst as jest.Mock).mockResolvedValue(
        mockMetric
      )

      const result = await repository.findByRequestId('req-123')

      expect(result).toEqual(mockMetric)
      expect(prisma.providerMetrics.findFirst).toHaveBeenCalledWith({
        where: { requestId: 'req-123' },
      })
    })

    it('should return null if not found', async () => {
      ;(prisma.providerMetrics.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await repository.findByRequestId('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getProviderStats', () => {
    it('should return aggregated provider statistics', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-02')

      ;(prisma.providerMetrics.aggregate as jest.Mock).mockResolvedValue({
        _count: { id: 100 },
        _avg: { latencyMs: 500 },
        _sum: { costUsd: 1.5, tokensIn: 10000, tokensOut: 5000 },
      })

      ;(prisma.providerMetrics.count as jest.Mock).mockResolvedValue(90)

      const result = await repository.getProviderStats(
        AIProvider.OPENAI,
        startDate,
        endDate
      )

      expect(result).toEqual({
        provider: AIProvider.OPENAI,
        totalRequests: 100,
        successfulRequests: 90,
        failedRequests: 10,
        errorRate: 10,
        avgLatencyMs: 500,
        totalCostUsd: 1.5,
        totalTokensIn: 10000,
        totalTokensOut: 5000,
      })
    })

    it('should return null when no data', async () => {
      ;(prisma.providerMetrics.aggregate as jest.Mock).mockResolvedValue({
        _count: { id: 0 },
        _avg: { latencyMs: null },
        _sum: { costUsd: null, tokensIn: null, tokensOut: null },
      })

      const result = await repository.getProviderStats(
        AIProvider.OPENAI,
        new Date(),
        new Date()
      )

      expect(result).toBeNull()
    })
  })

  describe('getRecentErrors', () => {
    it('should return recent error metrics', async () => {
      const mockErrors = [
        {
          id: 'metric-1',
          provider: AIProvider.OPENAI,
          model: ModelId.gpt_4o,
          success: false,
          errorCode: 'TIMEOUT',
          errorMessage: 'Request timeout',
          latencyMs: 30000,
          costUsd: 0,
          userId: null,
          requestId: null,
          tokensIn: null,
          tokensOut: null,
          createdAt: new Date(),
        },
      ]

      ;(prisma.providerMetrics.findMany as jest.Mock).mockResolvedValue(
        mockErrors
      )

      const result = await repository.getRecentErrors(AIProvider.OPENAI, 10)

      expect(result).toEqual(mockErrors)
      expect(prisma.providerMetrics.findMany).toHaveBeenCalledWith({
        where: {
          success: false,
          provider: AIProvider.OPENAI,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })
  })

  describe('getLatencyPercentiles', () => {
    it('should calculate latency percentiles', async () => {
      const latencies = Array.from({ length: 100 }, (_, i) => ({
        latencyMs: (i + 1) * 10,
      }))

      ;(prisma.providerMetrics.findMany as jest.Mock).mockResolvedValue(
        latencies
      )

      const result = await repository.getLatencyPercentiles(AIProvider.OPENAI)

      expect(result).toBeDefined()
      expect(result?.p50).toBe(510) // index 50 = 51st value * 10
      expect(result?.p95).toBe(960) // index 95 = 96th value * 10
      expect(result?.p99).toBe(1000) // index 99 = 100th value * 10
    })

    it('should return null when no data', async () => {
      ;(prisma.providerMetrics.findMany as jest.Mock).mockResolvedValue([])

      const result = await repository.getLatencyPercentiles(AIProvider.OPENAI)

      expect(result).toBeNull()
    })
  })
})
