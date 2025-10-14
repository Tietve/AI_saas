/**
 * Refactored Signin Route (DI Architecture)
 *
 * Demonstrates Controller/Service/Repository pattern for authentication.
 * - Route: Handles HTTP request/response and cookie management
 * - Controller: Validates input and orchestrates service calls
 * - Service: Contains authentication business logic
 * - Repository: Handles database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import 'reflect-metadata'
import { container } from '@/lib/di/container'
import { AuthController } from '@/controllers/auth.controller'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body = await req.json()
    const email = body?.email?.trim()
    const password = body?.password

    // 2. Resolve controller from DI container
    const authController = container.resolve(AuthController)

    // 3. Call controller
    const result = await authController.signin({
      email,
      password,
    })

    // 4. Handle success response
    if (result.success && result.data) {
      const { sessionCookie } = result.data

      // Create response with session cookie
      const response = NextResponse.json(
        {
          ok: true,
          message: 'Đăng nhập thành công',
          redirectUrl: '/chat',
        },
        { status: 200 }
      )

      // Set session cookie
      if (sessionCookie) {
        response.cookies.set(sessionCookie.name, sessionCookie.value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      }

      return response
    }

    // 5. Handle error response (including email not verified)
    if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
      return NextResponse.json(
        {
          error: result.error.message,
          needsVerification: true,
          email,
        },
        { status: result.status }
      )
    }

    return NextResponse.json(
      {
        error: result.error?.message || 'Có lỗi xảy ra',
      },
      { status: result.status }
    )
  } catch (error: any) {
    logger.error({ err: error }, 'Signin route error')

    return NextResponse.json(
      {
        error: 'Có lỗi xảy ra',
      },
      { status: 500 }
    )
  }
}
