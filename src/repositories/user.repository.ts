/**
 * User Repository
 *
 * Handles all database operations related to users.
 * Isolates data access logic from business logic.
 * Includes Redis caching for performance optimization.
 */

import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { User, PlanTier, Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'
import { cacheGet, cacheDelete, CacheTTL, CacheKey } from '@/lib/redis'

export interface CreateUserInput {
  email: string
  passwordHash: string
  emailVerifiedAt?: Date | null
  planTier?: PlanTier
}

export interface UpdateUserInput {
  email?: string
  emailVerifiedAt?: Date
  planTier?: PlanTier
  monthlyTokenUsed?: number
}

export interface UserWithSubscription extends User {
  subscriptions: {
    id: string
    planTier: PlanTier
    status: string
    currentPeriodEnd: Date
  }[]
}

@injectable()
export class UserRepository {
  /**
   * Find user by ID (with Redis caching)
   */
  async findById(userId: string): Promise<User | null> {
    try {
      return await cacheGet(
        CacheKey.USER(userId),
        CacheTTL.MEDIUM, // 15 minutes
        async () => {
          return await prisma.user.findUnique({
            where: { id: userId },
          })
        }
      )
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find user by ID')
      throw error
    }
  }

  /**
   * Find user by email (with Redis caching)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const emailLower = email.toLowerCase()
      return await cacheGet(
        `user:email:${emailLower}`,
        CacheTTL.MEDIUM, // 15 minutes
        async () => {
          return await prisma.user.findUnique({
            where: { emailLower },
          })
        }
      )
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to find user by email')
      throw error
    }
  }

  /**
   * Find user with active subscription (with Redis caching)
   */
  async findByIdWithSubscription(userId: string): Promise<UserWithSubscription | null> {
    try {
      return await cacheGet(
        CacheKey.USER_SUBSCRIPTION(userId),
        CacheTTL.SHORT, // 5 minutes (shorter TTL for subscription data)
        async () => {
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
          }) as UserWithSubscription | null
        }
      )
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find user with subscription')
      throw error
    }
  }

  /**
   * Create new user
   */
  async create(data: CreateUserInput): Promise<User> {
    try {
      const emailLower = data.email.toLowerCase()

      return await prisma.user.create({
        data: {
          email: data.email,
          emailLower,
          passwordHash: data.passwordHash,
          emailVerifiedAt: data.emailVerifiedAt ?? null,
          planTier: data.planTier ?? 'FREE',
          monthlyTokenUsed: 0,
        },
      })
    } catch (error) {
      logger.error({ err: error, email: data.email }, 'Failed to create user')
      throw error
    }
  }

  /**
   * Update user (with cache invalidation)
   */
  async update(userId: string, data: UpdateUserInput): Promise<User> {
    try {
      const updateData: Prisma.UserUpdateInput = {}

      if (data.email) {
        updateData.email = data.email
        updateData.emailLower = data.email.toLowerCase()
      }
      if (data.emailVerifiedAt !== undefined) {
        updateData.emailVerifiedAt = data.emailVerifiedAt
      }
      if (data.planTier) {
        updateData.planTier = data.planTier
      }
      if (data.monthlyTokenUsed !== undefined) {
        updateData.monthlyTokenUsed = data.monthlyTokenUsed
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      // Invalidate cache
      await cacheDelete(CacheKey.USER(userId))
      await cacheDelete(CacheKey.USER_SUBSCRIPTION(userId))
      await cacheDelete(`user:email:${updatedUser.emailLower}`)

      return updatedUser
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to update user')
      throw error
    }
  }

  /**
   * Increment monthly token usage (with cache invalidation)
   */
  async incrementTokenUsage(userId: string, tokens: number): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          monthlyTokenUsed: {
            increment: tokens,
          },
        },
      })

      // Invalidate cache (token usage changes frequently, so clear it)
      await cacheDelete(CacheKey.USER(userId))
      await cacheDelete(CacheKey.USER_SUBSCRIPTION(userId))

      return updatedUser
    } catch (error) {
      logger.error({ err: error, userId, tokens }, 'Failed to increment token usage')
      throw error
    }
  }

  /**
   * Reset monthly token usage for all users
   */
  async resetMonthlyTokenUsage(): Promise<number> {
    try {
      const result = await prisma.user.updateMany({
        data: {
          monthlyTokenUsed: 0,
        },
      })

      return result.count
    } catch (error) {
      logger.error({ err: error }, 'Failed to reset monthly token usage')
      throw error
    }
  }

  /**
   * Delete user (cascade deletes related data)
   */
  async delete(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      })
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to delete user')
      throw error
    }
  }

  /**
   * Check if email is already taken
   */
  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return user !== null
  }

  /**
   * Get user count by plan tier
   */
  async countByPlanTier(): Promise<Record<PlanTier, number>> {
    try {
      const counts = await prisma.user.groupBy({
        by: ['planTier'],
        _count: true,
      })

      const result: Record<string, number> = {
        FREE: 0,
        PLUS: 0,
        PRO: 0,
      }

      counts.forEach((count: any) => {
        result[count.planTier] = count._count
      })

      return result as Record<PlanTier, number>
    } catch (error) {
      logger.error({ err: error }, 'Failed to count users by plan tier')
      throw error
    }
  }
}
