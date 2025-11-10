import { getPineconeIndex } from '../config/pinecone.config';
import logger from '../config/logger.config';
import { env } from '../config/env.config';
import {
  VectorDocument,
  VectorQueryResult,
  VectorSearchOptions,
  VectorUpsertResult,
  VectorStats,
} from '../types/vector.types';

export class VectorStoreService {
  private indexName: string;

  constructor() {
    this.indexName = env.pinecone.indexName;
  }

  /**
   * Upsert vectors into Pinecone
   */
  public async upsert(documents: VectorDocument[]): Promise<VectorUpsertResult> {
    try {
      const index = await getPineconeIndex();

      const vectors = documents.map(doc => ({
        id: doc.id,
        values: doc.embedding,
        metadata: doc.metadata,
      }));

      await index.upsert(vectors);

      logger.info(`[VectorStore] Upserted ${documents.length} vectors`);

      return {
        upsertedCount: documents.length,
        ids: documents.map(d => d.id),
      };
    } catch (error) {
      logger.error('[VectorStore] Upsert failed:', error);
      throw error;
    }
  }

  /**
   * Query vectors by similarity
   */
  public async query(
    queryEmbedding: number[],
    options?: VectorSearchOptions
  ): Promise<VectorQueryResult[]> {
    try {
      const index = await getPineconeIndex();

      const topK = options?.topK || env.performance.maxRagResults;

      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: options?.includeMetadata !== false,
        filter: options?.filter,
      });

      const results: VectorQueryResult[] = queryResponse.matches.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata || {},
      }));

      logger.info(`[VectorStore] Query returned ${results.length} results`);

      return results;
    } catch (error) {
      logger.error('[VectorStore] Query failed:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  public async delete(ids: string[]): Promise<void> {
    try {
      const index = await getPineconeIndex();

      await index.deleteMany(ids);

      logger.info(`[VectorStore] Deleted ${ids.length} vectors`);
    } catch (error) {
      logger.error('[VectorStore] Delete failed:', error);
      throw error;
    }
  }

  /**
   * Delete all vectors matching filter
   */
  public async deleteByFilter(filter: Record<string, any>): Promise<void> {
    try {
      const index = await getPineconeIndex();

      await index.deleteMany({ filter });

      logger.info('[VectorStore] Deleted vectors by filter');
    } catch (error) {
      logger.error('[VectorStore] Delete by filter failed:', error);
      throw error;
    }
  }

  /**
   * Get index stats
   */
  public async getStats(): Promise<VectorStats> {
    try {
      const index = await getPineconeIndex();

      const stats = await index.describeIndexStats();

      return {
        totalVectors: stats.totalRecordCount || 0,
        dimension: stats.dimension || 1536,
        indexFullness: stats.indexFullness || 0,
      };
    } catch (error) {
      logger.error('[VectorStore] Get stats failed:', error);
      throw error;
    }
  }

  /**
   * Fetch vectors by IDs
   */
  public async fetch(ids: string[]): Promise<Map<string, VectorDocument>> {
    try {
      const index = await getPineconeIndex();

      const fetchResponse = await index.fetch(ids);

      const documents = new Map<string, VectorDocument>();

      for (const [id, record] of Object.entries(fetchResponse.records)) {
        documents.set(id, {
          id,
          embedding: record.values,
          metadata: record.metadata || {},
        });
      }

      logger.info(`[VectorStore] Fetched ${documents.size} vectors`);

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

      logger.info(`[VectorStore] Semantic search for "${text.substring(0, 50)}..." returned ${results.length} results`);

      return results;
    } catch (error) {
      logger.error('[VectorStore] Semantic search failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorStoreService = new VectorStoreService();
