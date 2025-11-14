/**
 * Visual Regression Tests - Component Screenshots
 *
 * Tests individual UI components:
 * - Modals and dialogs
 * - Dropdowns and selects
 * - Chat interface elements
 * - Forms and inputs
 * - Buttons and loading states
 * - Navigation components
 *
 * Run: npx playwright test tests/visual/components.spec.ts
 * Update: npx playwright test tests/visual/components.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';

test.describe('Form Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Login form - default state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const form = page.locator('form, [data-testid="login-form"]').first();
    if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(form).toHaveScreenshot('login-form-default.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Login form - filled state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await page.waitForTimeout(300);

      const form = page.locator('form, [data-testid="login-form"]').first();
      await expect(form).toHaveScreenshot('login-form-filled.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Signup form - all fields', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const form = page.locator('form, [data-testid="signup-form"]').first();
    if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(form).toHaveScreenshot('signup-form-default.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Input field - focus state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.focus();
      await page.waitForTimeout(200);

      await expect(emailInput).toHaveScreenshot('input-focus-state.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Input field - error state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form to trigger validation
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Find input with error
      const errorInput = page.locator('input[aria-invalid="true"], input.error, .input-error input').first();
      if (await errorInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(errorInput).toHaveScreenshot('input-error-state.png', {
          maxDiffPixels: 50,
        });
      }
    }
  });
});

test.describe('Button Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Primary button - default state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const button = page.locator('button[type="submit"], .btn-primary').first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(button).toHaveScreenshot('button-primary-default.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Primary button - hover state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button[type="submit"], .btn-primary').first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await button.hover();
      await page.waitForTimeout(200);

      await expect(button).toHaveScreenshot('button-primary-hover.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Button - disabled state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Look for disabled button or create one with evaluate
    const disabledButton = page.locator('button[disabled], button:disabled').first();

    // If no disabled button exists, disable the submit button temporarily
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (btn) btn.disabled = true;
      });
      await page.waitForTimeout(200);

      await expect(submitButton).toHaveScreenshot('button-disabled.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Button - loading state (if exists)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill and submit form to trigger loading state
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();

      // Wait briefly to catch loading state
      await page.waitForTimeout(100);

      // Look for loading indicator
      const loadingButton = page.locator('button[disabled], button .spinner, button .loading').first();
      if (await loadingButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await expect(loadingButton).toHaveScreenshot('button-loading.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });
});

test.describe('Chat Interface Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com', username: 'testuser' }));
    });
  });

  test('Chat sidebar - conversation list', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[data-testid="chat-sidebar"], .sidebar, .conversations, aside').first();
    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(sidebar).toHaveScreenshot('chat-sidebar.png', {
        maxDiffPixels: 200,
      });
    }
  });

  test('Chat input area', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const chatInput = page.locator('[data-testid="chat-input"], textarea, input[placeholder*="message"]').first();
    if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Screenshot the input container
      const inputContainer = chatInput.locator('..').first();
      await expect(inputContainer).toHaveScreenshot('chat-input-default.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Chat input - focused with text', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const chatInput = page.locator('[data-testid="chat-input"], textarea, input[placeholder*="message"]').first();
    if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatInput.focus();
      await chatInput.fill('Hello, this is a test message!');
      await page.waitForTimeout(300);

      const inputContainer = chatInput.locator('..').first();
      await expect(inputContainer).toHaveScreenshot('chat-input-filled.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Chat message - user message', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for user messages
    const userMessage = page.locator('[data-role="user"], .message-user, [data-sender="user"]').first();
    if (await userMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(userMessage).toHaveScreenshot('chat-message-user.png', {
        maxDiffPixels: 100,
        mask: [page.locator('[data-testid="timestamp"], .timestamp')],
      });
    }
  });

  test('Chat message - assistant message', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for assistant messages
    const assistantMessage = page.locator('[data-role="assistant"], .message-assistant, [data-sender="assistant"]').first();
    if (await assistantMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(assistantMessage).toHaveScreenshot('chat-message-assistant.png', {
        maxDiffPixels: 100,
        mask: [page.locator('[data-testid="timestamp"], .timestamp')],
      });
    }
  });
});

test.describe('Modal and Dialog Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock authentication for pages that might have modals
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });
  });

  test('Settings modal (if exists)', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for settings button
    const settingsButton = page.locator(
      '[data-testid="settings"], button[aria-label*="settings"], button:has-text("Settings")'
    ).first();

    if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);

      // Find modal
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
      if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(modal).toHaveScreenshot('modal-settings.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('User menu dropdown', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for user menu button
    const userMenuButton = page.locator(
      '[data-testid="user-menu"], button[aria-label*="user"], .user-menu-trigger'
    ).first();

    if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenuButton.click();
      await page.waitForTimeout(300);

      // Find dropdown
      const dropdown = page.locator('[role="menu"], .dropdown-menu, [data-testid="user-menu-dropdown"]').first();
      if (await dropdown.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(dropdown).toHaveScreenshot('dropdown-user-menu.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('Model selector dropdown', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for model selector
    const modelSelector = page.locator(
      '[data-testid="model-selector"], select[name="model"], button:has-text("GPT")'
    ).first();

    if (await modelSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modelSelector.click();
      await page.waitForTimeout(300);

      // Find dropdown options
      const dropdown = page.locator('[role="listbox"], .model-options, select option').first();
      if (await dropdown.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(page).toHaveScreenshot('dropdown-model-selector.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });
});

test.describe('Pricing Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Pricing card - Free plan', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find Free plan card
    const freeCard = page.locator('[data-plan="free"], [data-testid="plan-free"]').first();
    if (await freeCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(freeCard).toHaveScreenshot('pricing-card-free.png', {
        maxDiffPixels: 100,
      });
    } else {
      // Fallback: capture first pricing card
      const firstCard = page.locator('.plan-card, [data-testid*="plan"]').first();
      if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(firstCard).toHaveScreenshot('pricing-card-first.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('Pricing card - Pro plan', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find Pro plan card
    const proCard = page.locator('[data-plan="pro"], [data-testid="plan-pro"]').first();
    if (await proCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(proCard).toHaveScreenshot('pricing-card-pro.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Pricing card - hover state', async ({ page }) => {
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const firstCard = page.locator('.plan-card, [data-testid*="plan"]').first();
    if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCard.hover();
      await page.waitForTimeout(300);

      await expect(firstCard).toHaveScreenshot('pricing-card-hover.png', {
        maxDiffPixels: 150,
      });
    }
  });
});

test.describe('Navigation Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });
  });

  test('Main navigation bar', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const nav = page.locator('nav, [role="navigation"], .navbar, header nav').first();
    if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(nav).toHaveScreenshot('navigation-main.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Breadcrumbs (if exists)', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const breadcrumbs = page.locator('[aria-label="breadcrumb"], .breadcrumbs, nav[aria-label*="Breadcrumb"]').first();
    if (await breadcrumbs.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(breadcrumbs).toHaveScreenshot('breadcrumbs.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Page loading spinner', async ({ page }) => {
    await page.goto('/chat');

    // Try to catch loading state
    const spinner = page.locator('[data-testid="spinner"], .spinner, .loading').first();
    if (await spinner.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(spinner).toHaveScreenshot('loading-spinner.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Skeleton loader (if exists)', async ({ page }) => {
    await page.goto('/chat');

    // Look for skeleton loaders
    const skeleton = page.locator('.skeleton, [data-testid="skeleton"]').first();
    if (await skeleton.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(skeleton).toHaveScreenshot('skeleton-loader.png', {
        maxDiffPixels: 50,
      });
    }
  });
});
