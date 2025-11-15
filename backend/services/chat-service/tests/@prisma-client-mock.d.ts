/**
 * Mock type definitions for @prisma/client
 * Used when Prisma client is not fully generated
 */

declare module '@prisma/client' {
  export enum DocumentStatus {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
  }

  export interface Document {
    id: string;
    userId: string;
    title: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    pageCount: number | null;
    storageKey: string;
    status: DocumentStatus;
    errorMessage: string | null;
    uploadedAt: Date;
    processedAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    chunkIndex: number;
    pageNumber: number | null;
    tokens: number;
    embedding: number[] | null;
    createdAt: Date;
  }

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
  }

  export interface Message {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    contentType: string;
    tokenCount: number;
    model: string | null;
    deletedAt: Date | null;
    deletedBy: string | null;
    createdAt: Date;
  }

  export interface TokenUsage {
    id: string;
    userId: string;
    conversationId: string | null;
    messageId: string | null;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    createdAt: Date;
  }

  export class PrismaClient {
    constructor();
    document: any;
    documentChunk: any;
    conversation: any;
    message: any;
    tokenUsage: any;
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  }
}
