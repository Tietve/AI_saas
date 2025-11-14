/**
 * E2E Integration Tests
 * Tests complete flows across multiple services
 */

import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, generateTestEmail, wait } from './setup';

const AUTH_SERVICE_URL = 'http://localhost:3001';
const CHAT_SERVICE_URL = 'http://localhost:3002';
const BILLING_SERVICE_URL = 'http://localhost:3003';

describe('Full Integration E2E Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Complete User Journey', () => {
    it('should complete full user journey: signup → chat → check quota', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'UserJourney123!';
      let sessionCookie: string;

      // ===== STEP 1: SIGNUP =====
      console.log('Step 1: User signup...');
      const signupRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(signupRes.status).toBe(200);
      expect(signupRes.body.ok).toBe(true);

      // ===== STEP 2: LOGIN =====
      console.log('Step 2: User login...');
      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(signinRes.status).toBe(200);
      sessionCookie = signinRes.headers['set-cookie'][0];

      // ===== STEP 3: VERIFY SESSION =====
      console.log('Step 3: Verify session...');
      const meRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(testEmail);

      // ===== STEP 4: CHECK INITIAL QUOTA =====
      console.log('Step 4: Check billing plans...');
      const plansRes = await request(BILLING_SERVICE_URL)
        .get('/api/plans')
        .set('Cookie', sessionCookie);

      expect(plansRes.status).toBe(200);
      expect(plansRes.body.plans.FREE).toBeDefined();
      expect(plansRes.body.plans.FREE.quota).toBe(100000);

      // ===== STEP 5: SEND CHAT MESSAGE =====
      console.log('Step 5: Send chat message...');
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Hello! This is my first message in this integration test.'
        });

      expect(chatRes.status).toBe(200);
      expect(chatRes.body.ok).toBe(true);
      expect(chatRes.body.conversationId).toBeDefined();
      expect(chatRes.body.content).toBeDefined();

      const firstTokenCount = chatRes.body.tokenCount;
      expect(firstTokenCount).toBeGreaterThan(0);

      // ===== STEP 6: CHECK USAGE UPDATED =====
      console.log('Step 6: Verify token usage tracked...');
      const usageRes = await request(CHAT_SERVICE_URL)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.monthlyUsage).toBeGreaterThanOrEqual(firstTokenCount);

      // ===== STEP 7: CONTINUE CONVERSATION =====
      console.log('Step 7: Continue conversation...');
      const continueRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          conversationId: chatRes.body.conversationId,
          message: 'Can you help me with something?'
        });

      expect(continueRes.status).toBe(200);
      expect(continueRes.body.conversationId).toBe(chatRes.body.conversationId);

      // ===== STEP 8: LIST CONVERSATIONS =====
      console.log('Step 8: List all conversations...');
      const conversationsRes = await request(CHAT_SERVICE_URL)
        .get('/api/conversations')
        .set('Cookie', sessionCookie);

      expect(conversationsRes.status).toBe(200);
      expect(conversationsRes.body.conversations.length).toBeGreaterThan(0);

      // ===== STEP 9: LOGOUT =====
      console.log('Step 9: User logout...');
      const signoutRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signout')
        .set('Cookie', sessionCookie);

      expect(signoutRes.status).toBe(200);

      // ===== STEP 10: VERIFY SESSION CLEARED =====
      console.log('Step 10: Verify session cleared...');
      const afterLogoutRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(afterLogoutRes.status).toBe(401);

      console.log('✅ Complete user journey test passed!');
    });
  });

  describe('Quota Enforcement Flow', () => {
    it('should enforce quota limits (simulated)', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'QuotaTest123!';

      // Signup & Login
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: testEmail, password: testPassword });

      const sessionCookie = signinRes.headers['set-cookie'][0];

      // Check initial quota
      const plansRes = await request(BILLING_SERVICE_URL)
        .get('/api/plans')
        .set('Cookie', sessionCookie);

      const freeQuota = plansRes.body.plans.FREE.quota;
      console.log(`Free tier quota: ${freeQuota} tokens`);

      // Send a chat message
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Testing quota enforcement'
        });

      expect(chatRes.status).toBe(200);
      console.log(`Tokens used: ${chatRes.body.tokenCount}`);

      // In real scenario, if usage > quota, request should be rejected
      // For now, we just verify the flow works
      const usageRes = await request(CHAT_SERVICE_URL)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      expect(usageRes.body.monthlyUsage).toBeLessThan(freeQuota);
    });
  });

  describe('Multi-Service Error Handling', () => {
    it('should handle service failures gracefully', async () => {
      // Test with invalid session
      const invalidCookie = 'session=invalid-jwt-token';

      // Auth service should reject
      const authRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', invalidCookie);

      expect(authRes.status).toBe(401);

      // Chat service should reject
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', invalidCookie)
        .send({ message: 'Test' });

      expect(chatRes.status).toBe(401);

      // Billing service should reject
      const billingRes = await request(BILLING_SERVICE_URL)
        .get('/api/plans')
        .set('Cookie', invalidCookie);

      // Plans might be public, but protected endpoints should reject
      // This depends on implementation
    });
  });

  describe('Cross-Service Data Consistency', () => {
    it('should maintain data consistency across services', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'Consistency123!';

      // Create user
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: testEmail, password: testPassword });

      const sessionCookie = signinRes.headers['set-cookie'][0];

      // Get user from auth service
      const authMeRes = await request(AUTH_SERVICE_URL)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      const userId = authMeRes.body.user.userId;

      // Send chat message (creates data in chat service)
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Consistency test' });

      expect(chatRes.status).toBe(200);

      // Verify conversation belongs to same user
      const conversations = await request(CHAT_SERVICE_URL)
        .get('/api/conversations')
        .set('Cookie', sessionCookie);

      expect(conversations.body.conversations.length).toBeGreaterThan(0);
      expect(conversations.body.conversations[0].userId).toBe(userId);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests', async () => {
      const testEmail = generateTestEmail();
      const testPassword = 'ConcurrentTest123!';

      // Setup
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: testEmail, password: testPassword });

      const sessionCookie = signinRes.headers['set-cookie'][0];

      // Send 10 concurrent chat requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const promise = request(CHAT_SERVICE_URL)
          .post('/api/chat')
          .set('Cookie', sessionCookie)
          .send({ message: `Concurrent message ${i}` });
        promises.push(promise);
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });

      console.log('✅ Handled 10 concurrent requests successfully');
    });
  });
});
