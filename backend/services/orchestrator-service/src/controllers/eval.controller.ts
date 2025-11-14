import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import { evalRunnerService } from '../services/eval-runner.service';
import logger from '../config/logger.config';
import { RunType } from '@prisma/client';

/**
 * @swagger
 * /api/eval/datasets:
 *   post:
 *     tags:
 *       - Evaluations
 *     summary: Create evaluation dataset
 *     description: Create a new test dataset for automated evaluations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 enum: [general, adversarial, pii, injection]
 *     responses:
 *       201:
 *         description: Dataset created successfully
 */
export async function createDataset(req: Request, res: Response) {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name is required',
        },
      });
    }

    const dataset = await prisma.evalDataset.create({
      data: {
        name,
        description,
        category,
        isActive: true,
      },
    });

    logger.info(`[Eval] Created dataset ${dataset.id} (${name})`);

    res.status(201).json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    logger.error('[Eval] Create dataset failed:', error);

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
 * @swagger
 * /api/eval/datasets/{id}/questions:
 *   post:
 *     tags:
 *       - Evaluations
 *     summary: Add question to dataset
 *     description: Add a test question to an evaluation dataset
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
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *               expectedAnswer:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [pii_leak, prompt_injection, faithfulness]
 *     responses:
 *       201:
 *         description: Question added successfully
 */
export async function addQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { question, expectedAnswer, category, metadata } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'question is required',
        },
      });
    }

    // Check if dataset exists
    const dataset = await prisma.evalDataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Dataset not found',
        },
      });
    }

    const evalQuestion = await prisma.evalQuestion.create({
      data: {
        evalDatasetId: id,
        question,
        expectedAnswer,
        category,
        metadata,
      },
    });

    logger.info(`[Eval] Added question ${evalQuestion.id} to dataset ${id}`);

    res.status(201).json({
      success: true,
      data: evalQuestion,
    });
  } catch (error) {
    logger.error('[Eval] Add question failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_QUESTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/eval/run:
 *   post:
 *     tags:
 *       - Evaluations
 *     summary: Run evaluation
 *     description: |
 *       Execute evaluation on a dataset. Runs asynchronously and returns run ID.
 *       Use GET /api/eval/results/:runId to check status and results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - datasetId
 *             properties:
 *               datasetId:
 *                 type: string
 *               runType:
 *                 type: string
 *                 enum: [NIGHTLY, ON_DEMAND, PRE_DEPLOY, CONTINUOUS]
 *                 default: ON_DEMAND
 *     responses:
 *       202:
 *         description: Evaluation started
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
 *                     evalRunId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 */
export async function runEval(req: Request, res: Response) {
  try {
    const { datasetId, runType } = req.body;

    if (!datasetId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'datasetId is required',
        },
      });
    }

    // Validate runType
    const validRunTypes: RunType[] = ['NIGHTLY', 'ON_DEMAND', 'PRE_DEPLOY', 'CONTINUOUS'];
    const selectedRunType: RunType = runType && validRunTypes.includes(runType)
      ? runType
      : 'ON_DEMAND';

    const evalRunId = await evalRunnerService.runEval(datasetId, selectedRunType);

    logger.info(`[Eval] Started eval run ${evalRunId} for dataset ${datasetId}`);

    res.status(202).json({
      success: true,
      data: {
        evalRunId,
        status: 'RUNNING',
        message: 'Evaluation started. Check /api/eval/results/:runId for status.',
      },
    });
  } catch (error) {
    logger.error('[Eval] Run eval failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'RUN_EVAL_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/eval/results/{runId}:
 *   get:
 *     tags:
 *       - Evaluations
 *     summary: Get evaluation results
 *     description: |
 *       Get results and status of an evaluation run.
 *       Includes all test results with scores and red-team checks.
 *     parameters:
 *       - name: runId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evaluation results retrieved
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
 *                     status:
 *                       type: string
 *                       enum: [PENDING, RUNNING, COMPLETED, FAILED, CANCELLED]
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalQuestions:
 *                           type: integer
 *                         passed:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         passRate:
 *                           type: string
 *                         avgScores:
 *                           type: object
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 */
export async function getEvalResults(req: Request, res: Response) {
  try {
    const { runId } = req.params;

    const evalRun = await evalRunnerService.getEvalResults(runId);

    // Calculate pass rate
    const passRate =
      evalRun.totalQuestions > 0
        ? ((evalRun.passed / evalRun.totalQuestions) * 100).toFixed(2) + '%'
        : '0%';

    res.json({
      success: true,
      data: {
        id: evalRun.id,
        dataset: {
          id: evalRun.evalDataset.id,
          name: evalRun.evalDataset.name,
          category: evalRun.evalDataset.category,
        },
        status: evalRun.status,
        runType: evalRun.runType,
        summary: {
          totalQuestions: evalRun.totalQuestions,
          passed: evalRun.passed,
          failed: evalRun.failed,
          passRate,
          avgScores: {
            relevance: evalRun.avgRelevance?.toFixed(3),
            faithfulness: evalRun.avgFaithfulness?.toFixed(3),
            helpfulness: evalRun.avgHelpfulness?.toFixed(3),
          },
        },
        timing: {
          startedAt: evalRun.startedAt,
          completedAt: evalRun.completedAt,
          durationMs: evalRun.durationMs,
        },
        results: evalRun.evalResults.map((result) => ({
          question: result.evalQuestion.question,
          upgradedPrompt: result.upgradePrompt,
          response: result.llmResponse,
          scores: {
            relevance: result.relevanceScore,
            faithfulness: result.faithfulnessScore,
            helpfulness: result.helpfulnessScore,
          },
          redTeam: {
            piiLeakDetected: result.piiLeakDetected,
            injectionDetected: result.injectionDetected,
          },
          passed: result.passed,
          latencyMs: result.latencyMs,
        })),
      },
    });
  } catch (error) {
    logger.error('[Eval] Get results failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RESULTS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/eval/datasets:
 *   get:
 *     tags:
 *       - Evaluations
 *     summary: List evaluation datasets
 *     description: Get all evaluation datasets with run counts
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [general, adversarial, pii, injection]
 *       - name: activeOnly
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Datasets retrieved successfully
 */
export async function listDatasets(req: Request, res: Response) {
  try {
    const { category, activeOnly } = req.query;

    const where: any = {};

    if (category) {
      where.category = category as string;
    }

    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const datasets = await prisma.evalDataset.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
            evalRuns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: datasets.map((dataset) => ({
        ...dataset,
        questionCount: dataset._count.questions,
        runCount: dataset._count.evalRuns,
        _count: undefined,
      })),
    });
  } catch (error) {
    logger.error('[Eval] List datasets failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_DATASETS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/eval/datasets/{id}:
 *   get:
 *     tags:
 *       - Evaluations
 *     summary: Get dataset with questions
 *     description: Get detailed information about a dataset including all questions
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset retrieved successfully
 *       404:
 *         description: Dataset not found
 */
export async function getDataset(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const dataset = await prisma.evalDataset.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' },
        },
        evalRuns: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            runType: true,
            passed: true,
            failed: true,
            totalQuestions: true,
            createdAt: true,
          },
        },
      },
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Dataset not found',
        },
      });
    }

    res.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    logger.error('[Eval] Get dataset failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DATASET_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * @swagger
 * /api/eval/history:
 *   get:
 *     tags:
 *       - Evaluations
 *     summary: Get evaluation history
 *     description: Get history of all evaluation runs across all datasets
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, RUNNING, COMPLETED, FAILED, CANCELLED]
 *     responses:
 *       200:
 *         description: History retrieved successfully
 */
export async function getEvalHistory(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const history = await prisma.evalRun.findMany({
      where,
      include: {
        evalDataset: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: history.map((run) => ({
        id: run.id,
        dataset: run.evalDataset,
        status: run.status,
        runType: run.runType,
        passed: run.passed,
        failed: run.failed,
        totalQuestions: run.totalQuestions,
        passRate:
          run.totalQuestions > 0
            ? ((run.passed / run.totalQuestions) * 100).toFixed(2) + '%'
            : '0%',
        avgScores: {
          relevance: run.avgRelevance,
          faithfulness: run.avgFaithfulness,
          helpfulness: run.avgHelpfulness,
        },
        timing: {
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          durationMs: run.durationMs,
        },
      })),
    });
  } catch (error) {
    logger.error('[Eval] Get history failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HISTORY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
