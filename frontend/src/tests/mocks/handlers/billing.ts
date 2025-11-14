/**
 * MSW Billing Handlers
 * Mocks billing, subscription, and payment endpoints
 */

import { http, HttpResponse, delay } from 'msw';
import {
  mockPlans,
  mockSubscriptions,
  mockUsageData,
  getPlanById,
  getSubscriptionByUserId,
  getUsageByUserId,
  type MockSubscription,
} from '../fixtures/plans';
import { getUserByToken } from '../fixtures/user';

const BASE_URL = '/api/billing';

// Helper to extract user from auth header
const getUserFromRequest = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  return getUserByToken(token);
};

// In-memory storage for subscriptions (resets on test restart)
const subscriptions = { ...mockSubscriptions };

export const billingHandlers = [
  // GET /api/billing/plans - Get all available plans
  http.get(`${BASE_URL}/plans`, async () => {
    await delay(100);

    return HttpResponse.json({
      plans: mockPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features,
        limits: plan.limits,
      })),
    });
  }),

  // GET /api/billing/subscription - Get user's current subscription
  http.get(`${BASE_URL}/subscription`, async ({ request }) => {
    await delay(100);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = getSubscriptionByUserId(user.id);

    if (!subscription) {
      return HttpResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const plan = getPlanById(subscription.planId);

    return HttpResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
          limits: plan.limits,
        } : null,
      },
    });
  }),

  // POST /api/billing/subscribe - Create or update subscription
  http.post(`${BASE_URL}/subscribe`, async ({ request }) => {
    await delay(150); // Simulate Stripe API call

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as { planId: string };
    const { planId } = body;

    if (!planId) {
      return HttpResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = getPlanById(planId);
    if (!plan) {
      return HttpResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Check if user already has a subscription
    let subscription = subscriptions[user.id];

    if (subscription) {
      // Update existing subscription
      subscription.planId = planId;
      subscription.status = 'active';
      subscription.cancelAtPeriodEnd = false;
      subscription.currentPeriodStart = new Date().toISOString();
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Create new subscription
      subscription = {
        id: `sub-${Date.now()}`,
        userId: user.id,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `sub_stripe_${Date.now()}`,
        stripeCustomerId: `cus_stripe_${Date.now()}`,
      };
      subscriptions[user.id] = subscription;
    }

    return HttpResponse.json(
      {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: {
            id: plan.id,
            name: plan.name,
            price: plan.price,
          },
        },
        message: 'Subscription created successfully',
      },
      { status: 201 }
    );
  }),

  // POST /api/billing/cancel - Cancel subscription
  http.post(`${BASE_URL}/cancel`, async ({ request }) => {
    await delay(100);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = subscriptions[user.id];

    if (!subscription) {
      return HttpResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Don't immediately cancel - set to cancel at period end
    subscription.cancelAtPeriodEnd = true;

    return HttpResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      message: 'Subscription will be canceled at the end of the current period',
    });
  }),

  // POST /api/billing/reactivate - Reactivate canceled subscription
  http.post(`${BASE_URL}/reactivate`, async ({ request }) => {
    await delay(100);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = subscriptions[user.id];

    if (!subscription) {
      return HttpResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.cancelAtPeriodEnd && subscription.status === 'active') {
      return HttpResponse.json(
        { error: 'Subscription is already active' },
        { status: 400 }
      );
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.status = 'active';

    return HttpResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      message: 'Subscription reactivated successfully',
    });
  }),

  // GET /api/billing/usage - Get user's billing usage statistics
  http.get(`${BASE_URL}/usage`, async ({ request }) => {
    await delay(50);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const usage = getUsageByUserId(user.id);

    if (!usage) {
      return HttpResponse.json(
        { error: 'Usage data not found' },
        { status: 404 }
      );
    }

    const plan = getPlanById(usage.planId);

    return HttpResponse.json({
      usage: {
        currentPeriod: usage.currentPeriod,
        limits: usage.limits,
        percentage: usage.percentage,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          limits: plan.limits,
        } : null,
      },
    });
  }),

  // GET /api/billing/invoices - Get user's billing history
  http.get(`${BASE_URL}/invoices`, async ({ request }) => {
    await delay(100);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = subscriptions[user.id];
    if (!subscription) {
      return HttpResponse.json({
        invoices: [],
      });
    }

    const plan = getPlanById(subscription.planId);

    // Generate mock invoices
    const invoices = [
      {
        id: 'inv-1',
        date: '2025-01-01T00:00:00.000Z',
        amount: plan?.price || 0,
        currency: 'usd',
        status: 'paid',
        pdfUrl: 'https://example.com/invoices/inv-1.pdf',
      },
      {
        id: 'inv-2',
        date: '2024-12-01T00:00:00.000Z',
        amount: plan?.price || 0,
        currency: 'usd',
        status: 'paid',
        pdfUrl: 'https://example.com/invoices/inv-2.pdf',
      },
    ];

    return HttpResponse.json({
      invoices,
    });
  }),

  // Error scenarios
  // POST /api/billing/subscribe with payment failure
  http.post(`${BASE_URL}/subscribe/error`, async ({ request }) => {
    await delay(150);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      { error: 'Payment failed. Please check your card details.' },
      { status: 402 }
    );
  }),

  // GET /api/billing/subscription for user without subscription
  http.get(`${BASE_URL}/subscription/none`, async ({ request }) => {
    await delay(50);

    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      { error: 'No active subscription found' },
      { status: 404 }
    );
  }),
];
