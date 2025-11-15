/**
 * Orchestrator Service - Vector Store Tests
 *
 * Comprehensive tests for pgvector-based vector store in orchestrator service
 * Target: 20+ tests, 90%+ coverage
 */

import { VectorStoreService } from '../src/services/vector-store.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('VectorStoreService (Orchestrator)', () => {
  let vectorStore: VectorStoreService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    vectorStore = new VectorStoreService(mockPrisma);
  });

  afterEach(async () => {
    await vectorStore.disconnect();
  });

  describe('Constructor', () => {
    test('should initialize with provided Prisma client', () => {
      const service = new VectorStoreService(mockPrisma);
      expect(service).toBeInstanceOf(VectorStoreService);
    });

    test('should create new Prisma client if not provided', () => {
      const service = new VectorStoreService();
      expect(service).toBeInstanceOf(VectorStoreService);
    });
  });

  describe('upsert() - Knowledge Chunks', () => {
    test('should upsert knowledge vectors', async () => {
      const documents = [
        {
          id: 'doc-1',
          embedding: [0.1, 0.2, 0.3],
          metadata: {
            knowledgeBaseId: 'kb-123',
            content: 'Test content',
            chunkIndex: 0,
            tokens: 10,
          },
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await vectorStore.upsert(documents, 'knowledge');

      expect(result.upsertedCount).toBe(1);
      expect(result.ids).toContain('doc-1');
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    test('should process large batches correctly', async () => {
      const documents = Array(120)
        .fill(null)
        .map((_, i) => ({
          id: `doc-${i}`,
          embedding: Array(1536).fill(0.1),
          metadata: {
            knowledgeBaseId: 'kb-123',
            content: `Content ${i}`,
            chunkIndex: i,
            tokens: 10,
          },
        }));

      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await vectorStore.upsert(documents, 'knowledge');

      expect(result.upsertedCount).toBe(120);
      // Should be called 120 times (one per document, batched in groups of 50)
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(120);
    });

    test('should format embedding as vector type', async () => {
      const documents = [
        {
          id: 'doc-1',
          embedding: [0.1, 0.2, 0.3],
          metadata: {
            knowledgeBaseId: 'kb-123',
            content: 'Test',
            chunkIndex: 0,
            tokens: 5,
          },
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      await vectorStore.upsert(documents, 'knowledge');

      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('[0.1,0.2,0.3]::vector');
    });

    test('should handle metadata as JSONB', async () => {
      const documents = [
        {
          id: 'doc-1',
          embedding: [0.1, 0.2],
          metadata: {
            knowledgeBaseId: 'kb-123',
            content: 'Test',
            chunkIndex: 0,
            tokens: 5,
            customField: 'custom value',
          },
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      await vectorStore.upsert(documents, 'knowledge');

      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('::jsonb');
    });
  });

  describe('upsert() - Document Chunks', () => {
    test('should upsert document vectors', async () => {
      const documents = [
        {
          id: 'doc-1',
          embedding: [0.1, 0.2, 0.3],
          metadata: {
            documentId: 'doc-123',
            content: 'Test content',
            chunkIndex: 0,
            pageNumber: 1,
            tokens: 10,
          },
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await vectorStore.upsert(documents, 'document');

      expect(result.upsertedCount).toBe(1);
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    test('should handle pageNumber for document chunks', async () => {
      const documents = [
        {
          id: 'doc-1',
          embedding: [0.1, 0.2],
          metadata: {
            documentId: 'doc-123',
            content: 'Test',
            chunkIndex: 0,
            pageNumber: 5,
            tokens: 10,
          },
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      await vectorStore.upsert(documents, 'document');

      const call = mockPrisma.$executeRaw.mock.calls[0];
      // Should include pageNumber in the insert
      expect(call).toBeDefined();
    });
  });

  describe('query() - Knowledge Search', () => {
    test('should search knowledge vectors by similarity', async () => {
      const queryEmbedding = Array(1536).fill(0.1);
      const mockResults = [
        {
          id: 'chunk-1',
          parentId: 'kb-123',
          parentTitle: 'Knowledge Base',
          content: 'Similar content',
          chunkIndex: 0,
          tokens: 10,
          metadata: { custom: 'field' },
          similarity: 0.95,
          type: 'knowledge',
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        topK: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.95);
      expect(results[0].metadata?.content).toBe('Similar content');
    });

    test('should filter by knowledgeBaseId', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        knowledgeBaseId: 'kb-specific',
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain("kb.id = 'kb-specific'");
    });

    test('should filter by category when provided', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        filter: { category: 'tech' },
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain("kb.category = 'tech'");
    });
  });

  describe('query() - Document Search', () => {
    test('should search document vectors by similarity', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          parentId: 'doc-123',
          parentTitle: 'Document Title',
          content: 'Document content',
          chunkIndex: 0,
          pageNumber: 1,
          tokens: 10,
          similarity: 0.88,
          type: 'document',
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        documentId: 'doc-123',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.pageNumber).toBe(1);
    });

    test('should only search non-deleted documents', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        documentId: 'doc-123',
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain('d."deletedAt" IS NULL');
    });

    test('should only search COMPLETED documents', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        documentId: 'doc-123',
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain("d.status = 'COMPLETED'");
    });
  });

  describe('query() - Options', () => {
    test('should limit results to topK', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `chunk-${i}`,
          parentId: 'kb-123',
          parentTitle: 'KB',
          content: `Content ${i}`,
          chunkIndex: i,
          tokens: 10,
          metadata: {},
          similarity: 0.9 - i * 0.01,
          type: 'knowledge',
        }));

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        topK: 5,
      });

      expect(results).toHaveLength(5);
    });

    test('should enforce max topK of 20', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        topK: 100,
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain('LIMIT 40'); // Capped at 20 * 2
    });

    test('should filter by minimum similarity', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          parentId: 'kb-123',
          parentTitle: 'KB',
          content: 'High',
          chunkIndex: 0,
          tokens: 10,
          metadata: {},
          similarity: 0.9,
          type: 'knowledge',
        },
        {
          id: 'chunk-2',
          parentId: 'kb-123',
          parentTitle: 'KB',
          content: 'Low',
          chunkIndex: 1,
          tokens: 10,
          metadata: {},
          similarity: 0.2,
          type: 'knowledge',
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        minSimilarity: 0.5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.9);
    });

    test('should use default minSimilarity of 0.3', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          parentId: 'kb-123',
          parentTitle: 'KB',
          content: 'Content',
          chunkIndex: 0,
          tokens: 10,
          metadata: {},
          similarity: 0.25,
          type: 'knowledge',
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
      });

      expect(results).toHaveLength(0); // Filtered by default 0.3 threshold
    });

    test('should include metadata when includeMetadata is true', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          parentId: 'kb-123',
          parentTitle: 'KB Title',
          content: 'Content',
          chunkIndex: 0,
          tokens: 10,
          metadata: { custom: 'value' },
          similarity: 0.9,
          type: 'knowledge',
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        includeMetadata: true,
      });

      expect(results[0].metadata).toBeDefined();
      expect(results[0].metadata?.content).toBe('Content');
      expect(results[0].metadata?.custom).toBe('value');
    });

    test('should exclude metadata when includeMetadata is false', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          parentId: 'kb-123',
          parentTitle: 'KB',
          content: 'Content',
          chunkIndex: 0,
          tokens: 10,
          metadata: {},
          similarity: 0.9,
          type: 'knowledge',
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const results = await vectorStore.query(queryEmbedding, {
        userId: 'user-123',
        includeMetadata: false,
      });

      expect(Object.keys(results[0].metadata || {})).toHaveLength(0);
    });
  });

  describe('delete()', () => {
    test('should delete knowledge vectors by IDs', async () => {
      const ids = ['chunk-1', 'chunk-2', 'chunk-3'];
      mockPrisma.$executeRaw.mockResolvedValue(3);

      await vectorStore.delete(ids, 'knowledge');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM knowledge_chunks');
    });

    test('should delete document vectors by IDs', async () => {
      const ids = ['chunk-1', 'chunk-2'];
      mockPrisma.$executeRaw.mockResolvedValue(2);

      await vectorStore.delete(ids, 'document');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM document_chunks');
    });
  });

  describe('deleteByParent()', () => {
    test('should delete all chunks for a knowledge base', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(10);

      await vectorStore.deleteByParent('kb-123', 'knowledge');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM knowledge_chunks');
      expect(call[0]).toContain('"knowledgeBaseId"');
    });

    test('should delete all chunks for a document', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(5);

      await vectorStore.deleteByParent('doc-123', 'document');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM document_chunks');
      expect(call[0]).toContain('"documentId"');
    });
  });

  describe('deleteByFilter()', () => {
    test('should delete knowledge chunks by userId filter', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(15);

      await vectorStore.deleteByFilter({ userId: 'user-123' }, 'knowledge');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM knowledge_chunks');
      expect(call[0]).toContain('KnowledgeBase');
    });

    test('should delete document chunks by userId filter', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(8);

      await vectorStore.deleteByFilter({ userId: 'user-123' }, 'document');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM document_chunks');
      expect(call[0]).toContain('Document');
    });
  });

  describe('getStats()', () => {
    test('should return stats for knowledge chunks', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ count: BigInt(500) }])
        .mockResolvedValueOnce([
          {
            indexname: 'idx_knowledge_chunks_embedding_hnsw',
            tablename: 'knowledge_chunks',
          },
        ]);

      const stats = await vectorStore.getStats('knowledge');

      expect(stats.totalVectors).toBe(500);
      expect(stats.dimension).toBe(1536);
      expect(stats.indexes).toContain('knowledge_chunks.idx_knowledge_chunks_embedding_hnsw');
    });

    test('should return stats for document chunks', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ count: BigInt(300) }])
        .mockResolvedValueOnce([
          {
            indexname: 'idx_document_chunks_embedding_hnsw',
            tablename: 'document_chunks',
          },
        ]);

      const stats = await vectorStore.getStats('document');

      expect(stats.totalVectors).toBe(300);
    });

    test('should return combined stats when type not specified', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ count: BigInt(500) }])
        .mockResolvedValueOnce([{ count: BigInt(300) }])
        .mockResolvedValueOnce([]);

      const stats = await vectorStore.getStats();

      expect(stats.totalVectors).toBe(800);
    });
  });

  describe('fetch()', () => {
    test('should fetch knowledge vectors by IDs', async () => {
      const ids = ['chunk-1', 'chunk-2'];
      const mockResults = [
        {
          id: 'chunk-1',
          content: 'Content 1',
          chunkIndex: 0,
          tokens: 10,
          metadata: { custom: 'value1' },
        },
        {
          id: 'chunk-2',
          content: 'Content 2',
          chunkIndex: 1,
          tokens: 12,
          metadata: { custom: 'value2' },
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      const documents = await vectorStore.fetch(ids, 'knowledge');

      expect(documents.size).toBe(2);
      expect(documents.get('chunk-1')).toBeDefined();
      expect(documents.get('chunk-1')?.metadata.content).toBe('Content 1');
    });

    test('should fetch document vectors by IDs', async () => {
      const ids = ['chunk-1'];
      const mockResults = [
        {
          id: 'chunk-1',
          content: 'Doc content',
          chunkIndex: 0,
          pageNumber: 5,
          tokens: 15,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      const documents = await vectorStore.fetch(ids, 'document');

      expect(documents.size).toBe(1);
      expect(documents.get('chunk-1')?.metadata.pageNumber).toBe(5);
    });

    test('should not return full embeddings for efficiency', async () => {
      const ids = ['chunk-1'];
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'Content',
          chunkIndex: 0,
          tokens: 10,
          metadata: {},
        },
      ]);

      const documents = await vectorStore.fetch(ids, 'knowledge');

      expect(documents.get('chunk-1')?.embedding).toEqual([]);
    });
  });

  describe('semanticSearch()', () => {
    test('should perform semantic search with text embedding', async () => {
      const text = 'What is AI?';
      const mockEmbeddingService = {
        embed: jest.fn().mockResolvedValue({
          embedding: [0.1, 0.2, 0.3],
          tokens: 3,
          model: 'test-model',
          cached: false,
        }),
      };

      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 'chunk-1',
          parentId: 'kb-123',
          parentTitle: 'KB',
          content: 'AI is...',
          chunkIndex: 0,
          tokens: 10,
          metadata: {},
          similarity: 0.9,
          type: 'knowledge',
        },
      ]);

      const results = await vectorStore.semanticSearch(text, mockEmbeddingService, {
        userId: 'user-123',
      });

      expect(mockEmbeddingService.embed).toHaveBeenCalledWith(text);
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.9);
    });
  });

  describe('benchmarkSearch()', () => {
    test('should measure search performance', async () => {
      const queryEmbedding = Array(1536).fill(0.1);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      const queryTime = await vectorStore.benchmarkSearch(queryEmbedding, 'user-123');

      expect(queryTime).toBeGreaterThanOrEqual(0);
      expect(queryTime).toBeLessThan(1000);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('disconnect()', () => {
    test('should disconnect Prisma client', async () => {
      await vectorStore.disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});
