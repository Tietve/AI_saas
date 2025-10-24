/**
 * Simple Health Check Endpoint for Azure App Service
 * 
 * This is a minimal health check that always returns 200 OK
 * for Azure's basic health monitoring. Use this if the main
 * /api/health endpoint is too complex or has dependency issues.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      node_version: process.version,
      environment: process.env.NODE_ENV || 'unknown'
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}
