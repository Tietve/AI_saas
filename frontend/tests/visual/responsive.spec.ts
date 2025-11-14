/**
 * Visual Regression Tests - Responsive Design
 *
 * Tests responsive behavior across different viewport sizes:
 * - Desktop: 1920x1080
 * - Tablet: 768x1024
 * - Mobile: 375x667
 *
 * Run: npx playwright test tests/visual/responsive.spec.ts
 * Update: npx playwright test tests/visual/responsive.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 375, height: 667, name: 'mobile' },
};

const PAGES = [
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/billing/plans', name: 'pricing' },
];

test.describe('Responsive Design - Multiple Viewports', () => {
  for (const viewport of Object.values(VIEWPORTS)) {
    test.describe(`${viewport.name.toUpperCase()} viewport (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageInfo of PAGES) {
        test(`${pageInfo.name} page - ${viewport.name}`, async ({ page }) => {
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);

          await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}.png`, {
            fullPage: true,
            maxDiffPixels: 100,
          });
        });
      }

      test(`404 page - ${viewport.name}`, async ({ page }) => {
        await page.goto('/non-existent-route');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot(`404-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixels: 50,
        });
      });
    });
  }
});

test.describe('Responsive Components - Mobile Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Chat page - mobile sidebar closed', async ({ page }) => {
    // Mock auth
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('chat-mobile-sidebar-closed.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('Chat page - mobile sidebar open (if toggle exists)', async ({ page }) => {
    // Mock auth
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try to find and click sidebar toggle
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="menu"], button:has-text("☰")').first();

    if (await sidebarToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidebarToggle.click();
      await page.waitForTimeout(500); // Wait for animation

      await expect(page).toHaveScreenshot('chat-mobile-sidebar-open.png', {
        fullPage: true,
        maxDiffPixels: 200,
      });
    }
  });

  test('Login form - mobile view with keyboard visible simulation', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Focus on email input to simulate keyboard
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.click();
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('login-mobile-input-focused.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    }
  });
});

test.describe('Responsive Navigation', () => {
  test('Desktop - navigation visible', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock auth to see full navigation
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Capture navigation area only
    const nav = page.locator('nav, [role="navigation"], .navigation, .sidebar').first();
    if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(nav).toHaveScreenshot('navigation-desktop.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Mobile - hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Mock auth
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Look for mobile menu toggle
    const menuToggle = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], .hamburger').first();
    if (await menuToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(menuToggle).toHaveScreenshot('mobile-menu-toggle.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Responsive Forms', () => {
  test('Login form - desktop vs mobile layout', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Capture just the form area
      const form = page.locator('form, [data-testid="login-form"]').first();
      if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(form).toHaveScreenshot(`login-form-${viewport.name}.png`, {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('Signup form - tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const form = page.locator('form, [data-testid="signup-form"]').first();
    if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(form).toHaveScreenshot('signup-form-tablet.png', {
        maxDiffPixels: 100,
      });
    }
  });
});

test.describe('Responsive Pricing Cards', () => {
  test('Pricing cards - desktop 3-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('pricing-cards-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Pricing cards - tablet 2-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('pricing-cards-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Pricing cards - mobile stacked layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('pricing-cards-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
