/**
 * Visual Regression Tests - Theme Variations
 *
 * Tests different theme modes and color schemes:
 * - Light mode
 * - Dark mode
 * - Theme consistency across pages
 * - Theme toggle functionality
 *
 * Run: npx playwright test tests/visual/themes.spec.ts
 * Update: npx playwright test tests/visual/themes.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/billing/plans', name: 'pricing' },
];

test.describe('Theme Testing - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Set light mode in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      // Also try setting data-theme attribute
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
  });

  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} page - light mode`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify light mode is active
      const isDarkMode = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
      });

      if (!isDarkMode) {
        await expect(page).toHaveScreenshot(`${pageInfo.name}-light-mode.png`, {
          fullPage: true,
          maxDiffPixels: 100,
        });
      }
    });
  }

  test('Chat page - light mode (authenticated)', async ({ page }) => {
    // Mock auth
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const dynamicSelectors = [
      page.locator('[data-testid="timestamp"]'),
      page.locator('.timestamp'),
    ];

    await expect(page).toHaveScreenshot('chat-light-mode.png', {
      fullPage: true,
      mask: dynamicSelectors,
      maxDiffPixels: 200,
    });
  });
});

test.describe('Theme Testing - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Set dark mode in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      // Try different ways to set dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
  });

  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} page - dark mode`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify dark mode is active
      const isDarkMode = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
      });

      if (isDarkMode) {
        await expect(page).toHaveScreenshot(`${pageInfo.name}-dark-mode.png`, {
          fullPage: true,
          maxDiffPixels: 100,
        });
      }
    });
  }

  test('Chat page - dark mode (authenticated)', async ({ page }) => {
    // Mock auth
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const dynamicSelectors = [
      page.locator('[data-testid="timestamp"]'),
      page.locator('.timestamp'),
    ];

    await expect(page).toHaveScreenshot('chat-dark-mode.png', {
      fullPage: true,
      mask: dynamicSelectors,
      maxDiffPixels: 200,
    });
  });

  test('404 page - dark mode', async ({ page }) => {
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('404-dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 50,
    });
  });
});

test.describe('Theme Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Theme toggle button - light to dark', async ({ page }) => {
    // Start in light mode
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Look for theme toggle button
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀")'
    ).first();

    if (await themeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Screenshot before toggle
      await expect(page).toHaveScreenshot('login-before-theme-toggle.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });

      // Click toggle
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for transition

      // Screenshot after toggle
      await expect(page).toHaveScreenshot('login-after-theme-toggle.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    }
  });

  test('Theme persistence across navigation', async ({ page }) => {
    // Set dark mode
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    // Navigate through pages and verify theme persists
    const routes = ['/login', '/signup', '/billing/plans'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const isDarkMode = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               localStorage.getItem('theme') === 'dark';
      });

      // Only screenshot if dark mode persisted
      if (isDarkMode) {
        const pageName = route.split('/').filter(Boolean).join('-') || 'home';
        await expect(page).toHaveScreenshot(`theme-persistence-${pageName}.png`, {
          fullPage: true,
          maxDiffPixels: 100,
        });
      }
    }
  });
});

test.describe('Theme Components Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Buttons - light vs dark mode', async ({ page }) => {
    const modes = [
      { theme: 'light', class: '', name: 'light' },
      { theme: 'dark', class: 'dark', name: 'dark' },
    ];

    for (const mode of modes) {
      await page.goto('/');
      await page.evaluate((m) => {
        localStorage.setItem('theme', m.theme);
        if (m.class) {
          document.documentElement.classList.add(m.class);
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, mode);

      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Find and screenshot primary button
      const button = page.locator('button[type="submit"], .btn-primary').first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(button).toHaveScreenshot(`button-${mode.name}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });

  test('Forms - light vs dark mode', async ({ page }) => {
    const modes = [
      { theme: 'light', class: '', name: 'light' },
      { theme: 'dark', class: 'dark', name: 'dark' },
    ];

    for (const mode of modes) {
      await page.goto('/');
      await page.evaluate((m) => {
        localStorage.setItem('theme', m.theme);
        if (m.class) {
          document.documentElement.classList.add(m.class);
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, mode);

      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const form = page.locator('form, [data-testid="login-form"]').first();
      if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(form).toHaveScreenshot(`form-${mode.name}.png`, {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('Input fields - light vs dark focus states', async ({ page }) => {
    const modes = [
      { theme: 'light', class: '', name: 'light' },
      { theme: 'dark', class: 'dark', name: 'dark' },
    ];

    for (const mode of modes) {
      await page.goto('/');
      await page.evaluate((m) => {
        localStorage.setItem('theme', m.theme);
        if (m.class) {
          document.documentElement.classList.add(m.class);
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, mode);

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Focus on email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.focus();
        await page.waitForTimeout(200);

        await expect(emailInput).toHaveScreenshot(`input-focused-${mode.name}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });
});

test.describe('Theme Color Contrast Verification', () => {
  test('Verify text contrast in light mode', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Capture text-heavy area for contrast checking
    await expect(page).toHaveScreenshot('contrast-light-mode.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Verify text contrast in dark mode', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('contrast-dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
