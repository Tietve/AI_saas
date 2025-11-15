/**
 * Test Utilities Usage Examples
 *
 * This file demonstrates how to use the shared test utilities
 * from /backend/tests/utils/
 *
 * DO NOT RUN THIS FILE - It's for reference only
 */

import { PrismaClient } from '@prisma/client';
import {
  // Test Helpers
  createMockUser,
  createMockConversation,
  createMockMessage,
  createMockDocument,
  waitForCondition,
  sleep,
  generateTestEmail,
  mockConsole,
  createMockRequest,
  createMockResponse,
  assertThrows,
  retry,
  measureExecutionTime,

  // Mock Factories
  mockOpenAIResponse,
  mockEmbeddingResponse,
  mockStripeSubscription,
  mockStripeWebhookEvent,
  mockRedisClient,
  mockS3Client,
  mockFileUpload,
  mockPDFParseResult,

  // Database Helpers
  cleanDatabase,
  seedTestData,
  createTestUser,
  createTestConversation,
  deleteTestUser,
  waitForDatabase
} from '../utils';

describe('Test Utilities Usage Examples', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await waitForDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('Example 1: Using Mock Creators', () => {
    it('should create mock user objects', () => {
      // Create a mock user with defaults
      const user1 = createMockUser();
      expect(user1.id).toBeDefined();
      expect(user1.email).toBeDefined();
      expect(user1.planTier).toBe('FREE');

      // Create a mock user with overrides
      const user2 = createMockUser({
        email: 'custom@example.com',
        planTier: 'PRO',
        isEmailVerified: false
      });
      expect(user2.email).toBe('custom@example.com');
      expect(user2.planTier).toBe('PRO');
      expect(user2.isEmailVerified).toBe(false);
    });

    it('should create mock conversations and messages', () => {
      const conversation = createMockConversation({
        title: 'Test Chat',
        model: 'gpt-4'
      });

      const message = createMockMessage({
        conversationId: conversation.id,
        content: 'Hello, world!',
        role: 'user'
      });

      expect(conversation.title).toBe('Test Chat');
      expect(message.conversationId).toBe(conversation.id);
    });
  });

  describe('Example 2: Using External API Mocks', () => {
    it('should mock OpenAI responses', () => {
      const response = mockOpenAIResponse('This is a test response', {
        model: 'gpt-4',
        prompt_tokens: 50,
        completion_tokens: 100
      });

      expect(response.choices[0].message.content).toBe('This is a test response');
      expect(response.model).toBe('gpt-4');
      expect(response.usage.total_tokens).toBe(150);
    });

    it('should mock embedding responses', () => {
      const embedding = mockEmbeddingResponse(1536, {
        model: 'text-embedding-3-small'
      });

      expect(embedding.data[0].embedding).toHaveLength(1536);
      expect(embedding.model).toBe('text-embedding-3-small');
    });

    it('should mock Stripe objects', () => {
      const subscription = mockStripeSubscription({
        status: 'active',
        customer: 'cus_123'
      });

      expect(subscription.status).toBe('active');
      expect(subscription.customer).toBe('cus_123');
      expect(subscription.id).toMatch(/^sub_/);
    });

    it('should mock Stripe webhook events', () => {
      const subscription = mockStripeSubscription();
      const event = mockStripeWebhookEvent(
        'customer.subscription.updated',
        subscription
      );

      expect(event.type).toBe('customer.subscription.updated');
      expect(event.data.object).toBe(subscription);
    });
  });

  describe('Example 3: Using Database Helpers', () => {
    it('should seed test data', async () => {
      const seeded = await seedTestData(prisma);

      expect(seeded.users.free.planTier).toBe('FREE');
      expect(seeded.users.plus.planTier).toBe('PLUS');
      expect(seeded.users.pro.planTier).toBe('PRO');
      expect(seeded.passwordPlaintext).toBe('TestPassword123!');
    });

    it('should create test users with options', async () => {
      const { user, passwordPlaintext } = await createTestUser(prisma, {
        email: 'custom@test.example',
        planTier: 'PRO',
        password: 'CustomPass123!'
      });

      expect(user.email).toBe('custom@test.example');
      expect(user.planTier).toBe('PRO');
      expect(passwordPlaintext).toBe('CustomPass123!');
    });

    it('should create test conversations', async () => {
      const { user } = await createTestUser(prisma);
      const { conversation, messages } = await createTestConversation(
        prisma,
        user.id,
        { messageCount: 4 }
      );

      expect(conversation.userId).toBe(user.id);
      expect(messages).toHaveLength(4);
    });

    it('should clean up test users', async () => {
      const { user } = await createTestUser(prisma);
      const userId = user.id;

      // Verify user exists
      const foundUser = await prisma.user.findUnique({ where: { id: userId } });
      expect(foundUser).not.toBeNull();

      // Delete user
      await deleteTestUser(prisma, userId);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({ where: { id: userId } });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Example 4: Using Async Helpers', () => {
    it('should wait for conditions', async () => {
      let counter = 0;
      const incrementer = setInterval(() => counter++, 100);

      await waitForCondition(() => counter >= 5, 2000);

      clearInterval(incrementer);
      expect(counter).toBeGreaterThanOrEqual(5);
    });

    it('should retry failed operations', async () => {
      let attempts = 0;

      const result = await retry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Not ready yet');
          }
          return 'success';
        },
        5,
        100
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should measure execution time', async () => {
      const { result, duration } = await measureExecutionTime(async () => {
        await sleep(100);
        return 'completed';
      });

      expect(result).toBe('completed');
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Example 5: Using Express Mocks', () => {
    it('should create mock request/response', () => {
      const req = createMockRequest({
        body: { message: 'Hello' },
        user: createMockUser()
      });

      const res = createMockResponse();

      // Simulate controller logic
      res.status(200).json({ message: 'Hello from controller' });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Hello from controller' });
    });
  });

  describe('Example 6: Using Service Mocks', () => {
    it('should mock Redis client', () => {
      const redis = mockRedisClient();

      redis.get.mockResolvedValue('cached-value');
      redis.set.mockResolvedValue('OK');

      expect(redis.get).toBeDefined();
      expect(redis.set).toBeDefined();
    });

    it('should mock S3 client', () => {
      const s3 = mockS3Client();

      expect(s3.upload).toBeDefined();
      expect(s3.getObject).toBeDefined();
      expect(s3.deleteObject).toBeDefined();
    });

    it('should mock file uploads', () => {
      const file = mockFileUpload({
        originalname: 'my-document.pdf',
        size: 1024 * 500 // 500KB
      });

      expect(file.originalname).toBe('my-document.pdf');
      expect(file.size).toBe(512000);
      expect(file.mimetype).toBe('application/pdf');
    });

    it('should mock PDF parsing results', () => {
      const pdfResult = mockPDFParseResult({
        numpages: 10,
        text: 'Sample PDF content',
        title: 'My Document'
      });

      expect(pdfResult.numpages).toBe(10);
      expect(pdfResult.text).toBe('Sample PDF content');
      expect(pdfResult.info.Title).toBe('My Document');
    });
  });

  describe('Example 7: Using Console Mocks', () => {
    it('should suppress console output', () => {
      const consoleMock = mockConsole();

      console.log('This will be mocked');
      console.error('This error will be mocked');

      expect(consoleMock.mocks.log).toHaveBeenCalledWith('This will be mocked');
      expect(consoleMock.mocks.error).toHaveBeenCalledWith('This error will be mocked');

      consoleMock.restore();
    });
  });

  describe('Example 8: Using Assertion Helpers', () => {
    it('should assert throws with message', async () => {
      const error = await assertThrows(
        async () => {
          throw new Error('Something went wrong');
        },
        'went wrong'
      );

      expect(error.message).toContain('went wrong');
    });

    it('should generate test emails and passwords', () => {
      const email = generateTestEmail('integration');
      const password = generateTestEmail();

      expect(email).toMatch(/integration-\d+-[a-f0-9]+@test\.example/);
      expect(password).toMatch(/test-\d+-[a-f0-9]+@test\.example/);
    });
  });
});
