/**
 * @swagger
 * /api/metrics/alerts:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Check for active alerts
 *     description: Monitors system health and returns active alerts based on configured thresholds for error rates and latency
 *     parameters:
 *       - name: errorRatePercent
 *         in: query
 *         description: Error rate threshold percentage
 *         required: false
 *         schema:
 *           type: number
 *           default: 10
 *       - name: latencyMs
 *         in: query
 *         description: Latency threshold in milliseconds
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5000
 *       - name: enabled
 *         in: query
 *         description: Enable/disable alert checking
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Alert check completed successfully
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
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           severity:
 *                             type: string
 *                             enum: [critical, warning, info]
 *                           message:
 *                             type: string
 *                           provider:
 *                             type: string
 *                           metric:
 *                             type: string
 *                           value:
 *                             type: number
 *                     count:
 *                       type: number
 *                       description: Total number of active alerts
 *                     thresholds:
 *                       type: object
 *                       description: Configured alert thresholds
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Failed to check alerts
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

    // Get threshold configuration from query params or use defaults
    const thresholds = {
      errorRatePercent: parseFloat(
        searchParams.get('errorRatePercent') || '10'
      ),
      latencyMs: parseInt(searchParams.get('latencyMs') || '5000', 10),
      enabled: searchParams.get('enabled') !== 'false',
    }

    const metricsService = container.resolve(MetricsService)
    const alerts = await metricsService.checkAlerts(thresholds)

    return NextResponse.json({
      ok: true,
      data: {
        alerts,
        count: alerts.length,
        thresholds,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to check alerts')
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to check alerts',
      },
      { status: 500 }
    )
  }
}
