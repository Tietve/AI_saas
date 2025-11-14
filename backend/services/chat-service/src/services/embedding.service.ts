/**
 * Embedding Service
 *
 * Generates vector embeddings using OpenAI API
 */

import OpenAI from 'openai';
import { EmbeddingError, EmbeddingResponse, OpenAIEmbeddingResponse } from '../types/document.types';

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;
  private maxRetries: number;
  private baseDelay: number; // milliseconds

  constructor(
    apiKey: string = process.env.OPENAI_API_KEY!,
    model: string = 'text-embedding-3-small',
    maxRetries: number = 5
  ) {
    if (!apiKey) {
      throw new EmbeddingError('OpenAI API key not configured');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = model;
    this.maxRetries = maxRetries;
    this.baseDelay = 1000; // Start with 1 second
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * @param texts Array of text strings (max 100 per batch)
   * @returns Embeddings and token usage
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse> {
    if (texts.length === 0) {
      return { embeddings: [], tokensUsed: 0 };
    }

    // OpenAI allows max 100 texts per request
    if (texts.length > 100) {
      return await this.generateEmbeddingsBatched(texts);
    }

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.openai.embeddings.create({
          model: this.model,
          input: texts,
          encoding_format: 'float',
        });
      });

      return {
        embeddings: response.data.map((item) => item.embedding),
        tokensUsed: response.usage.total_tokens,
      };
    } catch (error) {
      throw new EmbeddingError(
        `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embedding for single text
   * @param text Text string
   * @returns Single embedding vector
   */
  async generateSingleEmbedding(text: string): Promise<number[]> {
    const response = await this.generateEmbeddings([text]);
    return response.embeddings[0];
  }

  /**
   * Generate embeddings for large batches (>100 texts)
   * Splits into multiple API calls
   */
  private async generateEmbeddingsBatched(texts: string[]): Promise<EmbeddingResponse> {
    const batchSize = 100;
    const batches = this.batchTexts(texts, batchSize);

    let allEmbeddings: number[][] = [];
    let totalTokens = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      console.log(`Processing embedding batch ${i + 1}/${batches.length} (${batch.length} texts)`);

      try {
        const response = await this.generateEmbeddings(batch);
        allEmbeddings = allEmbeddings.concat(response.embeddings);
        totalTokens += response.tokensUsed;

        // Small delay between batches to avoid rate limits
        if (i < batches.length - 1) {
          await this.sleep(500);
        }
      } catch (error) {
        throw new EmbeddingError(
          `Batch ${i + 1}/${batches.length} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      embeddings: allEmbeddings,
      tokensUsed: totalTokens,
    };
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
   * Retry function with exponential backoff
   * Handles rate limits (429) and transient errors (500, 503)
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
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
   * Calculate embedding cost
   * @param tokensUsed Total tokens processed
   * @returns Cost in USD
   */
  calculateCost(tokensUsed: number): number {
    // text-embedding-3-small: $0.02 per 1M tokens
    const costPer1MTokens = 0.02;
    return (tokensUsed / 1_000_000) * costPer1MTokens;
  }

  /**
   * Get embedding model dimension
   */
  getDimension(): number {
    switch (this.model) {
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
  validateText(text: string): { valid: boolean; error?: string } {
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
}
