import Stripe from 'stripe';
import { config } from '../config/env';

export class StripeService {
  private stripe: Stripe | null = null;
  private useMock: boolean;

  constructor() {
    // Check if we have a valid Stripe key
    this.useMock = !config.STRIPE_SECRET_KEY ||
                   config.STRIPE_SECRET_KEY.includes('sk_test_your-') ||
                   config.STRIPE_SECRET_KEY === 'sk_mock_key';

    if (this.useMock) {
      console.warn('[StripeService] No valid Stripe key. Using MOCK mode.');
    } else {
      this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(email: string, userId: string): Promise<string> {
    if (this.useMock) {
      return `cus_mock_${userId}`;
    }

    const customer = await this.stripe!.customers.create({
      email,
      metadata: { userId }
    });

    return customer.id;
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId: string
  ): Promise<{ subscriptionId: string; clientSecret: string | null }> {
    if (this.useMock) {
      return {
        subscriptionId: `sub_mock_${Date.now()}`,
        clientSecret: null
      };
    }

    // Attach payment method to customer
    await this.stripe!.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Set as default payment method
    await this.stripe!.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Create subscription
    const subscription = await this.stripe!.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || null
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelImmediately: boolean = false): Promise<void> {
    if (this.useMock) {
      console.log(`[MOCK] Canceling subscription: ${subscriptionId}`);
      return;
    }

    if (cancelImmediately) {
      await this.stripe!.subscriptions.cancel(subscriptionId);
    } else {
      await this.stripe!.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }
  }

  /**
   * Get Stripe price ID for plan
   */
  getPriceIdForPlan(planTier: 'PLUS' | 'PRO'): string {
    if (this.useMock) {
      return `price_mock_${planTier.toLowerCase()}`;
    }

    // In production, these would be actual Stripe Price IDs
    // For now, we'll need to create them in Stripe Dashboard
    const priceIds: Record<string, string> = {
      PLUS: process.env.STRIPE_PRICE_ID_PLUS || 'price_plus',
      PRO: process.env.STRIPE_PRICE_ID_PRO || 'price_pro'
    };

    return priceIds[planTier];
  }

  /**
   * Verify webhook signature
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    if (this.useMock) {
      return JSON.parse(payload.toString()) as Stripe.Event;
    }

    return this.stripe!.webhooks.constructEvent(
      payload,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );
  }

  /**
   * Check if using mock mode
   */
  isMockMode(): boolean {
    return this.useMock;
  }
}

export const stripeService = new StripeService();
