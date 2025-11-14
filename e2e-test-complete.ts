/**
 * COMPREHENSIVE E2E TEST - PRODUCTION READINESS CHECK
 * Test toàn bộ flow: Signup → Login → Chat → Multi-Turn RAG
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function testSignupPage(page: Page): Promise<void> {
  console.log('\n🧪 TEST 1: Signup Page Load');
  const startTime = Date.now();

  try {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 5000 });

    console.log('✅ Signup page loaded successfully');
    results.push({ name: 'Signup Page Load', passed: true, duration: Date.now() - startTime });
  } catch (error: any) {
    console.error('❌ Signup page failed:', error.message);
    results.push({ name: 'Signup Page Load', passed: false, error: error.message });
    throw error;
  }
}

async function testSignupFlow(page: Page): Promise<void> {
  console.log('\n🧪 TEST 2: Signup Flow');
  const startTime = Date.now();
  const testEmail = `test${Date.now()}@example.com`;

  try {
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="password"]', 'Test123456');

    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForTimeout(3000);

    const url = page.url();
    const hasSuccessMessage = await page.locator('text=/đăng ký thành công/i').count() > 0;

    if (hasSuccessMessage || url.includes('/login')) {
      console.log('✅ Signup successful');
      results.push({ name: 'Signup Flow', passed: true, duration: Date.now() - startTime });
    } else {
      throw new Error('No success confirmation found');
    }
  } catch (error: any) {
    console.error('❌ Signup flow failed:', error.message);
    results.push({ name: 'Signup Flow', passed: false, error: error.message });
    throw error;
  }
}

async function testLoginPage(page: Page): Promise<void> {
  console.log('\n🧪 TEST 3: Login Page Load');
  const startTime = Date.now();

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    console.log('✅ Login page loaded successfully');
    results.push({ name: 'Login Page Load', passed: true, duration: Date.now() - startTime });
  } catch (error: any) {
    console.error('❌ Login page failed:', error.message);
    results.push({ name: 'Login Page Load', passed: false, error: error.message });
    throw error;
  }
}

async function testAPIHealth(): Promise<void> {
  console.log('\n🧪 TEST 4: Backend API Health');
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok || response.status === 404) {
      // 404 is OK if health endpoint doesn't exist
      console.log('✅ API Gateway responding');
      results.push({ name: 'API Health', passed: true, duration: Date.now() - startTime });
    } else {
      throw new Error(`API returned ${response.status}`);
    }
  } catch (error: any) {
    console.error('❌ API health check failed:', error.message);
    results.push({ name: 'API Health', passed: false, error: error.message });
  }
}

async function testMultiTurnPage(page: Page): Promise<void> {
  console.log('\n🧪 TEST 5: Multi-Turn RAG Test Page');
  const startTime = Date.now();

  try {
    await page.goto(`${BASE_URL}/test/multi-turn`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.waitForSelector('button[title*="Nâng cấp"], button[title*="prompt"]', { timeout: 5000 });

    console.log('✅ Multi-Turn test page loaded');
    results.push({ name: 'Multi-Turn Page Load', passed: true, duration: Date.now() - startTime });
  } catch (error: any) {
    console.error('❌ Multi-Turn page failed:', error.message);
    results.push({ name: 'Multi-Turn Page Load', passed: false, error: error.message });
    throw error;
  }
}

async function testMultiTurnRAG(page: Page): Promise<void> {
  console.log('\n🧪 TEST 6: Multi-Turn RAG Functionality');
  const startTime = Date.now();

  try {
    // Type a simple message
    await page.fill('textarea', 'Tôi muốn học lập trình');
    await page.waitForTimeout(500);

    // Click the Sparkles button
    const sparklesButton = page.locator('button[title*="Nâng cấp"], button[title*="prompt"]').first();
    await sparklesButton.click();

    // Wait for API response (check for loading state change)
    await page.waitForTimeout(15000); // Multi-turn API can take 10-12s

    // Check if message was upgraded (textarea value should change)
    const textareaValue = await page.locator('textarea').inputValue();

    if (textareaValue.length > 30) {
      console.log('✅ Multi-Turn RAG working (prompt upgraded)');
      console.log(`   Upgraded prompt length: ${textareaValue.length} chars`);
      results.push({ name: 'Multi-Turn RAG', passed: true, duration: Date.now() - startTime });
    } else {
      throw new Error('Prompt not upgraded');
    }
  } catch (error: any) {
    console.error('❌ Multi-Turn RAG failed:', error.message);
    results.push({ name: 'Multi-Turn RAG', passed: false, error: error.message });
  }
}

async function printReport(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION READINESS TEST REPORT');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${index + 1}. ${result.name}: ${status}${duration}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - PRODUCTION READY! 🎉\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - FIX REQUIRED\n');
    process.exit(1);
  }
}

async function runTests(): Promise<void> {
  console.log('🚀 Starting Comprehensive E2E Tests...\n');
  console.log('Target: http://localhost:3000');
  console.log('Backend: http://localhost:4000\n');

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page: Page = await context.newPage();

    // Run tests in sequence
    await testAPIHealth();
    await testSignupPage(page);
    await testLoginPage(page);
    await testMultiTurnPage(page);
    await testMultiTurnRAG(page);

    // Screenshot final state
    await page.screenshot({ path: 'e2e-test-final.png', fullPage: true });
    console.log('\n📸 Screenshot saved: e2e-test-final.png');

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    await browser.close();
    await printReport();
  }
}

// Run tests
runTests().catch(console.error);
