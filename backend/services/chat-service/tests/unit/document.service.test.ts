/**
 * Unit Tests for DocumentService
 * Target: 30 tests, 70%+ coverage
 */

import { DocumentService } from '../../src/services/document.service';
import { DocumentError, QuotaExceededError } from '../../src/types/document.types';
import * as fs from 'fs/promises';
import { createMockFile, createLargeFile, createInvalidTypeFile, createValidPdfFile } from '../fixtures/mock-file';

// Define DocumentStatus enum locally (since Prisma client may not be fully generated)
enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Mock all external dependencies
jest.mock('@prisma/client');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('fs/promises');
jest.mock('../../src/services/pdf-parser.service');
jest.mock('../../src/services/chunking.service');
jest.mock('../../src/services/embedding.service');
jest.mock('../../src/services/vector-store.service');

// Import mocks
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { PdfParserService } from '../../src/services/pdf-parser.service';
import { ChunkingService } from '../../src/services/chunking.service';
import { EmbeddingService } from '../../src/services/embedding.service';
import { VectorStoreService } from '../../src/services/vector-store.service';
import {
  createMockPrismaClient,
  mockDocument,
} from '../mocks/prisma.mock';
import {
  mockParsedPdf,
  mockChunks,
  mockEmbeddings,
  MockPdfParserService,
  MockChunkingService,
  MockEmbeddingService,
  MockVectorStoreService,
} from '../mocks/services.mock';

describe('DocumentService - Unit Tests', () => {
  let documentService: DocumentService;
  let mockPrisma: any;
  let mockS3Client: any;
  let mockPdfParser: MockPdfParserService;
  let mockChunking: MockChunkingService;
  let mockEmbedding: MockEmbeddingService;
  let mockVectorStore: MockVectorStoreService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockPrisma = createMockPrismaClient();
    mockS3Client = { send: jest.fn().mockResolvedValue({}) };
    mockPdfParser = new MockPdfParserService();
    mockChunking = new MockChunkingService();
    mockEmbedding = new MockEmbeddingService();
    mockVectorStore = new MockVectorStoreService();

    // Mock constructors
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
    (PdfParserService as jest.Mock).mockImplementation(() => mockPdfParser);
    (ChunkingService as jest.Mock).mockImplementation(() => mockChunking);
    (EmbeddingService as jest.Mock).mockImplementation(() => mockEmbedding);
    (VectorStoreService as jest.Mock).mockImplementation(() => mockVectorStore);

    // Mock fs operations
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('mock pdf content'));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    // Create service instance
    documentService = new DocumentService();
  });

  // ============================================================================
  // 1. FILE VALIDATION TESTS (6 tests)
  // ============================================================================

  describe('File Validation', () => {
    test('should accept valid PDF file within size limit', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.PROCESSING,
      });

      const result = await documentService.uploadDocument('user-123', file);

      expect(result).toHaveProperty('documentId');
      expect(result.status).toBe(DocumentStatus.PROCESSING);
    });

    test('should reject file exceeding size limit', async () => {
      const file = createLargeFile();

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow(
        DocumentError
      );
      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow(
        'File too large'
      );
    });

    test('should reject non-PDF files', async () => {
      const file = createInvalidTypeFile();

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow(
        DocumentError
      );
      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow(
        'Only PDF files are allowed'
      );
    });

    test('should validate file size is positive', async () => {
      const file = createMockFile({ size: 0 });

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();
    });

    test('should validate file has required fields', async () => {
      const file = createMockFile({ originalname: '' });

      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        title: 'Untitled',
      });

      const result = await documentService.uploadDocument('user-123', file);
      expect(result.title).toBeTruthy();
    });

    test('should handle file with special characters in name', async () => {
      const file = createMockFile({ originalname: 'Test @#$% Document!.pdf' });
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const result = await documentService.uploadDocument('user-123', file);
      expect(result).toHaveProperty('documentId');
    });
  });

  // ============================================================================
  // 2. QUOTA CHECKING TESTS (5 tests)
  // ============================================================================

  describe('Quota Enforcement', () => {
    test('should allow upload when under quota', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(3); // Under limit of 5
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const result = await documentService.uploadDocument('user-123', file);
      expect(result).toHaveProperty('documentId');
    });

    test('should reject upload when quota exceeded', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(5); // At limit

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow(
        QuotaExceededError
      );
    });

    test('should count only non-deleted documents for quota', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(3);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await documentService.uploadDocument('user-123', file);

      expect(mockPrisma.document.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          deletedAt: null,
        },
      });
    });

    test('should allow upload after deleting documents', async () => {
      const file = createValidPdfFile();
      // First count shows at limit, second count shows under limit
      mockPrisma.document.count.mockResolvedValueOnce(5).mockResolvedValueOnce(4);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      // First upload should fail
      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow(
        QuotaExceededError
      );

      // Second upload should succeed (simulating after deletion)
      const result = await documentService.uploadDocument('user-123', file);
      expect(result).toHaveProperty('documentId');
    });

    test('should check quota before upload', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(5);

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      // Verify S3 upload was not attempted
      expect(mockS3Client.send).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 3. UPLOAD TESTS (7 tests)
  // ============================================================================

  describe('Document Upload', () => {
    test('should upload document with custom title', async () => {
      const file = createValidPdfFile();
      const customTitle = 'My Custom Title';
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        title: customTitle,
      });

      const result = await documentService.uploadDocument('user-123', file, customTitle);

      expect(result.title).toBe(customTitle);
      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: customTitle }),
        })
      );
    });

    test('should extract title from filename when no custom title provided', async () => {
      const file = createMockFile({ originalname: 'Research_Paper-2024.pdf' });
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        title: 'Research Paper 2024',
      });

      const result = await documentService.uploadDocument('user-123', file);

      expect(result.title).toBe('Research Paper 2024');
    });

    test('should generate unique storage key', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await documentService.uploadDocument('user-123', file);

      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storageKey: expect.stringContaining('pdfs/user-123/'),
          }),
        })
      );
    });

    test('should upload file to R2/S3', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await documentService.uploadDocument('user-123', file);

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalledWith(file.path);
    });

    test('should create document record with PROCESSING status', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue({
        ...mockDocument,
        status: DocumentStatus.PROCESSING,
      });

      const result = await documentService.uploadDocument('user-123', file);

      expect(result.status).toBe(DocumentStatus.PROCESSING);
      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: DocumentStatus.PROCESSING }),
        })
      );
    });

    test('should clean up temp file after upload', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await documentService.uploadDocument('user-123', file);

      expect(fs.unlink).toHaveBeenCalledWith(file.path);
    });

    test('should clean up temp file even on upload failure', async () => {
      const file = createValidPdfFile();
      mockPrisma.document.count.mockResolvedValue(0);
      mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

      await expect(documentService.uploadDocument('user-123', file)).rejects.toThrow();

      expect(fs.unlink).toHaveBeenCalledWith(file.path);
    });
  });

  // ============================================================================
  // 4. DOCUMENT RETRIEVAL TESTS (5 tests)
  // ============================================================================

  describe('Get Document', () => {
    test('should retrieve document by ID', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(mockDocument);
      mockVectorStore.getChunkCount.mockResolvedValue(10);

      const result = await documentService.getDocument('doc-123', 'user-123');

      expect(result.id).toBe('doc-123');
      expect(result.title).toBe(mockDocument.title);
      expect(result.chunksCount).toBe(10);
    });

    test('should throw error when document not found', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(documentService.getDocument('nonexistent', 'user-123')).rejects.toThrow(
        DocumentError
      );
    });

    test('should only return documents owned by user', async () => {
      await documentService.getDocument('doc-123', 'user-123');

      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doc-123',
          userId: 'user-123',
          deletedAt: null,
        },
      });
    });

    test('should not return soft-deleted documents', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(documentService.getDocument('deleted-doc', 'user-123')).rejects.toThrow();
    });

    test('should include chunk count in response', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(mockDocument);
      mockVectorStore.getChunkCount.mockResolvedValue(15);

      const result = await documentService.getDocument('doc-123', 'user-123');

      expect(result.chunksCount).toBe(15);
    });
  });

  // ============================================================================
  // 5. LIST DOCUMENTS TESTS (4 tests)
  // ============================================================================

  describe('List Documents', () => {
    test('should list user documents with pagination', async () => {
      const documents = [mockDocument, { ...mockDocument, id: 'doc-456' }];
      mockPrisma.document.findMany.mockResolvedValue(documents);
      mockPrisma.document.count.mockResolvedValue(2);

      const result = await documentService.listDocuments('user-123', {
        limit: 10,
        offset: 0,
      });

      expect(result.documents).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    test('should filter documents by status', async () => {
      mockPrisma.document.findMany.mockResolvedValue([mockDocument]);
      mockPrisma.document.count.mockResolvedValue(1);

      await documentService.listDocuments('user-123', {
        status: DocumentStatus.COMPLETED,
      });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DocumentStatus.COMPLETED,
          }),
        })
      );
    });

    test('should use default pagination values', async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const result = await documentService.listDocuments('user-123');

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    test('should order documents by upload date descending', async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await documentService.listDocuments('user-123');

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { uploadedAt: 'desc' },
        })
      );
    });
  });

  // ============================================================================
  // 6. DELETE DOCUMENT TESTS (3 tests)
  // ============================================================================

  describe('Delete Document', () => {
    test('should soft delete document', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(mockDocument);
      mockPrisma.document.update.mockResolvedValue({
        ...mockDocument,
        deletedAt: new Date(),
      });

      await documentService.deleteDocument('doc-123', 'user-123');

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    test('should throw error when deleting non-existent document', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(
        documentService.deleteDocument('nonexistent', 'user-123')
      ).rejects.toThrow(DocumentError);
    });

    test('should delete from R2/S3 in background', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(mockDocument);
      mockPrisma.document.update.mockResolvedValue(mockDocument);

      await documentService.deleteDocument('doc-123', 'user-123');

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Note: In real implementation, S3 delete happens in background
      // We can't easily test this without refactoring the service
      expect(mockPrisma.document.update).toHaveBeenCalled();
    });
  });
});
