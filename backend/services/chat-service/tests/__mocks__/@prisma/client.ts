/**
 * Mock @prisma/client module
 *
 * Provides type exports needed by repositories
 */

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  pinned: boolean;
  status: string;
  temperature?: number | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  tokenCount: number;
  model?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  id: string;
  userId: string;
  messageId?: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  storageKey: string;
  pageCount?: number | null;
  status: DocumentStatus;
  errorMessage?: string | null;
  uploadedAt: Date;
  processedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Create a mock instance factory
const createMockPrismaInstance = () => ({
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
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  documentChunk: {
    createMany: jest.fn(),
    count: jest.fn(),
  },

  $transaction: jest.fn(),
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $queryRawUnsafe: jest.fn(),
});

// Export as a jest.fn() constructor
export const PrismaClient = jest.fn().mockImplementation(createMockPrismaInstance);
