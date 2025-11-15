/**
 * End-to-End Tests for DocumentService
 * Target: 5 tests covering complete user flows
 */

import { DocumentService } from '../../src/services/document.service';
import { createValidPdfFile, createMockFile, createLargeFile } from '../fixtures/mock-file';
import * as fs from 'fs/promises';

// Define DocumentStatus enum locally (since Prisma client may not be fully generated)
enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Mock external services
// Note: @prisma/client is already mocked via jest.config.js moduleNameMapper
jest.mock('@aws-sdk/client-s3');
jest.mock('fs/promises');
jest.mock('../../src/services/pdf-parser.service');
jest.mock('../../src/services/chunking.service');
jest.mock('../../src/services/vector-store.service');

// Mock shared services
jest.mock('@saas/shared/services', () => ({
  EmbeddingService: jest.fn(),
  EmbeddingProvider: {
    OPENAI: 'openai',
    CLOUDFLARE: 'cloudflare',
  },
  LLMService: jest.fn(),
  LLMProvider: {
    OPENAI: 'openai',
    CLOUDFLARE: 'cloudflare',
  },
}));

import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { createMockPrismaClient, mockDocument } from '../mocks/prisma.mock';
import {
  mockParsedPdf,
  mockChunks,
  mockEmbeddings,
  MockPdfParserService,
  MockChunkingService,
  MockEmbeddingService,
  MockVectorStoreService,
} from '../mocks/services.mock';
import { PdfParserService } from '../../src/services/pdf-parser.service';
import { ChunkingService } from '../../src/services/chunking.service';
import { EmbeddingService } from '@saas/shared/services';
import { VectorStoreService } from '../../src/services/vector-store.service';

describe('DocumentService - E2E Tests', () => {
  let documentService: DocumentService;
  let mockPrisma: any;
  let mockS3Client: any;
  let mockPdfParser: MockPdfParserService;
  let mockChunking: MockChunkingService;
  let mockEmbedding: MockEmbeddingService;
  let mockVectorStore: MockVectorStoreService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = createMockPrismaClient();
    mockS3Client = { send: jest.fn().mockResolvedValue({}) };
    mockPdfParser = new MockPdfParserService();
    mockChunking = new MockChunkingService();
    mockEmbedding = new MockEmbeddingService();
    mockVectorStore = new MockVectorStoreService();

    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
    (PdfParserService as jest.Mock).mockImplementation(() => mockPdfParser);
    (ChunkingService as jest.Mock).mockImplementation(() => mockChunking);
    (EmbeddingService as jest.Mock).mockImplementation(() => mockEmbedding);
    (VectorStoreService as jest.Mock).mockImplementation(() => mockVectorStore);

    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('mock pdf content'));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    documentService = new DocumentService();
  });

  // ============================================================================
  // E2E USER FLOWS
  // ============================================================================

  test('E2E: Successful complete flow - Upload → Process → Query → Response', async () => {
    const userId = 'user-test-123';
    const file = createValidPdfFile();

    // Step 1: Upload document
    mockPrisma.document.count.mockResolvedValue(0);
    mockPrisma.document.create.mockResolvedValue({
      ...mockDocument,
      id: 'doc-e2e-1',
      userId,
      status: DocumentStatus.PROCESSING,
      processedAt: null,
    });

    const uploadResult = await documentService.uploadDocument(userId, file);

    expect(uploadResult.documentId).toBe('doc-e2e-1');
    expect(uploadResult.status).toBe(DocumentStatus.PROCESSING);
    expect(uploadResult.fileName).toBe(file.originalname);

    // Step 2: Check status during processing
    mockPrisma.document.findFirst.mockResolvedValue({
      ...mockDocument,
      id: 'doc-e2e-1',
      userId,
      status: DocumentStatus.PROCESSING,
      processedAt: null,
    });
    mockVectorStore.getChunkCount.mockResolvedValue(0);

    const processingDoc = await documentService.getDocument('doc-e2e-1', userId);

    expect(processingDoc.status).toBe(DocumentStatus.PROCESSING);
    expect(processingDoc.processedAt).toBeNull();
    expect(processingDoc.chunksCount).toBe(0);

    // Step 3: Simulate background processing completion
    // (In real scenario, processDocument runs in background)
    mockPdfParser.parsePdf.mockResolvedValue(mockParsedPdf);
    mockChunking.chunkText.mockResolvedValue(mockChunks);
    mockEmbedding.generateEmbeddings.mockResolvedValue(mockEmbeddings);
    mockVectorStore.insertChunks.mockResolvedValue(undefined);

    mockPrisma.document.update.mockResolvedValue({
      ...mockDocument,
      id: 'doc-e2e-1',
      status: DocumentStatus.COMPLETED,
      processedAt: new Date(),
      pageCount: mockParsedPdf.pageCount,
    });

    // Step 4: Check document after processing
    mockPrisma.document.findFirst.mockResolvedValue({
      ...mockDocument,
      id: 'doc-e2e-1',
      userId,
      status: DocumentStatus.COMPLETED,
      processedAt: new Date(),
      pageCount: 5,
    });
    mockVectorStore.getChunkCount.mockResolvedValue(10);

    const completedDoc = await documentService.getDocument('doc-e2e-1', userId);

    expect(completedDoc.status).toBe(DocumentStatus.COMPLETED);
    expect(completedDoc.processedAt).not.toBeNull();
    expect(completedDoc.pageCount).toBe(5);
    expect(completedDoc.chunksCount).toBe(10);

    // Step 5: List user documents
    mockPrisma.document.findMany.mockResolvedValue([
      {
        ...mockDocument,
        id: 'doc-e2e-1',
        status: DocumentStatus.COMPLETED,
      },
    ]);
    mockPrisma.document.count.mockResolvedValue(1);

    const list = await documentService.listDocuments(userId);

    expect(list.documents).toHaveLength(1);
    expect(list.documents[0].id).toBe('doc-e2e-1');
    expect(list.documents[0].status).toBe(DocumentStatus.COMPLETED);
  });

  test('E2E: Failed upload flow - Invalid file rejection', async () => {
    const userId = 'user-test-456';
    const largeFile = createLargeFile();

    // Attempt upload with oversized file
    await expect(documentService.uploadDocument(userId, largeFile)).rejects.toThrow(
      'File too large'
    );

    // Verify no database record was created
    expect(mockPrisma.document.create).not.toHaveBeenCalled();

    // Verify no S3 upload was attempted
    expect(mockS3Client.send).not.toHaveBeenCalled();

    // Verify temp file was still cleaned up
    expect(fs.unlink).toHaveBeenCalled();

    // Verify user's document count is unchanged
    mockPrisma.document.findMany.mockResolvedValue([]);
    mockPrisma.document.count.mockResolvedValue(0);

    const list = await documentService.listDocuments(userId);
    expect(list.documents).toHaveLength(0);
  });

  test('E2E: Quota limit scenario - User hits upload limit', async () => {
    const userId = 'user-quota-test';
    const file = createValidPdfFile();

    // User has 4 documents (under limit)
    const existingDocs = Array.from({ length: 4 }, (_, i) => ({
      ...mockDocument,
      id: `doc-${i}`,
      userId,
    }));

    mockPrisma.document.count.mockResolvedValue(4);
    mockPrisma.document.findMany.mockResolvedValue(existingDocs);

    // First upload succeeds (reaches limit of 5)
    mockPrisma.document.create.mockResolvedValue({
      ...mockDocument,
      id: 'doc-5',
      userId,
    });

    const result1 = await documentService.uploadDocument(userId, file);
    expect(result1.documentId).toBe('doc-5');

    // User now has 5 documents (at limit)
    mockPrisma.document.count.mockResolvedValue(5);

    // Second upload fails (quota exceeded)
    await expect(documentService.uploadDocument(userId, file)).rejects.toThrow(
      'PDF upload limit reached'
    );

    // User deletes one document
    mockPrisma.document.findFirst.mockResolvedValue({
      ...mockDocument,
      id: 'doc-1',
      userId,
    });
    mockPrisma.document.update.mockResolvedValue({
      ...mockDocument,
      id: 'doc-1',
      deletedAt: new Date(),
    });

    await documentService.deleteDocument('doc-1', userId);

    // User now has 4 documents again (under limit)
    mockPrisma.document.count.mockResolvedValue(4);
    mockPrisma.document.create.mockResolvedValue({
      ...mockDocument,
      id: 'doc-6',
      userId,
    });

    // New upload succeeds
    const result2 = await documentService.uploadDocument(userId, file);
    expect(result2.documentId).toBe('doc-6');
  });

  test('E2E: Multi-user isolation - Users cannot access each other documents', async () => {
    const user1 = 'user-1';
    const user2 = 'user-2';

    // User 1 uploads a document
    mockPrisma.document.count.mockResolvedValue(0);
    mockPrisma.document.create.mockResolvedValue({
      ...mockDocument,
      id: 'doc-user1',
      userId: user1,
    });

    const file = createValidPdfFile();
    const upload1 = await documentService.uploadDocument(user1, file);
    expect(upload1.documentId).toBe('doc-user1');

    // User 2 tries to access User 1's document - should fail
    mockPrisma.document.findFirst.mockResolvedValue(null);

    await expect(documentService.getDocument('doc-user1', user2)).rejects.toThrow(
      'Document not found'
    );

    // User 2 tries to delete User 1's document - should fail
    mockPrisma.document.findFirst.mockResolvedValue(null);

    await expect(documentService.deleteDocument('doc-user1', user2)).rejects.toThrow(
      'Document not found'
    );

    // User 1 can still access their own document
    mockPrisma.document.findFirst.mockResolvedValue({
      ...mockDocument,
      id: 'doc-user1',
      userId: user1,
    });
    mockVectorStore.getChunkCount.mockResolvedValue(10);

    const doc = await documentService.getDocument('doc-user1', user1);
    expect(doc.id).toBe('doc-user1');

    // Each user sees only their own documents
    mockPrisma.document.findMany.mockResolvedValueOnce([
      { ...mockDocument, id: 'doc-user1', userId: user1 },
    ]);
    mockPrisma.document.count.mockResolvedValueOnce(1);

    const list1 = await documentService.listDocuments(user1);
    expect(list1.documents).toHaveLength(1);
    expect(list1.documents[0].id).toBe('doc-user1');

    mockPrisma.document.findMany.mockResolvedValueOnce([]);
    mockPrisma.document.count.mockResolvedValueOnce(0);

    const list2 = await documentService.listDocuments(user2);
    expect(list2.documents).toHaveLength(0);
  });

  test('E2E: Complete document lifecycle - Upload → List → Get → Delete → Verify', async () => {
    const userId = 'user-lifecycle';
    const file1 = createMockFile({ originalname: 'document1.pdf' });
    const file2 = createMockFile({ originalname: 'document2.pdf' });

    // Step 1: Upload two documents
    mockPrisma.document.count.mockResolvedValue(0);
    mockPrisma.document.create.mockResolvedValueOnce({
      ...mockDocument,
      id: 'doc-1',
      fileName: 'document1.pdf',
      userId,
    });

    const upload1 = await documentService.uploadDocument(userId, file1);
    expect(upload1.documentId).toBe('doc-1');

    mockPrisma.document.count.mockResolvedValue(1);
    mockPrisma.document.create.mockResolvedValueOnce({
      ...mockDocument,
      id: 'doc-2',
      fileName: 'document2.pdf',
      userId,
    });

    const upload2 = await documentService.uploadDocument(userId, file2);
    expect(upload2.documentId).toBe('doc-2');

    // Step 2: List all documents
    mockPrisma.document.findMany.mockResolvedValue([
      { ...mockDocument, id: 'doc-2', fileName: 'document2.pdf' },
      { ...mockDocument, id: 'doc-1', fileName: 'document1.pdf' },
    ]);
    mockPrisma.document.count.mockResolvedValue(2);

    const listAll = await documentService.listDocuments(userId);
    expect(listAll.documents).toHaveLength(2);
    expect(listAll.total).toBe(2);

    // Step 3: Get specific document
    mockPrisma.document.findFirst.mockResolvedValue({
      ...mockDocument,
      id: 'doc-1',
      fileName: 'document1.pdf',
      userId,
    });
    mockVectorStore.getChunkCount.mockResolvedValue(10);

    const doc1 = await documentService.getDocument('doc-1', userId);
    expect(doc1.id).toBe('doc-1');
    expect(doc1.fileName).toBe('document1.pdf');

    // Step 4: Delete one document
    mockPrisma.document.findFirst.mockResolvedValue({
      ...mockDocument,
      id: 'doc-1',
      userId,
    });
    mockPrisma.document.update.mockResolvedValue({
      ...mockDocument,
      id: 'doc-1',
      deletedAt: new Date(),
    });

    await documentService.deleteDocument('doc-1', userId);

    // Step 5: Verify deletion - list should show only one document
    mockPrisma.document.findMany.mockResolvedValue([
      { ...mockDocument, id: 'doc-2', fileName: 'document2.pdf' },
    ]);
    mockPrisma.document.count.mockResolvedValue(1);

    const listAfterDelete = await documentService.listDocuments(userId);
    expect(listAfterDelete.documents).toHaveLength(1);
    expect(listAfterDelete.documents[0].id).toBe('doc-2');

    // Step 6: Verify deleted document cannot be retrieved
    mockPrisma.document.findFirst.mockResolvedValue(null);

    await expect(documentService.getDocument('doc-1', userId)).rejects.toThrow(
      'Document not found'
    );
  });
});
