import { Request, Response } from 'express';
import { orchestratorService } from '../services/orchestrator.service';
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
    // TODO: Implement stats from UsageMeter

    res.json({
      success: true,
      data: {
        message: 'Stats endpoint - coming soon in Phase 6',
      },
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
