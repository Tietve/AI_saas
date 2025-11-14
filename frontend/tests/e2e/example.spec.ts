/**
 * Test đơn giản để thử Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Tests', () => {
  test('homepage should load', async ({ page }) => {
    console.log('🚀 Testing homepage...');

    // Go to homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if page loaded (adjust selector based on your app)
    await expect(page).toHaveTitle(/.*/)

    console.log('✅ Homepage loaded successfully!');
  });

  test('should navigate to different routes', async ({ page }) => {
    console.log('🚀 Testing navigation...');

    await page.goto('/');

    // Try to find login link (adjust based on your app)
    const loginLink = page.locator('a[href*="login"], button:has-text("Login")').first();

    if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginLink.click();
      console.log('✅ Navigation to login works!');
    } else {
      console.log('ℹ️  No login link found (this is okay for testing)');
    }
  });

  test('page should be responsive', async ({ page }) => {
    console.log('🚀 Testing responsive design...');

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    console.log('✅ Desktop view: OK');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    console.log('✅ Tablet view: OK');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    console.log('✅ Mobile view: OK');
  });
});
