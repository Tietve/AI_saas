/**
 * Frontend-Backend Integration Tests
 *
 * Tests that frontend properly integrates with backend services
 */

import { test, expect } from '@playwright/test';

const API_GATEWAY = process.env.API_URL || 'http://localhost:4000';

test.describe('Backend Integration Tests', () => {
  test('all backend services should be healthy', async ({ request }) => {
    console.log('🔍 Checking backend health...');

    // API Gateway
    const gateway = await request.get(`${API_GATEWAY}/health`);
    expect(gateway.ok()).toBeTruthy();
    console.log('✅ API Gateway: OK');

    // Auth Service
    const auth = await request.get(`${API_GATEWAY}/api/auth/health`);
    expect(auth.ok()).toBeTruthy();
    console.log('✅ Auth Service: OK');

    // Chat Service
    const chat = await request.get(`${API_GATEWAY}/api/chat/health`);
    expect(chat.ok()).toBeTruthy();
    console.log('✅ Chat Service: OK');

    // Billing Service
    const billing = await request.get(`${API_GATEWAY}/api/billing/health`);
    expect(billing.ok()).toBeTruthy();
    console.log('✅ Billing Service: OK');

    // Analytics Service
    const analytics = await request.get(`${API_GATEWAY}/api/analytics/health`);
    expect(analytics.ok()).toBeTruthy();
    console.log('✅ Analytics Service: OK');
  });

  test('authentication flow should work end-to-end', async ({ request }) => {
    console.log('🔐 Testing authentication flow...');

    // Register new user
    const registerResponse = await request.post(`${API_GATEWAY}/api/auth/register`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        name: 'Test User',
      },
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    expect(registerData.token).toBeDefined();
    console.log('✅ User registration: OK');

    // Login with credentials
    const loginResponse = await request.post(`${API_GATEWAY}/api/auth/login`, {
      data: {
        email: registerData.user.email,
        password: 'SecurePass123!',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeDefined();
    console.log('✅ User login: OK');

    // Get profile with token
    const profileResponse = await request.get(`${API_GATEWAY}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginData.token}`,
      },
    });

    expect(profileResponse.ok()).toBeTruthy();
    const profile = await profileResponse.json();
    expect(profile.email).toBe(registerData.user.email);
    console.log('✅ Get profile: OK');
  });

  test('chat API should work correctly', async ({ request }) => {
    console.log('💬 Testing chat API...');

    // First, login to get token
    const loginResponse = await request.post(`${API_GATEWAY}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    const { token } = await loginResponse.json();

    // Send chat message
    const chatResponse = await request.post(`${API_GATEWAY}/api/chat/message`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        message: 'Hello, AI assistant!',
        conversationId: null,
      },
    });

    expect(chatResponse.ok()).toBeTruthy();
    const chatData = await chatResponse.json();
    expect(chatData.reply).toBeDefined();
    expect(chatData.conversationId).toBeDefined();
    console.log('✅ Send chat message: OK');

    // Get chat history
    const historyResponse = await request.get(
      `${API_GATEWAY}/api/chat/history/${chatData.conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(historyResponse.ok()).toBeTruthy();
    const history = await historyResponse.json();
    expect(history.messages).toBeDefined();
    expect(history.messages.length).toBeGreaterThan(0);
    console.log('✅ Get chat history: OK');
  });

  test('billing API should work correctly', async ({ request }) => {
    console.log('💳 Testing billing API...');

    // Login first
    const loginResponse = await request.post(`${API_GATEWAY}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    const { token } = await loginResponse.json();

    // Get subscription status
    const subResponse = await request.get(`${API_GATEWAY}/api/billing/subscription`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(subResponse.ok()).toBeTruthy();
    const subscription = await subResponse.json();
    expect(subscription.plan).toBeDefined();
    console.log('✅ Get subscription: OK');

    // Get usage stats
    const usageResponse = await request.get(`${API_GATEWAY}/api/billing/usage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(usageResponse.ok()).toBeTruthy();
    const usage = await usageResponse.json();
    expect(usage.messagesUsed).toBeDefined();
    console.log('✅ Get usage stats: OK');
  });

  test('error handling should work correctly', async ({ request }) => {
    console.log('🚨 Testing error handling...');

    // Test 401 Unauthorized
    const unauthorized = await request.get(`${API_GATEWAY}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(unauthorized.status()).toBe(401);
    const unauthorizedData = await unauthorized.json();
    expect(unauthorizedData.error).toBeDefined();
    console.log('✅ 401 Unauthorized: OK');

    // Test 404 Not Found
    const notFound = await request.get(`${API_GATEWAY}/api/nonexistent`);
    expect(notFound.status()).toBe(404);
    console.log('✅ 404 Not Found: OK');

    // Test 400 Bad Request
    const badRequest = await request.post(`${API_GATEWAY}/api/auth/login`, {
      data: {
        email: 'invalid-email', // Invalid email format
        password: '123', // Too short
      },
    });

    expect(badRequest.status()).toBe(400);
    const badRequestData = await badRequest.json();
    expect(badRequestData.errors).toBeDefined();
    console.log('✅ 400 Bad Request: OK');
  });

  test('CORS headers should be set correctly', async ({ request }) => {
    console.log('🌐 Testing CORS headers...');

    const response = await request.get(`${API_GATEWAY}/health`, {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    console.log('✅ CORS headers: OK');
  });

  test('rate limiting should work', async ({ request }) => {
    console.log('🚦 Testing rate limiting...');

    // Make many requests rapidly
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        request.get(`${API_GATEWAY}/health`).catch(() => null)
      );
    }

    const responses = await Promise.all(promises);

    // Should have at least one 429 (Too Many Requests)
    const rateLimited = responses.some(r => r && r.status() === 429);
    expect(rateLimited).toBeTruthy();
    console.log('✅ Rate limiting: OK');
  });

  test('WebSocket connection should work', async ({ page }) => {
    console.log('🔌 Testing WebSocket connection...');

    await page.goto('/chat');

    // Wait for WebSocket connection
    await page.waitForTimeout(1000);

    // Check WebSocket in browser console
    const wsConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:4000/ws/chat');

        ws.onopen = () => {
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          resolve(false);
        };

        setTimeout(() => resolve(false), 5000);
      });
    });

    expect(wsConnected).toBeTruthy();
    console.log('✅ WebSocket connection: OK');
  });

  test('analytics tracking should work', async ({ request }) => {
    console.log('📊 Testing analytics tracking...');

    // Login first
    const loginResponse = await request.post(`${API_GATEWAY}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    const { token } = await loginResponse.json();

    // Track event
    const trackResponse = await request.post(`${API_GATEWAY}/api/analytics/track`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        event: 'page_view',
        properties: {
          page: '/dashboard',
        },
      },
    });

    expect(trackResponse.ok()).toBeTruthy();
    console.log('✅ Analytics tracking: OK');
  });

  test('file upload should work', async ({ request }) => {
    console.log('📁 Testing file upload...');

    // Login first
    const loginResponse = await request.post(`${API_GATEWAY}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    const { token } = await loginResponse.json();

    // Upload file
    const uploadResponse = await request.post(`${API_GATEWAY}/api/chat/upload`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Test file content'),
        },
      },
    });

    expect(uploadResponse.ok()).toBeTruthy();
    const uploadData = await uploadResponse.json();
    expect(uploadData.fileId).toBeDefined();
    console.log('✅ File upload: OK');
  });

  test('API response times should be acceptable', async ({ request }) => {
    console.log('⚡ Testing API response times...');

    const endpoints = [
      '/health',
      '/api/auth/health',
      '/api/chat/health',
      '/api/billing/health',
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await request.get(`${API_GATEWAY}${endpoint}`);
      const duration = Date.now() - start;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(1000); // Should respond in < 1s
      console.log(`✅ ${endpoint}: ${duration}ms`);
    }
  });
});
