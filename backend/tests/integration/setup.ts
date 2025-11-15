/**
 * Integration Test Setup
 *
 * Provides test infrastructure for multi-service integration tests:
 * - Database setup/teardown
 * - Redis connection
 * - Mock external APIs (OpenAI, Stripe)
 * - Test data seeding
 */

import { PrismaClient as AuthPrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { randomBytes } from 'crypto';

// Prisma clients for each service
let authPrisma: AuthPrismaClient;
let redisClient: ReturnType<typeof createClient>;

// Service URLs
export const SERVICE_URLS = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  CHAT: process.env.CHAT_SERVICE_URL || 'http://localhost:3002',
  BILLING: process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
  ORCHESTRATOR: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3006',
};

/**
 * Initialize test environment
 */
export async function setupTestEnvironment() {
  console.log('🚀 Setting up integration test environment...');

  // Initialize Prisma clients
  authPrisma = new AuthPrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_saas_test'
      }
    }
  });

  // Initialize Redis client
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️  Redis connection failed (tests may still work):', error);
  }

  // Clean up test data
  await cleanupTestData();

  console.log('✅ Test environment ready');
}

/**
 * Teardown test environment
 */
export async function teardownTestEnvironment() {
  console.log('🧹 Tearing down test environment...');

  // Clean up test data
  await cleanupTestData();

  // Disconnect clients
  if (authPrisma) {
    await authPrisma.$disconnect();
  }

  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }

  console.log('✅ Test environment cleaned up');
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  try {
    // Delete test users (emails containing 'test' or 'integration')
    await authPrisma.user.deleteMany({
      where: {
        OR: [
          { emailLower: { contains: 'test' } },
          { emailLower: { contains: 'integration' } },
          { emailLower: { contains: '@integ.test' } }
        ]
      }
    });

    // Clean up Redis test keys
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys('test:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix = 'integration'): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${random}@integ.test`;
}

/**
 * Generate unique test password
 */
export function generateTestPassword(): string {
  return `TestPass${randomBytes(8).toString('hex')}!123`;
}

/**
 * Wait helper for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock OpenAI API responses
 */
export const mockOpenAI = {
  chatCompletion: {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-3.5-turbo',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a test response from mocked OpenAI API.'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30
    }
  },
  embedding: {
    object: 'list',
    data: [
      {
        object: 'embedding',
        embedding: Array(1536).fill(0).map(() => Math.random()),
        index: 0
      }
    ],
    model: 'text-embedding-3-small',
    usage: {
      prompt_tokens: 8,
      total_tokens: 8
    }
  }
};

/**
 * Mock Stripe API responses
 */
export const mockStripe = {
  customer: {
    id: 'cus_test123',
    object: 'customer',
    email: 'test@integ.test',
    created: Date.now()
  },
  subscription: {
    id: 'sub_test123',
    object: 'subscription',
    status: 'active',
    customer: 'cus_test123',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
  },
  paymentIntent: {
    id: 'pi_test123',
    object: 'payment_intent',
    status: 'succeeded',
    amount: 999,
    currency: 'usd'
  }
};

/**
 * Get Prisma client for auth service
 */
export function getAuthPrisma(): AuthPrismaClient {
  return authPrisma;
}

/**
 * Get Redis client
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Extract session cookie from response headers
 */
export function extractSessionCookie(headers: any): string {
  const setCookie = headers['set-cookie'];
  if (!setCookie) {
    throw new Error('No session cookie found in response');
  }

  if (Array.isArray(setCookie)) {
    const sessionCookie = setCookie.find((cookie: string) => cookie.startsWith('session='));
    if (!sessionCookie) {
      throw new Error('No session cookie found in set-cookie headers');
    }
    return sessionCookie.split(';')[0];
  }

  return setCookie.split(';')[0];
}

/**
 * Create test user directly in database
 */
export async function createTestUser(email?: string, planTier = 'FREE') {
  const testEmail = email || generateTestEmail();
  const passwordHash = '$2b$10$YourHashedPasswordHere'; // bcrypt hash of 'TestPassword123!'

  const user = await authPrisma.user.create({
    data: {
      email: testEmail,
      emailLower: testEmail.toLowerCase(),
      passwordHash,
      planTier,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  return {
    id: user.id,
    email: user.email,
    planTier: user.planTier
  };
}

/**
 * Delete test user by ID
 */
export async function deleteTestUser(userId: string) {
  await authPrisma.user.delete({
    where: { id: userId }
  }).catch(() => {
    // Ignore if user doesn't exist
  });
}

/**
 * Assert response is successful
 */
export function assertSuccess(response: any) {
  if (response.status >= 400) {
    console.error('Request failed:', {
      status: response.status,
      body: response.body
    });
  }
  expect(response.status).toBeLessThan(400);
}

/**
 * Assert response has error
 */
export function assertError(response: any, expectedStatus?: number) {
  if (expectedStatus) {
    expect(response.status).toBe(expectedStatus);
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  expect(response.body.error || response.body.message).toBeDefined();
}
