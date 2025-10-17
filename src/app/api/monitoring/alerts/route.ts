/**
 * @swagger
 * /api/monitoring/alerts:
 *   post:
 *     tags:
 *       - Monitoring
 *     summary: Send monitoring alerts
 *     description: Trigger alerts to Discord/Telegram for monitoring events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: "High Error Rate Detected"
 *               message:
 *                 type: string
 *                 example: "Error rate is at 7.5% which exceeds threshold"
 *               level:
 *                 type: string
 *                 enum: [info, warning, error, critical]
 *                 example: "critical"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["errors", "performance"]
 *               metadata:
 *                 type: object
 *                 example: { "errorRate": "7.5%", "threshold": "5%" }
 *     responses:
 *       200:
 *         description: Alert sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Failed to send alert
 */

import { NextResponse } from 'next/server'
import { sendAlert, AlertOptions } from '@/lib/alerting/webhook'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const alertOptions: AlertOptions = {
      title: body.title,
      message: body.message,
      level: body.level || 'info',
      tags: body.tags,
      metadata: body.metadata,
    }

    await sendAlert(alertOptions)

    return NextResponse.json({
      ok: true,
      message: 'Alert sent successfully',
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to send alert')
    return NextResponse.json(
      { error: 'Failed to send alert' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Test alert configuration
 *     description: Sends a test alert to verify Discord/Telegram webhook setup
 *     responses:
 *       200:
 *         description: Test alert sent
 */
export async function GET() {
  try {
    await sendAlert({
      title: '✅ Alert System Test',
      message: 'This is a test alert from Firbox monitoring system. If you see this, your webhooks are configured correctly!',
      level: 'info',
      tags: ['test', 'monitoring'],
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Test alert sent. Check your Discord/Telegram!',
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to send test alert')
    return NextResponse.json(
      { error: 'Failed to send test alert' },
      { status: 500 }
    )
  }
}
