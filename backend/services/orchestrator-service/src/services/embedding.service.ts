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
import { cloudflareAIService } from './cloudflare-ai.service';

export enum EmbeddingProvider {
  OPENAI = 'openai',
  CLOUDFLARE = 'cloudflare',
}

export class EmbeddingService {
  private openai: OpenAI;
  private defaultModel: string;
  private provider: EmbeddingProvider;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.openai.apiKey,
      organization: env.openai.orgId,
    });

    this.defaultModel = env.models.embedding;

    // Auto-select provider based on configuration
    // Prefer Cloudflare if configured (FREE, faster)
    this.provider = cloudflareAIService.isConfigured()
      ? EmbeddingProvider.CLOUDFLARE
      : EmbeddingProvider.OPENAI;

    logger.info(`[Embedding] Using provider: ${this.provider}`);
  }

  /**
   * Set embedding provider
   */
  public setProvider(provider: EmbeddingProvider): void {
    this.provider = provider;
    logger.info(`[Embedding] Switched to provider: ${this.provider}`);
  }

  /**
   * Get current provider
   */
  public getProvider(): EmbeddingProvider {
    return this.provider;
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
      const cacheKey = this.getCacheKey(text, model, this.provider);
      const cached = await cache.get<EmbeddingResult>(cacheKey);

      if (cached) {
        logger.debug(`[Embedding] Cache hit for text (${text.length} chars)`);
        return {
          ...cached,
          cached: true,
        };
      }
    }

    // Route to appropriate provider
    if (this.provider === EmbeddingProvider.CLOUDFLARE) {
      return await this.embedWithCloudflare(text, useCache, cacheTTL);
    } else {
      return await this.embedWithOpenAI(text, model, useCache, cacheTTL);
    }
  }

  /**
   * Generate embedding with OpenAI
   */
  private async embedWithOpenAI(
    text: string,
    model: string,
    useCache: boolean,
    cacheTTL: number
  ): Promise<EmbeddingResult> {
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
        const cacheKey = this.getCacheKey(text, model, this.provider);
        await cache.set(cacheKey, result, cacheTTL);
      }

      logger.info(`[Embedding] OpenAI generated embedding in ${latency}ms (${result.tokens} tokens)`);

      return result;
    } catch (error) {
      logger.error('[Embedding] OpenAI embedding failed:', error);
      throw error;
    }
  }

  /**
   * Generate embedding with Cloudflare Workers AI
   */
  private async embedWithCloudflare(
    text: string,
    useCache: boolean,
    cacheTTL: number
  ): Promise<EmbeddingResult> {
    try {
      const startTime = Date.now();

      const cfResult = await cloudflareAIService.generateEmbedding(text);

      const latency = Date.now() - startTime;

      const result: EmbeddingResult = {
        embedding: cfResult.embedding,
        tokens: cfResult.tokens,
        model: cfResult.model,
        cached: false,
      };

      // Cache the result
      if (useCache) {
        const cacheKey = this.getCacheKey(text, cfResult.model, this.provider);
        await cache.set(cacheKey, result, cacheTTL);
      }

      logger.info(`[Embedding] Cloudflare generated embedding in ${latency}ms (${result.tokens} tokens)`);

      return result;
    } catch (error) {
      logger.error('[Embedding] Cloudflare embedding failed:', error);
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
        const cacheKey = this.getCacheKey(text, model, this.provider);
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
      // Route to appropriate provider
      if (this.provider === EmbeddingProvider.CLOUDFLARE) {
        await this.embedBatchWithCloudflare(textsToEmbed, results, cacheKeys, useCache, cacheTTL);
      } else {
        await this.embedBatchWithOpenAI(textsToEmbed, model, results, cacheKeys, useCache, cacheTTL);
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
   * Batch embed with OpenAI
   */
  private async embedBatchWithOpenAI(
    texts: string[],
    model: string,
    results: EmbeddingResult[],
    cacheKeys: string[],
    useCache: boolean,
    cacheTTL: number
  ): Promise<void> {
    try {
      const startTime = Date.now();

      const response = await this.openai.embeddings.create({
        model,
        input: texts,
      });

      const latency = Date.now() - startTime;

      // Process results
      for (let i = 0; i < response.data.length; i++) {
        const result: EmbeddingResult = {
          embedding: response.data[i].embedding,
          tokens: response.usage.total_tokens / texts.length, // Approximate
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
        `[Embedding] OpenAI batch generated ${texts.length} embeddings in ${latency}ms`
      );
    } catch (error) {
      logger.error('[Embedding] OpenAI batch embedding failed:', error);
      throw error;
    }
  }

  /**
   * Batch embed with Cloudflare
   */
  private async embedBatchWithCloudflare(
    texts: string[],
    results: EmbeddingResult[],
    cacheKeys: string[],
    useCache: boolean,
    cacheTTL: number
  ): Promise<void> {
    try {
      const startTime = Date.now();

      const cfResults = await cloudflareAIService.generateEmbeddingsBatch(texts);

      const latency = Date.now() - startTime;

      // Process results
      for (let i = 0; i < cfResults.length; i++) {
        const result: EmbeddingResult = {
          embedding: cfResults[i].embedding,
          tokens: cfResults[i].tokens,
          model: cfResults[i].model,
          cached: false,
        };

        results.push(result);

        // Cache individual result
        if (useCache) {
          await cache.set(cacheKeys[i], result, cacheTTL);
        }
      }

      logger.info(
        `[Embedding] Cloudflare batch generated ${texts.length} embeddings in ${latency}ms`
      );
    } catch (error) {
      logger.error('[Embedding] Cloudflare batch embedding failed:', error);
      throw error;
    }
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
  private getCacheKey(text: string, model: string, provider: EmbeddingProvider): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${provider}:${model}:${text}`)
      .digest('hex');

    return `embedding:${provider}:${hash}`;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
