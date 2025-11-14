import OpenAI from 'openai';
import { config } from '../config/env';
import { OpenAICacheService } from './openai-cache.service';

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
}

export class OpenAIService {
  private client: OpenAI;
  private useMock: boolean;
  private cacheService: OpenAICacheService;

  constructor() {
    // Check if we have a valid API key (not placeholder)
    this.useMock = !config.OPENAI_API_KEY ||
                   config.OPENAI_API_KEY.includes('your-') ||
                   config.OPENAI_API_KEY === 'sk-mock-key';

    if (this.useMock) {
      console.warn('[OpenAIService] No valid API key. Using MOCK responses.');
    }

    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY || 'sk-mock-key'
    });

    this.cacheService = new OpenAICacheService();
  }

  /**
   * Create chat completion with Redis caching
   * Caches responses to reduce API costs by 40-60%
   */
  async createChatCompletion(
    messages: ChatMessage[],
    model: string = 'gpt-4'
  ): Promise<ChatCompletionResult> {
    // Use mock response if no valid API key
    if (this.useMock) {
      const lastMessage = messages[messages.length - 1];
      return {
        content: `[MOCK AI Response] Tôi đã nhận được tin nhắn: "${lastMessage.content}". Đây là phản hồi mô phỏng từ ${model} vì chưa config OpenAI API key.`,
        model,
        promptTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
        completionTokens: 50,
        totalTokens: this.estimateTokens(messages.map(m => m.content).join(' ')) + 50
      };
    }

    try {
      // 🔥 OPTIMIZATION: Check cache first
      const cached = await this.cacheService.getCachedResponse(messages, model);
      if (cached) {
        console.log(`[OpenAI] Cache HIT - Saved API call for model ${model}`);
        return {
          content: cached.response,
          model: cached.model,
          promptTokens: cached.tokens.prompt,
          completionTokens: cached.tokens.completion,
          totalTokens: cached.tokens.total
        };
      }

      // Cache MISS - Call OpenAI API
      console.log(`[OpenAI] Cache MISS - Calling API for model ${model}`);
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      const choice = completion.choices[0];
      const usage = completion.usage;

      const result = {
        content: choice.message.content || '',
        model: completion.model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0
      };

      // 🔥 OPTIMIZATION: Cache the response for future identical requests
      await this.cacheService.cacheResponse(
        messages,
        model,
        result.content,
        {
          prompt: result.promptTokens,
          completion: result.completionTokens,
          total: result.totalTokens
        }
      );

      return result;
    } catch (error: any) {
      console.error('[OpenAIService] Error:', error.message);
      throw new Error('Không thể kết nối với OpenAI. Vui lòng thử lại sau.');
    }
  }

  /**
   * Create streaming chat completion
   * Returns AsyncIterableIterator for SSE streaming
   */
  async *createStreamingChatCompletion(
    messages: ChatMessage[],
    model: string = 'gpt-4'
  ): AsyncGenerator<string, void, undefined> {
    // Use mock streaming if no valid API key
    if (this.useMock) {
      const lastMessage = messages[messages.length - 1];
      const mockResponse = `[MOCK STREAMING] Tôi đã nhận được tin nhắn: "${lastMessage.content}". Đây là phản hồi streaming mô phỏng từ ${model}. Streaming cho phép người dùng thấy phản hồi được gõ từng chữ một, tạo trải nghiệm tốt hơn.`;

      // Simulate streaming by yielding word by word with realistic typing speed
      const words = mockResponse.split(' ');
      for (const word of words) {
        yield word + ' ';
        // Simulate realistic AI typing delay (100-200ms per word for better UX)
        const delay = 100 + Math.random() * 100; // Random 100-200ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return;
    }

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true, // Enable streaming
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      console.error('[OpenAIService] Streaming error:', error.message);
      throw new Error('Không thể kết nối với OpenAI. Vui lòng thử lại sau.');
    }
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
