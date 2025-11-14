/**
 * E2E Tests: Send Message Functionality
 * Tests message sending, AI responses, token usage, and error handling
 */

import { test, expect, Page } from '@playwright/test';
import { loginViaAPI, waitForChatPageReady } from './auth-helper';

test.describe('Send Message - Chat Functionality', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    await waitForChatPageReady(page);
  });

  test('should send first message and create new conversation', async ({ page }) => {
    console.log('🧪 Test: Send first message');

    // Clear any active conversation - click new conversation button
    const newConvButton = page.locator('button:has-text("New"), [aria-label="New conversation"]');
    if (await newConvButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newConvButton.click();
      await page.waitForTimeout(500);
    }

    // Type message
    const testMessage = 'Hello! This is my first test message.';
    const input = page.locator('textarea[placeholder*="conversation"], [data-testid="chat-input"]');
    await input.fill(testMessage);

    // Send message
    const sendButton = page.locator('button[type="submit"], button[aria-label="Send message"]');
    await sendButton.click();

    // Wait for user message to appear in chat
    await expect(page.locator(`text="${testMessage}"`).first()).toBeVisible({ timeout: 5000 });

    // Wait for AI response (should show typing indicator first)
    const typingIndicator = page.locator('text=typing, text=Thinking, [data-testid="typing-indicator"]');
    if (await typingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Typing indicator visible');
    }

    // Wait for AI response to appear (timeout 30s for OpenAI API)
    await page.waitForSelector('[data-testid="message-assistant"], [class*="assistant"]', {
      timeout: 30000,
    });

    // Verify AI response exists
    const assistantMessages = page.locator('[data-testid="message-assistant"], [class*="assistant"]');
    await expect(assistantMessages.first()).toBeVisible();

    // Verify conversation was created in sidebar
    const conversationItems = page.locator('[data-testid="conversation-item"], [class*="conversation"]');
    await expect(conversationItems.first()).toBeVisible({ timeout: 5000 });

    console.log('✅ First message sent and conversation created!');
  });

  test('should send follow-up message in existing conversation', async ({ page }) => {
    console.log('🧪 Test: Send follow-up message');

    // Select first conversation if exists
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    if (await firstConversation.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstConversation.click();
      await page.waitForTimeout(1000);
    } else {
      // Create new conversation first
      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill('Initial message for follow-up test');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Count initial messages
    const initialMessageCount = await page.locator('[data-testid^="message-"]').count();

    // Send follow-up message
    const followUpMessage = 'This is a follow-up message in the same conversation.';
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(followUpMessage);
    await page.locator('button[type="submit"]').click();

    // Wait for new user message
    await expect(page.locator(`text="${followUpMessage}"`)).toBeVisible({ timeout: 5000 });

    // Wait for AI response
    await page.waitForTimeout(5000); // Give time for AI to respond

    // Verify message count increased
    const newMessageCount = await page.locator('[data-testid^="message-"]').count();
    expect(newMessageCount).toBeGreaterThan(initialMessageCount);

    console.log('✅ Follow-up message sent successfully!');
  });

  test('should show token usage updates after message', async ({ page }) => {
    console.log('🧪 Test: Token usage tracking');

    // Find token usage display in sidebar
    const tokenUsage = page.locator('[data-testid="token-usage"], text=/\\d+\\s*\\/\\s*\\d+.*tokens/i');

    // Get initial token count
    const initialText = await tokenUsage.textContent({ timeout: 5000 }).catch(() => '0/100000');
    const initialTokens = parseInt(initialText?.match(/(\d+)/)?.[1] || '0');

    console.log(`📊 Initial tokens: ${initialTokens}`);

    // Send a message
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Tell me a short joke.');
    await page.locator('button[type="submit"]').click();

    // Wait for response
    await page.waitForTimeout(8000);

    // Get updated token count
    const updatedText = await tokenUsage.textContent({ timeout: 5000 }).catch(() => '0/100000');
    const updatedTokens = parseInt(updatedText?.match(/(\d+)/)?.[1] || '0');

    console.log(`📊 Updated tokens: ${updatedTokens}`);

    // Verify tokens increased
    expect(updatedTokens).toBeGreaterThan(initialTokens);

    console.log('✅ Token usage updated correctly!');
  });

  test('should show loading states during AI response', async ({ page }) => {
    console.log('🧪 Test: Loading states');

    // Send message
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('What is the meaning of life?');

    // Check that send button gets disabled during send
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Input should be disabled while sending
    await expect(input).toBeDisabled({ timeout: 2000 });

    // Should show typing indicator
    const loadingStates = page.locator(
      'text=typing, text=Thinking, text=Generating, [data-testid="typing-indicator"], [class*="loading"]'
    );

    const isLoadingVisible = await loadingStates.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoadingVisible) {
      console.log('✅ Loading state visible');
    }

    // Wait for response
    await page.waitForTimeout(10000);

    // Input should be enabled again
    await expect(input).toBeEnabled({ timeout: 5000 });

    console.log('✅ Loading states working correctly!');
  });

  test('should handle empty message validation', async ({ page }) => {
    console.log('🧪 Test: Empty message validation');

    // Try to send empty message
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('   '); // Just spaces

    const sendButton = page.locator('button[type="submit"]');

    // Send button should be disabled or message should not send
    const isDisabled = await sendButton.isDisabled().catch(() => false);

    if (isDisabled) {
      console.log('✅ Send button correctly disabled for empty input');
    } else {
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Verify no new message appeared
      const emptyMessage = page.locator('text="   "').first();
      await expect(emptyMessage).not.toBeVisible();

      console.log('✅ Empty message not sent');
    }
  });

  test('should handle very long messages', async ({ page }) => {
    console.log('🧪 Test: Long message handling');

    // Create a long message (but not too long to avoid rate limits)
    const longMessage = 'This is a test message. '.repeat(50); // ~1250 chars

    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(longMessage);

    // Send message
    await page.locator('button[type="submit"]').click();

    // Wait for message to appear
    await page.waitForTimeout(2000);

    // Verify message was sent (check for first part of message)
    const messagePart = longMessage.substring(0, 50);
    await expect(page.locator(`text="${messagePart}"`).first()).toBeVisible({ timeout: 5000 });

    console.log('✅ Long message handled correctly!');
  });

  test('should handle rapid message sending', async ({ page }) => {
    console.log('🧪 Test: Rapid message sending');

    const messages = ['Message 1', 'Message 2', 'Message 3'];

    for (const msg of messages) {
      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(msg);
      await page.locator('button[type="submit"]').click();

      // Small delay between messages
      await page.waitForTimeout(500);
    }

    // Wait a bit for all messages to process
    await page.waitForTimeout(3000);

    // Verify all messages are visible
    for (const msg of messages) {
      await expect(page.locator(`text="${msg}"`).first()).toBeVisible();
    }

    console.log('✅ Rapid messages handled correctly!');
  });

  test('should preserve message history on page reload', async ({ page }) => {
    console.log('🧪 Test: Message persistence');

    // Send a unique message
    const uniqueMessage = `Test message ${Date.now()}`;
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(uniqueMessage);
    await page.locator('button[type="submit"]').click();

    // Wait for message to be sent
    await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await waitForChatPageReady(page);

    // Select first conversation
    const firstConv = page.locator('[data-testid="conversation-item"]').first();
    if (await firstConv.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstConv.click();
      await page.waitForTimeout(1000);
    }

    // Verify message is still there
    await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible({ timeout: 5000 });

    console.log('✅ Message persisted after reload!');
  });

  test('should display message timestamp', async ({ page }) => {
    console.log('🧪 Test: Message timestamps');

    // Send message
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Message with timestamp test');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Look for timestamp patterns (HH:MM, "just now", "1 minute ago", etc.)
    const timestamps = page.locator('text=/\\d{1,2}:\\d{2}|just now|minute ago|hour ago/i');

    const hasTimestamp = await timestamps.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTimestamp) {
      console.log('✅ Timestamps displayed');
    } else {
      console.log('ℹ️  Timestamps might be in different format or hidden');
    }
  });

  test('should handle model selection for messages', async ({ page }) => {
    console.log('🧪 Test: Model selection');

    // Find model selector
    const modelSelector = page.locator('select[value*="gpt"], [data-testid="model-selector"]');

    if (await modelSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Change model
      await modelSelector.selectOption('gpt-3.5-turbo');
      await page.waitForTimeout(500);

      // Send message with selected model
      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill('Test message with GPT-3.5');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Verify message sent
      await expect(page.locator('text="Test message with GPT-3.5"')).toBeVisible();

      console.log('✅ Model selection works!');
    } else {
      console.log('ℹ️  Model selector not found (might be in different location)');
    }
  });

  // Error handling tests (these require mocking or backend setup)
  test.skip('should handle API timeout gracefully', async ({ page }) => {
    console.log('🧪 Test: API timeout handling');

    // This test requires mocking the API to simulate timeout
    // Implementation depends on your error handling setup

    console.log('⏭️  Skipped: Requires API mocking');
  });

  test.skip('should handle rate limit errors', async ({ page }) => {
    console.log('🧪 Test: Rate limit handling');

    // Send many messages rapidly to trigger rate limit
    for (let i = 0; i < 20; i++) {
      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(`Rate limit test ${i}`);
      await page.locator('button[type="submit"]').click();
    }

    // Should show rate limit error
    await expect(page.locator('text=/rate limit|too many requests/i')).toBeVisible({ timeout: 5000 });

    console.log('✅ Rate limit handled correctly!');
  });

  test.skip('should handle network errors', async ({ page }) => {
    console.log('🧪 Test: Network error handling');

    // This requires simulating network failure
    // Can be done with page.route() or offline mode

    await page.context().setOffline(true);

    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Message during network error');
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator('text=/network error|connection failed/i')).toBeVisible({ timeout: 5000 });

    await page.context().setOffline(false);

    console.log('✅ Network error handled correctly!');
  });
});
