import { prisma } from '../config/database.config';
import { EvalRun, EvalResult, RunType } from '@prisma/client';
import logger from '../config/logger.config';
import { llmJudgeService } from './llm-judge.service';
import { redTeamService } from './red-team.service';

export interface RunSummary {
  totalQuestions: number;
  passed: number;
  failed: number;
  passRate: number;
  avgRelevance: number;
  avgFaithfulness: number;
  avgHelpfulness: number;
  avgLatency: number;
}

/**
 * Eval Runner Service
 * Runs evaluation datasets and tracks quality metrics
 */
export class EvalRunnerService {
  /**
   * Pass/fail criteria
   */
  private readonly PASS_CRITERIA = {
    relevance: 0.7,
    faithfulness: 0.8,
    helpfulness: 0.6,
  };

  /**
   * Run a complete evaluation dataset
   * Returns the eval run ID
   */
  public async runEval(
    datasetId: string,
    runType: RunType = 'ON_DEMAND'
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Get dataset with questions
      const dataset = await prisma.evalDataset.findUnique({
        where: { id: datasetId },
        include: {
          questions: true,
        },
      });

      if (!dataset) {
        throw new Error(`Dataset ${datasetId} not found`);
      }

      logger.info(
        `[EvalRunner] Starting eval run for dataset "${dataset.name}" ` +
        `(${dataset.questions.length} questions)`
      );

      // Create eval run record
      const evalRun = await prisma.evalRun.create({
        data: {
          evalDatasetId: datasetId,
          runType,
          status: 'RUNNING',
          startedAt: new Date(),
          totalQuestions: dataset.questions.length,
        },
      });

      // Run each question
      let passed = 0;
      let failed = 0;
      const scores = {
        relevance: [] as number[],
        faithfulness: [] as number[],
        helpfulness: [] as number[],
      };

      for (const question of dataset.questions) {
        try {
          const result = await this.runQuestion(question, evalRun.id);

          if (result.passed) {
            passed++;
          } else {
            failed++;
          }

          // Collect scores
          if (result.relevanceScore !== null) {
            scores.relevance.push(result.relevanceScore);
          }
          if (result.faithfulnessScore !== null) {
            scores.faithfulness.push(result.faithfulnessScore);
          }
          if (result.helpfulnessScore !== null) {
            scores.helpfulness.push(result.helpfulnessScore);
          }
        } catch (error) {
          logger.error(`[EvalRunner] Failed to run question ${question.id}:`, error);
          failed++;

          // Create error result
          await prisma.evalResult.create({
            data: {
              evalRunId: evalRun.id,
              evalQuestionId: question.id,
              passed: false,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }

      // Calculate averages
      const avgRelevance = this.average(scores.relevance);
      const avgFaithfulness = this.average(scores.faithfulness);
      const avgHelpfulness = this.average(scores.helpfulness);
      const durationMs = Date.now() - startTime;

      // Update eval run with results
      await prisma.evalRun.update({
        where: { id: evalRun.id },
        data: {
          status: 'COMPLETED',
          passed,
          failed,
          avgRelevance,
          avgFaithfulness,
          avgHelpfulness,
          completedAt: new Date(),
          durationMs,
        },
      });

      const passRate = (passed / dataset.questions.length) * 100;

      logger.info(
        `[EvalRunner] Eval run complete - ` +
        `${passed}/${dataset.questions.length} passed (${passRate.toFixed(1)}%), ` +
        `Duration: ${(durationMs / 1000).toFixed(1)}s`
      );

      return evalRun.id;
    } catch (error) {
      logger.error('[EvalRunner] Eval run failed:', error);
      throw error;
    }
  }

  /**
   * Run a single evaluation question
   * NOTE: Currently uses simple prompt echo for testing
   * Will integrate with orchestrator service later
   */
  public async runQuestion(
    question: any,
    runId: string
  ): Promise<EvalResult> {
    const startTime = Date.now();

    try {
      logger.debug(`[EvalRunner] Running question: ${question.question.substring(0, 50)}...`);

      // TODO: Integrate with orchestrator service
      // For now, use a simple mock response
      const upgradedPrompt = `Enhanced prompt: ${question.question}`;
      const context = question.metadata?.context || '';

      // LLM-as-judge scoring
      const scores = await llmJudgeService.scoreAll(
        question.question,
        context,
        upgradedPrompt
      );

      // Red-team checks
      const redTeamChecks = redTeamService.runAllChecks(
        question.question,
        upgradedPrompt,
        context
      );

      // Determine pass/fail
      const passed = this.calculatePassed(
        scores,
        redTeamChecks.piiLeak.detected,
        redTeamChecks.injection.detected
      );

      const latencyMs = Date.now() - startTime;

      // Create eval result
      const result = await prisma.evalResult.create({
        data: {
          evalRunId: runId,
          evalQuestionId: question.id,
          actualAnswer: upgradedPrompt,
          upgradePrompt: upgradedPrompt,
          relevanceScore: scores.relevance,
          faithfulnessScore: scores.faithfulness,
          helpfulnessScore: scores.helpfulness,
          passed,
          piiLeakDetected: redTeamChecks.piiLeak.detected,
          injectionDetected: redTeamChecks.injection.detected,
          latencyMs,
          tokensIn: 0,
          tokensOut: 0,
        },
      });

      logger.debug(
        `[EvalRunner] Question ${passed ? 'PASSED' : 'FAILED'} - ` +
        `Scores: R=${scores.relevance.toFixed(2)}, ` +
        `F=${scores.faithfulness.toFixed(2)}, ` +
        `H=${scores.helpfulness.toFixed(2)}`
      );

      return result;
    } catch (error) {
      logger.error('[EvalRunner] Failed to run question:', error);
      throw error;
    }
  }

  /**
   * Calculate if test passed based on criteria
   */
  private calculatePassed(
    scores: { relevance: number; faithfulness: number; helpfulness: number },
    piiLeakDetected: boolean,
    injectionDetected: boolean
  ): boolean {
    // Fail if PII leak or injection detected
    if (piiLeakDetected || injectionDetected) {
      return false;
    }

    // Fail if any score below threshold
    if (scores.relevance < this.PASS_CRITERIA.relevance) {
      return false;
    }

    if (scores.faithfulness < this.PASS_CRITERIA.faithfulness) {
      return false;
    }

    if (scores.helpfulness < this.PASS_CRITERIA.helpfulness) {
      return false;
    }

    return true;
  }

  /**
   * Get eval run with all results (for API)
   */
  public async getEvalResults(runId: string) {
    const run = await prisma.evalRun.findUnique({
      where: { id: runId },
      include: {
        evalResults: {
          include: {
            evalQuestion: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        evalDataset: true,
      },
    });

    if (!run) {
      throw new Error(`Eval run ${runId} not found`);
    }

    return run;
  }

  /**
   * Get summary statistics for an eval run
   */
  public async getRunSummary(runId: string): Promise<RunSummary> {
    const run = await prisma.evalRun.findUnique({
      where: { id: runId },
      include: {
        evalResults: true,
      },
    });

    if (!run) {
      throw new Error(`Eval run ${runId} not found`);
    }

    const latencies = run.evalResults
      .filter(r => r.latencyMs !== null)
      .map(r => r.latencyMs as number);

    const avgLatency = this.average(latencies);
    const passRate = run.totalQuestions > 0 ? run.passed / run.totalQuestions : 0;

    return {
      totalQuestions: run.totalQuestions,
      passed: run.passed,
      failed: run.failed,
      passRate,
      avgRelevance: run.avgRelevance || 0,
      avgFaithfulness: run.avgFaithfulness || 0,
      avgHelpfulness: run.avgHelpfulness || 0,
      avgLatency,
    };
  }

  /**
   * Get failing tests for debugging
   */
  public async getFailingTests(runId: string) {
    const results = await prisma.evalResult.findMany({
      where: {
        evalRunId: runId,
        passed: false,
      },
      include: {
        evalQuestion: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return results.map(result => ({
      question: result.evalQuestion.question,
      answer: result.actualAnswer,
      scores: {
        relevance: result.relevanceScore,
        faithfulness: result.faithfulnessScore,
        helpfulness: result.helpfulnessScore,
      },
      issues: {
        piiLeak: result.piiLeakDetected,
        injection: result.injectionDetected,
      },
      errorMessage: result.errorMessage,
    }));
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
  }
}

// Export singleton
export const evalRunnerService = new EvalRunnerService();
