// Mock Prisma Client before any imports
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    // Export mock types to avoid import errors
    User: class User {},
    EmailVerificationToken: class EmailVerificationToken {},
    PasswordResetToken: class PasswordResetToken {},
  };
});

// Mock logger
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock metrics
jest.mock('../src/config/metrics', () => ({
  metrics: {
    trackSignup: jest.fn(),
    trackLogin: jest.fn(),
    trackLogout: jest.fn(),
  },
}));

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
  process.env.AUTH_SECRET = 'test-secret-with-at-least-32-characters-for-testing';
});

afterAll(async () => {
  // Cleanup
  jest.clearAllMocks();
});
