import OpenAI from 'openai';
import { env } from '../config/env.config';
import { cache } from '../config/redis.config';
import logger from '../config/logger.config';
import {
  SUMMARIZER_SYSTEM_PROMPT,
  SUMMARIZER_USER_PROMPT,
  DEFAULT_SUMMARIZER_OPTIONS,
  SummarizerOptions,
} from '../prompts/summarizer.prompt';
import crypto from 'crypto';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SummaryResult {
  summary: string;
  messageCount: number;
  tokensUsed: number;
  cached: boolean;
  latencyMs: number;
}

export class SummarizerAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.openai.apiKey,
      organization: env.openai.orgId,
    });
  }

  /**
   * Summarize conversation messages
   */
  public async summarize(
    messages: Message[],
    options?: SummarizerOptions
  ): Promise<SummaryResult> {
    const opts = { ...DEFAULT_SUMMARIZER_OPTIONS, ...options };
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(messages);
    const cached = await cache.get<SummaryResult>(cacheKey);

    if (cached) {
      logger.info('[Summarizer] Cache hit');
      return {
        ...cached,
        cached: true,
        latencyMs: Date.now() - startTime,
      };
    }

    // Truncate to last N messages
    const truncatedMessages = this.truncateMessages(messages);

    try {
      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: opts.model || env.models.summarizer,
        messages: [
          {
            role: 'system',
            content: SUMMARIZER_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: SUMMARIZER_USER_PROMPT(truncatedMessages),
          },
        ],
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
      });

      const summary = response.choices[0].message.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const latencyMs = Date.now() - startTime;

      const result: SummaryResult = {
        summary,
        messageCount: truncatedMessages.length,
        tokensUsed,
        cached: false,
        latencyMs,
      };

      // Cache result
      await cache.set(cacheKey, result, env.cache.summaryTtl);

      logger.info(
        `[Summarizer] Generated summary (${tokensUsed} tokens, ${latencyMs}ms)`
      );

      return result;
    } catch (error) {
      logger.error('[Summarizer] Failed to generate summary:', error);
      throw error;
    }
  }

  /**
   * Truncate messages to last N (configured in env)
   */
  private truncateMessages(messages: Message[]): Message[] {
    const maxMessages = env.performance.maxContextMessages;

    if (messages.length <= maxMessages) {
      return messages;
    }

    return messages.slice(-maxMessages);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(messages: Message[]): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    return `summary:${hash}`;
  }
}

// Export singleton instance
export const summarizerAgent = new SummarizerAgent();
