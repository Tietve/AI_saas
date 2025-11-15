/**
 * Prisma Client Mock
 */

import { DocumentStatus } from '@prisma/client';

export const mockDocument = {
  id: 'doc-123',
  userId: 'user-123',
  title: 'Test Document',
  fileName: 'test.pdf',
  contentType: 'application/pdf',
  fileSize: 1024 * 100,
  storageKey: 'pdfs/user-123/1234567890-test.pdf',
  pageCount: 5,
  status: DocumentStatus.COMPLETED,
  errorMessage: null,
  uploadedAt: new Date('2024-01-01T00:00:00Z'),
  processedAt: new Date('2024-01-01T00:01:00Z'),
  deletedAt: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:01:00Z'),
};

export const createMockPrismaClient = () => ({
  conversation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  tokenUsage: {
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  document: {
    create: jest.fn().mockResolvedValue(mockDocument),
    findFirst: jest.fn().mockResolvedValue(mockDocument),
    findMany: jest.fn().mockResolvedValue([mockDocument]),
    findUnique: jest.fn().mockResolvedValue(mockDocument),
    update: jest.fn().mockResolvedValue(mockDocument),
    delete: jest.fn().mockResolvedValue(mockDocument),
    count: jest.fn().mockResolvedValue(0),
  },
  documentChunk: {
    createMany: jest.fn().mockResolvedValue({ count: 10 }),
    count: jest.fn().mockResolvedValue(10),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
  $disconnect: jest.fn().mockResolvedValue(undefined),
});

export const mockPrismaClient = createMockPrismaClient();

export const resetPrismaMocks = () => {
  Object.values(mockPrismaClient).forEach((model: any) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method: any) => {
        if (typeof method.mockReset === 'function') {
          method.mockReset();
        }
      });
    }
  });
};

// Mock the database module
jest.mock('../../src/config/database', () => ({
  db: mockPrismaClient,
  withRetry: jest.fn((callback) => callback()),
}));
