/**
 * GET /api/docs
 *
 * Returns OpenAPI/Swagger specification
 */

import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
