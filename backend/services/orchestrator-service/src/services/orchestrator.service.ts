import logger from '../config/logger.config';
import { piiRedactionService } from './pii-redaction.service';
import { summarizerAgent } from '../agents/summarizer.agent';
import { ragRetrieverAgent } from '../agents/rag-retriever.agent';
import { promptUpgraderAgent } from '../agents/prompt-upgrader.agent';
import { usageTrackingService } from './usage-tracking.service';
import { metricsService } from './metrics.service';
import { sentryService } from './sentry.service';
import {
  OrchestrationRequest,
  OrchestrationResult,
  PipelineStep,
} from '../types/orchestrator.types';

export class OrchestratorService {
  /**
   * Main orchestration pipeline
   * Flow: PII Redaction → Summarization → RAG Retrieval → Prompt Upgrading → PII Restore
   */
  public async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const steps: PipelineStep[] = [];

    const {
      userPrompt,
      conversationHistory = [],
      userId,
      options = {},
    } = request;

    logger.info('[Orchestrator] Starting pipeline', {
      userId,
      promptLength: userPrompt.length,
      historyLength: conversationHistory.length,
    });

    // Initialize metrics
    const metrics: any = {
      totalLatencyMs: 0,
      totalTokensUsed: 0,
    };

    let currentPrompt = userPrompt;
    let piiRedactionMap: Record<string, string> = {};
    let summary: string | undefined;
    let ragDocuments: any[] = [];
    let ragContext: string | undefined;

    // STEP 1: PII Redaction
    if (options.enablePIIRedaction !== false) {
      const step = this.startStep('PII Redaction');
      const piiStartTime = Date.now();

      try {
        const redactionResult = piiRedactionService.redact(currentPrompt);
        currentPrompt = redactionResult.redactedText;
        piiRedactionMap = redactionResult.redactionMap;

        const piiLatency = Date.now() - piiStartTime;

        // Record PII redaction metrics
        metricsService.recordComponentLatency('piiRedaction', piiLatency);

        if (redactionResult.piiFound.length > 0) {
          logger.info(`[Orchestrator] Redacted PII: ${redactionResult.piiFound.join(', ')}`);
        }

        this.endStep(step, true);
        steps.push(step);
      } catch (error) {
        this.endStep(step, false, error);
        steps.push(step);

        // Record error
        metricsService.recordError('pii_redaction_failed', 'pii-redaction');
        sentryService.captureException(error as Error, {
          component: 'orchestrator',
          operation: 'pii_redaction',
          userId,
        });

        logger.error('[Orchestrator] PII redaction failed:', error);
      }
    }

    // STEP 2: Conversation Summarization
    if (options.enableSummarization !== false && conversationHistory.length > 0) {
      const step = this.startStep('Summarization');

      try {
        const summaryResult = await summarizerAgent.summarize(conversationHistory);
        summary = summaryResult.summary;
        metrics.summaryLatencyMs = summaryResult.latencyMs;
        metrics.summaryTokens = summaryResult.tokensUsed;
        metrics.totalTokensUsed += summaryResult.tokensUsed;

        // Record summarizer metrics
        metricsService.recordComponentLatency('summarizer', summaryResult.latencyMs, summaryResult.cached || false);
        metricsService.recordCacheEvent('summary', summaryResult.cached || false);

        logger.info(`[Orchestrator] Generated summary (${summaryResult.messageCount} messages)`);

        // Track usage
        if (userId) {
          await usageTrackingService.track(userId, {
            component: 'summarizer',
            operation: 'summarize',
            tokensIn: 0,
            tokensOut: summaryResult.tokensUsed,
            costUsd: summaryResult.tokensUsed * 0.0000006, // GPT-4o-mini cost
            latencyMs: summaryResult.latencyMs,
            cacheHit: summaryResult.cached || false,
          });
        }

        this.endStep(step, true);
        steps.push(step);
      } catch (error) {
        this.endStep(step, false, error);
        steps.push(step);

        // Record error
        metricsService.recordError('summarization_failed', 'summarizer');
        sentryService.captureException(error as Error, {
          component: 'orchestrator',
          operation: 'summarization',
          userId,
        });

        logger.error('[Orchestrator] Summarization failed:', error);
      }
    }

    // STEP 3: RAG Retrieval
    if (options.enableRAG !== false) {
      const step = this.startStep('RAG Retrieval');

      try {
        const ragResult = await ragRetrieverAgent.retrieveAndFormat(currentPrompt, {
          userId,
          topK: options.ragTopK,
          minScore: options.ragMinScore,
        });

        ragContext = ragResult.context;
        ragDocuments = ragResult.metadata.documents;
        metrics.ragLatencyMs = ragResult.metadata.latencyMs;
        metrics.ragTokens = ragResult.metadata.queryEmbeddingTokens;
        metrics.totalTokensUsed += ragResult.metadata.queryEmbeddingTokens;

        // Record RAG metrics
        metricsService.recordComponentLatency('rag', ragResult.metadata.latencyMs, ragResult.metadata.cached || false);
        metricsService.recordComponentLatency('embedding', ragResult.metadata.latencyMs, ragResult.metadata.cached || false);
        metricsService.recordCacheEvent('rag', ragResult.metadata.cached || false);
        metricsService.recordCacheEvent('embedding', ragResult.metadata.cached || false);

        logger.info(`[Orchestrator] Retrieved ${ragDocuments.length} RAG documents`);

        // Track usage
        if (userId) {
          await usageTrackingService.track(userId, {
            component: 'embedding',
            operation: 'query',
            tokensIn: 0,
            tokensOut: ragResult.metadata.queryEmbeddingTokens,
            costUsd: ragResult.metadata.queryEmbeddingTokens * 0.00000002, // text-embedding-3-small cost
            latencyMs: ragResult.metadata.latencyMs,
            cacheHit: ragResult.metadata.cached || false,
          });
        }

        this.endStep(step, true);
        steps.push(step);
      } catch (error) {
        this.endStep(step, false, error);
        steps.push(step);

        // Record error
        metricsService.recordError('rag_retrieval_failed', 'rag-retriever');
        sentryService.captureException(error as Error, {
          component: 'orchestrator',
          operation: 'rag_retrieval',
          userId,
        });

        logger.error('[Orchestrator] RAG retrieval failed:', error);
      }
    }

    // STEP 4: Prompt Upgrading
    const step = this.startStep('Prompt Upgrading');

    try {
      const upgradeResult = await promptUpgraderAgent.upgrade({
        userPrompt: currentPrompt,
        conversationSummary: summary,
        ragContext,
      });

      const upgradedPromptText = upgradeResult.upgradedPrompt.finalPrompt;
      metrics.upgradeLatencyMs = upgradeResult.latencyMs;
      metrics.upgradeTokens = upgradeResult.tokensUsed;
      metrics.totalTokensUsed += upgradeResult.tokensUsed;

      // Track usage
      if (userId) {
        await usageTrackingService.track(userId, {
          component: 'upgrader',
          operation: 'upgrade',
          tokensIn: 0,
          tokensOut: upgradeResult.tokensUsed,
          costUsd: upgradeResult.tokensUsed * 0.0000006, // GPT-4o-mini cost
          latencyMs: upgradeResult.latencyMs,
          cacheHit: false,
        });
      }

      // STEP 5: PII Restoration
      const finalPrompt = piiRedactionService.restore(upgradedPromptText, piiRedactionMap);

      metrics.totalLatencyMs = Date.now() - startTime;

      // Record successful upgrade metrics
      metricsService.recordUpgradeRequest('success', userId);
      metricsService.recordUpgradeLatency(metrics.totalLatencyMs / 1000, 'success', userId);

      logger.info('[Orchestrator] Pipeline complete', {
        totalLatencyMs: metrics.totalLatencyMs,
        totalTokens: metrics.totalTokensUsed,
      });

      this.endStep(step, true);
      steps.push(step);

      return {
        upgradedPrompt: finalPrompt,
        originalPrompt: userPrompt,
        summary,
        ragDocuments,
        piiRedacted: Object.keys(piiRedactionMap).length > 0,
        metrics,
        confidence: upgradeResult.upgradedPrompt.confidence,
        reasoning: upgradeResult.upgradedPrompt.reasoning,
        missingQuestions: upgradeResult.upgradedPrompt.missingQuestions,
      };
    } catch (error) {
      this.endStep(step, false, error);
      steps.push(step);

      // Record error metrics
      metricsService.recordUpgradeRequest('error', userId);
      metricsService.recordError('prompt_upgrade_failed', 'prompt-upgrader');
      sentryService.captureException(error as Error, {
        component: 'orchestrator',
        operation: 'prompt_upgrade',
        userId,
        metadata: {
          promptLength: userPrompt.length,
          hadSummary: !!summary,
          hadRagContext: !!ragContext,
        },
      });

      logger.error('[Orchestrator] Prompt upgrading failed:', error);

      // Fallback: return original prompt
      return {
        upgradedPrompt: userPrompt,
        originalPrompt: userPrompt,
        metrics: {
          totalLatencyMs: Date.now() - startTime,
          totalTokensUsed: metrics.totalTokensUsed,
        },
        confidence: 0.5,
        reasoning: 'Pipeline failed, returning original prompt',
        missingQuestions: [],
      };
    }
  }

  /**
   * Helper: Start pipeline step
   */
  private startStep(name: string): PipelineStep {
    return {
      name,
      startTime: Date.now(),
      success: false,
    };
  }

  /**
   * Helper: End pipeline step
   */
  private endStep(step: PipelineStep, success: boolean, error?: any): void {
    step.endTime = Date.now();
    step.success = success;

    if (error) {
      step.error = error instanceof Error ? error.message : String(error);
    }
  }
}

// Export singleton instance
export const orchestratorService = new OrchestratorService();
