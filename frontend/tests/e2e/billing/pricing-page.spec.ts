/**
 * E2E Tests for Pricing Page
 * Tests the /billing/plans page functionality
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, mockBillingAPIs, mockSubscriptionForPlan } from './auth.setup';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await setupAuthenticatedSession(page);

    // Mock billing APIs
    await mockBillingAPIs(page);
  });

  test('should load pricing page successfully', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page.locator('h3, h1, h2').filter({ hasText: /choose your plan/i })).toBeVisible();

    // Check subtitle
    await expect(page.locator('text=/start for free/i')).toBeVisible();
  });

  test('should display all pricing plans', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Wait for plans to load (no loading spinner)
    await expect(page.locator('text=Loading').or(page.locator('[role="progressbar"]'))).not.toBeVisible({ timeout: 5000 });

    // Check Free plan
    await expect(page.locator('text="Free"').first()).toBeVisible();
    await expect(page.locator('text=/10,000 tokens/i')).toBeVisible();

    // Check Plus plan
    await expect(page.locator('text="Plus"').first()).toBeVisible();
    await expect(page.locator('text=/\\$19.99/i')).toBeVisible();
    await expect(page.locator('text=/100,000 tokens/i')).toBeVisible();

    // Check Pro plan
    await expect(page.locator('text="Pro"').first()).toBeVisible();
    await expect(page.locator('text=/\\$49.99/i')).toBeVisible();
    await expect(page.locator('text=/500,000 tokens/i')).toBeVisible();
  });

  test('should show "Most Popular" badge on Plus plan', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Check for "Most Popular" chip/badge
    const popularBadge = page.locator('text="Most Popular"');
    await expect(popularBadge).toBeVisible();

    // Verify it's on the Plus plan card
    const plusCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Plus"') });
    await expect(plusCard.locator('text="Most Popular"')).toBeVisible();
  });

  test('should display plan features correctly', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Check Free plan features
    const freeCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Free"') }).first();
    await expect(freeCard.locator('text=/basic chat features/i')).toBeVisible();
    await expect(freeCard.locator('text=/email support/i')).toBeVisible();

    // Check Plus plan features
    const plusCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Plus"') }).first();
    await expect(plusCard.locator('text=/advanced chat features/i')).toBeVisible();
    await expect(plusCard.locator('text=/priority support/i')).toBeVisible();
    await expect(plusCard.locator('text=/custom integrations/i')).toBeVisible();

    // Check Pro plan features
    const proCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Pro"') }).first();
    await expect(proCard.locator('text=/dedicated support/i')).toBeVisible();
    await expect(proCard.locator('text=/api access/i')).toBeVisible();
    await expect(proCard.locator('text=/custom models/i')).toBeVisible();
  });

  test('should have checkmarks for all features', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Check that check icons are present (using SVG check)
    const checkIcons = page.locator('svg').filter({ has: page.locator('path') });
    const count = await checkIcons.count();

    // Should have multiple check icons (at least 9 features total across 3 plans)
    expect(count).toBeGreaterThan(8);
  });

  test('should display Subscribe buttons for paid plans', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Plus plan should have Subscribe button
    const plusCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Plus"') }).first();
    await expect(plusCard.locator('button:has-text("Subscribe")')).toBeVisible();

    // Pro plan should have Subscribe button
    const proCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Pro"') }).first();
    await expect(proCard.locator('button:has-text("Subscribe")')).toBeVisible();
  });

  test('should display "Get Started" button for Free plan', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Free plan should have Get Started button
    const freeCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Free"') }).first();
    await expect(freeCard.locator('button:has-text("Get Started")')).toBeVisible();
  });

  test('should highlight current plan', async ({ page }) => {
    // Mock user as having Free plan
    await mockSubscriptionForPlan(page, 'free');

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Current plan should show "Current Plan" button
    const freeCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Free"') }).first();
    await expect(freeCard.locator('button:has-text("Current Plan")')).toBeVisible();

    // Button should be disabled
    const currentPlanButton = freeCard.locator('button:has-text("Current Plan")');
    await expect(currentPlanButton).toBeDisabled();
  });

  test('should handle subscription button click', async ({ page }) => {
    let subscribeRequested = false;

    // Mock subscription creation
    await page.route('**/api/billing/subscribe', async (route) => {
      subscribeRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription: {
            id: 'sub-new',
            userId: 'test-user-id',
            planId: 'plan-plus',
            tier: 'plus',
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Click Subscribe on Plus plan
    const plusCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Plus"') }).first();
    const subscribeButton = plusCard.locator('button:has-text("Subscribe")');
    await subscribeButton.click();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify API was called
    expect(subscribeRequested).toBe(true);
  });

  test('should show loading state when subscribing', async ({ page }) => {
    // Mock slow subscription creation
    await page.route('**/api/billing/subscribe', async (route) => {
      await page.waitForTimeout(2000); // Simulate slow network
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription: { tier: 'plus' },
        }),
      });
    });

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Click Subscribe on Plus plan
    const plusCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Plus"') }).first();
    const subscribeButton = plusCard.locator('button:has-text("Subscribe")');
    await subscribeButton.click();

    // Should show loading spinner
    await expect(plusCard.locator('[role="progressbar"]')).toBeVisible({ timeout: 500 });
  });

  test('should display footer information', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Check for footer text
    await expect(page.locator('text=/cancel anytime/i')).toBeVisible();
    await expect(page.locator('text=/all plans include/i')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Plans should be visible
    await expect(page.locator('text="Free"').first()).toBeVisible();
    await expect(page.locator('text="Plus"').first()).toBeVisible();
    await expect(page.locator('text="Pro"').first()).toBeVisible();

    // Should stack vertically (check if cards are in a column)
    const cards = page.locator('[class*="Card"]').filter({ has: page.locator('text="Free"') });
    await expect(cards.first()).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // All plans should be visible
    await expect(page.locator('text="Free"').first()).toBeVisible();
    await expect(page.locator('text="Plus"').first()).toBeVisible();
    await expect(page.locator('text="Pro"').first()).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // All plans should be visible in a row
    await expect(page.locator('text="Free"').first()).toBeVisible();
    await expect(page.locator('text="Plus"').first()).toBeVisible();
    await expect(page.locator('text="Pro"').first()).toBeVisible();
  });

  test('should show error toast on subscription failure', async ({ page }) => {
    // Mock subscription failure
    await page.route('**/api/billing/subscribe', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Payment method required',
        }),
      });
    });

    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Click Subscribe on Plus plan
    const plusCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Plus"') }).first();
    const subscribeButton = plusCard.locator('button:has-text("Subscribe")');
    await subscribeButton.click();

    // Wait for error toast
    await page.waitForTimeout(1000);

    // Check for error message (toast or alert)
    await expect(page.locator('text=/failed/i, text=/error/i')).toBeVisible({ timeout: 3000 });
  });

  test('should not allow subscribing to Free plan', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Free plan button should be "Get Started", not "Subscribe"
    const freeCard = page.locator('[class*="Card"]').filter({ has: page.locator('text="Free"') }).first();
    await expect(freeCard.locator('button:has-text("Subscribe")')).not.toBeVisible();
  });

  test('should show loading state while fetching plans', async ({ page }) => {
    // Mock slow plans API
    await page.route('**/api/billing/plans', async (route) => {
      await page.waitForTimeout(1000); // Simulate slow network
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/billing/plans');

    // Should show loading spinner initially
    await expect(page.locator('[role="progressbar"]')).toBeVisible({ timeout: 500 });
  });
});
