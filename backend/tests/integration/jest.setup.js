/**
 * Jest Setup
 * Runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_saas_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
process.env.AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
process.env.CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3002';
process.env.BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3003';
process.env.ORCHESTRATOR_SERVICE_URL = process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3006';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🚀 Integration Tests Starting...');
  console.log('Environment:', {
    database: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL
  });
});

// Global test teardown
afterAll(async () => {
  console.log('✅ Integration Tests Complete');
});
