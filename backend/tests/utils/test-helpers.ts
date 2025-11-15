/**
 * Test Helpers - Core Utilities
 *
 * Reusable test utilities for mocking, assertions, and async operations
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { randomBytes } from 'crypto';

/**
 * Create a deep mock of PrismaClient for unit tests
 */
export function createMockPrisma(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>();
}

/**
 * Create a mock user object with sensible defaults
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `user-${randomBytes(8).toString('hex')}`,
    email: overrides.email || `test-${randomBytes(4).toString('hex')}@example.com`,
    emailLower: overrides.emailLower || overrides.email?.toLowerCase() || `test-${randomBytes(4).toString('hex')}@example.com`,
    username: overrides.username || `testuser_${randomBytes(4).toString('hex')}`,
    passwordHash: overrides.passwordHash || '$2b$10$hashedpassword',
    planTier: overrides.planTier || 'FREE',
    isEmailVerified: overrides.isEmailVerified ?? true,
    emailVerifiedAt: overrides.emailVerifiedAt || new Date(),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
}

/**
 * Create a mock conversation object
 */
export function createMockConversation(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `conv-${randomBytes(8).toString('hex')}`,
    userId: overrides.userId || `user-${randomBytes(8).toString('hex')}`,
    title: overrides.title || 'Test Conversation',
    model: overrides.model || 'gpt-3.5-turbo',
    systemPrompt: overrides.systemPrompt || null,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
}

/**
 * Create a mock message object
 */
export function createMockMessage(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `msg-${randomBytes(8).toString('hex')}`,
    conversationId: overrides.conversationId || `conv-${randomBytes(8).toString('hex')}`,
    role: overrides.role || 'user',
    content: overrides.content || 'Test message content',
    tokenCount: overrides.tokenCount || 10,
    model: overrides.model || 'gpt-3.5-turbo',
    createdAt: overrides.createdAt || new Date(),
    ...overrides
  };
}

/**
 * Create a mock document object
 */
export function createMockDocument(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || `doc-${randomBytes(8).toString('hex')}`,
    userId: overrides.userId || `user-${randomBytes(8).toString('hex')}`,
    filename: overrides.filename || 'test-document.pdf',
    mimeType: overrides.mimeType || 'application/pdf',
    sizeBytes: overrides.sizeBytes || 1024 * 100, // 100KB
    s3Key: overrides.s3Key || `documents/${randomBytes(16).toString('hex')}.pdf`,
    textContent: overrides.textContent || 'Sample extracted text content',
    pageCount: overrides.pageCount || 5,
    embeddingStatus: overrides.embeddingStatus || 'completed',
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
}

/**
 * Create a mock subscription object
 */
export function createMockSubscription(overrides: Partial<any> = {}) {
  const now = Date.now();
  return {
    id: overrides.id || `sub-${randomBytes(8).toString('hex')}`,
    userId: overrides.userId || `user-${randomBytes(8).toString('hex')}`,
    stripeSubscriptionId: overrides.stripeSubscriptionId || `sub_stripe_${randomBytes(8).toString('hex')}`,
    stripeCustomerId: overrides.stripeCustomerId || `cus_stripe_${randomBytes(8).toString('hex')}`,
    planTier: overrides.planTier || 'PLUS',
    status: overrides.status || 'active',
    currentPeriodStart: overrides.currentPeriodStart || new Date(now),
    currentPeriodEnd: overrides.currentPeriodEnd || new Date(now + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: overrides.cancelAtPeriodEnd ?? false,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
}

/**
 * Wait for a condition to become true
 *
 * @param condition - Function returning boolean or Promise<boolean>
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Check interval in milliseconds
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();

  while (!(await condition())) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test email
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString('hex')}@test.example`;
}

/**
 * Generate random test password
 */
export function generateTestPassword(): string {
  return `TestPass${randomBytes(8).toString('hex')}!123`;
}

/**
 * Generate random string
 */
export function generateRandomString(length = 16): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Mock console methods to suppress output during tests
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  const mocks = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
    debug: jest.spyOn(console, 'debug').mockImplementation()
  };

  return {
    restore: () => {
      Object.keys(mocks).forEach((key) => {
        mocks[key as keyof typeof mocks].mockRestore();
      });
    },
    mocks,
    originalConsole
  };
}

/**
 * Create a mock request object (Express)
 */
export function createMockRequest(overrides: Partial<any> = {}) {
  return {
    body: overrides.body || {},
    params: overrides.params || {},
    query: overrides.query || {},
    headers: overrides.headers || {},
    user: overrides.user || null,
    session: overrides.session || {},
    cookies: overrides.cookies || {},
    ...overrides
  };
}

/**
 * Create a mock response object (Express)
 */
export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  return res;
}

/**
 * Create a mock next function (Express)
 */
export function createMockNext() {
  return jest.fn();
}

/**
 * Assert that a function throws an error with specific message
 */
export async function assertThrows(
  fn: () => any | Promise<any>,
  expectedMessage?: string | RegExp
): Promise<Error> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (expectedMessage) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    }
    return error;
  }
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
    const sessionCookie = setCookie.find((cookie: string) =>
      cookie.startsWith('session=') || cookie.startsWith('connect.sid=')
    );
    if (!sessionCookie) {
      throw new Error('No session cookie found in set-cookie headers');
    }
    return sessionCookie.split(';')[0];
  }

  return setCookie.split(';')[0];
}

/**
 * Assert API response is successful (2xx status)
 */
export function assertSuccess(response: any, expectedStatus = 200) {
  if (response.status >= 400) {
    console.error('Request failed:', {
      status: response.status,
      body: response.body
    });
  }
  expect(response.status).toBe(expectedStatus);
}

/**
 * Assert API response has error (4xx or 5xx status)
 */
export function assertError(response: any, expectedStatus?: number) {
  if (expectedStatus) {
    expect(response.status).toBe(expectedStatus);
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  expect(response.body.error || response.body.message).toBeDefined();
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Retry a function until it succeeds or max attempts reached
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}
