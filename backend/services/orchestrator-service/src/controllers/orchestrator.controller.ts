import { Request, Response } from 'express';
import { orchestratorService } from '../services/orchestrator.service';
import { usageTrackingService } from '../services/usage-tracking.service';
import logger from '../config/logger.config';

/**
 * @swagger
 * /api/upgrade:
 *   post:
 *     tags:
 *       - Orchestrator
 *     summary: Upgrade a user prompt using AI
 *     description: |
 *       Upgrades a user prompt through the full orchestration pipeline:
 *       1. PII Redaction (optional)
 *       2. Conversation Summarization (optional)
 *       3. RAG Retrieval (optional)
 *       4. Prompt Upgrading with GPT-4o-mini
 *       5. PII Restoration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpgradePromptRequest'
 *           examples:
 *             simple:
 *               summary: Simple prompt upgrade
 *               value:
 *                 userPrompt: "Write an email to apply for a job"
 *                 userId: "user-123"
 *             withHistory:
 *               summary: With conversation history
 *               value:
 *                 userPrompt: "Make it more formal"
 *                 conversationHistory:
 *                   - role: "user"
 *                     content: "Write an email"
 *                   - role: "assistant"
 *                     content: "Here's a draft email..."
 *                 userId: "user-123"
 *                 options:
 *                   enableSummarization: true
 *                   enableRAG: false
 *     responses:
 *       200:
 *         description: Successful upgrade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     upgradedPrompt:
 *                       type: string
 *                       example: "ROLE: Job Applicant; TASK: Write a professional job application email..."
 *                     originalPrompt:
 *                       type: string
 *                     ragDocuments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     piiRedacted:
 *                       type: boolean
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalLatencyMs:
 *                           type: integer
 *                         totalTokensUsed:
 *                           type: integer
 *                         upgradeLatencyMs:
 *                           type: integer
 *                     confidence:
 *                       type: number
 *                     reasoning:
 *                       type: string
 *                     missingQuestions:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/QuotaExceeded'
 *       500:
 *         description: Internal server error
 */
export async function upgradePrompt(req: Request, res: Response) {
  try {
    const {
      userPrompt,
      conversationHistory,
      userId,
      conversationId,
      options,
    } = req.body;

    // Validation
    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: 'userPrompt is required and must be a string',
        },
      });
    }

    // Run orchestration
    const result = await orchestratorService.orchestrate({
      userPrompt,
      conversationHistory,
      userId,
      conversationId,
      options,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('[Controller] Upgrade prompt failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'ORCHESTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags:
 *       - Stats
 *     summary: Get usage statistics for a user
 *     description: Returns usage statistics including tokens, costs, and component breakdown
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get stats for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601)
 *     responses:
 *       200:
 *         description: Usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         tokensUsed:
 *                           type: integer
 *                         tokensQuota:
 *                           type: integer
 *                         upgradesUsed:
 *                           type: integer
 *                         upgradesQuota:
 *                           type: integer
 *                     byComponent:
 *                       type: object
 *                     totalCost:
 *                       type: number
 *                     cacheHitRate:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
export async function getStats(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string || req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'userId is required as query parameter or x-user-id header',
        },
      });
    }

    // Get date range from query params
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // Get stats from usage tracking service
    const stats = await usageTrackingService.getStats(userId, startDate, endDate);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No usage stats found for this user',
        },
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('[Controller] Get stats failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
