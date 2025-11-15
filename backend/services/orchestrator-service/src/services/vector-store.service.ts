/**
 * Vector Store Service (pgvector)
 *
 * Manages vector embeddings in pgvector (PostgreSQL)
 * Replaces Pinecone for cost optimization ($70/mo -> $0)
 */

import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.config';
import {
  VectorDocument,
  VectorQueryResult,
  VectorSearchOptions,
  VectorUpsertResult,
  VectorStats,
} from '../types/vector.types';

export class VectorStoreService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Upsert vectors into pgvector (KnowledgeChunk or DocumentChunk)
   * @param documents Array of documents with embeddings
   * @param type 'knowledge' or 'document'
   */
  public async upsert(
    documents: VectorDocument[],
    type: 'knowledge' | 'document' = 'knowledge'
  ): Promise<VectorUpsertResult> {
    try {
      const batchSize = 50;
      const insertedIds: string[] = [];

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        for (const doc of batch) {
          if (type === 'knowledge') {
            // Insert into knowledge_chunks
            await this.prisma.$executeRaw`
              INSERT INTO knowledge_chunks (
                id,
                "knowledgeBaseId",
                content,
                "chunkIndex",
                tokens,
                embedding,
                metadata,
                "createdAt"
              ) VALUES (
                gen_random_uuid(),
                ${doc.metadata.knowledgeBaseId || doc.metadata.parentId},
                ${doc.metadata.content || ''},
                ${doc.metadata.chunkIndex || 0},
                ${doc.metadata.tokens || 0},
                ${`[${doc.embedding.join(',')}]`}::vector,
                ${JSON.stringify(doc.metadata)}::jsonb,
                NOW()
              )
              ON CONFLICT (id) DO UPDATE SET
                embedding = EXCLUDED.embedding,
                content = EXCLUDED.content,
                metadata = EXCLUDED.metadata
            `;
          } else {
            // Insert into document_chunks
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
                ${doc.metadata.documentId || doc.metadata.parentId},
                ${doc.metadata.content || ''},
                ${doc.metadata.chunkIndex || 0},
                ${doc.metadata.pageNumber || null},
                ${doc.metadata.tokens || 0},
                ${`[${doc.embedding.join(',')}]`}::vector,
                NOW()
              )
              ON CONFLICT (id) DO UPDATE SET
                embedding = EXCLUDED.embedding,
                content = EXCLUDED.content
            `;
          }

          insertedIds.push(doc.id);
        }

        logger.info(`[VectorStore] Inserted batch ${i / batchSize + 1} (${batch.length} vectors)`);
      }

      logger.info(`[VectorStore] Upserted ${documents.length} vectors to ${type} chunks`);

      return {
        upsertedCount: documents.length,
        ids: insertedIds,
      };
    } catch (error) {
      logger.error('[VectorStore] Upsert failed:', error);
      throw error;
    }
  }

  /**
   * Query vectors by similarity (cosine distance)
   * @param queryEmbedding Query vector
   * @param options Search options (topK, filter, userId, etc.)
   */
  public async query(
    queryEmbedding: number[],
    options?: VectorSearchOptions
  ): Promise<VectorQueryResult[]> {
    try {
      const {
        topK = 5,
        includeMetadata = true,
        filter,
        userId,
        documentId,
        knowledgeBaseId,
        minSimilarity = 0.3,
      } = options || {};

      const limitedTopK = Math.min(topK, 20);
      const embeddingVector = `[${queryEmbedding.join(',')}]`;

      let sqlQuery = '';

      // Search in knowledge_chunks if knowledgeBaseId specified or no specific target
      if (knowledgeBaseId || (!documentId && !knowledgeBaseId)) {
        sqlQuery = `
          SELECT
            kc.id,
            kc."knowledgeBaseId" as "parentId",
            kb.title as "parentTitle",
            kc.content,
            kc."chunkIndex",
            kc.tokens,
            kc.metadata,
            1 - (kc.embedding <=> '${embeddingVector}'::vector) as similarity,
            'knowledge' as type
          FROM knowledge_chunks kc
          JOIN "KnowledgeBase" kb ON kc."knowledgeBaseId" = kb.id
          WHERE 1=1
        `;

        if (userId) {
          sqlQuery += ` AND kb."userId" = '${userId}'`;
        }
        if (knowledgeBaseId) {
          sqlQuery += ` AND kb.id = '${knowledgeBaseId}'`;
        }
        if (filter?.category) {
          sqlQuery += ` AND kb.category = '${filter.category}'`;
        }

        sqlQuery += `
          ORDER BY kc.embedding <=> '${embeddingVector}'::vector
          LIMIT ${limitedTopK * 2}
        `;
      }
      // Search in document_chunks if documentId specified
      else if (documentId) {
        sqlQuery = `
          SELECT
            dc.id,
            dc."documentId" as "parentId",
            d.title as "parentTitle",
            dc.content,
            dc."chunkIndex",
            dc."pageNumber",
            dc.tokens,
            1 - (dc.embedding <=> '${embeddingVector}'::vector) as similarity,
            'document' as type
          FROM document_chunks dc
          JOIN "Document" d ON dc."documentId" = d.id
          WHERE 1=1
            AND d."deletedAt" IS NULL
            AND d.status = 'COMPLETED'
        `;

        if (userId) {
          sqlQuery += ` AND d."userId" = '${userId}'`;
        }
        if (documentId) {
          sqlQuery += ` AND d.id = '${documentId}'`;
        }

        sqlQuery += `
          ORDER BY dc.embedding <=> '${embeddingVector}'::vector
          LIMIT ${limitedTopK * 2}
        `;
      }

      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: string;
          parentId: string;
          parentTitle: string;
          content: string;
          chunkIndex: number;
          pageNumber?: number;
          tokens?: number;
          metadata?: any;
          similarity: number;
          type: string;
        }>
      >(sqlQuery);

      // Filter by similarity threshold
      const filtered = results
        .filter((row) => row.similarity >= minSimilarity)
        .slice(0, limitedTopK);

      const queryResults: VectorQueryResult[] = filtered.map((row) => ({
        id: row.id,
        score: row.similarity,
        metadata: includeMetadata
          ? {
              parentId: row.parentId,
              parentTitle: row.parentTitle,
              content: row.content,
              chunkIndex: row.chunkIndex,
              pageNumber: row.pageNumber,
              tokens: row.tokens,
              type: row.type,
              ...(row.metadata || {}),
            }
          : {},
      }));

      logger.info(`[VectorStore] Query returned ${queryResults.length} results`);

      return queryResults;
    } catch (error) {
      logger.error('[VectorStore] Query failed:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  public async delete(ids: string[], type: 'knowledge' | 'document' = 'knowledge'): Promise<void> {
    try {
      if (type === 'knowledge') {
        await this.prisma.$executeRaw`
          DELETE FROM knowledge_chunks
          WHERE id = ANY(${ids}::text[])
        `;
      } else {
        await this.prisma.$executeRaw`
          DELETE FROM document_chunks
          WHERE id = ANY(${ids}::text[])
        `;
      }

      logger.info(`[VectorStore] Deleted ${ids.length} ${type} vectors`);
    } catch (error) {
      logger.error('[VectorStore] Delete failed:', error);
      throw error;
    }
  }

  /**
   * Delete all vectors for a parent (KnowledgeBase or Document)
   */
  public async deleteByParent(parentId: string, type: 'knowledge' | 'document'): Promise<void> {
    try {
      if (type === 'knowledge') {
        await this.prisma.$executeRaw`
          DELETE FROM knowledge_chunks
          WHERE "knowledgeBaseId" = ${parentId}
        `;
      } else {
        await this.prisma.$executeRaw`
          DELETE FROM document_chunks
          WHERE "documentId" = ${parentId}
        `;
      }

      logger.info(`[VectorStore] Deleted all chunks for ${type} ${parentId}`);
    } catch (error) {
      logger.error('[VectorStore] Delete by parent failed:', error);
      throw error;
    }
  }

  /**
   * Delete all vectors matching filter
   */
  public async deleteByFilter(filter: Record<string, any>, type: 'knowledge' | 'document'): Promise<void> {
    try {
      // For knowledge chunks, filter by KnowledgeBase properties
      if (type === 'knowledge' && filter.userId) {
        await this.prisma.$executeRaw`
          DELETE FROM knowledge_chunks kc
          USING "KnowledgeBase" kb
          WHERE kc."knowledgeBaseId" = kb.id
            AND kb."userId" = ${filter.userId}
        `;
      }
      // For document chunks, filter by Document properties
      else if (type === 'document' && filter.userId) {
        await this.prisma.$executeRaw`
          DELETE FROM document_chunks dc
          USING "Document" d
          WHERE dc."documentId" = d.id
            AND d."userId" = ${filter.userId}
        `;
      }

      logger.info('[VectorStore] Deleted vectors by filter');
    } catch (error) {
      logger.error('[VectorStore] Delete by filter failed:', error);
      throw error;
    }
  }

  /**
   * Get index stats
   */
  public async getStats(type?: 'knowledge' | 'document'): Promise<VectorStats> {
    try {
      let totalVectors = 0;

      if (!type || type === 'knowledge') {
        const kbResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM knowledge_chunks WHERE embedding IS NOT NULL
        `;
        totalVectors += Number(kbResult[0].count);
      }

      if (!type || type === 'document') {
        const docResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM document_chunks WHERE embedding IS NOT NULL
        `;
        totalVectors += Number(docResult[0].count);
      }

      // Check HNSW index exists
      const indexes = await this.prisma.$queryRaw<
        Array<{
          indexname: string;
          tablename: string;
        }>
      >`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE indexname LIKE '%embedding_hnsw%'
      `;

      return {
        totalVectors,
        dimension: 1536,
        indexFullness: 0, // pgvector doesn't have this concept
        indexes: indexes.map((idx) => `${idx.tablename}.${idx.indexname}`),
      };
    } catch (error) {
      logger.error('[VectorStore] Get stats failed:', error);
      throw error;
    }
  }

  /**
   * Fetch vectors by IDs
   */
  public async fetch(
    ids: string[],
    type: 'knowledge' | 'document' = 'knowledge'
  ): Promise<Map<string, VectorDocument>> {
    try {
      const documents = new Map<string, VectorDocument>();

      if (type === 'knowledge') {
        const results = await this.prisma.$queryRaw<
          Array<{
            id: string;
            content: string;
            chunkIndex: number;
            tokens: number;
            metadata: any;
          }>
        >`
          SELECT id, content, "chunkIndex", tokens, metadata
          FROM knowledge_chunks
          WHERE id = ANY(${ids}::text[])
        `;

        for (const row of results) {
          documents.set(row.id, {
            id: row.id,
            embedding: [], // Not returning full embedding for efficiency
            metadata: {
              content: row.content,
              chunkIndex: row.chunkIndex,
              tokens: row.tokens,
              ...row.metadata,
            },
          });
        }
      } else {
        const results = await this.prisma.$queryRaw<
          Array<{
            id: string;
            content: string;
            chunkIndex: number;
            pageNumber: number | null;
            tokens: number;
          }>
        >`
          SELECT id, content, "chunkIndex", "pageNumber", tokens
          FROM document_chunks
          WHERE id = ANY(${ids}::text[])
        `;

        for (const row of results) {
          documents.set(row.id, {
            id: row.id,
            embedding: [], // Not returning full embedding for efficiency
            metadata: {
              content: row.content,
              chunkIndex: row.chunkIndex,
              pageNumber: row.pageNumber,
              tokens: row.tokens,
            },
          });
        }
      }

      logger.info(`[VectorStore] Fetched ${documents.size} ${type} vectors`);

      return documents;
    } catch (error) {
      logger.error('[VectorStore] Fetch failed:', error);
      throw error;
    }
  }

  /**
   * Semantic search with text (embedding + query)
   */
  public async semanticSearch(
    text: string,
    embeddingService: any,
    options?: VectorSearchOptions
  ): Promise<VectorQueryResult[]> {
    try {
      // Generate embedding for query text
      const embeddingResult = await embeddingService.embed(text);

      // Query with embedding
      const results = await this.query(embeddingResult.embedding, options);

      logger.info(
        `[VectorStore] Semantic search for "${text.substring(0, 50)}..." returned ${results.length} results`
      );

      return results;
    } catch (error) {
      logger.error('[VectorStore] Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Benchmark vector search performance
   */
  async benchmarkSearch(queryEmbedding: number[], userId: string): Promise<number> {
    const startTime = Date.now();

    await this.query(queryEmbedding, {
      userId,
      topK: 5,
    });

    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const vectorStoreService = new VectorStoreService();
