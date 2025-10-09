/**
 * @swagger
 * /api/metrics/health:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get AI provider health status
 *     description: Returns real-time health status for all AI providers including error rates, latency, and availability
 *     parameters:
 *       - name: lookbackMinutes
 *         in: query
 *         description: Time window in minutes to analyze provider health
 *         required: false
 *         schema:
 *           type: integer
 *           default: 15
 *           minimum: 1
 *           maximum: 60
 *     responses:
 *       200:
 *         description: Provider health data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProviderHealth'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to fetch provider health
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
    const lookbackMinutes = parseInt(
      searchParams.get('lookbackMinutes') || '15',
      10
    )

    const metricsService = container.resolve(MetricsService)
    const health = await metricsService.getProviderHealth(lookbackMinutes)

    return NextResponse.json({
      ok: true,
      data: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get provider health')
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch provider health',
      },
      { status: 500 }
    )
  }
}
