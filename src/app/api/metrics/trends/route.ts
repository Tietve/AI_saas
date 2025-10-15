/**
 * @swagger
 * /api/metrics/trends:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get latency trends by provider
 *     description: Returns hourly latency trends for a specific AI provider to identify performance patterns and degradations
 *     parameters:
 *       - name: provider
 *         in: query
 *         description: AI provider to analyze
 *         required: true
 *         schema:
 *           type: string
 *           enum: [OPENAI, ANTHROPIC, GOOGLE]
 *       - name: hoursBack
 *         in: query
 *         description: Number of hours to analyze
 *         required: false
 *         schema:
 *           type: integer
 *           default: 24
 *           minimum: 1
 *           maximum: 168
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
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
 *                     provider:
 *                       type: string
 *                       example: OPENAI
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hour:
 *                             type: string
 *                             format: date-time
 *                           avgLatency:
 *                             type: number
 *                           p95Latency:
 *                             type: number
 *                           p99Latency:
 *                             type: number
 *                           requestCount:
 *                             type: number
 *                     hoursBack:
 *                       type: number
 *       400:
 *         description: Invalid parameters (missing/invalid provider or hoursBack out of range)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch latency trends
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/lib/di/container'
import { MetricsService } from '@/services/metrics.service'
import { AIProvider } from '@prisma/client'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const provider = searchParams.get('provider')?.toUpperCase() as
      | AIProvider
      | null
    const hoursBack = parseInt(searchParams.get('hoursBack') || '24', 10)

    if (!provider || !Object.values(AIProvider).includes(provider)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Valid provider parameter required (OPENAI, ANTHROPIC, GOOGLE)',
        },
        { status: 400 }
      )
    }

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
    const trends = await metricsService.getLatencyTrends(provider, hoursBack)

    return NextResponse.json({
      ok: true,
      data: {
        provider,
        trends,
        hoursBack,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get latency trends')
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch latency trends',
      },
      { status: 500 }
    )
  }
}
