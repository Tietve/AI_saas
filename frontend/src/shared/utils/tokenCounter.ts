import { Tiktoken } from 'js-tiktoken/lite';
import cl100k_base from 'js-tiktoken/ranks/cl100k_base';

/**
 * Token counter utility using tiktoken
 * Compatible with GPT-4, GPT-3.5-turbo models (cl100k_base encoding)
 */

let encoding: Tiktoken | null = null;

/**
 * Initialize the tiktoken encoding (lazy loading)
 */
function getEncoding(): Tiktoken {
  if (!encoding) {
    encoding = new Tiktoken(cl100k_base);
  }
  return encoding;
}

/**
 * Count tokens in a text string
 * @param text - Text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
  if (!text || text.trim() === '') {
    return 0;
  }

  try {
    const enc = getEncoding();
    const tokens = enc.encode(text);
    return tokens.length;
  } catch (error) {
    console.error('Error counting tokens:', error);
    // Fallback: approximate 4 chars = 1 token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Format token count for display
 * @param count - Number of tokens
 * @returns Formatted string (e.g., "150 tokens", "1.2K tokens")
 */
export function formatTokenCount(count: number): string {
  if (count < 1000) {
    return `${count} tokens`;
  }
  if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K tokens`;
  }
  return `${(count / 1000000).toFixed(1)}M tokens`;
}

/**
 * Estimate cost based on token count (rough estimate)
 * @param tokens - Number of tokens
 * @param model - Model name (default: gpt-4)
 * @returns Estimated cost in USD
 */
export function estimateCost(tokens: number, model: string = 'gpt-4'): number {
  // Pricing as of 2024 (input tokens per 1M)
  const pricing: Record<string, number> = {
    'gpt-4': 30.0, // $30 per 1M tokens
    'gpt-4-turbo': 10.0, // $10 per 1M tokens
    'gpt-3.5-turbo': 0.5, // $0.50 per 1M tokens
    'claude-3-opus': 15.0, // $15 per 1M tokens
    'claude-3-sonnet': 3.0, // $3 per 1M tokens
  };

  const pricePerMillion = pricing[model] || pricing['gpt-4'];
  return (tokens / 1000000) * pricePerMillion;
}

/**
 * Check if token count exceeds limit
 * @param count - Number of tokens
 * @param limit - Token limit (default: 4096 for GPT-3.5)
 * @returns True if exceeds limit
 */
export function exceedsLimit(count: number, limit: number = 4096): boolean {
  return count > limit;
}

/**
 * Clean up encoding resources (call when component unmounts)
 */
export function cleanup(): void {
  if (encoding) {
    encoding.free();
    encoding = null;
  }
}
