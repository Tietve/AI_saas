import { embeddingService } from '../services/embedding.service';
import { vectorStoreService } from '../services/vector-store.service';
import logger from '../config/logger.config';
import { env } from '../config/env.config';
import { VectorQueryResult } from '../types/vector.types';

export interface RAGDocument {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface RAGRetrievalResult {
  documents: RAGDocument[];
  totalRetrieved: number;
  queryEmbeddingTokens: number;
  latencyMs: number;
  cached: boolean;
}

export interface RAGRetrievalOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, any>;
  userId?: string;
}

export class RAGRetrieverAgent {
  /**
   * Retrieve relevant documents for a query
   */
  public async retrieve(
    query: string,
    options?: RAGRetrievalOptions
  ): Promise<RAGRetrievalResult> {
    const startTime = Date.now();

    try {
      // Generate embedding for query
      logger.info(`[RAG] Retrieving documents for query: "${query.substring(0, 50)}..."`);

      const embeddingResult = await embeddingService.embed(query);

      // Query vector store
      const topK = options?.topK || env.performance.maxRagResults;
      const filter = options?.filter || (options?.userId ? { userId: options.userId } : undefined);

      const vectorResults = await vectorStoreService.query(
        embeddingResult.embedding,
        {
          topK,
          filter,
          includeMetadata: true,
        }
      );

      // Filter by minimum score if specified
      const minScore = options?.minScore || 0.7;
      const filteredResults = vectorResults.filter(r => r.score >= minScore);

      // Convert to RAGDocument format
      const documents: RAGDocument[] = filteredResults.map(result => ({
        id: result.id,
        content: result.metadata.content as string || '',
        score: result.score,
        metadata: result.metadata,
      }));

      const latencyMs = Date.now() - startTime;

      logger.info(
        `[RAG] Retrieved ${documents.length} documents in ${latencyMs}ms (${embeddingResult.tokens} tokens)`
      );

      return {
        documents,
        totalRetrieved: documents.length,
        queryEmbeddingTokens: embeddingResult.tokens,
        latencyMs,
        cached: embeddingResult.cached,
      };
    } catch (error) {
      logger.error('[RAG] Retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Format retrieved documents as context string
   */
  public formatContext(documents: RAGDocument[]): string {
    if (documents.length === 0) {
      return '';
    }

    const contextParts = documents.map((doc, index) => {
      return `[Document ${index + 1}] (Relevance: ${(doc.score * 100).toFixed(1)}%)\n${doc.content}`;
    });

    return contextParts.join('\n\n');
  }

  /**
   * Retrieve and format in one step
   */
  public async retrieveAndFormat(
    query: string,
    options?: RAGRetrievalOptions
  ): Promise<{ context: string; metadata: RAGRetrievalResult }> {
    const result = await this.retrieve(query, options);
    const context = this.formatContext(result.documents);

    return {
      context,
      metadata: result,
    };
  }
}

// Export singleton instance
export const ragRetrieverAgent = new RAGRetrieverAgent();
