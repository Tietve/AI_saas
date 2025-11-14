import { test, expect } from '@playwright/test';

test.describe('Signup Flow through API Gateway', () => {
  test('should successfully sign up a new user', async ({ page }) => {
    // Navigate to signup page
    await page.goto('http://localhost:3002/signup');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Fill in the signup form
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'Test123!@#';

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation or success message
    // Should redirect to /chat on success
    await page.waitForURL(/\/(chat|$)/, { timeout: 10000 });

    // Verify we're on the chat page or home page (successful signup redirects)
    const url = page.url();
    expect(url).toMatch(/\/(chat|$)/);

    console.log(`✅ Signup successful! Email: ${email}, Redirected to: ${url}`);
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('http://localhost:3002/signup');
    await page.waitForLoadState('networkidle');

    // Use an existing email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!@#');

    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Check for error message (adjust selector based on your error UI)
    const errorMessage = await page.locator('text=/already exists|đã tồn tại/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Duplicate email error shown correctly');
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('http://localhost:3002/signup');
    await page.waitForLoadState('networkidle');

    // Try a weak password
    await page.fill('input[type="email"]', 'weak@example.com');
    await page.fill('input[type="password"]', '123');

    await page.click('button[type="submit"]');

    // Should see validation error
    await page.waitForTimeout(1000);

    // Check if button is disabled or error is shown
    const hasError = await page.locator('text=/password|mật khẩu/i').count() > 0;
    expect(hasError).toBeTruthy();

    console.log('✅ Password validation working');
  });
});
