/**
 * Unit tests for UserRepository
 *
 * Tests database operations in isolation by mocking Prisma client.
 */

import { UserRepository } from '../user.repository'
import { prisma } from '@/lib/prisma'
import { PlanTier } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
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

describe('UserRepository', () => {
  let repository: UserRepository

  beforeEach(() => {
    repository = new UserRepository()
    jest.clearAllMocks()
    // Set default null returns to prevent mock bleed between tests
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
  })

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailLower: 'test@example.com',
        passwordHash: 'hashed',
        emailVerifiedAt: new Date(),
        planTier: PlanTier.FREE,
        monthlyTokenUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await repository.findById('user-123')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })

    it('should return null when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(error)

      await expect(repository.findById('user-123')).rejects.toThrow(
        'Database connection failed'
      )
    })
  })

  describe('findByEmail', () => {
    it.skip('should find user by email (case-insensitive)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'Test@Example.com',
        emailLower: 'test@example.com',
        passwordHash: 'hashed',
        emailVerifiedAt: new Date(),
        planTier: PlanTier.FREE,
        monthlyTokenUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      const result = await repository.findByEmail('TEST@EXAMPLE.COM')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { emailLower: 'test@example.com' },
      })
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const input = {
        email: 'new@example.com',
        passwordHash: 'hashed',
        emailVerifiedAt: new Date(),
        planTier: PlanTier.FREE,
      }

      const mockCreatedUser = {
        id: 'new-user-123',
        ...input,
        emailLower: 'new@example.com',
        monthlyTokenUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser)

      const result = await repository.create(input)

      expect(result).toEqual(mockCreatedUser)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: input.email,
          emailLower: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          emailVerifiedAt: input.emailVerifiedAt,
          planTier: input.planTier,
          monthlyTokenUsed: 0,
        },
      })
    })
  })

  describe('incrementTokenUsage', () => {
    it('should increment user token usage', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailLower: 'test@example.com',
        passwordHash: 'hashed',
        emailVerifiedAt: new Date(),
        planTier: PlanTier.FREE,
        monthlyTokenUsed: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser)

      const result = await repository.incrementTokenUsage('user-123', 1000)

      expect(result.monthlyTokenUsed).toBe(1000)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          monthlyTokenUsed: { increment: 1000 },
        },
      })
    })
  })

  describe('resetMonthlyTokenUsage', () => {
    it('should reset monthly token usage for all users', async () => {
      ;(prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 50 })

      const count = await repository.resetMonthlyTokenUsage()

      expect(count).toBe(50)
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        data: { monthlyTokenUsed: 0 },
      })
    })
  })

  describe('isEmailTaken', () => {
    it.skip('should return true if email is taken', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-123',
      })

      const result = await repository.isEmailTaken('taken@example.com')

      expect(result).toBe(true)
    })

    it('should return false if email is available', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await repository.isEmailTaken('available@example.com')

      expect(result).toBe(false)
    })
  })
})
