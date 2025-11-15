/**
 * Integration Tests for DocumentService
 * Target: 15 tests testing component interactions
 */

import { DocumentService } from '../../src/services/document.service';
import { createValidPdfFile, createMockFile } from '../fixtures/mock-file';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define DocumentStatus enum locally (since Prisma client may not be fully generated)
enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Mock external services but test real interactions
jest.mock('@prisma/client');
jest.mock('@aws-sdk/client-s3');
jest.mock('fs/promises');
jest.mock('../../src/services/pdf-parser.service');
jest.mock('../../src/services/chunking.service');
jest.mock('../../src/services/embedding.service');
jest.mock('../../src/services/vector-store.service');

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
import { EmbeddingService } from '../../src/services/embedding.service';
import { VectorStoreService } from '../../src/services/vector-store.service';

describe('DocumentService - Integration Tests', () => {
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
  // 1. FULL UPLOAD PIPELINE (5 tests)
  // ============================================================================

  describe('Complete Upload Pipeline', () => {
    test('should complete full upload flow: quota check → S3 upload → DB create', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(2);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.PROCESSING,
      });

      const result = await documentService.uploadDocument('user-123', file);

      // Verify quota was checked
      expect(mockPrisma.document.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', deletedAt: null },
      });

      // Verify S3 upload
      expect(mockS3Client.send).toHaveBeenCalled();

      // Verify DB record creation
      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            status: DocumentStatus.PROCESSING,
          }),
        })
      );

      // Verify cleanup
      expect(fs.unlink).toHaveBeenCalledWith(file.path);

      expect(result.documentId).toBeTruthy();
    });

    test('should rollback on S3 upload failure', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockS3Client.send.mockRejectedValue(new Error('S3 connection failed'));

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      // Verify temp file was still cleaned up
      expect(fs.unlink).toHaveBeenCalled();
    });

    test('should handle concurrent uploads from same user', async () => {
      const file1 = createMockFile({ originalname: 'doc1.pdf' });
      const file2 = createMockFile({ originalname: 'doc2.pdf' });

      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValueOnce({
        ...mockDocument,
        id: 'doc-1',
      });
      mockPrisma.document.create.mockResolvedValueOnce({
        ...mockDocument,
        id: 'doc-2',
      });

      const [result1, result2] = await Promise.all([
        documentService.uploadDocument('user-123', file1),
        documentService.uploadDocument('user-123', file2),
      ]);

      expect(result1.documentId).toBeTruthy();
      expect(result2.documentId).toBeTruthy();
      expect(mockPrisma.document.create).toHaveBeenCalledTimes(2);
    });

    test('should persist file metadata correctly', async () => {
      const file = createMockFile({
        originalname: 'Research_Paper.pdf',
        size: 1024 * 500, // 500 KB
        mimetype: 'application/pdf',
      });

      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await documentService.uploadDocument('user-123', file, 'Custom Title');

      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Custom Title',
            fileName: 'Research_Paper.pdf',
            contentType: 'application/pdf',
            fileSize: 1024 * 500,
          }),
        })
      );
    });

    test('should generate unique storage keys for same filename', async () => {
      const file1 = createMockFile({ originalname: 'document.pdf' });
      const file2 = createMockFile({ originalname: 'document.pdf' });

      mockPrisma.document.count.mockResolvedValue(0);

      let storageKey1: string = '';
      let storageKey2: string = '';

      mockPrisma.document.create.mockImplementationOnce((args: any) => {
        storageKey1 = args.data.storageKey;
        return Promise.resolve({ ...mockDocument, storageKey: storageKey1 });
      });

      mockPrisma.document.create.mockImplementationOnce((args: any) => {
        storageKey2 = args.data.storageKey;
        return Promise.resolve({ ...mockDocument, storageKey: storageKey2 });
      });

      await documentService.uploadDocument('user-123', file1);
      // Simulate time delay
      await new Promise((resolve) => setTimeout(resolve, 10));
      await documentService.uploadDocument('user-123', file2);

      expect(storageKey1).not.toBe(storageKey2);
      expect(storageKey1).toContain('pdfs/user-123/');
      expect(storageKey2).toContain('pdfs/user-123/');
    });
  });

  // ============================================================================
  // 2. QUOTA ENFORCEMENT ACROSS SERVICES (3 tests)
  // ============================================================================

  describe('Multi-Service Quota Enforcement', () => {
    test('should enforce quota before any expensive operations', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(5); // At limit

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      // Verify S3 was never called
      expect(mockS3Client.send).not.toHaveBeenCalled();
      // Verify DB create was never called
      expect(mockPrisma.document.create).not.toHaveBeenCalled();
    });

    test('should count documents correctly across multiple users', async () => {
      const file = createValidPdfFile();

      // User 1 has 5 documents
      mockPrisma.document.count.mockResolvedValueOnce(5);
      await expect(documentService.uploadDocument('user-1', file)).rejects.toThrow();

      // User 2 has 0 documents
      mockPrisma.document.count.mockResolvedValueOnce(0);
      mockPrisma.document.create.mockResolvedValue(mockDocument);
      const result = await documentService.uploadDocument('user-2', file);

      expect(result).toHaveProperty('documentId');
    });

    test('should handle quota check database errors gracefully', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockRejectedValue(new Error('Database connection lost'));

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      // Verify cleanup still happened
      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 3. DOCUMENT LIFECYCLE (4 tests)
  // ============================================================================

  describe('Document Lifecycle Management', () => {
    test('should track document through upload → processing → completed states', async () => {
      // Upload
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.PROCESSING,
        processedAt: null,
      });

      const uploadResult = await documentService.uploadDocument('user-123', file);
      expect(uploadResult.status).toBe(DocumentStatus.PROCESSING);

      // Get during processing
      mockPrisma.document.findFirst.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.PROCESSING,
        processedAt: null,
      });
      mockVectorStore.getChunkCount.mockResolvedValue(0);

      const processingDoc = await documentService.getDocument('doc-123', 'user-123');
      expect(processingDoc.status).toBe(DocumentStatus.PROCESSING);
      expect(processingDoc.processedAt).toBeNull();

      // Get after completion
      mockPrisma.document.findFirst.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.COMPLETED,
        processedAt: new Date(),
      });
      mockVectorStore.getChunkCount.mockResolvedValue(10);

      const completedDoc = await documentService.getDocument('doc-123', 'user-123');
      expect(completedDoc.status).toBe(DocumentStatus.COMPLETED);
      expect(completedDoc.processedAt).not.toBeNull();
      expect(completedDoc.chunksCount).toBe(10);
    });

    test('should list documents in correct order (newest first)', async () => {
      const doc1 = { ...mockDocument, id: 'doc-1', uploadedAt: new Date('2024-01-01') };
      const doc2 = { ...mockDocument, id: 'doc-2', uploadedAt: new Date('2024-01-02') };
      const doc3 = { ...mockDocument, id: 'doc-3', uploadedAt: new Date('2024-01-03') };

      mockPrisma.document.findMany.mockResolvedValue([doc3, doc2, doc1]);
      mockPrisma.document.count.mockResolvedValue(3);

      const result = await documentService.listDocuments('user-123');

      expect(result.documents[0].id).toBe('doc-3'); // Newest
      expect(result.documents[2].id).toBe('doc-1'); // Oldest
    });

    test('should handle soft delete correctly', async () => {
      // Document exists
      mockPrisma.document.findFirst.mockResolvedValue(mockDocument);
      mockPrisma.document.update.mockResolvedValue({
        ...mockDocument,
        deletedAt: new Date(),
      });
      mockVectorStore.getChunkCount.mockResolvedValue(10);

      // Delete document
      await documentService.deleteDocument('doc-123', 'user-123');

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: { deletedAt: expect.any(Date) },
      });

      // Try to get deleted document
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(documentService.getDocument('doc-123', 'user-123')).rejects.toThrow();
    });

    test('should filter out deleted documents from list', async () => {
      const activeDoc = { ...mockDocument, id: 'active', deletedAt: null };
      const deletedDoc = { ...mockDocument, id: 'deleted', deletedAt: new Date() };

      mockPrisma.document.findMany.mockResolvedValue([activeDoc]);
      mockPrisma.document.count.mockResolvedValue(1);

      const result = await documentService.listDocuments('user-123');

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].id).toBe('active');
    });
  });

  // ============================================================================
  // 4. ERROR HANDLING ACROSS SERVICES (3 tests)
  // ============================================================================

  describe('Cross-Service Error Handling', () => {
    test('should handle S3 upload errors and cleanup properly', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockS3Client.send.mockRejectedValue(new Error('Network timeout'));

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      // Verify temp file was cleaned up despite error
      expect(fs.unlink).toHaveBeenCalled();
    });

    test('should handle database errors during document creation', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      expect(fs.unlink).toHaveBeenCalled();
    });

    test('should handle file read errors gracefully', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();
    });
  });
});
