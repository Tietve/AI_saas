/**
 * Unified Embedding Service (Shared)
 *
 * Supports multiple embedding providers:
 * - OpenAI: text-embedding-3-small (1536d, $0.02/1M tokens)
 * - Cloudflare: @cf/baai/bge-base-en-v1.5 (768d, FREE/very cheap)
 *
 * FEATURES:
 * - Auto-provider selection based on config
 * - Caching support (Redis/Memory)
 * - Batch processing with rate limiting
 * - Retry with exponential backoff
 * - Cost tracking and estimation
 * - Text validation
 * - Cosine similarity calculation
 *
 * USAGE:
 * ```typescript
 * const embeddingService = new EmbeddingService();
 *
 * // Single embedding
 * const result = await embeddingService.embed('Hello world');
 *
 * // Batch embeddings
 * const batchResult = await embeddingService.embedBatch(['text1', 'text2']);
 *
 * // Switch provider
 * embeddingService.setProvider(EmbeddingProvider.CLOUDFLARE);
 * ```
 */

import crypto from 'crypto';
import {
  EmbeddingProvider,
  EmbeddingOptions,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingError,
} from './types';
import { CloudflareAIService } from './cloudflare-ai.service';

export class EmbeddingService {
  private openaiClient: any = null; // Lazy load OpenAI SDK
  private cloudflareAI: CloudflareAIService;
  private provider: EmbeddingProvider;
  private defaultModel: string;
  private cache: Map<string, EmbeddingResult>; // Simple in-memory cache
  private maxRetries: number;
  private baseDelay: number; // milliseconds

  constructor(
    config?: {
      provider?: EmbeddingProvider;
      openaiApiKey?: string;
      cloudflareAI?: CloudflareAIService;
      maxRetries?: number;
    }
  ) {
    this.cloudflareAI = config?.cloudflareAI || new CloudflareAIService();
    this.cache = new Map();
    this.maxRetries = config?.maxRetries || 5;
    this.baseDelay = 1000; // Start with 1 second

    // Auto-select provider based on configuration
    // Prefer Cloudflare if configured (FREE, faster)
    this.provider =
      config?.provider ||
      (this.cloudflareAI.isConfigured()
        ? EmbeddingProvider.CLOUDFLARE
        : EmbeddingProvider.OPENAI);

    this.defaultModel = 'text-embedding-3-small'; // OpenAI default

    console.log(`[Embedding] Using provider: ${this.provider}`);

    // Lazy load OpenAI client if needed
    if (this.provider === EmbeddingProvider.OPENAI || !this.cloudflareAI.isConfigured()) {
      this.initOpenAIClient(config?.openaiApiKey);
    }
  }

  /**
   * Initialize OpenAI client (lazy loading)
   */
  private async initOpenAIClient(apiKey?: string) {
    if (this.openaiClient) return;

    const openaiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('[Embedding] OpenAI API key not configured');
      return;
    }

    try {
      const OpenAI = await import('openai');
      this.openaiClient = new OpenAI.default({ apiKey: openaiKey });
    } catch (error) {
      console.error('[Embedding] Failed to load OpenAI SDK:', error);
    }
  }

  /**
   * Set embedding provider
   */
  public setProvider(provider: EmbeddingProvider): void {
    this.provider = provider;
    console.log(`[Embedding] Switched to provider: ${this.provider}`);
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
  public async embed(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult> {
    // Validate text first
    const validation = this.validateText(text);
    if (!validation.valid) {
      throw new EmbeddingError(validation.error || 'Invalid text');
    }

    const model = options?.model || this.defaultModel;
    const useCache = options?.useCache !== false;
    const cacheTTL = options?.cacheTTL || 3600; // 1 hour default

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(text, model, this.provider);
      const cached = this.cache.get(cacheKey);

      if (cached) {
        console.log(`[Embedding] Cache hit for text (${text.length} chars)`);
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
   * Generate embedding with OpenAI (with retry logic)
   */
  private async embedWithOpenAI(
    text: string,
    model: string,
    useCache: boolean,
    cacheTTL: number
  ): Promise<EmbeddingResult> {
    if (!this.openaiClient) {
      await this.initOpenAIClient();
      if (!this.openaiClient) {
        throw new EmbeddingError('OpenAI client not configured');
      }
    }

    try {
      const startTime = Date.now();

      const response = await this.retryWithBackoff(async () => {
        return await this.openaiClient.embeddings.create({
          model,
          input: text,
          encoding_format: 'float',
        });
      });

      const latency = Date.now() - startTime;

      const result: EmbeddingResult = {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
        model,
        cached: false,
        provider: EmbeddingProvider.OPENAI,
        cost: this.calculateCost(response.usage.total_tokens, EmbeddingProvider.OPENAI),
      };

      // Cache the result
      if (useCache) {
        const cacheKey = this.getCacheKey(text, model, this.provider);
        this.cache.set(cacheKey, result);
      }

      console.log(
        `[Embedding] OpenAI generated embedding in ${latency}ms (${result.tokens} tokens, $${result.cost?.toFixed(6)})`
      );

      return result;
    } catch (error) {
      console.error('[Embedding] OpenAI embedding failed:', error);
      throw new EmbeddingError(
        `OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

      const cfResult = await this.cloudflareAI.generateEmbedding(text);

      const latency = Date.now() - startTime;

      const result: EmbeddingResult = {
        embedding: cfResult.embedding,
        tokens: cfResult.tokens,
        model: cfResult.model,
        cached: false,
        provider: EmbeddingProvider.CLOUDFLARE,
        cost: this.calculateCost(cfResult.tokens, EmbeddingProvider.CLOUDFLARE),
      };

      // Cache the result
      if (useCache) {
        const cacheKey = this.getCacheKey(text, cfResult.model, this.provider);
        this.cache.set(cacheKey, result);
      }

      console.log(
        `[Embedding] Cloudflare generated embedding in ${latency}ms (${result.tokens} tokens, $${result.cost?.toFixed(6)})`
      );

      return result;
    } catch (error) {
      console.error('[Embedding] Cloudflare embedding failed:', error);
      throw new EmbeddingError(
        `Cloudflare embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  public async embedBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return {
        embeddings: [],
        totalTokens: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalCost: 0,
      };
    }

    const model = options?.model || this.defaultModel;
    const useCache = options?.useCache !== false;
    const cacheTTL = options?.cacheTTL || 3600;

    const results: EmbeddingResult[] = [];
    const textsToEmbed: string[] = [];
    const cacheKeys: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Check cache for each text
    if (useCache) {
      for (const text of texts) {
        const cacheKey = this.getCacheKey(text, model, this.provider);
        const cached = this.cache.get(cacheKey);

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
        await this.embedBatchWithOpenAI(
          textsToEmbed,
          model,
          results,
          cacheKeys,
          useCache,
          cacheTTL
        );
      }
    }

    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      embeddings: results,
      totalTokens,
      cacheHits,
      cacheMisses,
      totalCost,
    };
  }

  /**
   * Batch embed with OpenAI (handles max 100 texts per request)
   */
  private async embedBatchWithOpenAI(
    texts: string[],
    model: string,
    results: EmbeddingResult[],
    cacheKeys: string[],
    useCache: boolean,
    cacheTTL: number
  ): Promise<void> {
    if (!this.openaiClient) {
      await this.initOpenAIClient();
      if (!this.openaiClient) {
        throw new EmbeddingError('OpenAI client not configured');
      }
    }

    // OpenAI allows max 100 texts per request
    const batchSize = 100;
    const batches = this.batchTexts(texts, batchSize);

    let resultIndex = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        const startTime = Date.now();

        const response = await this.retryWithBackoff(async () => {
          return await this.openaiClient.embeddings.create({
            model,
            input: batch,
            encoding_format: 'float',
          });
        });

        const latency = Date.now() - startTime;

        // Process results
        for (let j = 0; j < response.data.length; j++) {
          const tokensPerText = response.usage.total_tokens / batch.length; // Approximate
          const result: EmbeddingResult = {
            embedding: response.data[j].embedding,
            tokens: Math.ceil(tokensPerText),
            model,
            cached: false,
            provider: EmbeddingProvider.OPENAI,
            cost: this.calculateCost(Math.ceil(tokensPerText), EmbeddingProvider.OPENAI),
          };

          results.push(result);

          // Cache individual result
          if (useCache && cacheKeys[resultIndex]) {
            this.cache.set(cacheKeys[resultIndex], result);
          }
          resultIndex++;
        }

        console.log(
          `[Embedding] OpenAI batch ${i + 1}/${batches.length}: ${batch.length} embeddings in ${latency}ms`
        );

        // Small delay between batches to avoid rate limits
        if (i < batches.length - 1) {
          await this.sleep(500);
        }
      } catch (error) {
        console.error('[Embedding] OpenAI batch embedding failed:', error);
        throw new EmbeddingError(
          `Batch ${i + 1}/${batches.length} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
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

      const cfResults = await this.cloudflareAI.generateEmbeddingsBatch(texts);

      const latency = Date.now() - startTime;

      // Process results
      for (let i = 0; i < cfResults.length; i++) {
        const result: EmbeddingResult = {
          embedding: cfResults[i].embedding,
          tokens: cfResults[i].tokens,
          model: cfResults[i].model,
          cached: false,
          provider: EmbeddingProvider.CLOUDFLARE,
          cost: this.calculateCost(cfResults[i].tokens, EmbeddingProvider.CLOUDFLARE),
        };

        results.push(result);

        // Cache individual result
        if (useCache && cacheKeys[i]) {
          this.cache.set(cacheKeys[i], result);
        }
      }

      console.log(
        `[Embedding] Cloudflare batch generated ${texts.length} embeddings in ${latency}ms`
      );
    } catch (error) {
      console.error('[Embedding] Cloudflare batch embedding failed:', error);
      throw new EmbeddingError(
        `Cloudflare batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new EmbeddingError('Embeddings must have the same dimension');
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
   * Calculate embedding cost
   * @param tokens Total tokens processed
   * @param provider Embedding provider
   * @returns Cost in USD
   */
  public calculateCost(tokens: number, provider: EmbeddingProvider): number {
    if (provider === EmbeddingProvider.OPENAI) {
      // text-embedding-3-small: $0.02 per 1M tokens
      const costPer1MTokens = 0.02;
      return (tokens / 1_000_000) * costPer1MTokens;
    } else {
      // Cloudflare: ~$0.0001 per request (simplified)
      return 0.0001;
    }
  }

  /**
   * Get embedding model dimension
   */
  public getDimension(model?: string): number {
    if (this.provider === EmbeddingProvider.CLOUDFLARE) {
      return this.cloudflareAI.getEmbeddingDimension();
    }

    // OpenAI dimensions
    const openaiModel = model || this.defaultModel;
    switch (openaiModel) {
      case 'text-embedding-3-small':
        return 1536;
      case 'text-embedding-3-large':
        return 3072;
      case 'text-embedding-ada-002':
        return 1536;
      default:
        return 1536; // Default
    }
  }

  /**
   * Validate text before embedding
   */
  public validateText(text: string): { valid: boolean; error?: string } {
    // Max input tokens for OpenAI embeddings: 8,191
    const MAX_TOKENS = 8191;

    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = Math.ceil(text.length / 4);

    if (estimatedTokens > MAX_TOKENS) {
      return {
        valid: false,
        error: `Text too long (estimated ${estimatedTokens} tokens, max ${MAX_TOKENS})`,
      };
    }

    if (text.trim().length === 0) {
      return {
        valid: false,
        error: 'Text is empty',
      };
    }

    return { valid: true };
  }

  /**
   * Retry function with exponential backoff
   * Handles rate limits (429) and transient errors (500, 503)
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on client errors (except 429 rate limit)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Max retries exceeded
      if (attempt >= this.maxRetries) {
        console.error(`Max retries (${this.maxRetries}) exceeded`);
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = this.baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // 0-1000ms jitter
      const totalDelay = delay + jitter;

      console.warn(
        `Embedding API error (attempt ${attempt}/${this.maxRetries}): ${error.message}. Retrying in ${Math.round(totalDelay)}ms...`
      );

      await this.sleep(totalDelay);

      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Split texts into batches
   */
  private batchTexts(texts: string[], batchSize: number): string[][] {
    const batches: string[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    return batches;
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

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('[Embedding] Cache cleared');
  }

  /**
   * Get cache size
   */
  public getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance (optional - services can create their own instances)
export const embeddingService = new EmbeddingService();
