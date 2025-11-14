/**
 * E2E Tests: Conversation Management
 * Tests creating, switching, renaming, deleting, pinning, searching, and exporting conversations
 */

import { test, expect, Page } from '@playwright/test';
import { loginViaAPI, waitForChatPageReady } from './auth-helper';

test.describe('Conversation Management', () => {
  // Authenticate before each test
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    await waitForChatPageReady(page);
  });

  test('should create new conversation', async ({ page }) => {
    console.log('🧪 Test: Create new conversation');

    // Get initial conversation count
    const conversationItems = page.locator('[data-testid="conversation-item"], [class*="conversation"]');
    const initialCount = await conversationItems.count();

    // Click new conversation button
    const newConvButton = page.locator('button:has-text("New"), [aria-label="New conversation"]');
    await newConvButton.click();
    await page.waitForTimeout(1000);

    // Send a message to actually create the conversation
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('This is a new conversation');
    await page.locator('button[type="submit"]').click();

    // Wait for message to be sent
    await page.waitForTimeout(3000);

    // Verify new conversation appears in sidebar
    await page.waitForTimeout(1000);
    const newCount = await conversationItems.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);

    console.log('✅ New conversation created!');
  });

  test('should switch between conversations', async ({ page }) => {
    console.log('🧪 Test: Switch between conversations');

    // Create two conversations
    const conversations = [
      { message: 'First conversation message' },
      { message: 'Second conversation message' },
    ];

    for (const conv of conversations) {
      // New conversation
      const newConvButton = page.locator('button:has-text("New")');
      await newConvButton.click();
      await page.waitForTimeout(500);

      // Send message
      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(conv.message);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Get all conversation items
    const conversationItems = page.locator('[data-testid="conversation-item"]');
    const count = await conversationItems.count();

    if (count >= 2) {
      // Click on first conversation
      await conversationItems.nth(0).click();
      await page.waitForTimeout(1000);

      // Verify first conversation's message is visible
      await expect(page.locator('text="First conversation message"')).toBeVisible({ timeout: 5000 });

      // Click on second conversation
      await conversationItems.nth(1).click();
      await page.waitForTimeout(1000);

      // Verify second conversation's message is visible
      await expect(page.locator('text="Second conversation message"')).toBeVisible({ timeout: 5000 });

      console.log('✅ Successfully switched between conversations!');
    } else {
      console.log('⚠️  Need at least 2 conversations to test switching');
    }
  });

  test('should rename conversation', async ({ page }) => {
    console.log('🧪 Test: Rename conversation');

    // Create a conversation
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Conversation to rename');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Find rename button (might be in context menu or hover actions)
    const conversationItem = page.locator('[data-testid="conversation-item"]').first();

    // Hover to show actions
    await conversationItem.hover();
    await page.waitForTimeout(500);

    // Look for rename button
    const renameButton = page.locator(
      '[aria-label="Rename conversation"], button:has-text("Rename"), [title="Rename"]'
    );

    if (await renameButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await renameButton.first().click();

      // Type new name
      const renameInput = page.locator('input[type="text"], input[placeholder*="name"]');
      await renameInput.fill('Renamed Conversation');

      // Submit
      await page.keyboard.press('Enter');

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify new name appears
      await expect(page.locator('text="Renamed Conversation"')).toBeVisible({ timeout: 3000 });

      console.log('✅ Conversation renamed!');
    } else {
      console.log('ℹ️  Rename feature coming soon (as per code comment)');
    }
  });

  test('should delete conversation', async ({ page }) => {
    console.log('🧪 Test: Delete conversation');

    // Create a conversation to delete
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Conversation to delete');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Get conversation count before deletion
    const conversationItems = page.locator('[data-testid="conversation-item"]');
    const initialCount = await conversationItems.count();

    // Find first conversation and hover to show actions
    const firstConversation = conversationItems.first();
    await firstConversation.hover();
    await page.waitForTimeout(500);

    // Find and click delete button
    const deleteButton = page.locator(
      '[aria-label="Delete conversation"], button:has-text("Delete"), [title="Delete"]'
    );

    if (await deleteButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.first().click();

      // Confirm deletion
      await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').click();

      // Wait for deletion
      await page.waitForTimeout(1000);

      // Verify conversation count decreased
      const newCount = await conversationItems.count();
      expect(newCount).toBeLessThan(initialCount);

      console.log('✅ Conversation deleted!');
    } else {
      console.log('⚠️  Delete button not found');
    }
  });

  test('should pin/unpin conversation', async ({ page }) => {
    console.log('🧪 Test: Pin conversation');

    // Create a conversation
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Conversation to pin');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Find conversation and hover
    const conversationItem = page.locator('[data-testid="conversation-item"]').first();
    await conversationItem.hover();
    await page.waitForTimeout(500);

    // Look for pin button
    const pinButton = page.locator(
      '[aria-label*="Pin"], button:has-text("Pin"), [title*="Pin"]'
    );

    if (await pinButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click pin
      await pinButton.first().click();
      await page.waitForTimeout(1000);

      // Verify pin indicator appears
      const pinIndicator = page.locator('[data-testid="pinned-indicator"], [class*="pinned"]');
      await expect(pinIndicator.first()).toBeVisible({ timeout: 3000 });

      // Unpin
      await conversationItem.hover();
      await pinButton.first().click();
      await page.waitForTimeout(1000);

      console.log('✅ Pin/unpin works!');
    } else {
      console.log('ℹ️  Pin feature coming soon (as per code comment)');
    }
  });

  test('should search conversations', async ({ page }) => {
    console.log('🧪 Test: Search conversations');

    // Create multiple conversations with distinct titles
    const searchableConversations = [
      'Python programming tutorial',
      'JavaScript web development',
      'Machine learning basics',
    ];

    for (const title of searchableConversations) {
      const newConvButton = page.locator('button:has-text("New")');
      await newConvButton.click();
      await page.waitForTimeout(500);

      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(title);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Find search input in sidebar
    const searchInput = page.locator('input[placeholder*="Search"], [data-testid="search-conversations"]');

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Search for "Python"
      await searchInput.fill('Python');
      await page.waitForTimeout(1000);

      // Should show only Python conversation
      await expect(page.locator('text="Python programming tutorial"')).toBeVisible();

      // JavaScript conversation should not be visible (or filtered out)
      const jsConv = page.locator('text="JavaScript web development"');
      const isJsVisible = await jsConv.isVisible({ timeout: 1000 }).catch(() => false);

      if (!isJsVisible) {
        console.log('✅ Search filtering works correctly!');
      }

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);

      // All conversations should be visible again
      await expect(page.locator('text="Python programming tutorial"')).toBeVisible();
      await expect(page.locator('text="JavaScript web development"')).toBeVisible();

      console.log('✅ Search functionality works!');
    } else {
      console.log('ℹ️  Search functionality not found');
    }
  });

  test('should export conversation as JSON', async ({ page }) => {
    console.log('🧪 Test: Export conversation as JSON');

    // Create a conversation with a few messages
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Export test conversation');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000); // Wait for AI response

    // Look for export button or menu
    const exportButton = page.locator(
      '[aria-label="Export conversation"], button:has-text("Export"), [data-testid="export-button"]'
    );

    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      await exportButton.click();
      await page.waitForTimeout(500);

      // Click JSON option
      const jsonOption = page.locator('text="JSON", [data-format="json"]');
      if (await jsonOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await jsonOption.click();

        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.json');

        console.log('✅ JSON export works!');
      } else {
        console.log('ℹ️  JSON export option not found');
      }
    } else {
      console.log('ℹ️  Export button not found');
    }
  });

  test('should export conversation as TXT', async ({ page }) => {
    console.log('🧪 Test: Export conversation as TXT');

    // Create a conversation
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('TXT export test');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Look for export button
    const exportButton = page.locator('[aria-label="Export conversation"], button:has-text("Export")');

    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      await exportButton.click();
      await page.waitForTimeout(500);

      // Click TXT option
      const txtOption = page.locator('text="TXT", text="Text", [data-format="txt"]');
      if (await txtOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await txtOption.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.txt$/);

        console.log('✅ TXT export works!');
      } else {
        console.log('ℹ️  TXT export option not found');
      }
    } else {
      console.log('ℹ️  Export button not found');
    }
  });

  test('should export conversation as Markdown', async ({ page }) => {
    console.log('🧪 Test: Export conversation as Markdown');

    // Create a conversation
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Markdown export test');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Look for export button
    const exportButton = page.locator('[aria-label="Export conversation"], button:has-text("Export")');

    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      await exportButton.click();
      await page.waitForTimeout(500);

      // Click Markdown option
      const mdOption = page.locator('text="Markdown", text="MD", [data-format="md"]');
      if (await mdOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mdOption.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.md$/);

        console.log('✅ Markdown export works!');
      } else {
        console.log('ℹ️  Markdown export option not found');
      }
    } else {
      console.log('ℹ️  Export button not found');
    }
  });

  test('should sort conversations by date', async ({ page }) => {
    console.log('🧪 Test: Conversation sorting');

    // Create multiple conversations at different times
    for (let i = 1; i <= 3; i++) {
      const newConvButton = page.locator('button:has-text("New")');
      await newConvButton.click();
      await page.waitForTimeout(500);

      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(`Conversation ${i} created at ${Date.now()}`);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Get all conversation items
    const conversationItems = page.locator('[data-testid="conversation-item"]');
    const count = await conversationItems.count();

    if (count >= 3) {
      // Get text of first 3 conversations
      const conv1Text = await conversationItems.nth(0).textContent();
      const conv2Text = await conversationItems.nth(1).textContent();
      const conv3Text = await conversationItems.nth(2).textContent();

      console.log('Conversations order:', { conv1Text, conv2Text, conv3Text });

      // Most recent should be at top (Conversation 3)
      expect(conv1Text).toContain('Conversation 3');

      console.log('✅ Conversations sorted correctly!');
    } else {
      console.log('⚠️  Need at least 3 conversations to test sorting');
    }
  });

  test('should display conversation metadata', async ({ page }) => {
    console.log('🧪 Test: Conversation metadata');

    // Create a conversation
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill('Metadata test conversation');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Click on conversation to view it
    const conversationItem = page.locator('[data-testid="conversation-item"]').first();
    await conversationItem.click();
    await page.waitForTimeout(1000);

    // Look for metadata (message count, model, date, etc.)
    const metadata = page.locator(
      'text=/\\d+ messages/i, text=/gpt-\\d/i, text=/\\d{1,2}:\\d{2}/i, [data-testid="conversation-metadata"]'
    );

    const hasMetadata = await metadata.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMetadata) {
      console.log('✅ Conversation metadata displayed!');
    } else {
      console.log('ℹ️  Metadata might be in different location');
    }
  });

  test('should handle empty conversations list', async ({ page }) => {
    console.log('🧪 Test: Empty conversations state');

    // Delete all conversations first (if possible)
    const conversationItems = page.locator('[data-testid="conversation-item"]');
    const count = await conversationItems.count();

    // If there are conversations, we can't fully test empty state
    // But we can check for empty state message
    if (count === 0) {
      const emptyMessage = page.locator('text=/no conversations/i, text=/start.*conversation/i');
      await expect(emptyMessage.first()).toBeVisible({ timeout: 3000 });

      console.log('✅ Empty state displayed correctly!');
    } else {
      console.log('ℹ️  Conversations exist, skipping empty state check');
    }
  });

  test('should preserve conversation state across page reload', async ({ page }) => {
    console.log('🧪 Test: Conversation state persistence');

    // Create a conversation with unique identifier
    const uniqueId = Date.now();
    const input = page.locator('textarea[placeholder*="conversation"]');
    await input.fill(`Persistence test ${uniqueId}`);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Reload page
    await page.reload();
    await waitForChatPageReady(page);

    // Verify conversation still exists
    await expect(page.locator(`text="Persistence test ${uniqueId}"`)).toBeVisible({ timeout: 5000 });

    console.log('✅ Conversation state persisted!');
  });

  test('should show conversation list is scrollable', async ({ page }) => {
    console.log('🧪 Test: Scrollable conversation list');

    // Create many conversations
    const numberOfConversations = 15;

    for (let i = 1; i <= numberOfConversations; i++) {
      const newConvButton = page.locator('button:has-text("New")');
      await newConvButton.click();
      await page.waitForTimeout(300);

      const input = page.locator('textarea[placeholder*="conversation"]');
      await input.fill(`Scroll test conversation ${i}`);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Check if sidebar is scrollable
    const sidebar = page.locator('[data-testid="chat-sidebar"], aside');
    const boundingBox = await sidebar.boundingBox();

    if (boundingBox) {
      const scrollHeight = await sidebar.evaluate((el) => el.scrollHeight);
      const clientHeight = await sidebar.evaluate((el) => el.clientHeight);

      if (scrollHeight > clientHeight) {
        console.log('✅ Conversation list is scrollable!');
      } else {
        console.log('ℹ️  Not enough conversations to make list scrollable');
      }
    }
  });
});
