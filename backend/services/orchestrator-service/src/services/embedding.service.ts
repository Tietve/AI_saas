import OpenAI from 'openai';
import { env } from '../config/env.config';
import { cache } from '../config/redis.config';
import logger from '../config/logger.config';
import {
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingOptions,
} from '../types/embedding.types';
import crypto from 'crypto';

export class EmbeddingService {
  private openai: OpenAI;
  private defaultModel: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.openai.apiKey,
      organization: env.openai.orgId,
    });

    this.defaultModel = env.models.embedding;
  }

  /**
   * Generate embedding for a single text
   */
  public async embed(
    text: string,
    options?: EmbeddingOptions
  ): Promise<EmbeddingResult> {
    const model = options?.model || this.defaultModel;
    const useCache = options?.useCache !== false;
    const cacheTTL = options?.cacheTTL || env.cache.embeddingTtl;

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(text, model);
      const cached = await cache.get<EmbeddingResult>(cacheKey);

      if (cached) {
        logger.debug(`[Embedding] Cache hit for text (${text.length} chars)`);
        return {
          ...cached,
          cached: true,
        };
      }
    }

    // Generate embedding
    try {
      const startTime = Date.now();

      const response = await this.openai.embeddings.create({
        model,
        input: text,
      });

      const latency = Date.now() - startTime;

      const result: EmbeddingResult = {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
        model,
        cached: false,
      };

      // Cache the result
      if (useCache) {
        const cacheKey = this.getCacheKey(text, model);
        await cache.set(cacheKey, result, cacheTTL);
      }

      logger.info(`[Embedding] Generated embedding in ${latency}ms (${result.tokens} tokens)`);

      return result;
    } catch (error) {
      logger.error('[Embedding] Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  public async embedBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<BatchEmbeddingResult> {
    const model = options?.model || this.defaultModel;
    const useCache = options?.useCache !== false;
    const cacheTTL = options?.cacheTTL || env.cache.embeddingTtl;

    const results: EmbeddingResult[] = [];
    const textsToEmbed: string[] = [];
    const cacheKeys: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Check cache for each text
    if (useCache) {
      for (const text of texts) {
        const cacheKey = this.getCacheKey(text, model);
        const cached = await cache.get<EmbeddingResult>(cacheKey);

        if (cached) {
          results.push({ ...cached, cached: true });
          cacheHits++;
        } else {
          textsToEmbed.push(text);
          cacheKeys.push(cacheKey);
          cacheMisses++;
        }
      }
    } else {
      textsToEmbed.push(...texts);
      cacheMisses = texts.length;
    }

    // Generate embeddings for cache misses
    if (textsToEmbed.length > 0) {
      try {
        const startTime = Date.now();

        const response = await this.openai.embeddings.create({
          model,
          input: textsToEmbed,
        });

        const latency = Date.now() - startTime;

        // Process results
        for (let i = 0; i < response.data.length; i++) {
          const result: EmbeddingResult = {
            embedding: response.data[i].embedding,
            tokens: response.usage.total_tokens / textsToEmbed.length, // Approximate
            model,
            cached: false,
          };

          results.push(result);

          // Cache individual result
          if (useCache) {
            await cache.set(cacheKeys[i], result, cacheTTL);
          }
        }

        logger.info(
          `[Embedding] Batch generated ${textsToEmbed.length} embeddings in ${latency}ms`
        );
      } catch (error) {
        logger.error('[Embedding] Batch embedding failed:', error);
        throw error;
      }
    }

    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

    return {
      embeddings: results,
      totalTokens,
      cacheHits,
      cacheMisses,
    };
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate cache key for embedding
   */
  private getCacheKey(text: string, model: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${model}:${text}`)
      .digest('hex');

    return `embedding:${hash}`;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
