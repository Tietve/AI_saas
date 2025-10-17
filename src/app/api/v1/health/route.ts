/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health Check (v1)
 *     summary: Health check endpoint (API v1)
 *     description: Returns the health status of the application (versioned API)
 *     responses:
 *       200:
 *         description: Service is healthy
 *         headers:
 *           X-API-Version:
 *             description: API version used
 *             schema:
 *               type: string
 *               example: v1
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 version:
 *                   type: string
 *                   example: v1
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: boolean
 *                     redis:
 *                       type: boolean
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upstash as redis } from '@/lib/redis'
import { versionedApiResponse, API_VERSIONS } from '@/middleware/api-version'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  // Check database
  let dbOk = false
  let dbResponseTime = 0
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbResponseTime = Date.now() - dbStart
    dbOk = true
  } catch (error) {
    dbOk = false
  }

  // Check Redis
  let redisOk = false
  let redisResponseTime = 0
  try {
    const redisStart = Date.now()
    await redis?.ping()
    redisResponseTime = Date.now() - redisStart
    redisOk = true
  } catch (error) {
    redisOk = false
  }

  const totalTime = Date.now() - startTime

  return versionedApiResponse(
    {
      ok: dbOk && redisOk,
      version: API_VERSIONS.V1,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk,
        redis: redisOk,
      },
      metrics: {
        dbResponseTime,
        redisResponseTime,
        totalResponseTime: totalTime,
      },
    },
    API_VERSIONS.V1
  )
}
