import { Request, Response } from 'express';
import { orchestratorService } from '../services/orchestrator.service';
import { usageTrackingService } from '../services/usage-tracking.service';
import logger from '../config/logger.config';

/**
 * Upgrade a prompt using the full pipeline
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
 * Get orchestrator stats
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
