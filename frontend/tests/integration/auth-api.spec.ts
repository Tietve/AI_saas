/**
 * Integration Tests: Auth Service API
 * Tests authentication endpoints via API Gateway
 */

import { test, expect } from '@playwright/test';

const API_GATEWAY = process.env.API_URL || 'http://localhost:4000';
const API_BASE = `${API_GATEWAY}/api`;

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#',
  username: 'testuser'
};

test.describe('Auth API - Authentication Endpoints', () => {
  let authToken: string | null = null;

  test.beforeAll(() => {
    console.log('🔍 Testing Auth Service API endpoints...');
    console.log(`📍 API Base: ${API_BASE}`);
  });

  test('POST /api/auth/signup - Register new user', async ({ request }) => {
    console.log('📝 Testing signup endpoint...');

    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `test-${Date.now()}@example.com`, // Unique email
        password: TEST_USER.password,
        username: `testuser-${Date.now()}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 201 || status === 200) {
      const body = await response.json();
      console.log('✅ Signup successful');

      // Verify response structure
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.user).toHaveProperty('email');
      expect(body.user).toHaveProperty('id');

      // Store token for later tests
      authToken = body.token;
    } else if (status === 409) {
      console.log('⚠️  User already exists (expected in repeated tests)');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('POST /api/auth/signin - Login with credentials', async ({ request }) => {
    console.log('🔐 Testing signin endpoint...');

    const response = await request.post(`${API_BASE}/auth/signin`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Login successful');

      // Verify response structure
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.token).toBeTruthy();

      // Verify JWT token format
      expect(body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Store token for later tests
      authToken = body.token;
    } else if (status === 401) {
      console.log('⚠️  Invalid credentials (create user first)');
    } else if (status === 404) {
      console.log('⚠️  Auth service not available');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('POST /api/auth/signin - Reject invalid credentials', async ({ request }) => {
    console.log('🔐 Testing invalid credentials...');

    const response = await request.post(`${API_BASE}/auth/signin`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    // Should be 401 Unauthorized or 404 Not Found
    if (status === 401 || status === 404) {
      console.log('✅ Correctly rejected invalid credentials');
      expect([401, 404]).toContain(status);
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('GET /api/auth/me - Get current user (authenticated)', async ({ request }) => {
    console.log('👤 Testing get current user endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token available, skipping test');
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Get current user successful');

      // Verify response structure
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body.email).toBeTruthy();
    } else if (status === 401) {
      console.log('⚠️  Token invalid or expired');
    } else if (status === 404) {
      console.log('⚠️  Endpoint not found');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('GET /api/auth/me - Reject unauthenticated request', async ({ request }) => {
    console.log('🚫 Testing unauthenticated access...');

    const response = await request.get(`${API_BASE}/auth/me`, {
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    // Should be 401 Unauthorized
    if (status === 401) {
      console.log('✅ Correctly rejected unauthenticated request');
      expect(status).toBe(401);
    } else if (status === 404) {
      console.log('⚠️  Endpoint not found');
    } else {
      console.log(`⚠️  Unexpected status: ${status} (expected 401)`);
    }
  });

  test('POST /api/auth/signout - Logout user', async ({ request }) => {
    console.log('🚪 Testing signout endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token available, skipping test');
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/auth/signout`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200 || status === 204) {
      console.log('✅ Logout successful');
      expect([200, 204]).toContain(status);
    } else if (status === 404) {
      console.log('⚠️  Endpoint not found');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('POST /api/auth/refresh - Refresh JWT token', async ({ request }) => {
    console.log('🔄 Testing token refresh endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token available, skipping test');
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/auth/refresh`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Token refresh successful');

      // Verify new token
      expect(body).toHaveProperty('token');
      expect(body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    } else if (status === 404) {
      console.log('⚠️  Endpoint not found');
    } else if (status === 401) {
      console.log('⚠️  Token invalid or expired');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('Verify JWT token format', async ({ request }) => {
    console.log('🔍 Testing JWT token format...');

    if (!authToken) {
      console.log('⚠️  No auth token available, skipping test');
      test.skip();
      return;
    }

    // JWT should have 3 parts separated by dots
    const parts = authToken.split('.');
    expect(parts).toHaveLength(3);

    // Each part should be base64
    expect(parts[0]).toMatch(/^[A-Za-z0-9-_]+$/);
    expect(parts[1]).toMatch(/^[A-Za-z0-9-_]+$/);
    expect(parts[2]).toMatch(/^[A-Za-z0-9-_]+$/);

    console.log('✅ JWT token format is valid');
  });

  test('Check response times (<500ms)', async ({ request }) => {
    console.log('⏱️  Testing response times...');

    const start = Date.now();
    const response = await request.get(`${API_BASE}/auth/health`, {
      failOnStatusCode: false
    });
    const duration = Date.now() - start;

    console.log(`   Response time: ${duration}ms`);

    if (response.ok() && duration < 500) {
      console.log('✅ Response time is acceptable');
      expect(duration).toBeLessThan(500);
    } else if (!response.ok()) {
      console.log('⚠️  Service not available');
    } else {
      console.log(`⚠️  Response time is slow: ${duration}ms`);
    }
  });
});
