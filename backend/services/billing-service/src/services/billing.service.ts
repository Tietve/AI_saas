import { PrismaClient, PlanTier } from '@prisma/client';
import { stripeService } from './stripe.service';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { config } from '../config/env';
import {
  SubscriptionInfo,
  UsageInfo,
  PaymentHistoryItem,
  CreateSubscriptionData
} from '../types';

const prisma = new PrismaClient();

export class BillingService {
  /**
   * Create subscription for user
   */
  async createSubscription(data: CreateSubscriptionData): Promise<{
    subscription: SubscriptionInfo;
    clientSecret: string | null;
  }> {
    const { userId, planTier, paymentMethodId } = data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has active subscription
    const existingSubscription = await subscriptionRepository.getActiveByUserId(userId);
    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Create or get Stripe customer
    let stripeCustomerId: string;

    if (stripeService.isMockMode()) {
      stripeCustomerId = `cus_mock_${userId}`;
    } else {
      stripeCustomerId = await stripeService.createCustomer(user.email, userId);
    }

    // Get price ID for plan
    const priceId = stripeService.getPriceIdForPlan(planTier);

    // Create Stripe subscription
    const { subscriptionId, clientSecret } = await stripeService.createSubscription(
      stripeCustomerId,
      priceId,
      paymentMethodId
    );

    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Create subscription in database
    const subscription = await subscriptionRepository.create({
      userId,
      planTier,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId,
      currentPeriodStart,
      currentPeriodEnd
    });

    // Update user plan tier
    await prisma.user.update({
      where: { id: userId },
      data: { planTier }
    });

    // Create payment record
    const amount = planTier === 'PLUS' ? config.PLAN_PLUS_PRICE : config.PLAN_PRO_PRICE;
    await paymentRepository.create({
      userId,
      stripePaymentId: stripeService.isMockMode() ? `pi_mock_${Date.now()}` : undefined,
      amount,
      planTier,
      description: `${planTier} plan subscription`,
      status: 'SUCCEEDED'
    });

    return {
      subscription: {
        id: subscription.id,
        planTier: subscription.planTier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId
      },
      clientSecret
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, cancelImmediately: boolean = false): Promise<void> {
    const subscription = await subscriptionRepository.getActiveByUserId(userId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Cancel in Stripe
    if (subscription.stripeSubscriptionId && !stripeService.isMockMode()) {
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId, cancelImmediately);
    }

    // Update in database
    await subscriptionRepository.cancel(subscription.id, !cancelImmediately);

    // If immediate cancellation, downgrade to FREE
    if (cancelImmediately) {
      await prisma.user.update({
        where: { id: userId },
        data: { planTier: 'FREE' }
      });
    }
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    const subscription = await subscriptionRepository.getActiveByUserId(userId);

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      planTier: subscription.planTier,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId
    };
  }

  /**
   * Get user usage information
   */
  async getUserUsage(userId: string): Promise<UsageInfo> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const quotas: Record<PlanTier, number> = {
      FREE: config.QUOTA_FREE,
      PLUS: config.QUOTA_PLUS,
      PRO: config.QUOTA_PRO
    };

    const monthlyQuota = quotas[user.planTier];
    const monthlyUsed = user.monthlyTokenUsed;
    const percentageUsed = (monthlyUsed / monthlyQuota) * 100;
    const remaining = Math.max(0, monthlyQuota - monthlyUsed);

    return {
      userId: user.id,
      planTier: user.planTier,
      monthlyQuota,
      monthlyUsed,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      remaining
    };
  }

  /**
   * Check if user can use tokens
   */
  async canUseTokens(userId: string, tokensNeeded: number): Promise<boolean> {
    const usage = await this.getUserUsage(userId);
    return usage.remaining >= tokensNeeded;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string, limit: number = 10): Promise<PaymentHistoryItem[]> {
    return await paymentRepository.getUserPayments(userId, limit);
  }

  /**
   * Get plan prices
   */
  getPlanPrices() {
    return {
      PLUS: config.PLAN_PLUS_PRICE,
      PRO: config.PLAN_PRO_PRICE
    };
  }

  /**
   * Get plan quotas
   */
  getPlanQuotas() {
    return {
      FREE: config.QUOTA_FREE,
      PLUS: config.QUOTA_PLUS,
      PRO: config.QUOTA_PRO
    };
  }
}

export const billingService = new BillingService();
