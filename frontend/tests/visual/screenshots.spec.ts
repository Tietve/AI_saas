/**
 * Visual Regression Tests - Main Pages Screenshots
 *
 * This test suite captures baseline screenshots of all major pages.
 * First run creates baselines in tests/visual/*.spec.ts-snapshots/
 * Subsequent runs compare against baselines.
 *
 * Run: npx playwright test tests/visual/screenshots.spec.ts
 * Update baselines: npx playwright test tests/visual/screenshots.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';

test.describe('Page Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Homepage - should redirect to chat or login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for redirect to complete
    await page.waitForTimeout(1000);

    // Homepage redirects, so capture whichever page it lands on
    await expect(page).toHaveScreenshot('homepage-redirect.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow minor differences
    });
  });

  test('Login Page - full page screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for animations to complete
    await page.waitForTimeout(500);

    // Mask any dynamic elements (timestamps, etc.)
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Signup Page - full page screenshot', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('signup-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Pricing Page - full page screenshot', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('pricing-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('404 Page - not found page screenshot', async ({ page }) => {
    await page.goto('/non-existent-route-that-should-404');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      maxDiffPixels: 50,
    });
  });
});

test.describe('Authenticated Pages Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Chat Page - with auth (mocked)', async ({ page }) => {
    // Mock authentication by setting localStorage
    await page.goto('/login');

    // Set mock tokens in localStorage
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'mock-user-id',
        email: 'test@example.com',
        username: 'testuser'
      }));
    });

    // Navigate to chat page
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Mask dynamic content like timestamps, user IDs
    const dynamicSelectors = [
      page.locator('[data-testid="timestamp"]'),
      page.locator('.timestamp'),
      page.locator('[data-testid="message-time"]'),
    ];

    await expect(page).toHaveScreenshot('chat-page-authenticated.png', {
      fullPage: true,
      mask: dynamicSelectors,
      maxDiffPixels: 200,
    });
  });

  test('Subscription Page - with auth (mocked)', async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'mock-user-id',
        email: 'test@example.com',
        username: 'testuser'
      }));
    });

    await page.goto('/billing/subscription');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Mask dynamic dates and amounts
    const dynamicSelectors = [
      page.locator('[data-testid="renewal-date"]'),
      page.locator('[data-testid="last-payment"]'),
      page.locator('.date'),
    ];

    await expect(page).toHaveScreenshot('subscription-page-authenticated.png', {
      fullPage: true,
      mask: dynamicSelectors,
      maxDiffPixels: 200,
    });
  });
});

test.describe('Page Elements and States', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Login Page - with error state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form to trigger validation errors
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-page-error-state.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    }
  });

  test('Signup Page - with validation errors', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('signup-page-error-state.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    }
  });
});
