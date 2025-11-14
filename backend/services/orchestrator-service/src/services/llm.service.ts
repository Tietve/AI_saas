import logger from '../config/logger.config';
import { cloudflareAIService } from './cloudflare-ai.service';
import { sentryService } from './sentry.service';
import Anthropic from '@anthropic-ai/sdk';

/**
 * LLM Service with Strategy Pattern
 *
 * Supports multiple LLM providers:
 * - GPT-4o (OpenAI) - High quality, expensive
 * - Llama-2 (Cloudflare) - Budget-friendly, good quality
 * - Claude (Anthropic) - Alternative high quality
 *
 * Strategy selection based on:
 * - User preference
 * - Query complexity
 * - Budget constraints
 * - Feature requirements
 */

export enum LLMProvider {
  GPT4O = 'gpt-4o',
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

export class LLMService {
  private anthropicClient: Anthropic | null = null;

  constructor() {
    // Initialize Anthropic if API key exists
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
    }
  }

  /**
   * Generate RAG answer using selected provider
   * @param query - User query
   * @param chunks - Retrieved text chunks
   * @param config - LLM configuration
   * @returns Generated answer with metadata
   */
  public async generateRAGAnswer(
    query: string,
    chunks: string[],
    config: LLMConfig = { provider: LLMProvider.LLAMA2 }
  ): Promise<LLMGenerationResult> {
    logger.info(`[LLM] Generating RAG answer using ${config.provider}`);

    try {
      switch (config.provider) {
        case LLMProvider.LLAMA2:
          return await this.generateWithLlama2(query, chunks, config);

        case LLMProvider.GPT4O:
          return await this.generateWithGPT4o(query, chunks, config);

        case LLMProvider.CLAUDE:
          return await this.generateWithClaude(query, chunks, config);

        default:
          throw new Error(`Unsupported LLM provider: ${config.provider}`);
      }
    } catch (error) {
      logger.error(`[LLM] Generation failed with ${config.provider}:`, error);
      sentryService.captureException(error as Error, {
        component: 'llm-service',
        operation: 'generateRAGAnswer',
        provider: config.provider,
      });

      // Fallback to Llama-2 if primary provider fails
      if (config.provider !== LLMProvider.LLAMA2) {
        logger.warn(`[LLM] Falling back to Llama-2`);
        return await this.generateWithLlama2(query, chunks, config);
      }

      throw error;
    }
  }

  /**
   * Generate with Llama-2 (Cloudflare Workers AI)
   * Budget-friendly option: ~$0.01 per 1M tokens
   */
  private async generateWithLlama2(
    query: string,
    chunks: string[],
    config: LLMConfig
  ): Promise<LLMGenerationResult> {
    const result = await cloudflareAIService.generateRAGAnswer(query, chunks);

    return {
      text: result.text,
      provider: LLMProvider.LLAMA2,
      model: result.model,
      tokens: result.tokens,
      cost: this.estimateCost(result.tokens, LLMProvider.LLAMA2),
    };
  }

  /**
   * Generate with GPT-4o (OpenAI)
   * High quality option: ~$5 per 1M input tokens, ~$15 per 1M output tokens
   */
  private async generateWithGPT4o(
    query: string,
    chunks: string[],
    config: LLMConfig
  ): Promise<LLMGenerationResult> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const context = chunks.join('\n\n---\n\n');
    const systemPrompt = `You are a helpful assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information, say so clearly.`;
    const userPrompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: config.maxTokens || 1024,
        temperature: config.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const text = data.choices[0].message.content;
    const tokens = data.usage.total_tokens;

    return {
      text,
      provider: LLMProvider.GPT4O,
      model: 'gpt-4o',
      tokens,
      cost: this.estimateCost(tokens, LLMProvider.GPT4O),
    };
  }

  /**
   * Generate with Claude 3 Sonnet (Anthropic)
   * High quality alternative: ~$3 per 1M input tokens, ~$15 per 1M output tokens
   */
  private async generateWithClaude(
    query: string,
    chunks: string[],
    config: LLMConfig
  ): Promise<LLMGenerationResult> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic API key not configured');
    }

    const context = chunks.join('\n\n---\n\n');
    const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer the question based ONLY on the provided context. If the context doesn't contain enough information, say so clearly.`;

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: config.maxTokens || 1024,
      temperature: config.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokens = response.usage.input_tokens + response.usage.output_tokens;

    return {
      text,
      provider: LLMProvider.CLAUDE,
      model: 'claude-3-sonnet-20240229',
      tokens,
      cost: this.estimateCost(tokens, LLMProvider.CLAUDE),
    };
  }

  /**
   * Estimate cost for token usage
   * @param tokens - Total tokens used
   * @param provider - LLM provider
   * @returns Estimated cost in USD
   */
  private estimateCost(tokens: number, provider: LLMProvider): number {
    const prices = {
      [LLMProvider.LLAMA2]: 0.00001, // ~$0.01 per 1M tokens
      [LLMProvider.GPT4O]: 0.01, // Average of input ($5) and output ($15) per 1M tokens
      [LLMProvider.CLAUDE]: 0.009, // Average of input ($3) and output ($15) per 1M tokens
    };

    return (tokens / 1000000) * prices[provider];
  }

  /**
   * Auto-select best provider based on query complexity
   * @param query - User query
   * @param budgetMode - Prefer budget-friendly options
   * @returns Recommended provider
   */
  public autoSelectProvider(query: string, budgetMode: boolean = true): LLMProvider {
    const queryLength = query.length;
    const complexity = this.estimateComplexity(query);

    // Budget mode: prefer Llama-2 unless query is very complex
    if (budgetMode) {
      return complexity > 0.8 ? LLMProvider.GPT4O : LLMProvider.LLAMA2;
    }

    // Quality mode: prefer GPT-4o for complex queries, Llama-2 for simple
    if (complexity > 0.6) {
      return LLMProvider.GPT4O;
    } else if (queryLength > 200) {
      return LLMProvider.CLAUDE;
    } else {
      return LLMProvider.LLAMA2;
    }
  }

  /**
   * Estimate query complexity (0-1 scale)
   * Higher = more complex
   */
  private estimateComplexity(query: string): number {
    let score = 0;

    // Length factor
    if (query.length > 200) score += 0.3;
    else if (query.length > 100) score += 0.2;
    else score += 0.1;

    // Technical terms
    const technicalTerms = /\b(algorithm|analysis|compare|explain|detail|implement|optimize)\b/i;
    if (technicalTerms.test(query)) score += 0.3;

    // Multiple questions
    const questionMarks = (query.match(/\?/g) || []).length;
    if (questionMarks > 2) score += 0.2;
    else if (questionMarks > 1) score += 0.1;

    // List requests
    if (/\b(list|all|every|each)\b/i.test(query)) score += 0.2;

    return Math.min(score, 1);
  }

  /**
   * Get provider comparison info
   */
  public getProviderComparison() {
    return {
      [LLMProvider.LLAMA2]: {
        name: 'Llama-2 7B (Cloudflare)',
        cost: '~$0.01 per 1M tokens',
        quality: 'Good',
        speed: 'Fast',
        useCases: ['Simple Q&A', 'Summaries', 'Budget-friendly operations'],
      },
      [LLMProvider.GPT4O]: {
        name: 'GPT-4o (OpenAI)',
        cost: '~$10 per 1M tokens (avg)',
        quality: 'Excellent',
        speed: 'Medium',
        useCases: ['Complex analysis', 'Multi-step reasoning', 'High-quality answers'],
      },
      [LLMProvider.CLAUDE]: {
        name: 'Claude 3 Sonnet (Anthropic)',
        cost: '~$9 per 1M tokens (avg)',
        quality: 'Excellent',
        speed: 'Medium-Fast',
        useCases: ['Long context', 'Detailed analysis', 'Code generation'],
      },
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();
