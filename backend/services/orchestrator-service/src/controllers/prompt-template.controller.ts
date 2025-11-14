import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import { canaryRolloutService } from '../services/canary-rollout.service';
import logger from '../config/logger.config';

/**
 * @swagger
 * /api/prompts:
 *   post:
 *     tags:
 *       - Prompt Templates
 *     summary: Create a new prompt template version
 *     description: Creates a new version of a prompt template. If template with same name exists, increments version number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *               - promptType
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 description: The prompt template content
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               promptType:
 *                 type: string
 *                 enum: [SUMMARIZER, UPGRADER, RAG_QUERY, CUSTOM]
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid input
 */
export async function createTemplate(req: Request, res: Response) {
  try {
    const { name, content, description, promptType, variables } = req.body;

    // Validation
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name and content are required',
        },
      });
    }

    // Check if template with this name exists
    const existing = await prisma.promptTemplate.findFirst({
      where: { name },
      orderBy: { version: 'desc' },
    });

    const newVersion = existing ? existing.version + 1 : 1;

    // Deactivate previous versions
    if (existing) {
      await prisma.promptTemplate.updateMany({
        where: { name },
        data: { isActive: false },
      });
    }

    // Create new template
    const template = await prisma.promptTemplate.create({
      data: {
        name,
        version: newVersion,
        content,
        description,
        promptType: promptType || 'CUSTOM',
        variables,
        isActive: true,
        rolloutStage: 'DEVELOPMENT',
      },
    });

    logger.info(`[PromptTemplate] Created template ${template.id} (${name} v${newVersion})`);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('[PromptTemplate] Create failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Get a prompt template by ID
 */
export async function getTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const template = await prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        promptRuns: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Get metrics
    const metrics = await canaryRolloutService.getMetrics(id);

    res.json({
      success: true,
      data: {
        ...template,
        metrics,
      },
    });
  } catch (error) {
    logger.error('[PromptTemplate] Get failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * List all prompt templates
 */
export async function listTemplates(req: Request, res: Response) {
  try {
    const { name, activeOnly } = req.query;

    const where: any = {};

    if (name) {
      where.name = name as string;
    }

    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const templates = await prisma.promptTemplate.findMany({
      where,
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
      include: {
        _count: {
          select: { promptRuns: true },
        },
      },
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('[PromptTemplate] List failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Start canary rollout for a template
 */
export async function startRollout(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const template = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    if (template.rolloutStage !== 'DEVELOPMENT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Template is not in DEVELOPMENT stage',
        },
      });
    }

    // Start canary rollout (move to 5%)
    await canaryRolloutService.incrementRollout(id);

    const updated = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    logger.info(`[PromptTemplate] Started rollout for ${id}`);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('[PromptTemplate] Start rollout failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'ROLLOUT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Increment rollout to next stage
 */
export async function incrementRollout(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check error rate first
    const errorRate = await canaryRolloutService.checkErrorRate(id);

    if (errorRate > 0.05) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HIGH_ERROR_RATE',
          message: `Error rate too high: ${(errorRate * 100).toFixed(2)}%`,
          errorRate,
        },
      });
    }

    await canaryRolloutService.incrementRollout(id);

    const updated = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    logger.info(`[PromptTemplate] Incremented rollout for ${id}`);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('[PromptTemplate] Increment rollout failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INCREMENT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Rollback to previous version
 */
export async function rollbackTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await canaryRolloutService.rollback(id);

    logger.info(`[PromptTemplate] Rolled back ${id}`);

    res.json({
      success: true,
      message: 'Template rolled back to previous version',
    });
  } catch (error) {
    logger.error('[PromptTemplate] Rollback failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'ROLLBACK_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Get rollout metrics for a template
 */
export async function getMetrics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;

    const metrics = await canaryRolloutService.getMetrics(id, hoursBack);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('[PromptTemplate] Get metrics failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/prompts/{id}:
 *   patch:
 *     tags:
 *       - Prompt Templates
 *     summary: Update a prompt template
 *     description: Update template metadata (description, variables). Cannot update content or name.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 */
export async function updateTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { description, variables } = req.body;

    // Check if template exists
    const template = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Update template
    const updated = await prisma.promptTemplate.update({
      where: { id },
      data: {
        description,
        variables,
        updatedAt: new Date(),
      },
    });

    logger.info(`[PromptTemplate] Updated template ${id}`);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('[PromptTemplate] Update failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/prompts/{id}:
 *   delete:
 *     tags:
 *       - Prompt Templates
 *     summary: Delete a prompt template
 *     description: Soft delete a template by deactivating it and resetting rollout stage to DEVELOPMENT
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 */
export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if template exists
    const template = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Soft delete by deactivating
    await prisma.promptTemplate.update({
      where: { id },
      data: {
        isActive: false,
        rolloutStage: 'DEVELOPMENT',
        updatedAt: new Date(),
      },
    });

    logger.info(`[PromptTemplate] Deleted template ${id}`);

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('[PromptTemplate] Delete failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/prompts/{name}/compare:
 *   get:
 *     tags:
 *       - Prompt Templates
 *     summary: Compare two versions of a template
 *     description: |
 *       Compares performance metrics between two versions of the same template.
 *       Returns metrics, improvement percentages, and determines the winner.
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Template name
 *         schema:
 *           type: string
 *       - name: version1
 *         in: query
 *         required: true
 *         description: First version number
 *         schema:
 *           type: integer
 *       - name: version2
 *         in: query
 *         required: true
 *         description: Second version number
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comparison results
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
 *                     template1:
 *                       type: object
 *                     template2:
 *                       type: object
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         latencyImprovement:
 *                           type: string
 *                         errorRateImprovement:
 *                           type: string
 *                         winner:
 *                           type: string
 *                           enum: [version1, version2]
 *       400:
 *         description: Missing version parameters
 *       404:
 *         description: One or both versions not found
 */
export async function compareVersions(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const { version1, version2 } = req.query;

    if (!version1 || !version2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'version1 and version2 are required',
        },
      });
    }

    // Get both templates
    const [template1, template2] = await Promise.all([
      prisma.promptTemplate.findFirst({
        where: { name, version: parseInt(version1 as string) },
        include: {
          promptRuns: {
            take: 100,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.promptTemplate.findFirst({
        where: { name, version: parseInt(version2 as string) },
        include: {
          promptRuns: {
            take: 100,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    if (!template1 || !template2) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'One or both template versions not found',
        },
      });
    }

    // Calculate metrics for both
    const [metrics1, metrics2] = await Promise.all([
      canaryRolloutService.getMetrics(template1.id, 24 * 7), // Last 7 days
      canaryRolloutService.getMetrics(template2.id, 24 * 7),
    ]);

    // Calculate improvement percentages
    const latencyImprovement = metrics1.avgLatency > 0
      ? ((metrics1.avgLatency - metrics2.avgLatency) / metrics1.avgLatency) * 100
      : 0;

    const errorRateImprovement = metrics1.errorRate > 0
      ? ((metrics1.errorRate - metrics2.errorRate) / metrics1.errorRate) * 100
      : 0;

    res.json({
      success: true,
      data: {
        template1: {
          id: template1.id,
          version: template1.version,
          rolloutStage: template1.rolloutStage,
          isActive: template1.isActive,
          createdAt: template1.createdAt,
          metrics: metrics1,
        },
        template2: {
          id: template2.id,
          version: template2.version,
          rolloutStage: template2.rolloutStage,
          isActive: template2.isActive,
          createdAt: template2.createdAt,
          metrics: metrics2,
        },
        comparison: {
          latencyImprovement: `${latencyImprovement.toFixed(2)}%`,
          errorRateImprovement: `${errorRateImprovement.toFixed(2)}%`,
          totalRunsChange: metrics2.totalRuns - metrics1.totalRuns,
          winner: errorRateImprovement > 0 && latencyImprovement > 0 ? 'version2' : 'version1',
        },
        contentDiff: {
          version1Length: template1.content.length,
          version2Length: template2.content.length,
          lengthDiff: template2.content.length - template1.content.length,
        },
      },
    });
  } catch (error) {
    logger.error('[PromptTemplate] Compare versions failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'COMPARE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/prompts/{id}/history:
 *   get:
 *     tags:
 *       - Prompt Templates
 *     summary: Get rollout history for a template
 *     description: |
 *       Returns detailed rollout history grouped by stage, including:
 *       - Runs per stage (success/failure counts)
 *       - Average latency per stage
 *       - Error rate per stage
 *       - Timeline of recent runs
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Template ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rollout history retrieved successfully
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
 *                     template:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         version:
 *                           type: integer
 *                         currentStage:
 *                           type: string
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage:
 *                             type: string
 *                           totalRuns:
 *                             type: integer
 *                           successRuns:
 *                             type: integer
 *                           failureRuns:
 *                             type: integer
 *                           avgLatency:
 *                             type: integer
 *                           errorRate:
 *                             type: number
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Template not found
 */
export async function getRolloutHistory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get template
    const template = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Get all runs grouped by rollout stage
    const runs = await prisma.promptRun.findMany({
      where: { promptTemplateId: id },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Group by rollout stage
    const historyByStage: any = {};

    runs.forEach((run) => {
      const stage = run.rolloutStage;
      if (!historyByStage[stage]) {
        historyByStage[stage] = {
          stage,
          totalRuns: 0,
          successRuns: 0,
          failureRuns: 0,
          avgLatency: 0,
          totalLatency: 0,
        };
      }

      historyByStage[stage].totalRuns++;
      if (run.success) {
        historyByStage[stage].successRuns++;
      } else {
        historyByStage[stage].failureRuns++;
      }
      historyByStage[stage].totalLatency += run.latencyMs || 0;
    });

    // Calculate averages
    Object.values(historyByStage).forEach((stage: any) => {
      stage.avgLatency = stage.totalRuns > 0
        ? Math.round(stage.totalLatency / stage.totalRuns)
        : 0;
      stage.errorRate = stage.totalRuns > 0
        ? (stage.failureRuns / stage.totalRuns) * 100
        : 0;
      delete stage.totalLatency; // Remove intermediate calculation
    });

    res.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          version: template.version,
          currentStage: template.rolloutStage,
        },
        history: Object.values(historyByStage),
        timeline: runs.slice(0, 50).map((run) => ({
          stage: run.rolloutStage,
          success: run.success,
          latencyMs: run.latencyMs,
          tokensUsed: run.tokensUsed,
          createdAt: run.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('[PromptTemplate] Get rollout history failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/prompts/dashboard/ab-testing:
 *   get:
 *     tags:
 *       - Prompt Templates
 *     summary: Get A/B testing dashboard
 *     description: |
 *       Returns an overview of all active A/B tests and canary rollouts.
 *       Useful for monitoring multiple rollouts simultaneously.
 *     responses:
 *       200:
 *         description: A/B testing dashboard data
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
 *                     activeRollouts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalTemplates:
 *                       type: integer
 *                     stageDistribution:
 *                       type: object
 */
export async function getABTestingDashboard(req: Request, res: Response) {
  try {
    // Get all active rollouts
    const activeRollouts = await canaryRolloutService.getActiveRollouts();

    // Get metrics for each
    const rolloutsWithMetrics = await Promise.all(
      activeRollouts.map(async (rollout) => {
        const metrics = await canaryRolloutService.getMetrics(rollout.id, 24);
        const errorRate = await canaryRolloutService.checkErrorRate(rollout.id, 24);

        return {
          ...rollout,
          metrics,
          errorRate: (errorRate * 100).toFixed(2) + '%',
          health: errorRate < 0.05 ? 'healthy' : errorRate < 0.10 ? 'warning' : 'critical',
        };
      })
    );

    // Calculate stage distribution
    const stageDistribution: Record<string, number> = {};
    activeRollouts.forEach((rollout) => {
      stageDistribution[rollout.rolloutStage] =
        (stageDistribution[rollout.rolloutStage] || 0) + 1;
    });

    // Get all templates (including inactive)
    const totalTemplates = await prisma.promptTemplate.count();

    res.json({
      success: true,
      data: {
        summary: {
          totalTemplates,
          activeRollouts: activeRollouts.length,
          healthyRollouts: rolloutsWithMetrics.filter(r => r.health === 'healthy').length,
          warningRollouts: rolloutsWithMetrics.filter(r => r.health === 'warning').length,
          criticalRollouts: rolloutsWithMetrics.filter(r => r.health === 'critical').length,
        },
        stageDistribution,
        activeRollouts: rolloutsWithMetrics,
      },
    });
  } catch (error) {
    logger.error('[PromptTemplate] Get A/B testing dashboard failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
