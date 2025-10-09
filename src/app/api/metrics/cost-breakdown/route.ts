/**
 * @swagger
 * /api/metrics/cost-breakdown:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get detailed cost breakdown
 *     description: Returns granular cost analysis by provider and model for understanding spending patterns
 *     parameters:
 *       - name: hoursBack
 *         in: query
 *         description: Number of hours to analyze
 *         required: false
 *         schema:
 *           type: integer
 *           default: 24
 *           minimum: 1
 *           maximum: 720
 *     responses:
 *       200:
 *         description: Cost breakdown retrieved successfully
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
 *                     timeRange:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                         end:
 *                           type: string
 *                           format: date-time
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provider:
 *                             type: string
 *                           model:
 *                             type: string
 *                           cost:
 *                             type: number
 *                           requests:
 *                             type: number
 *                           tokens:
 *                             type: number
 *                     total:
 *                       type: number
 *                       description: Total cost across all providers/models
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch cost breakdown
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

    // Validate hoursBack
    if (hoursBack < 1 || hoursBack > 720) {
      return NextResponse.json(
        {
          ok: false,
          error: 'hoursBack must be between 1 and 720 (30 days)',
        },
        { status: 400 }
      )
    }

    const endDate = new Date()
    const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

    const metricsService = container.resolve(MetricsService)
    const breakdown = await metricsService.getCostBreakdown(startDate, endDate)

    return NextResponse.json({
      ok: true,
      data: {
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        breakdown,
        total: breakdown.reduce((sum, item) => sum + item.cost, 0),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get cost breakdown')
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch cost breakdown',
      },
      { status: 500 }
    )
  }
}
