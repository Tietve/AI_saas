// Jest setup file
// Runs before each test suite

// Import reflect-metadata for tsyringe DI (use require for CommonJS)
require('reflect-metadata')

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Suppress console logs in tests unless debugging
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}
