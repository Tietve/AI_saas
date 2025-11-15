/**
 * Document Types - PDF Q&A System
 *
 * Type definitions for document upload, processing, and RAG queries
 */

// ============================================================================
// Document Models
// ============================================================================

// Use Prisma's generated types
import { Document as PrismaDocument, DocumentStatus as PrismaDocumentStatus } from '@prisma/client';

export type Document = PrismaDocument;
export type DocumentStatus = PrismaDocumentStatus;

// Re-export for convenience
export { DocumentStatus as DocumentStatusEnum } from '@prisma/client';

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

// ============================================================================
// PDF Parsing
// ============================================================================

export interface ParsedPdf {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

export interface PdfParserOptions {
  useFallback?: boolean;
  cleanText?: boolean;
}

// ============================================================================
// Text Chunking
// ============================================================================

export interface Chunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  tokens: number;
}

export interface ChunkingOptions {
  maxTokens?: number;        // Default: 512
  overlapPercentage?: number; // Default: 20 (20% overlap)
  preserveSentences?: boolean; // Default: true
}

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}

// ============================================================================
// Embeddings - MOVED TO SHARED SERVICE
// ============================================================================
// Note: Embedding types are now in backend/shared/services
// Use: import { EmbeddingService, EmbeddingProvider, EmbeddingResult } from '@/backend/shared/services';

// ============================================================================
// Vector Search
// ============================================================================

export interface SimilarChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
}

export interface VectorSearchOptions {
  userId: string;
  topK?: number;              // Default: 5, max: 10
  documentId?: string;        // Optional: search specific document
  minSimilarity?: number;     // Default: 0.7
}

// ============================================================================
// RAG Query
// ============================================================================

export interface RagQueryRequest {
  query: string;
  documentId?: string;
  topK?: number;
  stream?: boolean;
}

export interface RagQueryResponse {
  answer: string;
  sources: Source[];
  tokensUsed: TokenUsage;
}

export interface Source {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
  excerpt: string; // First 200 chars of chunk
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  cost?: number; // Optional: cost in USD
}

export interface RagOptions {
  userId: string;
  documentId?: string;
  topK?: number;
  stream?: boolean;
  model?: string; // OpenAI model (default: gpt-4o-mini)
}

// ============================================================================
// Streaming Response
// ============================================================================

export type RagStreamChunk =
  | { type: 'sources'; sources: Source[] }
  | { type: 'chunk'; content: string }
  | { type: 'done'; tokensUsed: TokenUsage }
  | { type: 'error'; error: string };

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface UploadDocumentRequest {
  file: Express.Multer.File;
  title?: string;
}

export interface UploadDocumentResponse {
  documentId: string;
  title: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface ListDocumentsRequest {
  limit?: number;
  offset?: number;
  status?: DocumentStatus;
}

export interface ListDocumentsResponse {
  documents: DocumentListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentListItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt: string | null;
}

export interface GetDocumentResponse {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  chunksCount?: number;
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class DocumentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DocumentError';
  }
}

export class PdfParsingError extends DocumentError {
  constructor(message: string) {
    super(message, 'PDF_PARSING_ERROR', 400);
    this.name = 'PdfParsingError';
  }
}

// EmbeddingError moved to shared service
// Use: import { EmbeddingError } from '@/backend/shared/services';

export class VectorStoreError extends DocumentError {
  constructor(message: string) {
    super(message, 'VECTOR_STORE_ERROR', 500);
    this.name = 'VectorStoreError';
  }
}

export class QuotaExceededError extends DocumentError {
  constructor(message: string = 'PDF upload quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 429);
    this.name = 'QuotaExceededError';
  }
}

// ============================================================================
// Configuration
// ============================================================================

export interface DocumentConfig {
  // PDF limits
  maxFileSize: number;        // Bytes (default: 10MB)
  allowedMimeTypes: string[]; // Default: ['application/pdf']

  // Chunking
  chunkSize: number;          // Tokens (default: 512)
  chunkOverlap: number;       // Percentage (default: 20)

  // OpenAI
  embeddingModel: string;     // Default: 'text-embedding-3-small'
  chatModel: string;          // Default: 'gpt-4o-mini'
  maxRetries: number;         // Default: 5

  // Vector search
  defaultTopK: number;        // Default: 5
  maxTopK: number;            // Default: 10
  minSimilarity: number;      // Default: 0.7

  // Storage
  r2BucketName: string;
  r2Endpoint: string;
}
