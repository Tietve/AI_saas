/**
 * Authentication setup for billing E2E tests
 * This file provides utilities to authenticate users for testing
 */

import { Page } from '@playwright/test';

/**
 * Mock authentication tokens for testing
 * In a real scenario, these would be obtained from a test login
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#',
  userId: 'test-user-id',
};

/**
 * Setup authenticated session for testing
 * This function simulates an authenticated user by setting localStorage tokens
 */
export async function setupAuthenticatedSession(page: Page) {
  // Navigate to the app first
  await page.goto('/');

  // Mock authentication tokens in localStorage
  await page.evaluate(() => {
    localStorage.setItem('auth_token', 'mock-jwt-token-for-testing');
    localStorage.setItem('refresh_token', 'mock-refresh-token-for-testing');
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
    }));
  });

  // Reload to apply authentication
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Login via UI (if needed for integration testing)
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);

  // Submit form
  await page.click('button[type="submit"], button:has-text("Login")');

  // Wait for navigation
  await page.waitForLoadState('networkidle');
}

/**
 * Mock API responses for billing endpoints
 */
export async function mockBillingAPIs(page: Page) {
  // Mock plans API
  await page.route('**/api/billing/plans', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'plan-free',
          name: 'Free',
          tier: 'free',
          price: 0,
          currency: 'usd',
          interval: 'month',
          tokenLimit: 10000,
          features: [
            '10,000 tokens/month',
            'Basic chat features',
            'Email support',
          ],
          popular: false,
        },
        {
          id: 'plan-plus',
          name: 'Plus',
          tier: 'plus',
          price: 19.99,
          currency: 'usd',
          interval: 'month',
          tokenLimit: 100000,
          features: [
            '100,000 tokens/month',
            'Advanced chat features',
            'Priority support',
            'Custom integrations',
          ],
          popular: true,
        },
        {
          id: 'plan-pro',
          name: 'Pro',
          tier: 'pro',
          price: 49.99,
          currency: 'usd',
          interval: 'month',
          tokenLimit: 500000,
          features: [
            '500,000 tokens/month',
            'All Plus features',
            'Dedicated support',
            'API access',
            'Custom models',
          ],
          popular: false,
        },
      ]),
    });
  });

  // Mock subscription API
  await page.route('**/api/billing/subscription', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'sub-123',
        userId: 'test-user-id',
        planId: 'plan-free',
        tier: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  });

  // Mock usage API
  await page.route('**/api/billing/usage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tokensUsed: 3500,
        tokenLimit: 10000,
        percentUsed: 35,
        resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });

  // Mock payment history API
  await page.route('**/api/billing/payments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'pay-1',
          userId: 'test-user-id',
          subscriptionId: 'sub-123',
          amount: 19.99,
          currency: 'usd',
          status: 'succeeded',
          paymentMethod: 'card',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'pay-2',
          userId: 'test-user-id',
          subscriptionId: 'sub-123',
          amount: 19.99,
          currency: 'usd',
          status: 'succeeded',
          paymentMethod: 'card',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]),
    });
  });
}

/**
 * Mock subscription for a specific plan
 */
export async function mockSubscriptionForPlan(page: Page, tier: 'free' | 'plus' | 'pro') {
  const subscriptionData = {
    free: {
      planId: 'plan-free',
      tokenLimit: 10000,
    },
    plus: {
      planId: 'plan-plus',
      tokenLimit: 100000,
    },
    pro: {
      planId: 'plan-pro',
      tokenLimit: 500000,
    },
  };

  await page.route('**/api/billing/subscription', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'sub-123',
        userId: 'test-user-id',
        planId: subscriptionData[tier].planId,
        tier,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/billing/usage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tokensUsed: 3500,
        tokenLimit: subscriptionData[tier].tokenLimit,
        percentUsed: (3500 / subscriptionData[tier].tokenLimit) * 100,
        resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });
}
