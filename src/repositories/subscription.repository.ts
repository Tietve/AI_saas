/**
 * Subscription Repository
 *
 * Handles all database operations related to subscriptions.
 */

import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { Subscription, SubscriptionStatus, PlanTier } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface CreateSubscriptionInput {
  userId: string
  planTier: PlanTier
  currentPeriodStart: Date
  currentPeriodEnd: Date
  payosSubscriptionId?: string
}

@injectable()
export class SubscriptionRepository {
  /**
   * Find subscription by ID
   */
  async findById(subscriptionId: string): Promise<Subscription | null> {
    try {
      return await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      })
    } catch (error) {
      logger.error({ err: error, subscriptionId }, 'Failed to find subscription')
      throw error
    }
  }

  /**
   * Find active subscription for user
   */
  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    try {
      return await prisma.subscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find active subscription')
      throw error
    }
  }

  /**
   * Find all user subscriptions
   */
  async findByUserId(userId: string): Promise<Subscription[]> {
    try {
      return await prisma.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find user subscriptions')
      throw error
    }
  }

  /**
   * Create subscription
   */
  async create(data: CreateSubscriptionInput): Promise<Subscription> {
    try {
      return await prisma.subscription.create({
        data: {
          userId: data.userId,
          planTier: data.planTier,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          payosSubscriptionId: data.payosSubscriptionId,
        },
      })
    } catch (error) {
      logger.error({ err: error, userId: data.userId }, 'Failed to create subscription')
      throw error
    }
  }

  /**
   * Update subscription status
   */
  async updateStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ): Promise<Subscription> {
    try {
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status,
          canceledAt: status === SubscriptionStatus.CANCELLED ? new Date() : undefined,
        },
      })
    } catch (error) {
      logger.error({ err: error, subscriptionId, status }, 'Failed to update subscription status')
      throw error
    }
  }

  /**
   * Mark subscription for cancellation at period end
   */
  async cancelAtPeriodEnd(subscriptionId: string): Promise<Subscription> {
    try {
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
        },
      })
    } catch (error) {
      logger.error({ err: error, subscriptionId }, 'Failed to mark subscription for cancellation')
      throw error
    }
  }

  /**
   * Find expired subscriptions
   */
  async findExpired(): Promise<Subscription[]> {
    try {
      const now = new Date()

      return await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { lte: now },
          cancelAtPeriodEnd: false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to find expired subscriptions')
      throw error
    }
  }

  /**
   * Delete subscription
   */
  async delete(subscriptionId: string): Promise<void> {
    try {
      await prisma.subscription.delete({
        where: { id: subscriptionId },
      })
    } catch (error) {
      logger.error({ err: error, subscriptionId }, 'Failed to delete subscription')
      throw error
    }
  }
}
