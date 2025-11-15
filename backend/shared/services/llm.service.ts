/**
 * LLM Service with Strategy Pattern (Shared)
 *
 * Supports multiple LLM providers:
 * - GPT-4o (OpenAI) - High quality, expensive (~$10/1M tokens)
 * - GPT-3.5-turbo (OpenAI) - Good quality, affordable (~$0.50/1M tokens)
 * - Llama-2 (Cloudflare) - Budget-friendly, good quality (~$0.01/1M tokens)
 * - Claude 3 (Anthropic) - Alternative high quality (~$9/1M tokens)
 *
 * Strategy selection based on:
 * - User preference
 * - Query complexity
 * - Budget constraints
 * - Feature requirements
 *
 * FEATURES:
 * - Auto-provider selection based on complexity
 * - Cost tracking and estimation
 * - Fallback to budget provider on failure
 * - Extensible architecture for new providers
 */

import {
  LLMProvider,
  LLMConfig,
  LLMGenerationResult,
  LLMProviderInfo,
  AIServiceError,
} from './types';
import { CloudflareAIService } from './cloudflare-ai.service';

export class LLMService {
  private cloudflareAI: CloudflareAIService;
  private anthropicClient: any = null; // Lazy load Anthropic SDK

  constructor(cloudflareAI?: CloudflareAIService) {
    this.cloudflareAI = cloudflareAI || new CloudflareAIService();
  }

  /**
   * Initialize Anthropic client (lazy loading)
   */
  private async initAnthropicClient() {
    if (this.anthropicClient) return;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return;

    try {
      const Anthropic = await import('@anthropic-ai/sdk');
      this.anthropicClient = new Anthropic.default({ apiKey: anthropicKey });
    } catch (error) {
      console.warn('[LLM] Anthropic SDK not available:', error);
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
    console.log(`[LLM] Generating RAG answer using ${config.provider}`);

    try {
      switch (config.provider) {
        case LLMProvider.LLAMA2:
          return await this.generateWithLlama2(query, chunks, config);

        case LLMProvider.GPT4O:
          return await this.generateWithGPT4o(query, chunks, config);

        case LLMProvider.GPT35_TURBO:
          return await this.generateWithGPT35Turbo(query, chunks, config);

        case LLMProvider.CLAUDE:
          return await this.generateWithClaude(query, chunks, config);

        default:
          throw new AIServiceError(
            `Unsupported LLM provider: ${config.provider}`,
            'llm-service',
            'generateRAGAnswer'
          );
      }
    } catch (error) {
      console.error(`[LLM] Generation failed with ${config.provider}:`, error);

      // Fallback to Llama-2 if primary provider fails (unless already using Llama-2)
      if (config.provider !== LLMProvider.LLAMA2) {
        console.warn(`[LLM] Falling back to Llama-2`);
        return await this.generateWithLlama2(query, chunks, config);
      }

      throw new AIServiceError(
        `LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        config.provider,
        'generateRAGAnswer',
        error as Error
      );
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
    const result = await this.cloudflareAI.generateRAGAnswer(query, chunks);

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
    return await this.generateWithOpenAI(query, chunks, config, 'gpt-4o', LLMProvider.GPT4O);
  }

  /**
   * Generate with GPT-3.5-turbo (OpenAI)
   * Affordable option: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens
   */
  private async generateWithGPT35Turbo(
    query: string,
    chunks: string[],
    config: LLMConfig
  ): Promise<LLMGenerationResult> {
    return await this.generateWithOpenAI(
      query,
      chunks,
      config,
      'gpt-3.5-turbo',
      LLMProvider.GPT35_TURBO
    );
  }

  /**
   * Generic OpenAI generation
   */
  private async generateWithOpenAI(
    query: string,
    chunks: string[],
    config: LLMConfig,
    model: string,
    provider: LLMProvider
  ): Promise<LLMGenerationResult> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new AIServiceError('OpenAI API key not configured', 'openai', 'generateText');
    }

    const context = chunks.join('\n\n---\n\n');
    const systemPrompt = `You are a helpful assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information, say so clearly.`;
    const userPrompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
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

    const data = (await response.json()) as any;
    const text = data.choices[0].message.content;
    const tokens = data.usage.total_tokens;

    return {
      text,
      provider,
      model,
      tokens,
      cost: this.estimateCost(tokens, provider),
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
    await this.initAnthropicClient();

    if (!this.anthropicClient) {
      throw new AIServiceError('Anthropic API key not configured', 'anthropic', 'generateText');
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
  public estimateCost(tokens: number, provider: LLMProvider): number {
    const prices = {
      [LLMProvider.LLAMA2]: 0.00001, // ~$0.01 per 1M tokens
      [LLMProvider.GPT35_TURBO]: 0.001, // Average of input ($0.50) and output ($1.50) per 1M tokens
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
    const complexity = this.estimateComplexity(query);

    // Budget mode: prefer Llama-2 unless query is very complex
    if (budgetMode) {
      if (complexity > 0.8) {
        return LLMProvider.GPT35_TURBO; // Use GPT-3.5 for complex queries (cheaper than GPT-4o)
      }
      return LLMProvider.LLAMA2;
    }

    // Quality mode: prefer GPT-4o for complex queries
    if (complexity > 0.7) {
      return LLMProvider.GPT4O;
    } else if (complexity > 0.4) {
      return LLMProvider.CLAUDE;
    } else {
      return LLMProvider.GPT35_TURBO;
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
    const technicalTerms =
      /\b(algorithm|analysis|compare|explain|detail|implement|optimize|summarize|evaluate)\b/i;
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
  public getProviderComparison(): Record<LLMProvider, LLMProviderInfo> {
    return {
      [LLMProvider.LLAMA2]: {
        name: 'Llama-2 7B (Cloudflare)',
        cost: '~$0.01 per 1M tokens',
        quality: 'Good',
        speed: 'Fast',
        useCases: ['Simple Q&A', 'Summaries', 'Budget-friendly operations'],
      },
      [LLMProvider.GPT35_TURBO]: {
        name: 'GPT-3.5-turbo (OpenAI)',
        cost: '~$1 per 1M tokens (avg)',
        quality: 'Very Good',
        speed: 'Fast',
        useCases: ['General Q&A', 'Content generation', 'Balanced quality/cost'],
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

// Export singleton instance (optional - services can create their own instances)
export const llmService = new LLMService();
