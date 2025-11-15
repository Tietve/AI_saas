/**
 * Shared Service Types
 *
 * Type definitions for shared AI services (Cloudflare AI, LLM, Embedding)
 */

// ============================================================================
// Cloudflare AI Types
// ============================================================================

export interface CloudflareAIConfig {
  accountId: string;
  apiToken: string;
}

export interface CloudflareEmbeddingResult {
  embedding: number[];
  model: string;
  tokens: number;
}

export interface CloudflareGenerationResult {
  text: string;
  model: string;
  tokens: number;
}

// ============================================================================
// LLM Service Types
// ============================================================================

export enum LLMProvider {
  GPT4O = 'gpt-4o',
  GPT35_TURBO = 'gpt-3.5-turbo',
  LLAMA2 = 'llama-2',
  CLAUDE = 'claude-3-sonnet',
}

export interface LLMConfig {
  provider: LLMProvider;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMGenerationResult {
  text: string;
  provider: LLMProvider;
  model: string;
  tokens: number;
  cost?: number; // Estimated cost in USD
}

export interface LLMProviderInfo {
  name: string;
  cost: string;
  quality: string;
  speed: string;
  useCases: string[];
}

// ============================================================================
// Embedding Service Types
// ============================================================================

export enum EmbeddingProvider {
  OPENAI = 'openai',
  CLOUDFLARE = 'cloudflare',
}

export interface EmbeddingOptions {
  model?: string;
  useCache?: boolean;
  cacheTTL?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
  cached: boolean;
  provider?: EmbeddingProvider;
  cost?: number; // Estimated cost in USD
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens: number;
  cacheHits: number;
  cacheMisses: number;
  totalCost?: number; // Estimated total cost in USD
}

// ============================================================================
// Cost Tracking Types
// ============================================================================

export interface CostInfo {
  tokens: number;
  cost: number; // USD
  provider: string;
  model: string;
  operation: 'embedding' | 'generation' | 'completion';
}

// ============================================================================
// Error Types
// ============================================================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public provider: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class EmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingError';
  }
}
