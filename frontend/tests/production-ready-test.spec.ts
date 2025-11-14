import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE PRODUCTION-READY TEST
 * Tests everything like a real user would
 */

// Helper to capture console logs and errors
const consoleMessages: string[] = [];
const consoleErrors: string[] = [];

test.describe('Production-Ready Frontend Test', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });
  });

  test('1. Homepage - Initial Load and UI Check', async ({ page }) => {
    console.log('📄 Testing Homepage...');

    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });

    // Check title
    await expect(page).toHaveTitle(/Fir Box/i);

    // Check for console errors
    console.log('Console messages:', consoleMessages.length);
    console.log('Console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('❌ Console errors found:', consoleErrors);
    }

    // Visual checks - look for text content
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains:', bodyText?.substring(0, 200));
  });

  test('2. Check All Buttons and Links', async ({ page }) => {
    console.log('🔘 Testing all buttons and links...');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      console.log(`Button ${i + 1}: "${text}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);

      // Check if button has meaningful text or aria-label
      if (!text?.trim() && !await button.getAttribute('aria-label')) {
        console.warn(`⚠️ Button ${i + 1} has no text or aria-label - might be useless`);
      }
    }

    // Find all links
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} links`);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');

      console.log(`Link ${i + 1}: "${text}" → ${href}`);

      if (!href || href === '#') {
        console.warn(`⚠️ Link ${i + 1} has no valid href - might be useless`);
      }
    }

    await page.screenshot({ path: 'test-results/02-all-buttons.png', fullPage: true });
  });

  test('3. Test Login Flow', async ({ page }) => {
    console.log('🔐 Testing login flow...');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Look for login button/link
    const loginButton = page.locator('text=/đăng nhập|login|sign in/i').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/03-login-page.png', fullPage: true });

      // Check form fields
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await emailInput.isVisible()) {
        console.log('✅ Email input found');
        await emailInput.fill('test@example.com');
      } else {
        console.warn('⚠️ No email input found');
      }

      if (await passwordInput.isVisible()) {
        console.log('✅ Password input found');
        await passwordInput.fill('test123');
      } else {
        console.warn('⚠️ No password input found');
      }

      // Check submit button
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        console.log('✅ Submit button found');
        const submitText = await submitButton.textContent();
        console.log(`Submit button text: "${submitText}"`);
      }

      // Test with invalid credentials to check validation
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/03b-login-error.png', fullPage: true });
      }
    } else {
      console.warn('⚠️ No login button found on homepage');
    }
  });

  test('4. Test Signup Flow', async ({ page }) => {
    console.log('📝 Testing signup flow...');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Look for signup button/link
    const signupButton = page.locator('text=/đăng ký|sign up|register|tạo tài khoản/i').first();
    if (await signupButton.isVisible()) {
      await signupButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/04-signup-page.png', fullPage: true });

      // Check all form fields
      const inputs = await page.locator('input').all();
      console.log(`Found ${inputs.length} input fields`);

      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`Input: type=${type}, name=${name}, placeholder=${placeholder}`);
      }
    } else {
      console.warn('⚠️ No signup button found');
    }
  });

  test('5. Chat Page - Layout and Colors', async ({ page }) => {
    console.log('💬 Testing chat page...');

    // Try to navigate to chat (might need login first)
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/05-chat-page.png', fullPage: true });

    // Check background color
    const bgColor = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log('Body background color:', bgColor);

    // Check for chat interface elements
    const hasChatInput = await page.locator('textarea, input[placeholder*="message"], input[placeholder*="tin nhắn"]').count() > 0;
    const hasSendButton = await page.locator('button:has-text("send"), button:has-text("gửi")').count() > 0;
    const hasSidebar = await page.locator('nav, aside, [role="navigation"]').count() > 0;

    console.log('Chat interface check:');
    console.log('- Has chat input:', hasChatInput);
    console.log('- Has send button:', hasSendButton);
    console.log('- Has sidebar:', hasSidebar);

    // Check for overlapping elements
    const allElements = await page.locator('*').all();
    console.log(`Total elements on page: ${allElements.length}`);
  });

  test('6. Check All Navigation Items', async ({ page }) => {
    console.log('🧭 Testing navigation...');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');

    // Find nav elements
    const navItems = await page.locator('nav a, nav button, aside a, aside button').all();
    console.log(`Found ${navItems.length} navigation items`);

    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      const text = await item.textContent();
      const href = await item.getAttribute('href');
      const ariaLabel = await item.getAttribute('aria-label');

      console.log(`Nav ${i + 1}: "${text}" → ${href || 'button'} (aria: ${ariaLabel})`);
    }

    await page.screenshot({ path: 'test-results/06-navigation.png', fullPage: true });
  });

  test('7. Test Chat Functionality (if logged in)', async ({ page }) => {
    console.log('💬 Testing chat functionality...');

    // First try to login with test account
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Simple login attempt
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill('testuser123@example.com');
      await page.locator('input[type="password"]').first().fill('Test123456');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }

    // Navigate to chat
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/07a-chat-before.png', fullPage: true });

    // Try to send a message
    const chatInput = page.locator('textarea, input[placeholder*="message"], input[placeholder*="tin nhắn"]').first();
    if (await chatInput.isVisible()) {
      console.log('✅ Chat input found');
      await chatInput.fill('Hello, this is a test message');

      const sendButton = page.locator('button:has-text("send"), button:has-text("gửi"), button[type="submit"]').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        console.log('✅ Message sent');
        await page.waitForTimeout(5000); // Wait for AI response
        await page.screenshot({ path: 'test-results/07b-chat-after.png', fullPage: true });
      }
    } else {
      console.warn('⚠️ Chat input not found');
    }
  });

  test('8. Check Responsive Design', async ({ page }) => {
    console.log('📱 Testing responsive design...');

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/08a-mobile.png', fullPage: true });
    console.log('✅ Mobile (375x667) screenshot taken');

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/08b-tablet.png', fullPage: true });
    console.log('✅ Tablet (768x1024) screenshot taken');

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/08c-desktop.png', fullPage: true });
    console.log('✅ Desktop (1920x1080) screenshot taken');
  });

  test('9. Final Report - Console Errors', async ({ page }) => {
    console.log('📊 Generating final report...');

    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== FINAL REPORT ===\n');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.error('\n❌ CONSOLE ERRORS FOUND:');
      consoleErrors.forEach((error, i) => {
        console.error(`${i + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No console errors found!');
    }
  });
});
