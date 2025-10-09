/**
 * @swagger
 * /api/metrics/dashboard:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get comprehensive metrics dashboard
 *     description: |
 *       Returns aggregated metrics for the dashboard including:
 *       - Provider-level statistics (requests, errors, costs)
 *       - Top models by usage and cost
 *       - Overall platform metrics
 *     parameters:
 *       - name: hoursBack
 *         in: query
 *         description: Number of hours to look back for metrics
 *         required: false
 *         schema:
 *           type: integer
 *           default: 24
 *           minimum: 1
 *           maximum: 168
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     providers:
 *                       type: array
 *                       description: Per-provider statistics
 *                     topModels:
 *                       type: array
 *                       description: Most used models
 *                     totalRequests:
 *                       type: number
 *                     totalCost:
 *                       type: number
 *                     avgLatency:
 *                       type: number
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/lib/di/container'
import { MetricsService } from '@/services/metrics.service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const hoursBack = parseInt(searchParams.get('hoursBack') || '24', 10)

    // Validate hoursBack is reasonable
    if (hoursBack < 1 || hoursBack > 168) {
      return NextResponse.json(
        {
          ok: false,
          error: 'hoursBack must be between 1 and 168 (7 days)',
        },
        { status: 400 }
      )
    }

    const metricsService = container.resolve(MetricsService)
    const dashboard = await metricsService.getDashboardMetrics(hoursBack)

    return NextResponse.json({
      ok: true,
      data: dashboard,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get dashboard metrics')
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch dashboard metrics',
      },
      { status: 500 }
    )
  }
}
