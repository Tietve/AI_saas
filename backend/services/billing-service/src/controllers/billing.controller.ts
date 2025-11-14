import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { billingService } from '../services/billing.service';
import { EventPublisher } from '../shared/events';
import { BillingEventType } from '../shared/events/types';
import { config } from '../config/env';

export class BillingController {
  /**
   * POST /api/subscribe
   * Create subscription
   */
  async createSubscription(req: AuthRequest, res: Response) {
    try {
      const { planTier, paymentMethodId } = req.body;

      if (!planTier || !paymentMethodId) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: planTier, paymentMethodId'
        });
      }

      if (!['PLUS', 'PRO'].includes(planTier)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid plan tier. Must be PLUS or PRO'
        });
      }

      const result = await billingService.createSubscription({
        userId: req.userId!,
        planTier,
        paymentMethodId
      });

      // Publish billing events to analytics (non-blocking)
      try {
        const amount = planTier === 'PLUS' ? config.PLAN_PLUS_PRICE : config.PLAN_PRO_PRICE;

        // Subscription created event
        await EventPublisher.getInstance().publishBillingEvent({
          event_type: BillingEventType.SUBSCRIPTION_CREATED,
          user_id: req.userId!,
          plan_tier: planTier,
          amount: amount,
          currency: 'VND',
          subscription_id: result.subscription.id
        });

        // Payment success event
        await EventPublisher.getInstance().publishBillingEvent({
          event_type: BillingEventType.PAYMENT_SUCCESS,
          user_id: req.userId!,
          plan_tier: planTier,
          amount: amount,
          currency: 'VND',
          subscription_id: result.subscription.id
        });
      } catch (eventError) {
        console.error('[createSubscription] Failed to publish event:', eventError);
        // Don't fail the request if event publishing fails
      }

      return res.json({
        ok: true,
        subscription: result.subscription,
        clientSecret: result.clientSecret
      });
    } catch (error: any) {
      console.error('[BillingController] createSubscription error:', error);
      return res.status(400).json({
        ok: false,
        error: error.message || 'Failed to create subscription'
      });
    }
  }

  /**
   * POST /api/cancel
   * Cancel subscription
   */
  async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const { immediate } = req.body;

      await billingService.cancelSubscription(req.userId!, immediate === true);

      // Publish cancellation event to analytics (non-blocking)
      try {
        await EventPublisher.getInstance().publishBillingEvent({
          event_type: BillingEventType.SUBSCRIPTION_CANCELLED,
          user_id: req.userId!,
          metadata: { cancel_immediately: immediate === true }
        });
      } catch (eventError) {
        console.error('[cancelSubscription] Failed to publish event:', eventError);
        // Don't fail the request if event publishing fails
      }

      return res.json({
        ok: true,
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at period end'
      });
    } catch (error: any) {
      console.error('[BillingController] cancelSubscription error:', error);
      return res.status(400).json({
        ok: false,
        error: error.message || 'Failed to cancel subscription'
      });
    }
  }

  /**
   * GET /api/subscription
   * Get current subscription
   */
  async getSubscription(req: AuthRequest, res: Response) {
    try {
      const subscription = await billingService.getUserSubscription(req.userId!);

      return res.json({
        ok: true,
        subscription
      });
    } catch (error: any) {
      console.error('[BillingController] getSubscription error:', error);
      return res.status(400).json({
        ok: false,
        error: error.message || 'Failed to get subscription'
      });
    }
  }

  /**
   * GET /api/usage
   * Get usage information
   */
  async getUsage(req: AuthRequest, res: Response) {
    try {
      const usage = await billingService.getUserUsage(req.userId!);

      return res.json({
        ok: true,
        usage
      });
    } catch (error: any) {
      console.error('[BillingController] getUsage error:', error);
      return res.status(400).json({
        ok: false,
        error: error.message || 'Failed to get usage'
      });
    }
  }

  /**
   * GET /api/payments
   * Get payment history
   */
  async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const payments = await billingService.getPaymentHistory(req.userId!, limit);

      return res.json({
        ok: true,
        payments
      });
    } catch (error: any) {
      console.error('[BillingController] getPaymentHistory error:', error);
      return res.status(400).json({
        ok: false,
        error: error.message || 'Failed to get payment history'
      });
    }
  }

  /**
   * GET /api/plans
   * Get plan information (prices and quotas)
   */
  async getPlans(req: AuthRequest, res: Response) {
    try {
      const prices = billingService.getPlanPrices();
      const quotas = billingService.getPlanQuotas();

      return res.json({
        ok: true,
        plans: {
          FREE: {
            price: 0,
            quota: quotas.FREE,
            features: ['Basic chat', 'Limited tokens', 'Community support']
          },
          PLUS: {
            price: prices.PLUS,
            quota: quotas.PLUS,
            features: ['Priority chat', 'Extended tokens', 'Email support', 'GPT-4 access']
          },
          PRO: {
            price: prices.PRO,
            quota: quotas.PRO,
            features: ['Unlimited chat', 'Maximum tokens', 'Priority support', 'All AI models', 'API access']
          }
        }
      });
    } catch (error: any) {
      console.error('[BillingController] getPlans error:', error);
      return res.status(400).json({
        ok: false,
        error: error.message || 'Failed to get plans'
      });
    }
  }
}

export const billingController = new BillingController();
