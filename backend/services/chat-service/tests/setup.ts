/**
 * Jest Test Setup
 *
 * Global setup for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Document service environment variables
process.env.CF_R2_ENDPOINT = 'https://test-endpoint.r2.cloudflarestorage.com';
process.env.CF_R2_ACCESS_KEY_ID = 'test-access-key';
process.env.CF_R2_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.PDF_BUCKET_NAME = 'test-bucket';
process.env.PDF_MAX_SIZE = '10485760'; // 10MB

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
