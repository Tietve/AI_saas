import OpenAI from 'openai';
import { env } from '../config/env.config';
import logger from '../config/logger.config';
import { prisma } from '../config/database.config';
import { canaryRolloutService } from '../services/canary-rollout.service';
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
    options?: UpgraderOptions & { userId?: string; templateName?: string }
  ): Promise<UpgradeResult> {
    const opts = { ...DEFAULT_UPGRADER_OPTIONS, ...options };
    const startTime = Date.now();
    let promptTemplateId: string | undefined;
    let systemPrompt = UPGRADER_SYSTEM_PROMPT;

    try {
      // Load template from database if templateName is provided
      if (opts.templateName && opts.userId) {
        const shouldUseNew = await canaryRolloutService.shouldUseNewVersion(
          opts.templateName,
          opts.userId
        );

        const template = await prisma.promptTemplate.findFirst({
          where: {
            name: opts.templateName,
            isActive: true,
          },
          orderBy: {
            version: shouldUseNew ? 'desc' : 'asc',
          },
        });

        if (template) {
          systemPrompt = template.content;
          promptTemplateId = template.id;
          logger.debug(
            `[Upgrader] Using template ${template.name} v${template.version} (${template.rolloutStage})`
          );
        }
      }

      logger.info(`[Upgrader] Upgrading prompt: "${input.userPrompt.substring(0, 50)}..."`);

      // Call OpenAI with JSON mode
      const response = await this.openai.chat.completions.create({
        model: opts.model || env.models.upgrader,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
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

      // Track prompt run for AB testing
      if (promptTemplateId && opts.userId) {
        await this.trackPromptRun({
          promptTemplateId,
          userId: opts.userId,
          userPrompt: input.userPrompt,
          upgradedPrompt: upgradedPrompt.finalPrompt,
          tokensUsed,
          latencyMs,
          success: true,
        });
      }

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

      const latencyMs = Date.now() - startTime;

      // Track failure
      if (promptTemplateId && opts.userId) {
        await this.trackPromptRun({
          promptTemplateId,
          userId: opts.userId,
          userPrompt: input.userPrompt,
          upgradedPrompt: '',
          tokensUsed: 0,
          latencyMs,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Fallback: return original prompt if upgrade fails
      return {
        upgradedPrompt: {
          finalPrompt: input.userPrompt,
          reasoning: 'Upgrade failed, using original prompt',
          missingQuestions: [],
          confidence: 0.5,
        },
        tokensUsed: 0,
        latencyMs,
        originalPrompt: input.userPrompt,
      };
    }
  }

  /**
   * Track prompt run for AB testing and error rate calculation
   */
  private async trackPromptRun(data: {
    promptTemplateId: string;
    userId: string;
    userPrompt: string;
    upgradedPrompt: string;
    tokensUsed: number;
    latencyMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await prisma.promptRun.create({
        data: {
          promptTemplateId: data.promptTemplateId,
          userId: data.userId,
          userPrompt: data.userPrompt,
          upgradedPrompt: data.upgradedPrompt,
          tokensUsed: data.tokensUsed,
          latencyMs: data.latencyMs,
          success: data.success,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      logger.error('[Upgrader] Failed to track prompt run:', error);
      // Don't throw - tracking shouldn't break the request
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
