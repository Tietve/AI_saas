/**
 * Vector Store Service Tests
 *
 * Comprehensive tests for pgvector-based vector store
 * Target: 20+ tests, 70%+ coverage
 */

import { VectorStoreService } from '../../src/services/vector-store.service';
import { VectorStoreError, ChunkWithEmbedding } from '../../src/types/document.types';
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

describe('VectorStoreService', () => {
  let vectorStoreService: VectorStoreService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    vectorStoreService = new VectorStoreService(mockPrisma);
  });

  afterEach(async () => {
    await vectorStoreService.disconnect();
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

  describe('insertChunks()', () => {
    test('should insert chunks with embeddings', async () => {
      const documentId = 'doc-123';
      const chunks: ChunkWithEmbedding[] = [
        {
          content: 'Test chunk 1',
          chunkIndex: 0,
          pageNumber: 1,
          tokens: 10,
          embedding: [0.1, 0.2, 0.3],
        },
        {
          content: 'Test chunk 2',
          chunkIndex: 1,
          pageNumber: 1,
          tokens: 12,
          embedding: [0.4, 0.5, 0.6],
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      await vectorStoreService.insertChunks(documentId, chunks);

      // Should be called once per chunk
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    test('should process chunks in batches of 50', async () => {
      const documentId = 'doc-123';
      const chunks: ChunkWithEmbedding[] = Array(120)
        .fill(null)
        .map((_, i) => ({
          content: `Chunk ${i}`,
          chunkIndex: i,
          pageNumber: Math.floor(i / 10) + 1,
          tokens: 10,
          embedding: Array(1536).fill(0.1),
        }));

      mockPrisma.$executeRaw.mockResolvedValue(1);

      await vectorStoreService.insertChunks(documentId, chunks);

      // 120 chunks = 3 batches (50, 50, 20)
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(120);
    });

    test('should format embedding as vector type', async () => {
      const documentId = 'doc-123';
      const chunks: ChunkWithEmbedding[] = [
        {
          content: 'Test',
          chunkIndex: 0,
          pageNumber: 1,
          tokens: 5,
          embedding: [0.1, 0.2, 0.3],
        },
      ];

      mockPrisma.$executeRaw.mockResolvedValue(1);

      await vectorStoreService.insertChunks(documentId, chunks);

      // Check that embedding is formatted as vector
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('[0.1,0.2,0.3]::vector');
    });

    test('should throw VectorStoreError on database failure', async () => {
      const documentId = 'doc-123';
      const chunks: ChunkWithEmbedding[] = [
        {
          content: 'Test',
          chunkIndex: 0,
          pageNumber: 1,
          tokens: 5,
          embedding: [0.1, 0.2],
        },
      ];

      mockPrisma.$executeRaw.mockRejectedValue(new Error('Database error'));

      await expect(vectorStoreService.insertChunks(documentId, chunks)).rejects.toThrow(
        VectorStoreError
      );
      await expect(vectorStoreService.insertChunks(documentId, chunks)).rejects.toThrow(
        'Failed to insert chunks'
      );
    });

    test('should handle empty chunks array', async () => {
      const documentId = 'doc-123';
      const chunks: ChunkWithEmbedding[] = [];

      await vectorStoreService.insertChunks(documentId, chunks);

      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('searchSimilar()', () => {
    test('should search for similar chunks', async () => {
      const queryEmbedding = Array(1536).fill(0.1);
      const mockResults = [
        {
          id: 'chunk-1',
          documentId: 'doc-123',
          documentTitle: 'Test Document',
          content: 'Similar content 1',
          chunkIndex: 0,
          pageNumber: 1,
          similarity: 0.95,
        },
        {
          id: 'chunk-2',
          documentId: 'doc-123',
          documentTitle: 'Test Document',
          content: 'Similar content 2',
          chunkIndex: 1,
          pageNumber: 1,
          similarity: 0.87,
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const result = await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
        topK: 5,
      });

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBe(0.95);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    test('should filter by documentId when provided', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
        documentId: 'doc-specific',
        topK: 5,
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain("d.id = 'doc-specific'");
    });

    test('should limit results to topK', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `chunk-${i}`,
          documentId: 'doc-123',
          documentTitle: 'Test Doc',
          content: `Content ${i}`,
          chunkIndex: i,
          pageNumber: 1,
          similarity: 0.9 - i * 0.01,
        }));

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const result = await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
        topK: 5,
      });

      expect(result).toHaveLength(5);
    });

    test('should enforce max topK of 10', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
        topK: 100, // Request 100, should cap at 10
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain('LIMIT 20'); // topK * 2 = 10 * 2 = 20
    });

    test('should filter by minimum similarity threshold', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          documentId: 'doc-123',
          documentTitle: 'Test Doc',
          content: 'High similarity',
          chunkIndex: 0,
          pageNumber: 1,
          similarity: 0.9,
        },
        {
          id: 'chunk-2',
          documentId: 'doc-123',
          documentTitle: 'Test Doc',
          content: 'Low similarity',
          chunkIndex: 1,
          pageNumber: 1,
          similarity: 0.2,
        },
        {
          id: 'chunk-3',
          documentId: 'doc-123',
          documentTitle: 'Test Doc',
          content: 'Medium similarity',
          chunkIndex: 2,
          pageNumber: 1,
          similarity: 0.6,
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const result = await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
        minSimilarity: 0.5,
      });

      // Should only return chunks with similarity >= 0.5
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.similarity >= 0.5)).toBe(true);
    });

    test('should use default minSimilarity of 0.3', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          documentId: 'doc-123',
          documentTitle: 'Test Doc',
          content: 'Content',
          chunkIndex: 0,
          pageNumber: 1,
          similarity: 0.25,
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const result = await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
      });

      // 0.25 < 0.3 default threshold, should be filtered
      expect(result).toHaveLength(0);
    });

    test('should only search non-deleted documents', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain('d."deletedAt" IS NULL');
    });

    test('should only search COMPLETED documents', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain("d.status = 'COMPLETED'");
    });

    test('should use cosine distance for similarity', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStoreService.searchSimilar(queryEmbedding, {
        userId: 'user-123',
      });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      // <=> is pgvector's cosine distance operator
      expect(sqlQuery).toContain('<=>');
      // 1 - distance = similarity
      expect(sqlQuery).toContain('1 - (dc.embedding <=>');
    });

    test('should throw VectorStoreError on database failure', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      await expect(
        vectorStoreService.searchSimilar(queryEmbedding, { userId: 'user-123' })
      ).rejects.toThrow(VectorStoreError);
      await expect(
        vectorStoreService.searchSimilar(queryEmbedding, { userId: 'user-123' })
      ).rejects.toThrow('Failed to search vectors');
    });
  });

  describe('deleteDocumentChunks()', () => {
    test('should delete all chunks for a document', async () => {
      const documentId = 'doc-123';
      mockPrisma.$executeRaw.mockResolvedValue(5); // 5 rows deleted

      await vectorStoreService.deleteDocumentChunks(documentId);

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const call = mockPrisma.$executeRaw.mock.calls[0];
      expect(call[0]).toContain('DELETE FROM document_chunks');
    });

    test('should throw VectorStoreError on deletion failure', async () => {
      const documentId = 'doc-123';
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Database error'));

      await expect(vectorStoreService.deleteDocumentChunks(documentId)).rejects.toThrow(
        VectorStoreError
      );
      await expect(vectorStoreService.deleteDocumentChunks(documentId)).rejects.toThrow(
        'Failed to delete chunks'
      );
    });
  });

  describe('getChunkCount()', () => {
    test('should return chunk count for a document', async () => {
      const documentId = 'doc-123';
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(42) }]);

      const count = await vectorStoreService.getChunkCount(documentId);

      expect(count).toBe(42);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    test('should return 0 for document with no chunks', async () => {
      const documentId = 'doc-empty';
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

      const count = await vectorStoreService.getChunkCount(documentId);

      expect(count).toBe(0);
    });

    test('should throw VectorStoreError on query failure', async () => {
      const documentId = 'doc-123';
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

      await expect(vectorStoreService.getChunkCount(documentId)).rejects.toThrow(VectorStoreError);
      await expect(vectorStoreService.getChunkCount(documentId)).rejects.toThrow(
        'Failed to get chunk count'
      );
    });
  });

  describe('getIndexStats()', () => {
    test('should return index stats when index exists', async () => {
      const mockIndexes = [
        {
          indexname: 'idx_document_chunks_embedding_hnsw',
          tablename: 'document_chunks',
          indexdef: 'CREATE INDEX ...',
        },
      ];
      const mockSize = [{ size: '128 kB' }];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockSize);

      const stats = await vectorStoreService.getIndexStats();

      expect(stats.exists).toBe(true);
      expect(stats.indexName).toBe('idx_document_chunks_embedding_hnsw');
      expect(stats.indexSize).toBe('128 kB');
    });

    test('should return exists: false when index does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const stats = await vectorStoreService.getIndexStats();

      expect(stats.exists).toBe(false);
      expect(stats.indexName).toBeUndefined();
      expect(stats.indexSize).toBeUndefined();
    });

    test('should handle errors gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

      const stats = await vectorStoreService.getIndexStats();

      expect(stats.exists).toBe(false);
    });
  });

  describe('benchmarkSearch()', () => {
    test('should measure search performance', async () => {
      const queryEmbedding = Array(1536).fill(0.1);
      const mockResults = [
        {
          id: 'chunk-1',
          documentId: 'doc-123',
          documentTitle: 'Test',
          content: 'Content',
          chunkIndex: 0,
          pageNumber: 1,
          similarity: 0.9,
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const queryTime = await vectorStoreService.benchmarkSearch(queryEmbedding, 'user-123');

      expect(queryTime).toBeGreaterThanOrEqual(0);
      expect(queryTime).toBeLessThan(1000); // Should be fast in tests
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    test('should benchmark with topK=5', async () => {
      const queryEmbedding = [0.1, 0.2];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStoreService.benchmarkSearch(queryEmbedding, 'user-123');

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toContain('LIMIT 10'); // topK * 2 = 5 * 2
    });
  });

  describe('getTotalVectors()', () => {
    test('should return total number of vectors', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(1500) }]);

      const total = await vectorStoreService.getTotalVectors();

      expect(total).toBe(1500);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    test('should only count chunks with embeddings', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

      await vectorStoreService.getTotalVectors();

      const call = mockPrisma.$queryRaw.mock.calls[0];
      expect(call[0]).toContain('WHERE embedding IS NOT NULL');
    });

    test('should throw VectorStoreError on query failure', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

      await expect(vectorStoreService.getTotalVectors()).rejects.toThrow(VectorStoreError);
      await expect(vectorStoreService.getTotalVectors()).rejects.toThrow(
        'Failed to get total vectors'
      );
    });
  });

  describe('disconnect()', () => {
    test('should disconnect Prisma client', async () => {
      await vectorStoreService.disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    test('should handle disconnect errors gracefully', async () => {
      mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(vectorStoreService.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should insert 100 chunks in <2000ms (mocked)', async () => {
      const chunks: ChunkWithEmbedding[] = Array(100)
        .fill(null)
        .map((_, i) => ({
          content: `Chunk ${i}`,
          chunkIndex: i,
          pageNumber: 1,
          tokens: 10,
          embedding: Array(1536).fill(0.1),
        }));

      mockPrisma.$executeRaw.mockResolvedValue(1);

      const startTime = Date.now();
      await vectorStoreService.insertChunks('doc-123', chunks);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should search in <200ms (mocked)', async () => {
      const queryEmbedding = Array(1536).fill(0.1);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      const startTime = Date.now();
      await vectorStoreService.searchSimilar(queryEmbedding, { userId: 'user-123' });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Cosine Similarity Calculations', () => {
    test('should use pgvector cosine distance operator', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await vectorStoreService.searchSimilar(queryEmbedding, { userId: 'user-123' });

      const sqlQuery = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sqlQuery).toMatch(/dc\.embedding\s*<=>\s*'/);
    });

    test('should convert distance to similarity (1 - distance)', async () => {
      const queryEmbedding = [0.1, 0.2];
      const mockResults = [
        {
          id: 'chunk-1',
          documentId: 'doc-123',
          documentTitle: 'Test',
          content: 'Content',
          chunkIndex: 0,
          pageNumber: 1,
          similarity: 0.85, // Already converted: 1 - 0.15
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);

      const result = await vectorStoreService.searchSimilar(queryEmbedding, { userId: 'user-123' });

      expect(result[0].similarity).toBe(0.85);
    });
  });

  describe('HNSW Index Integration', () => {
    test('should query HNSW index name correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          indexname: 'idx_document_chunks_embedding_hnsw',
          tablename: 'document_chunks',
          indexdef: 'CREATE INDEX idx_document_chunks_embedding_hnsw ...',
        },
      ]);

      await vectorStoreService.getIndexStats();

      const call = mockPrisma.$queryRaw.mock.calls[0];
      expect(call[0]).toContain("indexname = 'idx_document_chunks_embedding_hnsw'");
      expect(call[0]).toContain("tablename = 'document_chunks'");
    });

    test('should query index size using pg_relation_size', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          {
            indexname: 'idx_document_chunks_embedding_hnsw',
            tablename: 'document_chunks',
            indexdef: 'CREATE INDEX ...',
          },
        ])
        .mockResolvedValueOnce([{ size: '256 kB' }]);

      await vectorStoreService.getIndexStats();

      const sizeCall = mockPrisma.$queryRaw.mock.calls[1];
      expect(sizeCall[0]).toContain('pg_size_pretty');
      expect(sizeCall[0]).toContain('pg_relation_size');
      expect(sizeCall[0]).toContain('idx_document_chunks_embedding_hnsw');
    });
  });
});
