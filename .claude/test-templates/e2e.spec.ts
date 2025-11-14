/**
 * End-to-End Tests
 *
 * Tests complete user flows from frontend through backend
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Flows', () => {
  test('complete onboarding flow', async ({ page }) => {
    console.log('🚀 Testing complete onboarding flow...');

    // 1. Visit homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome');
    console.log('✅ Homepage loaded');

    // 2. Click "Get Started"
    await page.click('text=Get Started');
    await expect(page).toHaveURL('/register');
    console.log('✅ Navigated to registration');

    // 3. Fill registration form
    const timestamp = Date.now();
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', `test-${timestamp}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    console.log('✅ Registration form filled');

    // 4. Submit registration
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Registration successful, redirected to dashboard');

    // 5. Verify welcome message
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    console.log('✅ Welcome message displayed');

    // 6. Complete onboarding checklist
    await page.click('text=Complete Profile');
    await page.fill('[name="bio"]', 'Test bio');
    await page.click('button:has-text("Save")');
    console.log('✅ Profile completed');

    // 7. Start first chat
    await page.click('text=Start Chat');
    await expect(page).toHaveURL(/\/chat/);
    console.log('✅ Chat page loaded');

    // 8. Send first message
    await page.fill('[placeholder*="message"]', 'Hello, this is my first message!');
    await page.click('button[aria-label="Send"]');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    console.log('✅ First message sent and received reply');

    // 9. Verify message appears in history
    await expect(page.locator('.message.user')).toContainText('Hello, this is my first message!');
    console.log('✅ Message appears in chat history');

    console.log('🎉 Complete onboarding flow: PASSED');
  });

  test('login and chat workflow', async ({ page }) => {
    console.log('💬 Testing login and chat workflow...');

    // 1. Go to login page
    await page.goto('/login');
    console.log('✅ Login page loaded');

    // 2. Login
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Login successful');

    // 3. Navigate to chat
    await page.click('a[href="/chat"]');
    await expect(page).toHaveURL('/chat');
    console.log('✅ Chat page loaded');

    // 4. Send multiple messages
    const messages = [
      'What is the weather today?',
      'Tell me a joke',
      'Explain quantum computing',
    ];

    for (const message of messages) {
      await page.fill('[placeholder*="message"]', message);
      await page.click('button[aria-label="Send"]');
      await page.waitForSelector('.message.assistant', { timeout: 10000 });
      console.log(`✅ Sent: "${message}"`);
      await page.waitForTimeout(500);
    }

    // 5. Verify all messages in history
    for (const message of messages) {
      await expect(page.locator(`.message.user:has-text("${message}")`)).toBeVisible();
    }
    console.log('✅ All messages appear in history');

    // 6. Start new conversation
    await page.click('button:has-text("New Chat")');
    await page.waitForTimeout(500);
    const messageCount = await page.locator('.message').count();
    expect(messageCount).toBe(0);
    console.log('✅ New conversation started');

    console.log('🎉 Login and chat workflow: PASSED');
  });

  test('subscription upgrade workflow', async ({ page }) => {
    console.log('💳 Testing subscription upgrade workflow...');

    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Logged in');

    // 2. Go to billing
    await page.click('a[href="/billing"]');
    await expect(page).toHaveURL('/billing');
    console.log('✅ Billing page loaded');

    // 3. Check current plan
    const currentPlan = await page.locator('.current-plan').textContent();
    console.log(`✅ Current plan: ${currentPlan}`);

    // 4. View available plans
    await expect(page.locator('.plan-card')).toHaveCount(3); // Free, Pro, Enterprise
    console.log('✅ All plans displayed');

    // 5. Select Pro plan
    await page.locator('.plan-card:has-text("Pro")').locator('button:has-text("Upgrade")').click();
    console.log('✅ Pro plan selected');

    // 6. Fill payment details (in test mode)
    await page.waitForSelector('[name="cardNumber"]');
    await page.fill('[name="cardNumber"]', '4242424242424242'); // Test card
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');
    console.log('✅ Payment details filled');

    // 7. Confirm upgrade
    await page.click('button:has-text("Confirm Upgrade")');
    await page.waitForSelector('.success-message', { timeout: 10000 });
    console.log('✅ Upgrade confirmed');

    // 8. Verify new plan active
    await expect(page.locator('.current-plan')).toContainText('Pro');
    console.log('✅ Pro plan activated');

    console.log('🎉 Subscription upgrade workflow: PASSED');
  });

  test('settings and profile update workflow', async ({ page }) => {
    console.log('⚙️ Testing settings workflow...');

    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Logged in');

    // 2. Open settings
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    console.log('✅ Settings page loaded');

    // 3. Update profile
    await page.click('text=Profile');
    await page.fill('[name="name"]', 'Updated Name');
    await page.fill('[name="bio"]', 'Updated bio description');
    await page.click('button:has-text("Save Profile")');
    await expect(page.locator('.success-toast')).toBeVisible();
    console.log('✅ Profile updated');

    // 4. Update preferences
    await page.click('text=Preferences');
    await page.check('[name="emailNotifications"]');
    await page.check('[name="darkMode"]');
    await page.click('button:has-text("Save Preferences")');
    await expect(page.locator('.success-toast')).toBeVisible();
    console.log('✅ Preferences updated');

    // 5. Verify dark mode applied
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBeTruthy();
    console.log('✅ Dark mode applied');

    // 6. Change password
    await page.click('text=Security');
    await page.fill('[name="currentPassword"]', 'password123');
    await page.fill('[name="newPassword"]', 'NewSecurePass456!');
    await page.fill('[name="confirmNewPassword"]', 'NewSecurePass456!');
    await page.click('button:has-text("Change Password")');
    await expect(page.locator('.success-toast')).toBeVisible();
    console.log('✅ Password changed');

    console.log('🎉 Settings workflow: PASSED');
  });

  test('error handling and recovery', async ({ page }) => {
    console.log('🚨 Testing error handling...');

    // 1. Test invalid login
    await page.goto('/login');
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
    console.log('✅ Invalid login error shown');

    // 2. Test form validation
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', '123'); // Too short
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toContainText('Invalid email');
    console.log('✅ Form validation errors shown');

    // 3. Test offline error (mock network failure)
    await page.context().route('**/api/**', route => route.abort());
    await page.goto('/chat');
    await page.fill('[placeholder*="message"]', 'Test message');
    await page.click('button[aria-label="Send"]');
    await expect(page.locator('.error-toast')).toContainText('Connection error');
    console.log('✅ Network error handled');

    // 4. Restore network and retry
    await page.context().unroute('**/api/**');
    await page.click('button:has-text("Retry")');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    console.log('✅ Retry after error successful');

    console.log('🎉 Error handling: PASSED');
  });

  test('mobile responsive workflow', async ({ page }) => {
    console.log('📱 Testing mobile responsive workflow...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Visit homepage
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ Mobile homepage loaded');

    // 2. Open mobile menu
    await page.click('[aria-label="Menu"]');
    await expect(page.locator('.mobile-menu')).toBeVisible();
    console.log('✅ Mobile menu opened');

    // 3. Navigate to login
    await page.click('.mobile-menu a[href="/login"]');
    await expect(page).toHaveURL('/login');
    console.log('✅ Mobile navigation works');

    // 4. Login on mobile
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Mobile login successful');

    // 5. Test mobile chat
    await page.click('a[href="/chat"]');
    await page.fill('[placeholder*="message"]', 'Mobile test message');
    await page.click('button[aria-label="Send"]');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    console.log('✅ Mobile chat works');

    // 6. Test swipe gestures (if implemented)
    // This would require custom swipe simulation

    console.log('🎉 Mobile responsive workflow: PASSED');
  });

  test('logout and session management', async ({ page }) => {
    console.log('🔓 Testing logout workflow...');

    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Logged in');

    // 2. Verify authenticated state
    await expect(page.locator('text=Logout')).toBeVisible();
    console.log('✅ Authenticated state verified');

    // 3. Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/');
    console.log('✅ Logged out');

    // 4. Verify logged out state
    await expect(page.locator('text=Login')).toBeVisible();
    console.log('✅ Logged out state verified');

    // 5. Try accessing protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login'); // Should redirect
    console.log('✅ Protected route redirected to login');

    console.log('🎉 Logout workflow: PASSED');
  });
});
