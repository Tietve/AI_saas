/**
 * Prisma Type Definitions for Testing
 *
 * These types are defined manually since Prisma client generation
 * may not be available in test environments
 */

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  pinned: boolean;
  status: string;
  temperature: number | null;
  deletedAt: Date | null;
  deletedBy: string | null;
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
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  id: string;
  userId: string;
  messageId: string | null;
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
  pageCount: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  uploadedAt: Date;
  processedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
