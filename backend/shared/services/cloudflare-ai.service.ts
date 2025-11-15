/**
 * Cloudflare Workers AI Service (Shared)
 *
 * IMPORTANT: Cloudflare Workers AI requires either:
 * 1. Cloudflare Workers runtime (native bindings)
 * 2. REST API calls with Account ID + API Token
 *
 * This implementation uses REST API for compatibility with Node.js
 *
 * FEATURES:
 * - Embeddings: @cf/baai/bge-base-en-v1.5 (768 dimensions, FREE)
 * - Generation: @cf/meta/llama-2-7b-chat-int8 (Budget-friendly)
 * - RAG: Combines embeddings + generation for Q&A
 *
 * PRICING:
 * - FREE tier: 10k requests/day across all models
 * - Paid: ~$0.0001 per embedding, ~$0.01 per 1M tokens
 * - 90-95% cheaper than OpenAI
 */

import {
  CloudflareAIConfig,
  CloudflareEmbeddingResult,
  CloudflareGenerationResult,
  AIServiceError,
} from './types';

export class CloudflareAIService {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  // Models
  private readonly EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'; // 768 dimensions, FREE
  private readonly LLAMA_MODEL = '@cf/meta/llama-2-7b-chat-int8'; // Budget-friendly generation

  constructor(config?: CloudflareAIConfig) {
    this.accountId = config?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.apiToken = config?.apiToken || process.env.CLOUDFLARE_API_TOKEN || '';
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;

    if (!this.accountId || !this.apiToken) {
      console.warn('[CloudflareAI] Missing credentials - service will be disabled');
    }
  }

  /**
   * Check if Cloudflare AI is configured
   */
  public isConfigured(): boolean {
    return !!this.accountId && !!this.apiToken;
  }

  /**
   * Generate embedding for a single text
   * @param text - Text to embed
   * @returns Embedding vector (768 dimensions)
   */
  public async generateEmbedding(text: string): Promise<CloudflareEmbeddingResult> {
    if (!this.isConfigured()) {
      throw new AIServiceError(
        'Cloudflare AI not configured - missing account ID or API token',
        'cloudflare',
        'generateEmbedding'
      );
    }

    try {
      console.log(`[CloudflareAI] Generating embedding for text (${text.length} chars)`);

      const response = await fetch(`${this.baseUrl}/${this.EMBEDDING_MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as any;

      // Cloudflare returns: { result: { shape: [1, 768], data: [[...]] } }
      const embedding = data.result.data[0];

      console.log(`[CloudflareAI] Generated embedding: ${embedding.length} dimensions`);

      return {
        embedding,
        model: this.EMBEDDING_MODEL,
        tokens: this.estimateTokens(text),
      };
    } catch (error) {
      console.error('[CloudflareAI] Embedding generation failed:', error);
      throw new AIServiceError(
        `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'cloudflare',
        'generateEmbedding',
        error as Error
      );
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param texts - Array of texts to embed
   * @returns Array of embedding results
   */
  public async generateEmbeddingsBatch(texts: string[]): Promise<CloudflareEmbeddingResult[]> {
    if (!this.isConfigured()) {
      throw new AIServiceError(
        'Cloudflare AI not configured',
        'cloudflare',
        'generateEmbeddingsBatch'
      );
    }

    console.log(`[CloudflareAI] Batch embedding: ${texts.length} texts`);

    // Process in parallel (Cloudflare has good rate limits)
    const results = await Promise.all(texts.map((text) => this.generateEmbedding(text)));

    console.log(`[CloudflareAI] Batch complete: ${results.length} embeddings`);

    return results;
  }

  /**
   * Generate text using Llama-2 (budget-friendly RAG analysis)
   * @param prompt - Prompt for generation
   * @param systemPrompt - System prompt (optional)
   * @param maxTokens - Maximum tokens to generate
   * @returns Generated text
   */
  public async generateText(
    prompt: string,
    systemPrompt?: string,
    maxTokens: number = 512
  ): Promise<CloudflareGenerationResult> {
    if (!this.isConfigured()) {
      throw new AIServiceError('Cloudflare AI not configured', 'cloudflare', 'generateText');
    }

    try {
      console.log(`[CloudflareAI] Generating text with Llama-2 (max ${maxTokens} tokens)`);

      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${this.baseUrl}/${this.LLAMA_MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as any;

      // Cloudflare returns: { result: { response: "..." } }
      const text = data.result.response;

      console.log(`[CloudflareAI] Generated ${text.length} characters with Llama-2`);

      return {
        text,
        model: this.LLAMA_MODEL,
        tokens: this.estimateTokens(text),
      };
    } catch (error) {
      console.error('[CloudflareAI] Text generation failed:', error);
      throw new AIServiceError(
        `Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'cloudflare',
        'generateText',
        error as Error
      );
    }
  }

  /**
   * Generate RAG analysis using Llama-2
   * Combines retrieved chunks with user query to generate contextual answer
   * @param query - User query
   * @param chunks - Retrieved text chunks from vector search
   * @returns Generated answer
   */
  public async generateRAGAnswer(
    query: string,
    chunks: string[]
  ): Promise<CloudflareGenerationResult> {
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a helpful assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information, say so.`;

    const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

    return this.generateText(prompt, systemPrompt, 512);
  }

  /**
   * Estimate tokens for text (rough approximation)
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for operations
   * @param tokens - Token count
   * @param operation - Operation type
   * @returns Estimated cost in USD
   */
  public calculateCost(tokens: number, operation: 'embedding' | 'generation'): number {
    if (operation === 'embedding') {
      // FREE tier: 10k requests/day, then ~$0.0001 per request
      // Simplified: assume $0.0001 per request
      return 0.0001;
    } else {
      // Generation: ~$0.01 per 1M tokens
      return (tokens / 1_000_000) * 0.01;
    }
  }

  /**
   * Get pricing info (for logging/monitoring)
   */
  public getPricingInfo() {
    return {
      embedding: {
        model: this.EMBEDDING_MODEL,
        cost: 'FREE (first 10k requests/day), then ~$0.0001 per request',
        dimensions: 768,
      },
      generation: {
        model: this.LLAMA_MODEL,
        cost: 'FREE (first 10k requests/day), then ~$0.01 per 1M tokens',
        maxTokens: 2048,
      },
      notes: [
        'FREE tier: 10k requests/day across all models',
        'Paid: $0.011 per 1k Neurons (1 neuron = 1 request to most models)',
        'Embedding: ~$0.0001 per request (768d)',
        'Llama-2: ~$0.01 per 1M tokens',
        'vs OpenAI: ~90% cheaper for embeddings, ~95% cheaper for generation',
      ],
    };
  }

  /**
   * Get embedding dimension
   */
  public getEmbeddingDimension(): number {
    return 768;
  }

  /**
   * Get available models
   */
  public getAvailableModels() {
    return {
      embedding: this.EMBEDDING_MODEL,
      generation: this.LLAMA_MODEL,
    };
  }
}

// Export singleton instance (optional - services can create their own instances)
export const cloudflareAIService = new CloudflareAIService();
