/**
 * Token Counter Utility
 *
 * Counts tokens for text using js-tiktoken (OpenAI tokenizer)
 */

import { Tiktoken, encodingForModel } from 'js-tiktoken';

export class TokenCounter {
  private encoder: Tiktoken;

  constructor(model: string = 'gpt-4') {
    // Get encoding for model (cl100k_base for gpt-4, gpt-3.5-turbo, text-embedding-3-*)
    this.encoder = encodingForModel(model as any);
  }

  /**
   * Count tokens in text
   */
  count(text: string): number {
    try {
      const tokens = this.encoder.encode(text);
      return tokens.length;
    } catch (error) {
      // Fallback: estimate tokens as ~0.75 * word count
      const words = text.split(/\s+/).length;
      return Math.ceil(words * 0.75);
    }
  }

  /**
   * Count tokens in array of texts
   */
  countBatch(texts: string[]): number {
    return texts.reduce((total, text) => total + this.count(text), 0);
  }

  /**
   * Truncate text to max tokens
   */
  truncate(text: string, maxTokens: number): string {
    const tokens = this.encoder.encode(text);

    if (tokens.length <= maxTokens) {
      return text;
    }

    // Decode only the first maxTokens
    const truncatedTokens = tokens.slice(0, maxTokens);
    return this.encoder.decode(truncatedTokens);
  }

  /**
   * Split text into chunks by token count
   * Returns array of text chunks, each ≤ maxTokens
   */
  splitByTokens(text: string, maxTokens: number, overlapTokens: number = 0): string[] {
    const tokens = this.encoder.encode(text);
    const chunks: string[] = [];

    let i = 0;
    while (i < tokens.length) {
      const chunkTokens = tokens.slice(i, i + maxTokens);
      const chunkText = this.encoder.decode(chunkTokens);
      chunks.push(chunkText);

      // Move forward, accounting for overlap
      i += maxTokens - overlapTokens;
    }

    return chunks;
  }

  /**
   * Free encoder resources (call when done)
   * Note: js-tiktoken doesn't require explicit cleanup
   */
  free(): void {
    // No-op: js-tiktoken handles cleanup automatically
  }
}

// Singleton instance for default model
let defaultCounter: TokenCounter | null = null;

/**
 * Get default token counter instance
 */
export function getTokenCounter(): TokenCounter {
  if (!defaultCounter) {
    defaultCounter = new TokenCounter('gpt-4');
  }
  return defaultCounter;
}

/**
 * Quick helper to count tokens
 */
export function countTokens(text: string): number {
  return getTokenCounter().count(text);
}

/**
 * Quick helper to count batch tokens
 */
export function countBatchTokens(texts: string[]): number {
  return getTokenCounter().countBatch(texts);
}
