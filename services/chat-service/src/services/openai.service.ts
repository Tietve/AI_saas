import OpenAI from 'openai';
import { config } from '../config/env';
import { openaiCacheService } from './openai-cache.service';
import { DEV_CONFIG } from '../../../../shared/cache/cache.config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cached?: boolean; // Indicates if response was from cache
  costSavings?: number; // Cost saved by using cache (in USD)
}

export class OpenAIService {
  private client: OpenAI;
  private useMock: boolean;

  constructor() {
    // Check if we have a valid API key (not placeholder)
    this.useMock = !config.OPENAI_API_KEY ||
                   config.OPENAI_API_KEY.includes('your-') ||
                   config.OPENAI_API_KEY === 'sk-mock-key' ||
                   DEV_CONFIG.SKIP_OPENAI_CALLS;

    if (this.useMock) {
      console.warn('[OpenAIService] No valid API key or DEV mode enabled. Using MOCK responses.');
    }

    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY || 'sk-mock-key'
    });
  }

  /**
   * Create chat completion with caching support
   */
  async createChatCompletion(
    messages: ChatMessage[],
    model: string = 'gpt-4',
    useCache: boolean = true
  ): Promise<ChatCompletionResult> {
    // Try to get cached response first
    if (useCache) {
      const cached = await openaiCacheService.getCachedResponse(messages, model);
      if (cached) {
        const costSavings = this.calculateCost(cached.tokens.total, model);
        console.log(`[OpenAI] Cache hit! Saved $${costSavings.toFixed(4)}`);

        return {
          content: cached.response.content,
          model: cached.model,
          promptTokens: cached.tokens.prompt,
          completionTokens: cached.tokens.completion,
          totalTokens: cached.tokens.total,
          cached: true,
          costSavings,
        };
      }
    }

    // Use mock response if no valid API key
    if (this.useMock) {
      const lastMessage = messages[messages.length - 1];
      return {
        content: `[MOCK AI Response] Tôi đã nhận được tin nhắn: "${lastMessage.content}". Đây là phản hồi mô phỏng từ ${model} vì chưa config OpenAI API key hoặc đang ở DEV mode.`,
        model,
        promptTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
        completionTokens: 50,
        totalTokens: this.estimateTokens(messages.map(m => m.content).join(' ')) + 50,
        cached: false,
      };
    }

    try {
      const startTime = Date.now();
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });
      const duration = Date.now() - startTime;

      const choice = completion.choices[0];
      const usage = completion.usage;

      const result: ChatCompletionResult = {
        content: choice.message.content || '',
        model: completion.model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        cached: false,
      };

      // Cache the response for future use
      if (useCache && result.totalTokens > 0) {
        await openaiCacheService.cacheResponse(messages, model, {
          content: result.content,
        }, {
          prompt: result.promptTokens,
          completion: result.completionTokens,
          total: result.totalTokens,
        });
      }

      console.log(`[OpenAI] API call completed in ${duration}ms, cost: $${this.calculateCost(result.totalTokens, model).toFixed(4)}`);

      return result;
    } catch (error: any) {
      console.error('[OpenAIService] Error:', error.message);
      throw new Error('Không thể kết nối với OpenAI. Vui lòng thử lại sau.');
    }
  }

  /**
   * Calculate cost based on model and tokens
   * Prices as of 2024 (update these based on current OpenAI pricing)
   */
  private calculateCost(tokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };

    // Default to gpt-4 pricing if model not found
    const modelPricing = pricing[model] || pricing['gpt-4'];

    // Simplified: use average of input and output pricing
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;

    return (tokens / 1000) * avgPrice;
  }

  /**
   * Count tokens (approximate)
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

export const openaiService = new OpenAIService();
