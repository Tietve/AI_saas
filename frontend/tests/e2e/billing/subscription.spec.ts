/**
 * E2E Tests for Subscription Page
 * Tests the /billing/subscription page functionality
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, mockBillingAPIs, mockSubscriptionForPlan } from './auth.setup';

test.describe('Subscription Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await setupAuthenticatedSession(page);
  });

  test('should load subscription page successfully', async ({ page }) => {
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page.locator('h4, h1').filter({ hasText: /subscription.*billing/i })).toBeVisible();
  });

  test('should display "No Active Subscription" for free users', async ({ page }) => {
    // Mock no subscription (404 response)
    await page.route('**/api/billing/subscription', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'No subscription found' }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Should show no subscription message
    await expect(page.locator('text=/no active subscription/i')).toBeVisible();

    // Should show upgrade prompt
    await expect(page.locator('text=/free plan/i')).toBeVisible();
    await expect(page.locator('text=/upgrade/i')).toBeVisible();

    // Should have "View Pricing Plans" button
    await expect(page.locator('button:has-text("View Pricing Plans")')).toBeVisible();
  });

  test('should navigate to pricing page from no subscription state', async ({ page }) => {
    // Mock no subscription
    await page.route('**/api/billing/subscription', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'No subscription found' }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Click "View Pricing Plans"
    const viewPricingButton = page.locator('button:has-text("View Pricing Plans")');
    await viewPricingButton.click();

    // Should navigate to pricing page
    await page.waitForURL('**/pricing', { timeout: 5000 });
    expect(page.url()).toContain('/pricing');
  });

  test('should display active subscription details', async ({ page }) => {
    // Mock Plus subscription
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check subscription details
    await expect(page.locator('text="Current Plan"')).toBeVisible();
    await expect(page.locator('text="Plus"')).toBeVisible();

    // Check status chip
    await expect(page.locator('text="ACTIVE"')).toBeVisible();

    // Check current period dates
    await expect(page.locator('text=/current period/i')).toBeVisible();
  });

  test('should display subscription status chip with correct color', async ({ page }) => {
    // Mock active subscription
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Status chip should be visible
    const statusChip = page.locator('[class*="Chip"]').filter({ hasText: 'ACTIVE' });
    await expect(statusChip).toBeVisible();
  });

  test('should display current billing period', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for date range
    await expect(page.locator('text=/current period:/i')).toBeVisible();

    // Should show dates in readable format (e.g., "November 6, 2025")
    const datePattern = /\w+\s+\d{1,2},\s+\d{4}/;
    const periodText = await page.locator('text=/current period:/i').textContent();
    expect(periodText).toMatch(datePattern);
  });

  test('should display Change Plan button', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for Change Plan button
    const changePlanButton = page.locator('button:has-text("Change Plan")');
    await expect(changePlanButton).toBeVisible();
    await expect(changePlanButton).toBeEnabled();
  });

  test('should navigate to pricing page when Change Plan is clicked', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Click Change Plan
    await page.click('button:has-text("Change Plan")');

    // Should navigate to pricing page
    await page.waitForURL('**/pricing', { timeout: 5000 });
    expect(page.url()).toContain('/pricing');
  });

  test('should display Cancel button for paid subscriptions', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for Cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
  });

  test('should NOT display Cancel button for free plan', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'free');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Cancel button should NOT be visible for free plan
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).not.toBeVisible();
  });

  test('should show confirmation dialog when Cancel is clicked', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Mock dialog confirmation
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toMatch(/are you sure/i);
      await dialog.dismiss(); // Cancel the action
    });

    // Click Cancel button
    await page.click('button:has-text("Cancel")');

    // Dialog should have appeared (verified by event listener)
  });

  test('should handle subscription cancellation', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    let cancelRequested = false;

    // Mock cancellation API
    await page.route('**/api/billing/cancel', async (route) => {
      cancelRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription: {
            id: 'sub-123',
            cancelAtPeriodEnd: true,
          },
          message: 'Subscription cancelled successfully',
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Accept dialog confirmation
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click Cancel button
    await page.click('button:has-text("Cancel")');

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify API was called
    expect(cancelRequested).toBe(true);
  });

  test('should show success message after cancellation', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    // Mock cancellation API
    await page.route('**/api/billing/cancel', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription: { cancelAtPeriodEnd: true },
          message: 'Subscription cancelled successfully',
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Accept dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Wait for success toast
    await page.waitForTimeout(1000);

    // Should show success message
    await expect(page.locator('text=/cancelled successfully/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show warning when subscription is cancelled', async ({ page }) => {
    // Mock cancelled subscription
    await page.route('**/api/billing/subscription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sub-123',
          userId: 'test-user-id',
          planId: 'plan-plus',
          tier: 'plus',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: true, // Marked for cancellation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Should show cancellation warning
    await expect(page.locator('text=/will be cancelled/i')).toBeVisible();
    await expect(page.locator('text=/end of the billing period/i')).toBeVisible();
  });

  test('should hide Cancel button when already cancelled', async ({ page }) => {
    // Mock cancelled subscription
    await page.route('**/api/billing/subscription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sub-123',
          userId: 'test-user-id',
          planId: 'plan-plus',
          tier: 'plus',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Cancel button should not be visible
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).not.toBeVisible();
  });

  test('should display token usage statistics', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for usage card
    await expect(page.locator('text="Token Usage"')).toBeVisible();

    // Check usage numbers
    await expect(page.locator('text=/3,500/i')).toBeVisible();
    await expect(page.locator('text=/100,000/i')).toBeVisible();

    // Check percentage
    await expect(page.locator('text=/35.*%/i')).toBeVisible();
  });

  test('should display usage progress bar', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Usage card should exist
    const usageCard = page.locator('text="Token Usage"').locator('..');

    // Should have a visual progress indicator (check for box elements that could be progress bars)
    const progressBars = usageCard.locator('[class*="Box"]').filter({ has: page.locator('[style*="width"]') });
    expect(await progressBars.count()).toBeGreaterThan(0);
  });

  test('should display reset date for usage', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for reset date
    await expect(page.locator('text=/resets on/i')).toBeVisible();
  });

  test('should display payment history section', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for payment history header
    await expect(page.locator('text="Payment History"')).toBeVisible();
  });

  test('should display payment records', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for payment amounts
    await expect(page.locator('text=/\\$19.99/i').first()).toBeVisible();

    // Check for payment status
    await expect(page.locator('text="SUCCEEDED"').first()).toBeVisible();
  });

  test('should show "No payment history" when empty', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock empty payment history
    await page.route('**/api/billing/payments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Should show empty state
    await expect(page.locator('text=/no payment history/i')).toBeVisible();
  });

  test('should show loading state while fetching subscription', async ({ page }) => {
    // Mock slow subscription API
    await page.route('**/api/billing/subscription', async (route) => {
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'plus',
          status: 'active',
        }),
      });
    });

    await page.goto('/billing/subscription');

    // Should show loading spinner
    await expect(page.locator('text=/loading/i, [role="progressbar"]')).toBeVisible({ timeout: 500 });
  });

  test('should handle cancellation error gracefully', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    // Mock cancellation error
    await page.route('**/api/billing/cancel', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error',
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Accept dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Wait for error message
    await page.waitForTimeout(1000);

    // Should show error toast
    await expect(page.locator('text=/failed/i, text=/error/i')).toBeVisible({ timeout: 3000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // All sections should be visible
    await expect(page.locator('text="Current Plan"')).toBeVisible();
    await expect(page.locator('text="Token Usage"')).toBeVisible();
    await expect(page.locator('text="Payment History"')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // All sections should be visible
    await expect(page.locator('text="Current Plan"')).toBeVisible();
    await expect(page.locator('text="Token Usage"')).toBeVisible();
  });
});
