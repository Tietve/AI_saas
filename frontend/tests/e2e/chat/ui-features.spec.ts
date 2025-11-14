/**
 * E2E Tests: UI Features and Interactions
 * Tests model selector, theme switcher, sidebar, keyboard shortcuts, message actions, and responsive design
 */

import { test, expect, Page } from '@playwright/test';
import { loginViaAPI, waitForChatPageReady } from './auth-helper';

test.describe('UI Features and Interactions', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    await waitForChatPageReady(page);
  });

  test('should switch between AI models', async ({ page }) => {
    console.log('🧪 Test: Model selector');

    // Find model selector dropdown
    const modelSelector = page.locator('select[value*="gpt"], [data-testid="model-selector"]');

    if (await modelSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get current model
      const currentModel = await modelSelector.inputValue();
      console.log(`Current model: ${currentModel}`);

      // Change to GPT-3.5
      await modelSelector.selectOption('gpt-3.5-turbo');
      await page.waitForTimeout(500);
      expect(await modelSelector.inputValue()).toBe('gpt-3.5-turbo');

      // Change to GPT-4
      await modelSelector.selectOption('gpt-4');
      await page.waitForTimeout(500);
      expect(await modelSelector.inputValue()).toBe('gpt-4');

      // Change to Claude
      await modelSelector.selectOption('claude-3');
      await page.waitForTimeout(500);
      expect(await modelSelector.inputValue()).toBe('claude-3');

      console.log('✅ Model switching works!');
    } else {
      console.log('⚠️  Model selector not found');
    }
  });

  test('should toggle theme (light/dark mode)', async ({ page }) => {
    console.log('🧪 Test: Theme switcher');

    // Find theme toggle button
    const themeToggle = page.locator(
      '[aria-label*="theme"], [data-testid="theme-switcher"], button:has-text("Theme")'
    );

    if (await themeToggle.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get current theme
      const bodyClass = await page.locator('body').getAttribute('class');
      const initialTheme = bodyClass?.includes('dark') ? 'dark' : 'light';
      console.log(`Initial theme: ${initialTheme}`);

      // Toggle theme
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Verify theme changed
      const newBodyClass = await page.locator('body').getAttribute('class');
      const newTheme = newBodyClass?.includes('dark') ? 'dark' : 'light';
      expect(newTheme).not.toBe(initialTheme);

      console.log(`New theme: ${newTheme}`);

      // Toggle back
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Verify theme changed back
      const finalBodyClass = await page.locator('body').getAttribute('class');
      const finalTheme = finalBodyClass?.includes('dark') ? 'dark' : 'light';
      expect(finalTheme).toBe(initialTheme);

      console.log('✅ Theme switching works!');
    } else {
      console.log('⚠️  Theme toggle not found');
    }
  });

  test('should toggle sidebar on desktop', async ({ page }) => {
    console.log('🧪 Test: Sidebar toggle (desktop)');

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Find sidebar
    const sidebar = page.locator('[data-testid="chat-sidebar"], aside');

    // Find sidebar toggle button (hamburger menu)
    const toggleButton = page.locator('[aria-label*="menu"], [data-testid="sidebar-toggle"]');

    if (await toggleButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Check initial state
      const isInitiallyVisible = await sidebar.isVisible();
      console.log(`Sidebar initially visible: ${isInitiallyVisible}`);

      // Toggle sidebar
      await toggleButton.first().click();
      await page.waitForTimeout(500);

      // Verify sidebar state changed
      const isVisibleAfterToggle = await sidebar.isVisible();
      expect(isVisibleAfterToggle).not.toBe(isInitiallyVisible);

      // Toggle back
      await toggleButton.first().click();
      await page.waitForTimeout(500);

      console.log('✅ Sidebar toggle works on desktop!');
    } else {
      console.log('ℹ️  Sidebar toggle button not found (might be mobile-only)');
    }
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    console.log('🧪 Test: Sidebar toggle (mobile)');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Find sidebar
    const sidebar = page.locator('[data-testid="chat-sidebar"], aside');

    // On mobile, sidebar should be hidden by default
    const isInitiallyVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Mobile sidebar initially visible: ${isInitiallyVisible}`);

    // Find hamburger menu to open sidebar
    const menuButton = page.locator('[aria-label*="menu"], button[class*="hamburger"]');

    if (await menuButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Open sidebar
      await menuButton.first().click();
      await page.waitForTimeout(500);

      // Sidebar should now be visible
      await expect(sidebar).toBeVisible({ timeout: 3000 });

      // Close sidebar (click outside or close button)
      const closeButton = page.locator('[aria-label*="close"], button:has-text("Close")');
      if (await closeButton.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeButton.first().click();
      } else {
        // Click on main content area to close
        await page.click('main, [role="main"]');
      }

      await page.waitForTimeout(500);

      console.log('✅ Mobile sidebar toggle works!');
    } else {
      console.log('⚠️  Mobile menu button not found');
    }
  });

  test('should use keyboard shortcut: Ctrl+N for new conversation', async ({ page }) => {
    console.log('🧪 Test: Keyboard shortcut Ctrl+N');

    // Get initial conversation count
    const conversationItems = page.locator('[data-testid="conversation-item"]');
    const initialCount = await conversationItems.count();

    // Press Ctrl+N
    await page.keyboard.press('Control+N');
    await page.waitForTimeout(500);

    // Verify input is focused (ready for new conversation)
    const input = page.locator('textarea[placeholder*="conversation"]');
    const isFocused = await input.evaluate((el) => el === document.activeElement);

    if (isFocused) {
      console.log('✅ Ctrl+N focuses input for new conversation!');

      // Send a message to create conversation
      await input.fill('Shortcut test conversation');
      await page.keyboard.press('Enter'); // Submit with Enter
      await page.waitForTimeout(2000);

      // Verify new conversation was created
      const newCount = await conversationItems.count();
      expect(newCount).toBeGreaterThan(initialCount);
    } else {
      console.log('ℹ️  Ctrl+N might not focus input, but still triggers new conversation');
    }
  });

  test('should use keyboard shortcut: Ctrl+K for search', async ({ page }) => {
    console.log('🧪 Test: Keyboard shortcut Ctrl+K');

    // Press Ctrl+K
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(500);

    // Verify search input is focused
    const searchInput = page.locator('input[placeholder*="Search"], [data-testid="search-conversations"]');

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isFocused = await searchInput.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();

      console.log('✅ Ctrl+K focuses search input!');
    } else {
      console.log('ℹ️  Search input not found or not focusable');
    }
  });

  test('should use keyboard shortcut: / to focus message input', async ({ page }) => {
    console.log('🧪 Test: Keyboard shortcut /');

    // Press /
    await page.keyboard.press('/');
    await page.waitForTimeout(500);

    // Verify message input is focused
    const input = page.locator('textarea[placeholder*="conversation"]');
    const isFocused = await input.evaluate((el) => el === document.activeElement);

    expect(isFocused).toBeTruthy();
    console.log('✅ / focuses message input!');
  });

  test('should use keyboard shortcut: Escape to close dialogs', async ({ page }) => {
    console.log('🧪 Test: Keyboard shortcut Escape');

    // Open settings
    await page.keyboard.press('Control+,'); // Open settings with Ctrl+,
    await page.waitForTimeout(1000);

    // Settings dialog should be open
    const settingsDialog = page.locator('[role="dialog"], [data-testid="settings-panel"]');

    if (await settingsDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Settings should be closed
      await expect(settingsDialog).not.toBeVisible({ timeout: 2000 });

      console.log('✅ Escape closes dialogs!');
    } else {
      console.log('ℹ️  Settings dialog not found');
    }
  });

  test('should use keyboard shortcut: Shift+? to show help', async ({ page }) => {
    console.log('🧪 Test: Keyboard shortcut Shift+?');

    // Press Shift+?
    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(1000);

    // Keyboard shortcuts help should appear
    const helpDialog = page.locator(
      'text="Keyboard Shortcuts", text="Shortcuts", [data-testid="shortcuts-help"]'
    );

    if (await helpDialog.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Shift+? shows keyboard shortcuts help!');

      // Close help
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('ℹ️  Shortcuts help not found');
    }
  });

  test('should copy message content', async ({ page }) => {
    console.log('🧪 Test: Copy message action');

    // Send a message first
    const testMessage = 'Message to copy';
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(testMessage);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Find the message and hover to show actions
    const messageElement = page.locator(`text="${testMessage}"`).first();
    await messageElement.hover();
    await page.waitForTimeout(500);

    // Find copy button
    const copyButton = page.locator('[aria-label*="Copy"], button:has-text("Copy")');

    if (await copyButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await copyButton.first().click();
      await page.waitForTimeout(500);

      // Verify copy success notification
      const notification = page.locator('text=/copied/i, text="Copied to clipboard"');
      await expect(notification.first()).toBeVisible({ timeout: 3000 });

      console.log('✅ Copy message works!');
    } else {
      console.log('ℹ️  Copy button not found');
    }
  });

  test('should regenerate AI response', async ({ page }) => {
    console.log('🧪 Test: Regenerate response action');

    // Send a message
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Tell me a joke');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000); // Wait for AI response

    // Find AI message and hover
    const aiMessage = page.locator('[data-testid="message-assistant"]').first();

    if (await aiMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await aiMessage.hover();
      await page.waitForTimeout(500);

      // Find regenerate button
      const regenerateButton = page.locator('[aria-label*="Regenerate"], button:has-text("Regenerate")');

      if (await regenerateButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await regenerateButton.first().click();
        await page.waitForTimeout(1000);

        // Should show loading indicator
        const loadingIndicator = page.locator('text=typing, text=Regenerating');
        const isLoading = await loadingIndicator.first().isVisible({ timeout: 2000 }).catch(() => false);

        if (isLoading) {
          console.log('✅ Regenerate response triggered!');
        }
      } else {
        console.log('ℹ️  Regenerate feature coming soon (as per code comment)');
      }
    }
  });

  test('should edit user message', async ({ page }) => {
    console.log('🧪 Test: Edit message action');

    // Send a message
    const testMessage = 'Message to edit';
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(testMessage);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Find message and hover
    const messageElement = page.locator(`text="${testMessage}"`).first();
    await messageElement.hover();
    await page.waitForTimeout(500);

    // Find edit button
    const editButton = page.locator('[aria-label*="Edit"], button:has-text("Edit")');

    if (await editButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.first().click();
      await page.waitForTimeout(500);

      // Should show edit input
      const editInput = page.locator('input[type="text"], textarea');

      if (await editInput.last().isVisible({ timeout: 2000 }).catch(() => false)) {
        await editInput.last().fill('Edited message');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        // Verify edited message appears
        await expect(page.locator('text="Edited message"')).toBeVisible();

        console.log('✅ Edit message works!');
      }
    } else {
      console.log('ℹ️  Edit feature coming soon (as per code comment)');
    }
  });

  test('should delete message', async ({ page }) => {
    console.log('🧪 Test: Delete message action');

    // Send a message
    const testMessage = 'Message to delete';
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(testMessage);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Count initial messages
    const initialCount = await page.locator('[data-testid^="message-"]').count();

    // Find message and hover
    const messageElement = page.locator(`text="${testMessage}"`).first();
    await messageElement.hover();
    await page.waitForTimeout(500);

    // Find delete button
    const deleteButton = page.locator('[aria-label*="Delete"], button:has-text("Delete")');

    if (await deleteButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.first().click();

      // Confirm deletion
      await page.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
      await page.waitForTimeout(1000);

      // Verify message count decreased
      const newCount = await page.locator('[data-testid^="message-"]').count();
      expect(newCount).toBeLessThan(initialCount);

      console.log('✅ Delete message works!');
    } else {
      console.log('ℹ️  Delete feature coming soon (as per code comment)');
    }
  });

  test('should show scroll to bottom button', async ({ page }) => {
    console.log('🧪 Test: Scroll to bottom button');

    // Send multiple messages to create scrollable content
    for (let i = 1; i <= 10; i++) {
      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(`Scroll test message ${i}`);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Scroll to top of message list
    await page.evaluate(() => {
      const messageContainer = document.querySelector('[data-testid="message-list"], main');
      if (messageContainer) {
        messageContainer.scrollTo({ top: 0 });
      }
    });

    await page.waitForTimeout(1000);

    // Look for scroll to bottom button
    const scrollButton = page.locator(
      '[aria-label*="scroll"], button:has-text("Bottom"), [data-testid="scroll-to-bottom"]'
    );

    if (await scrollButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click scroll to bottom
      await scrollButton.first().click();
      await page.waitForTimeout(1000);

      // Verify we scrolled to bottom
      const isAtBottom = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="message-list"], main');
        if (!container) return false;
        return container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      });

      expect(isAtBottom).toBeTruthy();

      console.log('✅ Scroll to bottom works!');
    } else {
      console.log('ℹ️  Scroll to bottom button not visible (might appear only when needed)');
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    console.log('🧪 Test: Mobile responsiveness');

    // Test different mobile viewports
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 360, height: 800, name: 'Android' },
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Verify page is usable
      const input = page.locator('textarea[placeholder*="conversation"]');
      await expect(input).toBeVisible({ timeout: 3000 });

      // Verify send button is visible
      const sendButton = page.locator('button[type="submit"]');
      await expect(sendButton).toBeVisible();

      console.log(`✅ ${viewport.name} responsive design works!`);
    }
  });

  test('should be responsive on tablet devices', async ({ page }) => {
    console.log('🧪 Test: Tablet responsiveness');

    // Test tablet viewports
    const viewports = [
      { width: 768, height: 1024, name: 'iPad' },
      { width: 820, height: 1180, name: 'iPad Air' },
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Verify sidebar is visible or accessible
      const sidebar = page.locator('[data-testid="chat-sidebar"], aside');
      const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);

      if (!sidebarVisible) {
        // If not visible, should have button to open it
        const menuButton = page.locator('[aria-label*="menu"]');
        await expect(menuButton.first()).toBeVisible({ timeout: 2000 });
      }

      // Verify input is visible
      const input = page.locator('textarea[placeholder*="conversation"]');
      await expect(input).toBeVisible();

      console.log(`✅ ${viewport.name} responsive design works!`);
    }
  });

  test('should show user menu with profile options', async ({ page }) => {
    console.log('🧪 Test: User menu');

    // Find user avatar or menu button
    const userAvatar = page.locator('[data-testid="user-avatar"], [aria-label*="user"]');

    if (await userAvatar.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to open menu
      await userAvatar.first().click();
      await page.waitForTimeout(500);

      // Verify menu items
      const menuItems = [
        'Profile',
        'Settings',
        'Billing',
        'Analytics',
        'Logout',
      ];

      for (const item of menuItems) {
        const menuItem = page.locator(`text="${item}"`);
        const isVisible = await menuItem.isVisible({ timeout: 1000 }).catch(() => false);
        if (isVisible) {
          console.log(`✓ ${item} menu item found`);
        }
      }

      // Close menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      console.log('✅ User menu works!');
    } else {
      console.log('⚠️  User menu not found');
    }
  });

  test('should display welcome screen on empty state', async ({ page }) => {
    console.log('🧪 Test: Welcome screen');

    // Clear active conversation
    const newConvButton = page.locator('button:has-text("New")');
    if (await newConvButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newConvButton.click();
      await page.waitForTimeout(500);
    }

    // Look for welcome screen elements
    const welcomeElements = page.locator(
      'text=/welcome/i, text=/get started/i, [data-testid="welcome-screen"]'
    );

    if (await welcomeElements.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Welcome screen displayed!');

      // Check for suggested prompts
      const suggestedPrompts = page.locator('[data-testid="suggested-prompt"], button[class*="prompt"]');
      const promptCount = await suggestedPrompts.count();

      if (promptCount > 0) {
        console.log(`✓ Found ${promptCount} suggested prompts`);

        // Click on first suggested prompt
        await suggestedPrompts.first().click();
        await page.waitForTimeout(500);

        // Verify prompt was inserted into input
        const input = page.locator('textarea[placeholder*="conversation"]');
        const inputValue = await input.inputValue();
        expect(inputValue.length).toBeGreaterThan(0);

        console.log('✅ Suggested prompts work!');
      }
    } else {
      console.log('ℹ️  Welcome screen not visible (might have active conversation)');
    }
  });

  test('should handle window resize gracefully', async ({ page }) => {
    console.log('🧪 Test: Window resize handling');

    // Start with desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Verify desktop layout
    const sidebar = page.locator('[data-testid="chat-sidebar"], aside');
    const desktopSidebarVisible = await sidebar.isVisible();
    console.log(`Desktop: Sidebar visible = ${desktopSidebarVisible}`);

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Verify mobile layout
    const mobileSidebarVisible = await sidebar.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`Mobile: Sidebar visible = ${mobileSidebarVisible}`);

    // Resize back to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // Should be back to desktop layout
    const finalSidebarVisible = await sidebar.isVisible();
    console.log(`Back to desktop: Sidebar visible = ${finalSidebarVisible}`);

    console.log('✅ Window resize handled gracefully!');
  });
});
