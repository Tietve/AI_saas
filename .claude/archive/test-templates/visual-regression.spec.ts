/**
 * Visual Regression Tests
 *
 * Takes screenshots and compares with baseline images
 * to detect unintended UI changes
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
  // Configure test
  test.beforeEach(async ({ page }) => {
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Additional wait for animations
  });

  test('homepage should match baseline', async ({ page }) => {
    await page.goto('/');

    // Wait for hero section to be visible
    await page.waitForSelector('h1');

    // Take full-page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled', // Disable animations for consistent screenshots
    });
  });

  test('login page should match baseline', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('dashboard should match baseline', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
    });
  });

  test('chat interface should match baseline', async ({ page }) => {
    // Navigate to chat
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    // Take screenshot of chat interface
    await expect(page).toHaveScreenshot('chat-interface.png', {
      fullPage: true,
    });
  });

  test('modal should match baseline', async ({ page }) => {
    await page.goto('/dashboard');

    // Open settings modal
    await page.click('[aria-label="Settings"]');
    await page.waitForSelector('[role="dialog"]');

    // Screenshot just the modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('settings-modal.png');
  });

  test('responsive mobile view should match baseline', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });

  test('responsive tablet view should match baseline', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
    });
  });

  test('dark theme should match baseline', async ({ page }) => {
    await page.goto('/');

    // Toggle dark theme
    await page.click('[aria-label="Toggle theme"]');
    await page.waitForTimeout(300); // Wait for theme transition

    await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
      fullPage: true,
    });
  });

  test('dropdown menu should match baseline', async ({ page }) => {
    await page.goto('/dashboard');

    // Open dropdown
    await page.click('[aria-label="User menu"]');
    await page.waitForSelector('[role="menu"]');

    // Screenshot the dropdown
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toHaveScreenshot('user-menu-dropdown.png');
  });

  test('form validation errors should match baseline', async ({ page }) => {
    await page.goto('/login');

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');
    await page.waitForSelector('.error-message');

    await expect(page).toHaveScreenshot('login-validation-errors.png');
  });

  test('loading state should match baseline', async ({ page }) => {
    // Intercept API call to simulate loading
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 5000); // Delay response
    });

    await page.goto('/dashboard');

    // Capture loading state
    await expect(page).toHaveScreenshot('dashboard-loading.png');
  });

  test('empty state should match baseline', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/chat/history', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ messages: [] }),
      });
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('chat-empty-state.png', {
      fullPage: true,
    });
  });

  test('error page should match baseline', async ({ page }) => {
    await page.goto('/nonexistent-page');

    await expect(page).toHaveScreenshot('404-error-page.png');
  });

  test('billing page should match baseline', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('billing-page.png', {
      fullPage: true,
    });
  });

  test('profile settings should match baseline', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('profile-settings.png', {
      fullPage: true,
    });
  });
});

// Pixel comparison threshold
test.use({
  screenshot: {
    // Allow 1% difference to account for font rendering differences
    threshold: 0.01,
  },
});
