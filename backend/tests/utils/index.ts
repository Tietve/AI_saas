/**
 * Test Utilities Index
 *
 * Centralized export of all test utilities for easy importing
 *
 * Usage:
 * ```typescript
 * import {
 *   createMockUser,
 *   mockOpenAIResponse,
 *   cleanDatabase,
 *   waitForCondition
 * } from '@tests/utils';
 * ```
 */

// Test Helpers
export {
  createMockPrisma,
  createMockUser,
  createMockConversation,
  createMockMessage,
  createMockDocument,
  createMockSubscription,
  waitForCondition,
  sleep,
  generateTestEmail,
  generateTestPassword,
  generateRandomString,
  mockConsole,
  createMockRequest,
  createMockResponse,
  createMockNext,
  assertThrows,
  extractSessionCookie,
  assertSuccess,
  assertError,
  measureExecutionTime,
  retry
} from './test-helpers';

// Mock Factories
export {
  mockOpenAIResponse,
  mockOpenAIStreamChunk,
  mockEmbeddingResponse,
  mockEmbeddingVector,
  mockCloudflareTextResponse,
  mockCloudflareEmbeddingResponse,
  mockStripeCustomer,
  mockStripeSubscription,
  mockStripePaymentIntent,
  mockStripeCheckoutSession,
  mockStripeWebhookEvent,
  mockRedisClient,
  mockS3Client,
  mockJWTToken,
  mockSocket,
  mockSocketServer,
  mockHTTPResponse,
  mockFileUpload,
  mockPDFParseResult,
  mockEnvVars
} from './mock-factories';

// Database Helpers
export {
  cleanDatabase,
  cleanTestUsers,
  seedTestData,
  createTestUser,
  createTestConversation,
  createTestDocument,
  createTestSubscription,
  createTestTokenUsage,
  getUserTokenUsage,
  getUserConversationCount,
  deleteTestUser,
  truncateAllTables,
  isDatabaseInTestMode,
  waitForDatabase
} from './db-helpers';
