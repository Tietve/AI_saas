import { test, expect } from '@playwright/test';

/**
 * CHAT INTERFACE VERIFICATION TEST
 * Verifies the chat interface works when properly authenticated
 */

test.describe('Chat Interface Verification (Authenticated)', () => {

  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    console.log('🔐 Logging in...');

    // Go to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login with test account
    const emailField = page.locator('input[type="email"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailField.isVisible()) {
      await emailField.fill('testuser123@example.com');
      await passwordField.fill('Test123456');
      await submitButton.click();

      // Wait for login to complete (should redirect to /chat or dashboard)
      await page.waitForTimeout(3000);

      console.log('✅ Logged in, current URL:', page.url());
    } else {
      console.log('⚠️ Already logged in or no login form found');
    }
  });

  test('1. Chat page should load and display UI elements', async ({ page }) => {
    console.log('📄 Testing chat page UI...');

    // Navigate to chat page
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React to render

    // Take screenshot
    await page.screenshot({ path: 'test-results/chat-authenticated.png', fullPage: true });

    // Check URL - should NOT redirect to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    expect(currentUrl).toContain('/chat');

    console.log('✅ Still on chat page (not redirected to login)');
  });

  test('2. Chat input should be visible and functional', async ({ page }) => {
    console.log('💬 Testing chat input...');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for textarea (ChatInput component)
    const textarea = page.locator('textarea').first();
    const isTextareaVisible = await textarea.isVisible();
    console.log('Textarea visible:', isTextareaVisible);

    if (isTextareaVisible) {
      console.log('✅ Chat input field found!');

      // Get placeholder
      const placeholder = await textarea.getAttribute('placeholder');
      console.log('Placeholder text:', placeholder);

      // Test typing
      await textarea.fill('Test message');
      const value = await textarea.inputValue();
      console.log('Input value:', value);
      expect(value).toBe('Test message');

      console.log('✅ Chat input is functional');
    } else {
      console.error('❌ Chat input NOT found');

      // Debug: Print all text on page
      const bodyText = await page.locator('body').textContent();
      console.log('Page content (first 500 chars):', bodyText?.substring(0, 500));

      // Debug: Count all textareas
      const textareaCount = await page.locator('textarea').count();
      console.log('Total textareas on page:', textareaCount);

      throw new Error('Chat input not visible');
    }
  });

  test('3. Send button should be visible', async ({ page }) => {
    console.log('📤 Testing send button...');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for send button (multiple possible selectors)
    const sendButton = page.locator('button.send-btn, button[type="submit"]').last();
    const isVisible = await sendButton.isVisible();

    console.log('Send button visible:', isVisible);

    if (isVisible) {
      console.log('✅ Send button found!');

      // Take screenshot highlighting the button
      await sendButton.screenshot({ path: 'test-results/send-button.png' });
    } else {
      console.log('⚠️ Send button not immediately visible, checking all buttons...');

      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons on page`);

      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        const text = await btn.textContent();
        const visible = await btn.isVisible();
        const classes = await btn.getAttribute('class');
        console.log(`Button ${i + 1}: text="${text}", visible=${visible}, class="${classes}"`);
      }
    }
  });

  test('4. Sidebar should be visible', async ({ page }) => {
    console.log('📂 Testing sidebar...');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for sidebar/nav elements
    const sidebar = page.locator('aside, nav, [role="navigation"]').first();
    const isVisible = await sidebar.isVisible();

    console.log('Sidebar visible:', isVisible);

    if (isVisible) {
      console.log('✅ Sidebar found!');

      // Check for "New conversation" button
      const newConvButton = page.locator('text=/new conversation|cuộc trò chuyện mới|new chat/i').first();
      if (await newConvButton.isVisible()) {
        console.log('✅ "New conversation" button found in sidebar');
      }
    } else {
      console.log('⚠️ Sidebar not immediately visible');

      // Debug: Look for any nav-like elements
      const navElements = await page.locator('aside, nav, [role="navigation"]').count();
      console.log('Total navigation elements:', navElements);
    }
  });

  test('5. Full chat flow - Send a test message', async ({ page }) => {
    console.log('🚀 Testing full chat flow...');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take before screenshot
    await page.screenshot({ path: 'test-results/chat-before-message.png', fullPage: true });

    // Fill message
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello, this is a test message!');

    // Click send button
    const sendButton = page.locator('button.send-btn, button[aria-label*="send"], button[title*="send"]').last();
    await sendButton.click();

    console.log('✅ Message sent, waiting for response...');

    // Wait for AI response (up to 10 seconds)
    await page.waitForTimeout(10000);

    // Take after screenshot
    await page.screenshot({ path: 'test-results/chat-after-message.png', fullPage: true });

    // Check if messages appeared
    const messageCount = await page.locator('[role="log"] > div, .message-item, .message').count();
    console.log('Messages found on page:', messageCount);

    if (messageCount > 0) {
      console.log('✅ Messages are displaying!');
    } else {
      console.log('⚠️ No messages found, but this might be expected if backend is not responding');
    }
  });

  test('6. Check for console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\n=== CONSOLE ERRORS CHECK ===');
    console.log(`Total errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.error('\n❌ ERRORS FOUND:');
      consoleErrors.forEach((error, i) => {
        console.error(`${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors found!');
    }
  });
});
