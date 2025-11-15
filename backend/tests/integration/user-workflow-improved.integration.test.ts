/**
 * User Workflow Integration Tests (Using New Utilities)
 *
 * This test file demonstrates using the new shared test utilities
 * from /backend/tests/utils/
 *
 * Tests basic user workflows:
 * - User signup → login → chat flow
 * - Session management
 * - Token usage tracking
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  SERVICE_URLS,
  getAuthPrisma
} from './setup';

// ✨ Using new shared utilities
import {
  generateTestEmail,
  generateTestPassword,
  extractSessionCookie,
  assertSuccess,
  assertError,
  waitForCondition,
  sleep,
  createTestUser,
  createTestConversation,
  cleanTestUsers,
  mockOpenAIResponse
} from '../utils';

describe('User Workflow Integration (Improved)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    await setupTestEnvironment();
    prisma = getAuthPrisma();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clean test users before each test
    await cleanTestUsers(prisma);
  });

  describe('Signup → Login → Chat Flow', () => {
    it('should allow user to signup, login, and send chat message', async () => {
      // ✨ Using generateTestEmail() and generateTestPassword()
      const email = generateTestEmail('workflow');
      const password = generateTestPassword();

      // Step 1: Signup
      const signupRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email, password });

      // ✨ Using assertSuccess()
      assertSuccess(signupRes);
      expect(signupRes.body.ok).toBe(true);

      // Step 2: Login
      const loginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email, password });

      assertSuccess(loginRes);

      // ✨ Using extractSessionCookie()
      const sessionCookie = extractSessionCookie(loginRes.headers);
      expect(sessionCookie).toBeDefined();

      // Step 3: Send chat message
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Hello, AI assistant!' });

      assertSuccess(chatRes);
      expect(chatRes.body.ok).toBe(true);
      expect(chatRes.body.conversationId).toBeDefined();
      expect(chatRes.body.content).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const email = generateTestEmail();
      const password = generateTestPassword();

      // Signup first
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email, password });

      // Try login with wrong password
      const loginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email, password: 'WrongPassword123!' });

      // ✨ Using assertError()
      assertError(loginRes, 401);
      expect(loginRes.body.error).toBeDefined();
    });
  });

  describe('Database Helper Usage', () => {
    it('should create test user with database helper', async () => {
      // ✨ Using createTestUser() database helper
      const { user, passwordPlaintext } = await createTestUser(prisma, {
        email: 'dbhelper@test.example',
        planTier: 'PRO',
        password: 'CustomPassword123!'
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('dbhelper@test.example');
      expect(user.planTier).toBe('PRO');
      expect(passwordPlaintext).toBe('CustomPassword123!');

      // Verify user can login
      const loginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: user.email, password: passwordPlaintext });

      assertSuccess(loginRes);
    });

    it('should create test conversation with database helper', async () => {
      // Create user first
      const { user, passwordPlaintext } = await createTestUser(prisma);

      // ✨ Using createTestConversation() database helper
      const { conversation, messages } = await createTestConversation(
        prisma,
        user.id,
        {
          title: 'Test Conversation',
          messageCount: 6
        }
      );

      expect(conversation.id).toBeDefined();
      expect(conversation.userId).toBe(user.id);
      expect(conversation.title).toBe('Test Conversation');
      expect(messages).toHaveLength(6);

      // Verify alternating roles
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[2].role).toBe('user');
    });
  });

  describe('Async Helper Usage', () => {
    it('should wait for async condition', async () => {
      const email = generateTestEmail();
      const password = generateTestPassword();

      // Signup
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email, password });

      // Login
      const loginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email, password });

      const sessionCookie = extractSessionCookie(loginRes.headers);

      // Send chat message
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Create a conversation' });

      const conversationId = chatRes.body.conversationId;

      // ✨ Using waitForCondition() to wait for conversation to be saved
      await waitForCondition(async () => {
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId }
        });
        return conv !== null;
      }, 5000);

      // Verify conversation exists
      const savedConversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      expect(savedConversation).not.toBeNull();
      expect(savedConversation?.id).toBe(conversationId);
    });

    it('should use sleep helper', async () => {
      const start = Date.now();

      // ✨ Using sleep() helper
      await sleep(200);

      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across multiple requests', async () => {
      const { user, passwordPlaintext } = await createTestUser(prisma);

      // Login
      const loginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: user.email, password: passwordPlaintext });

      const sessionCookie = extractSessionCookie(loginRes.headers);

      // Make multiple authenticated requests
      for (let i = 0; i < 3; i++) {
        const meRes = await request(SERVICE_URLS.AUTH)
          .get('/api/auth/me')
          .set('Cookie', sessionCookie);

        assertSuccess(meRes);
        expect(meRes.body.user.email).toBe(user.email);

        // ✨ Using sleep() between requests
        await sleep(100);
      }
    });

    it('should expire session after logout', async () => {
      const { user, passwordPlaintext } = await createTestUser(prisma);

      // Login
      const loginRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: user.email, password: passwordPlaintext });

      const sessionCookie = extractSessionCookie(loginRes.headers);

      // Verify session works
      const meRes = await request(SERVICE_URLS.AUTH)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      assertSuccess(meRes);

      // Logout
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signout')
        .set('Cookie', sessionCookie);

      // ✨ Using sleep() to ensure logout completes
      await sleep(100);

      // Try to use expired session
      const expiredRes = await request(SERVICE_URLS.AUTH)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      assertError(expiredRes, 401);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing email on signup', async () => {
      const signupRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ password: 'TestPassword123!' });

      assertError(signupRes, 400);
    });

    it('should handle duplicate email signup', async () => {
      const email = generateTestEmail();
      const password = generateTestPassword();

      // First signup
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email, password });

      // Duplicate signup
      const duplicateRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email, password });

      assertError(duplicateRes, 409);
    });

    it('should handle unauthorized chat access', async () => {
      // Try to chat without authentication
      const chatRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .send({ message: 'Hello' });

      assertError(chatRes, 401);
    });
  });
});
