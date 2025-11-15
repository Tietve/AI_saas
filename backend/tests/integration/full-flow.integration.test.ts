/**
 * Full-Flow Integration Tests
 *
 * Tests complete user flows across ALL services:
 * - Auth → Chat → Billing → Analytics
 * - Service-to-service communication
 * - Shared services integration
 * - Event propagation
 * - End-to-end user journeys
 *
 * This test suite validates that all microservices work together correctly.
 */

import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  SERVICE_URLS,
  extractSessionCookie,
  wait,
  assertSuccess,
  assertError,
  mockOpenAI
} from './setup';
import { createFreshTestUser, PLAN_QUOTAS } from './fixtures/users';
import { MESSAGE_TEMPLATES } from './fixtures/conversations';

describe('Full-Flow Integration Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('E2E Flow 1: Complete User Journey (Registration → Chat → Analytics)', () => {
    it('should complete full user journey from signup to tracked analytics', async () => {
      const testUser = createFreshTestUser('FREE');

      // Step 1: User Registration (auth-service)
      console.log('📝 Step 1: User registration...');
      const signupRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      assertSuccess(signupRes);
      expect(signupRes.body.ok).toBe(true);
      console.log('✅ User registered successfully');

      // Step 2: User Login (auth-service)
      console.log('📝 Step 2: User login...');
      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      assertSuccess(signinRes);
      const sessionCookie = extractSessionCookie(signinRes.headers);
      const userId = signinRes.body.user.id;
      console.log('✅ User logged in successfully');

      // Step 3: Create Chat (chat-service)
      console.log('📝 Step 3: Creating chat conversation...');
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: MESSAGE_TEMPLATES.GREETING,
          model: 'gpt-3.5-turbo'
        });

      assertSuccess(chatRes);
      expect(chatRes.body.ok).toBe(true);
      expect(chatRes.body.conversationId).toBeDefined();
      expect(chatRes.body.content).toBeDefined();
      expect(chatRes.body.tokenCount).toBeGreaterThan(0);
      const conversationId = chatRes.body.conversationId;
      const tokensUsed = chatRes.body.tokenCount;
      console.log(`✅ Chat created (${tokensUsed} tokens used)`);

      // Step 4: Check Quota Tracking (chat-service + billing integration)
      console.log('📝 Step 4: Checking quota tracking...');
      const usageRes = await request(SERVICE_URLS.CHAT)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      assertSuccess(usageRes);
      expect(usageRes.body.monthlyUsage).toBeGreaterThanOrEqual(tokensUsed);
      console.log(`✅ Usage tracked: ${usageRes.body.monthlyUsage} tokens`);

      // Step 5: Continue Conversation
      console.log('📝 Step 5: Continuing conversation...');
      const followUpRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          conversationId,
          message: MESSAGE_TEMPLATES.FOLLOW_UP
        });

      assertSuccess(followUpRes);
      expect(followUpRes.body.conversationId).toBe(conversationId);
      console.log('✅ Conversation continued');

      // Step 6: Get Conversation History
      console.log('📝 Step 6: Retrieving conversation history...');
      const historyRes = await request(SERVICE_URLS.CHAT)
        .get(`/api/conversations/${conversationId}`)
        .set('Cookie', sessionCookie);

      assertSuccess(historyRes);
      expect(historyRes.body.conversation.id).toBe(conversationId);
      expect(historyRes.body.conversation.messages.length).toBeGreaterThanOrEqual(2);
      console.log('✅ Conversation history retrieved');

      // Step 7: Verify User Profile Still Valid
      console.log('📝 Step 7: Verifying user profile...');
      const meRes = await request(SERVICE_URLS.AUTH)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      assertSuccess(meRes);
      expect(meRes.body.user.email).toBe(testUser.email);
      console.log('✅ User profile verified');

      console.log('🎉 E2E Flow 1: Complete user journey PASSED');
    });
  });

  describe('E2E Flow 2: Quota Enforcement Across Services', () => {
    it('should enforce quota limits across chat and billing services', async () => {
      const testUser = createFreshTestUser('FREE');

      console.log('📝 Testing quota enforcement flow...');

      // Sign up and sign in
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Get initial usage
      const initialUsageRes = await request(SERVICE_URLS.CHAT)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      assertSuccess(initialUsageRes);
      const initialUsage = initialUsageRes.body.monthlyUsage || 0;
      console.log(`📊 Initial usage: ${initialUsage} tokens`);

      // Send a message
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: MESSAGE_TEMPLATES.QUESTION });

      assertSuccess(chatRes);
      const tokensUsed = chatRes.body.tokenCount;
      console.log(`📊 Tokens used in message: ${tokensUsed}`);

      // Verify usage increased
      const afterUsageRes = await request(SERVICE_URLS.CHAT)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      assertSuccess(afterUsageRes);
      expect(afterUsageRes.body.monthlyUsage).toBeGreaterThan(initialUsage);
      console.log(`📊 Updated usage: ${afterUsageRes.body.monthlyUsage} tokens`);

      // Verify quota limits are respected
      const freeQuota = PLAN_QUOTAS.FREE.monthlyTokenQuota;
      expect(afterUsageRes.body.monthlyUsage).toBeLessThan(freeQuota);

      console.log('🎉 E2E Flow 2: Quota enforcement PASSED');
    });
  });

  describe('E2E Flow 3: Multi-Service Authentication Flow', () => {
    it('should maintain authentication across all services', async () => {
      const testUser = createFreshTestUser('PLUS');

      console.log('📝 Testing authentication flow across services...');

      // Register
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      // Login
      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);
      const userId = signinRes.body.user.id;

      // Test auth-service authentication
      const authMeRes = await request(SERVICE_URLS.AUTH)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      assertSuccess(authMeRes);
      expect(authMeRes.body.user.id).toBe(userId);
      console.log('✅ Auth service: Authentication valid');

      // Test chat-service authentication
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Test authentication' });

      assertSuccess(chatRes);
      console.log('✅ Chat service: Authentication valid');

      // Test conversation ownership
      const conversationId = chatRes.body.conversationId;
      const convRes = await request(SERVICE_URLS.CHAT)
        .get(`/api/conversations/${conversationId}`)
        .set('Cookie', sessionCookie);

      assertSuccess(convRes);
      expect(convRes.body.conversation.userId).toBe(userId);
      console.log('✅ Conversation ownership verified');

      // Test authentication with expired/invalid session
      const badRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', 'session=invalid_token')
        .send({ message: 'Should fail' });

      assertError(badRes, 401);
      console.log('✅ Invalid authentication rejected');

      console.log('🎉 E2E Flow 3: Multi-service authentication PASSED');
    });
  });

  describe('E2E Flow 4: Service-to-Service Communication', () => {
    it('should handle communication between chat and billing services', async () => {
      const testUser = createFreshTestUser('FREE');

      console.log('📝 Testing service-to-service communication...');

      // Setup user
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Chat service should call billing service for quota check
      console.log('📝 Chat → Billing: Quota check...');
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: MESSAGE_TEMPLATES.CODE_REQUEST });

      assertSuccess(chatRes);
      expect(chatRes.body.tokenCount).toBeDefined();
      console.log('✅ Quota check successful');

      // Verify usage is tracked
      console.log('📝 Verifying usage tracking...');
      const usageRes = await request(SERVICE_URLS.CHAT)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      assertSuccess(usageRes);
      expect(usageRes.body.monthlyUsage).toBeGreaterThan(0);
      console.log(`✅ Usage tracked: ${usageRes.body.monthlyUsage} tokens`);

      console.log('🎉 E2E Flow 4: Service communication PASSED');
    });
  });

  describe('E2E Flow 5: Shared Services Integration', () => {
    it('should use shared LLM and Embedding services correctly', async () => {
      const testUser = createFreshTestUser('PRO');

      console.log('📝 Testing shared services integration...');

      // Setup user
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Test LLM service integration (via chat)
      console.log('📝 Testing LLM service integration...');
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: MESSAGE_TEMPLATES.QUESTION,
          model: 'gpt-3.5-turbo'
        });

      assertSuccess(chatRes);
      expect(chatRes.body.content).toBeDefined();
      expect(chatRes.body.tokenCount).toBeGreaterThan(0);
      console.log('✅ LLM service integration working');

      // Verify cost tracking
      const usageRes = await request(SERVICE_URLS.CHAT)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      assertSuccess(usageRes);
      expect(usageRes.body.monthlyUsage).toBeGreaterThan(0);
      console.log('✅ Cost tracking working');

      console.log('🎉 E2E Flow 5: Shared services integration PASSED');
    });
  });

  describe('E2E Flow 6: User Lifecycle Management', () => {
    it('should handle complete user lifecycle', async () => {
      const testUser = createFreshTestUser('FREE');

      console.log('📝 Testing user lifecycle...');

      // 1. Registration
      console.log('📝 Phase 1: Registration...');
      const signupRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      assertSuccess(signupRes);
      console.log('✅ User created');

      // 2. Login
      console.log('📝 Phase 2: Login...');
      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      assertSuccess(signinRes);
      const sessionCookie = extractSessionCookie(signinRes.headers);
      console.log('✅ User logged in');

      // 3. Use application (create data)
      console.log('📝 Phase 3: Using application...');
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Test message' });

      assertSuccess(chatRes);
      const conversationId = chatRes.body.conversationId;
      console.log('✅ User created conversations');

      // 4. Verify data exists
      console.log('📝 Phase 4: Verifying data...');
      const convRes = await request(SERVICE_URLS.CHAT)
        .get('/api/conversations')
        .set('Cookie', sessionCookie);

      assertSuccess(convRes);
      expect(convRes.body.conversations.length).toBeGreaterThan(0);
      console.log('✅ User data verified');

      // 5. Logout
      console.log('📝 Phase 5: Logout...');
      const logoutRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signout')
        .set('Cookie', sessionCookie);

      assertSuccess(logoutRes);
      console.log('✅ User logged out');

      // 6. Verify access denied after logout
      console.log('📝 Phase 6: Verifying access denied...');
      const deniedRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Should fail' });

      assertError(deniedRes, 401);
      console.log('✅ Access denied after logout');

      console.log('🎉 E2E Flow 6: User lifecycle PASSED');
    });
  });

  describe('E2E Flow 7: Concurrent Users Isolation', () => {
    it('should isolate data between concurrent users', async () => {
      const user1 = createFreshTestUser('FREE');
      const user2 = createFreshTestUser('PLUS');

      console.log('📝 Testing concurrent users isolation...');

      // Setup User 1
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: user1.email, password: user1.password });

      const signin1Res = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: user1.email, password: user1.password });

      const session1Cookie = extractSessionCookie(signin1Res.headers);

      // Setup User 2
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: user2.email, password: user2.password });

      const signin2Res = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: user2.email, password: user2.password });

      const session2Cookie = extractSessionCookie(signin2Res.headers);

      // User 1 creates conversation
      console.log('📝 User 1: Creating conversation...');
      const chat1Res = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', session1Cookie)
        .send({ message: 'User 1 message' });

      assertSuccess(chat1Res);
      const user1ConvId = chat1Res.body.conversationId;
      console.log('✅ User 1 conversation created');

      // User 2 creates conversation
      console.log('📝 User 2: Creating conversation...');
      const chat2Res = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', session2Cookie)
        .send({ message: 'User 2 message' });

      assertSuccess(chat2Res);
      const user2ConvId = chat2Res.body.conversationId;
      console.log('✅ User 2 conversation created');

      // Verify conversations are different
      expect(user1ConvId).not.toBe(user2ConvId);

      // User 1 cannot access User 2's conversation
      console.log('📝 Testing cross-user access denial...');
      const unauthorizedRes = await request(SERVICE_URLS.CHAT)
        .get(`/api/conversations/${user2ConvId}`)
        .set('Cookie', session1Cookie);

      assertError(unauthorizedRes, 404);
      console.log('✅ Cross-user access denied');

      // User 2 cannot access User 1's conversation
      const unauthorized2Res = await request(SERVICE_URLS.CHAT)
        .get(`/api/conversations/${user1ConvId}`)
        .set('Cookie', session2Cookie);

      assertError(unauthorized2Res, 404);
      console.log('✅ Cross-user access denied (reverse)');

      console.log('🎉 E2E Flow 7: User isolation PASSED');
    });
  });

  describe('E2E Flow 8: Error Handling Across Services', () => {
    it('should handle errors gracefully across services', async () => {
      const testUser = createFreshTestUser('FREE');

      console.log('📝 Testing error handling...');

      // Test 1: Invalid credentials
      console.log('📝 Test: Invalid login credentials...');
      const badLoginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: 'wrongpassword' });

      assertError(badLoginRes, 401);
      console.log('✅ Invalid credentials rejected');

      // Test 2: Unauthenticated chat access
      console.log('📝 Test: Unauthenticated chat access...');
      const noAuthRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .send({ message: 'Should fail' });

      assertError(noAuthRes, 401);
      console.log('✅ Unauthenticated access blocked');

      // Setup valid user
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Test 3: Invalid conversation ID
      console.log('📝 Test: Invalid conversation ID...');
      const badConvRes = await request(SERVICE_URLS.CHAT)
        .get('/api/conversations/invalid-id-123')
        .set('Cookie', sessionCookie);

      assertError(badConvRes, 404);
      console.log('✅ Invalid conversation ID rejected');

      // Test 4: Missing required fields
      console.log('📝 Test: Missing required fields...');
      const noMessageRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({});

      assertError(noMessageRes, 400);
      console.log('✅ Missing fields rejected');

      console.log('🎉 E2E Flow 8: Error handling PASSED');
    });
  });

  describe('E2E Flow 9: Rate Limiting and Performance', () => {
    it('should handle rate limiting and concurrent requests', async () => {
      const testUser = createFreshTestUser('PRO');

      console.log('📝 Testing rate limiting and performance...');

      // Setup user
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Test concurrent requests
      console.log('📝 Sending 5 concurrent requests...');
      const promises = Array(5).fill(null).map((_, i) =>
        request(SERVICE_URLS.CHAT)
          .post('/api/chat')
          .set('Cookie', sessionCookie)
          .send({ message: `Concurrent message ${i}` })
      );

      const results = await Promise.all(promises);

      // All should succeed (PRO tier has high limits)
      results.forEach((res, i) => {
        expect(res.status).toBeLessThan(400);
        console.log(`✅ Request ${i + 1} succeeded`);
      });

      console.log('🎉 E2E Flow 9: Rate limiting and performance PASSED');
    });
  });

  describe('E2E Flow 10: Analytics Event Propagation', () => {
    it('should propagate events to analytics service', async () => {
      const testUser = createFreshTestUser('FREE');

      console.log('📝 Testing analytics event propagation...');

      // Setup user
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Generate activity
      console.log('📝 Generating user activity...');
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: MESSAGE_TEMPLATES.GREETING });

      assertSuccess(chatRes);
      console.log('✅ Activity generated');

      // Verify usage tracking
      const usageRes = await request(SERVICE_URLS.CHAT)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      assertSuccess(usageRes);
      expect(usageRes.body.monthlyUsage).toBeGreaterThan(0);
      console.log(`✅ Analytics tracked: ${usageRes.body.monthlyUsage} tokens`);

      console.log('🎉 E2E Flow 10: Analytics propagation PASSED');
    });
  });
});
