import { PrismaClient, PlanTier, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export class SubscriptionRepository {
  /**
   * Create subscription
   */
  async create(data: {
    userId: string;
    planTier: PlanTier;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    return await prisma.subscriptions.create({
      data: {
        ...data,
        id: randomUUID(),
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get active subscription by user ID
   */
  async getActiveByUserId(userId: string) {
    return await prisma.subscriptions.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getByStripeId(stripeSubscriptionId: string) {
    return await prisma.subscriptions.findUnique({
      where: {
        stripeSubscriptionId
      }
    });
  }

  /**
   * Update subscription status
   */
  async updateStatus(id: string, status: SubscriptionStatus) {
    return await prisma.subscriptions.update({
      where: { id },
      data: { status }
    });
  }

  /**
   * Cancel subscription
   */
  async cancel(id: string, cancelAtPeriodEnd: boolean = true) {
    return await prisma.subscriptions.update({
      where: { id },
      data: {
        cancelAtPeriodEnd,
        canceledAt: new Date(),
        ...(cancelAtPeriodEnd ? {} : { status: 'CANCELED' })
      }
    });
  }

  /**
   * Update subscription period
   */
  async updatePeriod(id: string, currentPeriodStart: Date, currentPeriodEnd: Date) {
    return await prisma.subscriptions.update({
      where: { id },
      data: {
        currentPeriodStart,
        currentPeriodEnd
      }
    });
  }

  /**
   * Get all user subscriptions
   */
  async getAllByUserId(userId: string) {
    return await prisma.subscriptions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
