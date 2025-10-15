/**
 * Refactored Verify Email Route (DI Architecture)
 *
 * Demonstrates Controller/Service/Repository pattern for email verification.
 * - Route: Handles HTTP request/response and redirects
 * - Controller: Validates input and orchestrates service calls
 * - Service: Contains verification business logic
 * - Repository: Handles database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import 'reflect-metadata'
import { container } from '@/lib/di/container'
import { AuthController } from '@/controllers/auth.controller'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // 1. Extract token from query params
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        {
          error: 'Token không hợp lệ',
        },
        { status: 400 }
      )
    }

    // 2. Resolve controller from DI container
    const authController = container.resolve(AuthController)

    // 3. Call controller
    const result = await authController.verifyEmail({ token })

    // 4. Handle success response
    if (result.success) {
      // Redirect to verification success page
      return NextResponse.redirect(new URL('/auth/verified', req.url))
    }

    // 5. Handle error response
    return NextResponse.json(
      {
        error: result.error?.message || 'Có lỗi xảy ra',
      },
      { status: result.status }
    )
  } catch (error: any) {
    logger.error({ err: error }, 'Verify email route error')

    return NextResponse.json(
      {
        error: 'Có lỗi xảy ra',
      },
      { status: 500 }
    )
  }
}
