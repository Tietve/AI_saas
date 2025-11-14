/**
 * Vector Store Service
 *
 * Manages vector embeddings in pgvector (PostgreSQL)
 */

import { PrismaClient } from '@prisma/client';
import { ChunkWithEmbedding, SimilarChunk, VectorSearchOptions, VectorStoreError } from '../types/document.types';

export class VectorStoreService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Insert chunks with embeddings into vector store
   * @param documentId Document ID these chunks belong to
   * @param chunks Array of chunks with embeddings
   */
  async insertChunks(documentId: string, chunks: ChunkWithEmbedding[]): Promise<void> {
    try {
      // Insert chunks in batches (avoid massive single transaction)
      const batchSize = 50;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        // Use raw SQL for vector insertion (Prisma doesn't fully support vector type)
        for (const chunk of batch) {
          await this.prisma.$executeRaw`
            INSERT INTO document_chunks (
              id,
              "documentId",
              content,
              "chunkIndex",
              "pageNumber",
              tokens,
              embedding,
              "createdAt"
            ) VALUES (
              gen_random_uuid(),
              ${documentId},
              ${chunk.content},
              ${chunk.chunkIndex},
              ${chunk.pageNumber},
              ${chunk.tokens},
              ${`[${chunk.embedding.join(',')}]`}::vector,
              NOW()
            )
          `;
        }

        console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} chunks)`);
      }

      console.log(`Successfully inserted ${chunks.length} chunks for document ${documentId}`);
    } catch (error) {
      throw new VectorStoreError(
        `Failed to insert chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for similar chunks using vector similarity
   * @param queryEmbedding Query vector (1536 dimensions)
   * @param options Search options (userId, topK, documentId, minSimilarity)
   * @returns Array of similar chunks with scores
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: VectorSearchOptions
  ): Promise<SimilarChunk[]> {
    const {
      userId,
      topK = 5,
      documentId,
      minSimilarity = 0.3, // Lower threshold for cosine similarity
    } = options;

    // Validate topK
    const maxTopK = 10;
    const limitedTopK = Math.min(topK, maxTopK);

    try {
      // Build embedding vector string
      const embeddingVector = `[${queryEmbedding.join(',')}]`;

      // Build query with optional document filter
      let sqlQuery = `
        SELECT
          dc.id,
          dc."documentId",
          d.title as "documentTitle",
          dc.content,
          dc."chunkIndex",
          dc."pageNumber",
          1 - (dc.embedding <=> '${embeddingVector}'::vector) as similarity
        FROM document_chunks dc
        JOIN documents d ON dc."documentId" = d.id
        WHERE d."userId" = '${userId}'
          AND d."deletedAt" IS NULL
          AND d.status = 'COMPLETED'`;

      if (documentId) {
        sqlQuery += `
          AND d.id = '${documentId}'`;
      }

      sqlQuery += `
        ORDER BY dc.embedding <=> '${embeddingVector}'::vector
        LIMIT ${limitedTopK * 2}
      `;

      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: string;
          documentId: string;
          documentTitle: string;
          content: string;
          chunkIndex: number;
          pageNumber: number | null;
          similarity: number;
        }>
      >(sqlQuery);

      // Filter by similarity threshold and limit
      const filtered = results
        .filter((row) => row.similarity >= minSimilarity)
        .slice(0, limitedTopK);

      return filtered.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        content: row.content,
        chunkIndex: row.chunkIndex,
        pageNumber: row.pageNumber,
        similarity: row.similarity,
      }));
    } catch (error) {
      throw new VectorStoreError(
        `Failed to search vectors: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete all chunks for a document
   * @param documentId Document ID
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM document_chunks
        WHERE "documentId" = ${documentId}
      `;

      console.log(`Deleted chunks for document ${documentId}`);
    } catch (error) {
      throw new VectorStoreError(
        `Failed to delete chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get chunk count for a document
   * @param documentId Document ID
   * @returns Number of chunks
   */
  async getChunkCount(documentId: string): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM document_chunks
        WHERE "documentId" = ${documentId}
      `;

      return Number(result[0].count);
    } catch (error) {
      throw new VectorStoreError(
        `Failed to get chunk count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if HNSW index exists and is being used
   * @returns Index statistics
   */
  async getIndexStats(): Promise<{
    exists: boolean;
    indexName?: string;
    indexSize?: string;
  }> {
    try {
      const indexes = await this.prisma.$queryRaw<
        Array<{
          indexname: string;
          tablename: string;
          indexdef: string;
        }>
      >`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE tablename = 'document_chunks'
          AND indexname = 'idx_document_chunks_embedding_hnsw'
      `;

      if (indexes.length === 0) {
        return { exists: false };
      }

      // Get index size
      const sizeResult = await this.prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_relation_size('idx_document_chunks_embedding_hnsw')) as size
      `;

      return {
        exists: true,
        indexName: indexes[0].indexname,
        indexSize: sizeResult[0]?.size,
      };
    } catch (error) {
      console.error('Failed to get index stats:', error);
      return { exists: false };
    }
  }

  /**
   * Benchmark vector search performance
   * @returns Query time in milliseconds
   */
  async benchmarkSearch(queryEmbedding: number[], userId: string): Promise<number> {
    const startTime = Date.now();

    await this.searchSimilar(queryEmbedding, {
      userId,
      topK: 5,
    });

    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Get total vectors in store
   */
  async getTotalVectors(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM document_chunks WHERE embedding IS NOT NULL
      `;

      return Number(result[0].count);
    } catch (error) {
      throw new VectorStoreError(
        `Failed to get total vectors: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
