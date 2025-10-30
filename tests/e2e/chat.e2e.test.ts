/**
 * E2E Tests for Chat Service
 * Tests chat functionality and AI integration
 */

import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, generateTestEmail } from './setup';

const AUTH_SERVICE_URL = 'http://localhost:3001';
const CHAT_SERVICE_URL = 'http://localhost:3002';

describe('Chat Service E2E Tests', () => {
  let sessionCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create and login test user
    const testEmail = generateTestEmail();
    const testPassword = 'ChatTest123!';

    await request(AUTH_SERVICE_URL)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });

    const signinRes = await request(AUTH_SERVICE_URL)
      .post('/api/auth/signin')
      .send({ email: testEmail, password: testPassword });

    sessionCookie = signinRes.headers['set-cookie'][0];

    const meRes = await request(AUTH_SERVICE_URL)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    testUserId = meRes.body.user.userId;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Chat Message Flow', () => {
    it('should send message and receive AI response', async () => {
      const res = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Hello, this is an E2E test message'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.conversationId).toBeDefined();
      expect(res.body.messageId).toBeDefined();
      expect(res.body.content).toBeDefined();
      expect(res.body.tokenCount).toBeGreaterThan(0);
    });

    it('should create conversation on first message', async () => {
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'First message in new conversation'
        });

      const conversationId = chatRes.body.conversationId;

      // Verify conversation was created
      const convRes = await request(CHAT_SERVICE_URL)
        .get(`/api/conversations/${conversationId}`)
        .set('Cookie', sessionCookie);

      expect(convRes.status).toBe(200);
      expect(convRes.body.ok).toBe(true);
      expect(convRes.body.conversation.id).toBe(conversationId);
    });

    it('should continue conversation with context', async () => {
      // First message
      const firstRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'My name is TestUser'
        });

      const conversationId = firstRes.body.conversationId;

      // Second message in same conversation
      const secondRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          conversationId,
          message: 'What is my name?'
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.conversationId).toBe(conversationId);
      expect(secondRes.body.content).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .send({
          message: 'Unauthorized message'
        });

      expect(res.status).toBe(401);
    });

    it('should reject empty messages', async () => {
      const res = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: ''
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Conversation Management', () => {
    it('should list user conversations', async () => {
      // Create a conversation first
      await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Test conversation'
        });

      // List conversations
      const res = await request(CHAT_SERVICE_URL)
        .get('/api/conversations')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.conversations)).toBe(true);
      expect(res.body.conversations.length).toBeGreaterThan(0);
    });

    it('should get conversation with messages', async () => {
      // Create conversation
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Get conversation test'
        });

      const conversationId = chatRes.body.conversationId;

      // Get conversation
      const res = await request(CHAT_SERVICE_URL)
        .get(`/api/conversations/${conversationId}`)
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.conversation.id).toBe(conversationId);
      expect(Array.isArray(res.body.conversation.messages)).toBe(true);
      expect(res.body.conversation.messages.length).toBeGreaterThan(0);
    });

    it('should delete conversation', async () => {
      // Create conversation
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Delete test conversation'
        });

      const conversationId = chatRes.body.conversationId;

      // Delete conversation
      const deleteRes = await request(CHAT_SERVICE_URL)
        .delete(`/api/conversations/${conversationId}`)
        .set('Cookie', sessionCookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.ok).toBe(true);

      // Verify deletion
      const getRes = await request(CHAT_SERVICE_URL)
        .get(`/api/conversations/${conversationId}`)
        .set('Cookie', sessionCookie);

      expect(getRes.status).toBe(404);
    });

    it('should not access other users conversations', async () => {
      // Create second user
      const secondEmail = generateTestEmail();
      await request(AUTH_SERVICE_URL)
        .post('/api/auth/signup')
        .send({ email: secondEmail, password: 'Test123456' });

      const signinRes = await request(AUTH_SERVICE_URL)
        .post('/api/auth/signin')
        .send({ email: secondEmail, password: 'Test123456' });

      const secondUserCookie = signinRes.headers['set-cookie'][0];

      // Create conversation with first user
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Private conversation'
        });

      const conversationId = chatRes.body.conversationId;

      // Try to access with second user
      const unauthorizedRes = await request(CHAT_SERVICE_URL)
        .get(`/api/conversations/${conversationId}`)
        .set('Cookie', secondUserCookie);

      expect(unauthorizedRes.status).toBe(404);
    });
  });

  describe('Token Usage Tracking', () => {
    it('should track token usage', async () => {
      // Send message
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Track my tokens'
        });

      expect(chatRes.body.tokenCount).toBeGreaterThan(0);

      // Get usage stats
      const usageRes = await request(CHAT_SERVICE_URL)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.ok).toBe(true);
      expect(usageRes.body.monthlyUsage).toBeGreaterThan(0);
    });

    it('should increment usage after each message', async () => {
      // Get initial usage
      const initialUsage = await request(CHAT_SERVICE_URL)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      const initialTokens = initialUsage.body.monthlyUsage;

      // Send message
      const chatRes = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Increment usage test'
        });

      const tokensUsed = chatRes.body.tokenCount;

      // Get updated usage
      const updatedUsage = await request(CHAT_SERVICE_URL)
        .get('/api/usage')
        .set('Cookie', sessionCookie);

      const updatedTokens = updatedUsage.body.monthlyUsage;

      expect(updatedTokens).toBeGreaterThanOrEqual(initialTokens + tokensUsed);
    });
  });

  describe('AI Response Quality', () => {
    it('should return mock response when no API key', async () => {
      const res = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: 'Test mock AI'
        });

      expect(res.body.content).toContain('MOCK AI Response');
    });

    it('should handle long messages', async () => {
      const longMessage = 'This is a very long message. '.repeat(100);

      const res = await request(CHAT_SERVICE_URL)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({
          message: longMessage
        });

      expect(res.status).toBe(200);
      expect(res.body.content).toBeDefined();
    });
  });
});
