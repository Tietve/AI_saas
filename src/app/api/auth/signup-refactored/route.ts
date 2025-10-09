/**
 * Refactored Signup Route (DI Architecture)
 *
 * Demonstrates Controller/Service/Repository pattern for auth operations.
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
    const result = await authController.signup({
      email,
      password,
    })

    // 4. Handle success response
    if (result.success && result.data) {
      const { needsVerification, sessionCookie } = result.data

      // If verification required, return message
      if (needsVerification) {
        return NextResponse.json(
          {
            ok: true,
            needsVerification: true,
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
            email,
          },
          { status: 201 }
        )
      }

      // Auto-login: Create response with session cookie
      const response = NextResponse.json(
        {
          ok: true,
          message: 'Đăng ký thành công',
          redirectUrl: '/chat',
        },
        { status: 201 }
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

    // 5. Handle error response
    return NextResponse.json(
      {
        error: result.error?.message || 'Có lỗi xảy ra khi đăng ký',
      },
      { status: result.status }
    )
  } catch (error: any) {
    logger.error({ err: error }, 'Signup route error')

    return NextResponse.json(
      {
        error: 'Có lỗi xảy ra khi đăng ký',
      },
      { status: 500 }
    )
  }
}
