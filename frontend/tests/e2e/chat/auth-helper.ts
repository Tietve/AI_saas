/**
 * Authentication Helper for E2E Tests
 * Provides utilities for logging in and managing auth state
 */

import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

/**
 * Default test user credentials
 * IMPORTANT: Make sure this user exists in your test database
 */
export const TEST_USER: TestUser = {
  email: 'test@example.com',
  password: 'Test123!@#',
  name: 'Test User',
};

/**
 * Login via UI (more realistic but slower)
 */
export async function loginViaUI(page: Page, user: TestUser = TEST_USER): Promise<void> {
  console.log('🔐 Logging in via UI...');

  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill in login form
  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"], input[name="password"]', user.password);

  // Click login button
  await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

  // Wait for successful login - should redirect to chat page
  await page.waitForURL('**/chat', { timeout: 10000 });

  // Verify we're on chat page
  await expect(page).toHaveURL(/\/chat/);

  console.log('✅ Login successful!');
}

/**
 * Login via API (faster, recommended for most tests)
 */
export async function loginViaAPI(page: Page, user: TestUser = TEST_USER): Promise<void> {
  console.log('🔐 Logging in via API...');

  // Make login request
  const response = await page.request.post('http://localhost:3000/api/auth/signin', {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.ok).toBeTruthy();
  expect(data.token).toBeDefined();

  // Store auth token in localStorage
  await page.goto('/chat');
  await page.evaluate((token) => {
    localStorage.setItem('authToken', token);
  }, data.token);

  // Reload page to apply auth
  await page.reload();
  await page.waitForLoadState('networkidle');

  console.log('✅ API login successful!');
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  console.log('🚪 Logging out...');

  // Click user avatar to open menu
  await page.click('[aria-label="User menu"], button:has(div[class*="Avatar"])');

  // Wait for menu to appear
  await page.waitForSelector('text=Logout', { timeout: 3000 });

  // Click logout
  await page.click('text=Logout');

  // Confirm if dialog appears
  const dialog = page.locator('text=Are you sure');
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.click('button:has-text("Confirm"), button:has-text("Yes")');
  }

  // Wait for redirect to login
  await page.waitForURL('**/login', { timeout: 5000 });

  console.log('✅ Logout successful!');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  return !!token;
}

/**
 * Wait for chat page to be fully loaded
 */
export async function waitForChatPageReady(page: Page): Promise<void> {
  // Wait for main chat elements
  await page.waitForSelector('[data-testid="chat-input"], textarea[placeholder*="conversation"]', {
    timeout: 10000,
  });

  // Wait for sidebar
  await page.waitForSelector('[data-testid="chat-sidebar"], aside', {
    timeout: 5000,
  });

  // Wait for network idle
  await page.waitForLoadState('networkidle');

  console.log('✅ Chat page ready!');
}

/**
 * Create a test user (for isolated tests)
 * Note: Requires signup endpoint to be available
 */
export async function createTestUser(page: Page, user: TestUser): Promise<void> {
  console.log('👤 Creating test user...');

  const response = await page.request.post('http://localhost:3000/api/auth/signup', {
    data: {
      email: user.email,
      password: user.password,
      name: user.name || 'Test User',
    },
  });

  if (!response.ok()) {
    const error = await response.text();
    console.warn('⚠️  Failed to create test user:', error);
  } else {
    console.log('✅ Test user created!');
  }
}

/**
 * Clear all conversations for test user
 */
export async function clearConversations(page: Page): Promise<void> {
  console.log('🧹 Clearing conversations...');

  // Get all delete buttons in sidebar
  const deleteButtons = page.locator('[aria-label="Delete conversation"], button:has-text("Delete")');
  const count = await deleteButtons.count();

  for (let i = 0; i < count; i++) {
    // Always click the first delete button (since list updates after each delete)
    const firstDeleteButton = deleteButtons.first();
    if (await firstDeleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await firstDeleteButton.click();

      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');

      // Wait for deletion to complete
      await page.waitForTimeout(500);
    }
  }

  console.log('✅ Conversations cleared!');
}
