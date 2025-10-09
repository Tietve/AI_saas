/**
 * Unit tests for QuotaService
 *
 * Tests business logic in isolation by mocking repositories.
 */

import 'reflect-metadata'
import { QuotaService } from '../quota.service'
import { UserRepository } from '@/repositories/user.repository'
import { TokenUsageRepository } from '@/repositories/token-usage.repository'
import { PlanTier, ModelId } from '@prisma/client'

// Mock repositories
jest.mock('@/repositories/user.repository')
jest.mock('@/repositories/token-usage.repository')

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logBillingEvent: jest.fn(),
}))

describe('QuotaService', () => {
  let quotaService: QuotaService
  let mockUserRepo: jest.Mocked<UserRepository>
  let mockTokenUsageRepo: jest.Mocked<TokenUsageRepository>

  beforeEach(() => {
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>
    mockTokenUsageRepo = new TokenUsageRepository() as jest.Mocked<TokenUsageRepository>
    quotaService = new QuotaService(mockUserRepo, mockTokenUsageRepo)
    jest.clearAllMocks()
  })

  describe('canSpend', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      emailLower: 'test@example.com',
      passwordHash: 'hashed',
      emailVerifiedAt: new Date(),
      planTier: PlanTier.FREE,
      monthlyTokenUsed: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should allow spending within quota limits', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const result = await quotaService.canSpend('user-123', 1000)

      expect(result.ok).toBe(true)
      expect(result.remaining).toBe(44000) // FREE limit is 50k, used 5k, spending 1k = 44k remaining
    })

    it('should reject when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null)

      const result = await quotaService.canSpend('user-123', 1000)

      expect(result.ok).toBe(false)
      expect(result.reason).toBe('NO_USER')
    })

    it('should reject when per-request limit exceeded', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const result = await quotaService.canSpend('user-123', 10_000) // Over FREE per-request limit of 8k

      expect(result.ok).toBe(false)
      expect(result.reason).toBe('PER_REQUEST_TOO_LARGE')
    })

    it('should reject when monthly limit would be exceeded', async () => {
      const nearLimitUser = { ...mockUser, monthlyTokenUsed: 49_000 }
      mockUserRepo.findById.mockResolvedValue(nearLimitUser)

      const result = await quotaService.canSpend('user-123', 2000) // Would exceed 50k limit

      expect(result.ok).toBe(false)
      expect(result.reason).toBe('OVER_LIMIT')
      expect(result.wouldExceedBy).toBe(1000) // 49k + 2k - 50k = 1k over
    })

    it('should allow PRO users higher limits', async () => {
      const proUser = { ...mockUser, planTier: PlanTier.PRO, monthlyTokenUsed: 500_000 }
      mockUserRepo.findById.mockResolvedValue(proUser)

      const result = await quotaService.canSpend('user-123', 30_000)

      expect(result.ok).toBe(true) // PRO limit is 1.5M, so 500k + 30k is OK
    })
  })

  describe('recordUsage', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      emailLower: 'test@example.com',
      passwordHash: 'hashed',
      emailVerifiedAt: new Date(),
      planTier: PlanTier.FREE,
      monthlyTokenUsed: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should record usage and update user token count', async () => {
      const updatedUser = { ...mockUser, monthlyTokenUsed: 6500 }

      mockTokenUsageRepo.findByRequestId.mockResolvedValue(null)
      mockTokenUsageRepo.create.mockResolvedValue({
        id: 'usage-123',
        userId: 'user-123',
        model: ModelId.gpt_4o_mini,
        tokensIn: 1000,
        tokensOut: 500,
        costUsd: 0.001,
        meta: {},
        createdAt: new Date(),
      })
      mockUserRepo.incrementTokenUsage.mockResolvedValue(updatedUser)

      const result = await quotaService.recordUsage({
        userId: 'user-123',
        model: ModelId.gpt_4o_mini,
        tokensIn: 1000,
        tokensOut: 500,
        costUsd: 0.001,
        meta: { requestId: 'req-123' },
      })

      expect(result.saved).toBe(true)
      expect(result.newMonthlyUsed).toBe(6500)
      expect(mockTokenUsageRepo.create).toHaveBeenCalled()
      expect(mockUserRepo.incrementTokenUsage).toHaveBeenCalledWith('user-123', 1500) // 1000 + 500
    })

    it('should skip duplicate requests', async () => {
      mockTokenUsageRepo.findByRequestId.mockResolvedValue({
        id: 'usage-123',
        userId: 'user-123',
        model: ModelId.gpt_4o_mini,
        tokensIn: 1000,
        tokensOut: 500,
        costUsd: 0.001,
        meta: { requestId: 'req-123' },
        createdAt: new Date(),
      })

      const result = await quotaService.recordUsage({
        userId: 'user-123',
        model: ModelId.gpt_4o_mini,
        tokensIn: 1000,
        tokensOut: 500,
        meta: { requestId: 'req-123' },
      })

      expect(result.saved).toBe(false)
      expect(mockTokenUsageRepo.create).not.toHaveBeenCalled()
      expect(mockUserRepo.incrementTokenUsage).not.toHaveBeenCalled()
    })
  })

  describe('getUsageSummary', () => {
    it('should return usage summary for user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailLower: 'test@example.com',
        passwordHash: 'hashed',
        emailVerifiedAt: new Date(),
        planTier: PlanTier.FREE,
        monthlyTokenUsed: 25000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepo.findById.mockResolvedValue(mockUser)

      const result = await quotaService.getUsageSummary('user-123')

      expect(result).toEqual({
        used: 25000,
        limit: 50000,
        remaining: 25000,
        percent: 50,
        plan: PlanTier.FREE,
      })
    })

    it('should return null when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null)

      const result = await quotaService.getUsageSummary('user-123')

      expect(result).toBeNull()
    })
  })

  describe('resetMonthlyQuotas', () => {
    it('should reset quotas for all users', async () => {
      mockUserRepo.resetMonthlyTokenUsage.mockResolvedValue(100)

      const count = await quotaService.resetMonthlyQuotas()

      expect(count).toBe(100)
      expect(mockUserRepo.resetMonthlyTokenUsage).toHaveBeenCalled()
    })
  })
})
