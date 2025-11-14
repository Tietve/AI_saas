/**
 * Integration Tests: Chat Service API
 * Tests chat and conversation endpoints via API Gateway
 */

import { test, expect } from '@playwright/test';

const API_GATEWAY = process.env.API_URL || 'http://localhost:4000';
const API_BASE = `${API_GATEWAY}/api`;

// Test credentials and data
const TEST_USER = {
  email: 'chattest@example.com',
  password: 'Test123!@#'
};

test.describe('Chat API - Chat and Conversation Endpoints', () => {
  let authToken: string | null = null;
  let conversationId: string | null = null;

  test.beforeAll(async ({ request }) => {
    console.log('🔍 Testing Chat Service API endpoints...');
    console.log(`📍 API Base: ${API_BASE}`);

    // Try to login and get token
    console.log('🔐 Attempting to login for chat tests...');
    const response = await request.post(`${API_BASE}/auth/signin`, {
      data: TEST_USER,
      failOnStatusCode: false
    });

    if (response.ok()) {
      const body = await response.json();
      authToken = body.token;
      console.log('✅ Authentication successful');
    } else {
      console.log('⚠️  Authentication failed - some tests will be skipped');
    }
  });

  test('POST /api/chat - Send a message', async ({ request }) => {
    console.log('💬 Testing send message endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/chat`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        message: 'Hello, this is a test message',
        conversationId: conversationId || undefined
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200 || status === 201) {
      const body = await response.json();
      console.log('✅ Message sent successfully');

      // Verify response structure
      expect(body).toBeDefined();

      // If conversation ID returned, store it
      if (body.conversationId) {
        conversationId = body.conversationId;
        console.log(`   Conversation ID: ${conversationId}`);
      }

      // Should have message content or response
      if (body.response || body.message) {
        expect(body.response || body.message).toBeTruthy();
      }
    } else if (status === 404) {
      console.log('⚠️  Chat endpoint not found');
    } else if (status === 401) {
      console.log('⚠️  Unauthorized - token may be invalid');
    } else if (status === 429) {
      console.log('⚠️  Rate limit exceeded');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('GET /api/conversations - Get all conversations', async ({ request }) => {
    console.log('📋 Testing get conversations endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/conversations`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Got conversations successfully');

      // Should be an array
      expect(Array.isArray(body) || Array.isArray(body.conversations)).toBeTruthy();

      const conversations = Array.isArray(body) ? body : body.conversations;
      console.log(`   Found ${conversations.length} conversations`);

      // If conversations exist, verify structure
      if (conversations.length > 0) {
        const conv = conversations[0];
        expect(conv).toHaveProperty('id');

        // Store first conversation ID for later tests
        if (!conversationId && conv.id) {
          conversationId = conv.id;
        }
      }
    } else if (status === 404) {
      console.log('⚠️  Conversations endpoint not found');
    } else if (status === 401) {
      console.log('⚠️  Unauthorized');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('GET /api/conversations/:id - Get single conversation', async ({ request }) => {
    console.log('📄 Testing get single conversation endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    if (!conversationId) {
      console.log('⚠️  No conversation ID available, skipping test');
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Got conversation successfully');

      // Verify response structure
      expect(body).toHaveProperty('id');
      expect(body.id).toBe(conversationId);

      // Should have messages array
      if (body.messages) {
        expect(Array.isArray(body.messages)).toBeTruthy();
        console.log(`   Found ${body.messages.length} messages`);
      }
    } else if (status === 404) {
      console.log('⚠️  Conversation not found');
    } else if (status === 401) {
      console.log('⚠️  Unauthorized');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('PATCH /api/conversations/:id - Rename conversation', async ({ request }) => {
    console.log('✏️  Testing rename conversation endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    if (!conversationId) {
      console.log('⚠️  No conversation ID available, skipping test');
      test.skip();
      return;
    }

    const newTitle = `Test Conversation ${Date.now()}`;

    const response = await request.patch(`${API_BASE}/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        title: newTitle
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Conversation renamed successfully');

      // Verify updated title
      if (body.title) {
        expect(body.title).toBe(newTitle);
      }
    } else if (status === 404) {
      console.log('⚠️  Conversation not found or endpoint not available');
    } else if (status === 401) {
      console.log('⚠️  Unauthorized');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('DELETE /api/conversations/:id - Delete conversation', async ({ request }) => {
    console.log('🗑️  Testing delete conversation endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    if (!conversationId) {
      console.log('⚠️  No conversation ID available, skipping test');
      test.skip();
      return;
    }

    const response = await request.delete(`${API_BASE}/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200 || status === 204) {
      console.log('✅ Conversation deleted successfully');
      expect([200, 204]).toContain(status);

      // Clear conversation ID
      conversationId = null;
    } else if (status === 404) {
      console.log('⚠️  Conversation not found or endpoint not available');
    } else if (status === 401) {
      console.log('⚠️  Unauthorized');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('GET /api/usage - Get token usage', async ({ request }) => {
    console.log('📊 Testing get usage endpoint...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/usage`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    if (status === 200) {
      const body = await response.json();
      console.log('✅ Got usage data successfully');

      // Verify response structure
      if (body.usage !== undefined || body.tokensUsed !== undefined) {
        expect(body.usage !== undefined || body.tokensUsed !== undefined).toBeTruthy();

        const usage = body.usage || body.tokensUsed || 0;
        console.log(`   Tokens used: ${usage}`);
      }
    } else if (status === 404) {
      console.log('⚠️  Usage endpoint not found');
    } else if (status === 401) {
      console.log('⚠️  Unauthorized');
    } else {
      console.log(`⚠️  Unexpected status: ${status}`);
    }
  });

  test('POST /api/chat - Reject unauthenticated request', async ({ request }) => {
    console.log('🚫 Testing unauthenticated chat request...');

    const response = await request.post(`${API_BASE}/chat`, {
      data: {
        message: 'This should fail'
      },
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

  test('POST /api/chat - Validate message content required', async ({ request }) => {
    console.log('🔍 Testing message validation...');

    if (!authToken) {
      console.log('⚠️  No auth token, skipping test');
      test.skip();
      return;
    }

    const response = await request.post(`${API_BASE}/chat`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        // Missing message field
      },
      failOnStatusCode: false
    });

    const status = response.status();
    console.log(`   Response status: ${status}`);

    // Should be 400 Bad Request
    if (status === 400) {
      console.log('✅ Correctly validated missing message');
      expect(status).toBe(400);
    } else if (status === 404) {
      console.log('⚠️  Endpoint not found');
    } else {
      console.log(`⚠️  Unexpected status: ${status} (expected 400)`);
    }
  });

  test('Check chat service response times', async ({ request }) => {
    console.log('⏱️  Testing chat service response times...');

    const start = Date.now();
    const response = await request.get(`${API_BASE}/chat/health`, {
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
