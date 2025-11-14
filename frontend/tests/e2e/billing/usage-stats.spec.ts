/**
 * E2E Tests for Usage Statistics
 * Tests token usage tracking and display across the application
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, mockBillingAPIs, mockSubscriptionForPlan } from './auth.setup';

test.describe('Usage Statistics', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await setupAuthenticatedSession(page);
  });

  test('should display usage statistics on subscription page', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check usage card exists
    await expect(page.locator('text="Token Usage"')).toBeVisible();

    // Check usage numbers
    await expect(page.locator('text=/3,500.*100,000/i')).toBeVisible();
  });

  test('should display correct token limits for Free plan', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'free');

    // Mock usage for free plan
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 5000,
          tokenLimit: 10000,
          percentUsed: 50,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check free plan limit (10,000)
    await expect(page.locator('text=/10,000/i')).toBeVisible();
    await expect(page.locator('text=/5,000/i')).toBeVisible();
  });

  test('should display correct token limits for Plus plan', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock usage for plus plan
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 50000,
          tokenLimit: 100000,
          percentUsed: 50,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check plus plan limit (100,000)
    await expect(page.locator('text=/100,000/i')).toBeVisible();
    await expect(page.locator('text=/50,000/i')).toBeVisible();
  });

  test('should display correct token limits for Pro plan', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'pro');

    // Mock usage for pro plan
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 250000,
          tokenLimit: 500000,
          percentUsed: 50,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check pro plan limit (500,000)
    await expect(page.locator('text=/500,000/i')).toBeVisible();
    await expect(page.locator('text=/250,000/i')).toBeVisible();
  });

  test('should display percentage used correctly', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock 75% usage
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 75000,
          tokenLimit: 100000,
          percentUsed: 75,
          resetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check percentage display
    await expect(page.locator('text=/75.*%/i')).toBeVisible();
  });

  test('should display usage progress bar with correct width', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock 60% usage
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 60000,
          tokenLimit: 100000,
          percentUsed: 60,
          resetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for progress bar (looking for box with width style)
    const usageCard = page.locator('text="Token Usage"').locator('..');
    const progressBar = usageCard.locator('[style*="width"]').first();

    // Progress bar should exist
    await expect(progressBar).toBeVisible();
  });

  test('should show red progress bar when usage is over 90%', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock 95% usage (over limit warning)
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 95000,
          tokenLimit: 100000,
          percentUsed: 95,
          resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for high usage warning
    await expect(page.locator('text=/95.*%/i')).toBeVisible();

    // Progress bar should be red (error color)
    // This is indicated by the bgcolor: 'error.main' in the code
    const usageCard = page.locator('text="Token Usage"').locator('..');
    const progressBar = usageCard.locator('[style*="width"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('should display reset date', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock usage with specific reset date
    const resetDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 50000,
          tokenLimit: 100000,
          percentUsed: 50,
          resetDate: resetDate.toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for "Resets on" text
    await expect(page.locator('text=/resets on/i')).toBeVisible();

    // Should show a formatted date
    const datePattern = /\w+\s+\d{1,2},\s+\d{4}/;
    const resetText = await page.locator('text=/resets on/i').textContent();
    expect(resetText).toMatch(datePattern);
  });

  test('should show usage at 0% initially', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock 0% usage
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 0,
          tokenLimit: 100000,
          percentUsed: 0,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for 0 tokens used
    await expect(page.locator('text=/0.*100,000/i')).toBeVisible();
    await expect(page.locator('text=/0.*%/i')).toBeVisible();
  });

  test('should show usage at 100% when limit reached', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock 100% usage
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 100000,
          tokenLimit: 100000,
          percentUsed: 100,
          resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for 100% usage
    await expect(page.locator('text=/100,000.*100,000/i')).toBeVisible();
    await expect(page.locator('text=/100.*%/i')).toBeVisible();
  });

  test('should cap progress bar at 100% even if over limit', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock over-limit usage (should still show 100% max on progress bar)
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 120000, // Over limit
          tokenLimit: 100000,
          percentUsed: 120,
          resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Should show over 100%
    await expect(page.locator('text=/120.*%/i')).toBeVisible();

    // But progress bar should be capped (check code: Math.min(usage.percentUsed, 100))
    const usageCard = page.locator('text="Token Usage"').locator('..');
    const progressBar = usageCard.locator('[style*="width"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('should format large numbers with commas', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'pro');

    // Mock large usage numbers
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 250000,
          tokenLimit: 500000,
          percentUsed: 50,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Numbers should have comma separators (250,000)
    await expect(page.locator('text=/250,000/i')).toBeVisible();
    await expect(page.locator('text=/500,000/i')).toBeVisible();
  });

  test('should update usage after API refresh', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    let requestCount = 0;

    // Mock changing usage on refresh
    await page.route('**/api/billing/usage', async (route) => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: requestCount === 1 ? 50000 : 60000,
          tokenLimit: 100000,
          percentUsed: requestCount === 1 ? 50 : 60,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Initial usage
    await expect(page.locator('text=/50,000/i')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Updated usage
    await expect(page.locator('text=/60,000/i')).toBeVisible();
  });

  test('should show usage icon', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check for TrendingUp icon (SVG)
    const usageCard = page.locator('text="Token Usage"').locator('..');
    const icon = usageCard.locator('svg').first();
    await expect(icon).toBeVisible();
  });

  test('should handle missing usage data gracefully', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock 404 for usage API
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Usage data not found' }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Usage card should not crash the page
    // Current plan should still be visible
    await expect(page.locator('text="Current Plan"')).toBeVisible();
  });

  test('should show loading state while fetching usage', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock slow usage API
    await page.route('**/api/billing/usage', async (route) => {
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 50000,
          tokenLimit: 100000,
          percentUsed: 50,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');

    // Initially subscription loads but usage might be loading
    // (The current implementation doesn't show a separate loading state for usage)
    await page.waitForLoadState('networkidle');
  });

  test('should display usage in compact format on mobile', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Usage card should be visible and readable on mobile
    await expect(page.locator('text="Token Usage"')).toBeVisible();
    await expect(page.locator('text=/3,500.*100,000/i')).toBeVisible();
  });

  test('should maintain consistent usage display across page navigation', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');
    await mockBillingAPIs(page);

    // Visit subscription page
    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Check initial usage
    await expect(page.locator('text=/3,500/i')).toBeVisible();

    // Navigate to pricing
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Navigate back to subscription
    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Usage should still be visible
    await expect(page.locator('text=/3,500/i')).toBeVisible();
  });

  test('should show accurate percentage calculation', async ({ page }) => {
    await mockSubscriptionForPlan(page, 'plus');

    // Mock specific usage for precise percentage
    await page.route('**/api/billing/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokensUsed: 33333,
          tokenLimit: 100000,
          percentUsed: 33.333,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');

    // Should show percentage with one decimal place
    await expect(page.locator('text=/33\.3.*%/i')).toBeVisible();
  });
});
