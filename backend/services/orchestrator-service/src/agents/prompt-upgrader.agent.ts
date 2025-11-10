import OpenAI from 'openai';
import { env } from '../config/env.config';
import logger from '../config/logger.config';
import {
  UPGRADER_SYSTEM_PROMPT,
  UPGRADER_USER_PROMPT,
  DEFAULT_UPGRADER_OPTIONS,
  UpgraderOptions,
  UpgraderInput,
} from '../prompts/upgrader.prompt';

export interface UpgradedPrompt {
  finalPrompt: string;
  reasoning: string;
  missingQuestions: string[];
  confidence: number;
}

export interface UpgradeResult {
  upgradedPrompt: UpgradedPrompt;
  tokensUsed: number;
  latencyMs: number;
  originalPrompt: string;
}

export class PromptUpgraderAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.openai.apiKey,
      organization: env.openai.orgId,
    });
  }

  /**
   * Upgrade a user prompt
   */
  public async upgrade(
    input: UpgraderInput,
    options?: UpgraderOptions
  ): Promise<UpgradeResult> {
    const opts = { ...DEFAULT_UPGRADER_OPTIONS, ...options };
    const startTime = Date.now();

    try {
      logger.info(`[Upgrader] Upgrading prompt: "${input.userPrompt.substring(0, 50)}..."`);

      // Call OpenAI with JSON mode
      const response = await this.openai.chat.completions.create({
        model: opts.model || env.models.upgrader,
        messages: [
          {
            role: 'system',
            content: UPGRADER_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: UPGRADER_USER_PROMPT(input),
          },
        ],
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);

      const upgradedPrompt: UpgradedPrompt = {
        finalPrompt: parsed.final_prompt || input.userPrompt,
        reasoning: parsed.reasoning || 'No reasoning provided',
        missingQuestions: parsed.missing_questions || [],
        confidence: parsed.confidence || 0.8,
      };

      const tokensUsed = response.usage?.total_tokens || 0;
      const latencyMs = Date.now() - startTime;

      logger.info(
        `[Upgrader] Upgraded prompt (${tokensUsed} tokens, ${latencyMs}ms, confidence: ${upgradedPrompt.confidence})`
      );

      return {
        upgradedPrompt,
        tokensUsed,
        latencyMs,
        originalPrompt: input.userPrompt,
      };
    } catch (error) {
      logger.error('[Upgrader] Failed to upgrade prompt:', error);

      // Fallback: return original prompt if upgrade fails
      return {
        upgradedPrompt: {
          finalPrompt: input.userPrompt,
          reasoning: 'Upgrade failed, using original prompt',
          missingQuestions: [],
          confidence: 0.5,
        },
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
        originalPrompt: input.userPrompt,
      };
    }
  }

  /**
   * Batch upgrade multiple prompts
   */
  public async upgradeBatch(
    inputs: UpgraderInput[],
    options?: UpgraderOptions
  ): Promise<UpgradeResult[]> {
    const results: UpgradeResult[] = [];

    for (const input of inputs) {
      const result = await this.upgrade(input, options);
      results.push(result);
    }

    logger.info(`[Upgrader] Batch upgraded ${results.length} prompts`);

    return results;
  }
}

// Export singleton instance
export const promptUpgraderAgent = new PromptUpgraderAgent();
