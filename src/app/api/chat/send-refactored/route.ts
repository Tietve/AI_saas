/**
 * Refactored Chat Send Route (DI Architecture)
 *
 * This route demonstrates the Controller/Service/Repository pattern.
 * - Route: Handles HTTP request/response and session management
 * - Controller: Validates input and orchestrates service calls
 * - Service: Contains business logic
 * - Repository: Handles database operations
 *
 * Note: This is a simplified version showing the DI pattern.
 * The full streaming implementation with attachments is being migrated.
 */

import { NextRequest, NextResponse } from 'next/server'
import 'reflect-metadata'
import { container } from '@/lib/di/container'
import { ChatController } from '@/controllers/chat.controller'
import { getUserIdFromSession } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // 1. Get user ID from session (authentication)
    const userId = await getUserIdFromSession()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'You must be logged in to send messages',
          },
        },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()

    // 3. Resolve controller from DI container
    const chatController = container.resolve(ChatController)

    // 4. Call controller with user ID and body
    const result = await chatController.sendMessage({
      userId,
      conversationId: body.conversationId,
      content: body.content,
      model: body.model,
      systemPrompt: body.systemPrompt,
      botId: body.botId,
      requestId: body.requestId,
      attachments: body.attachments,
    })

    // 5. Return response with appropriate status code
    return NextResponse.json(
      {
        success: result.success,
        data: result.data,
        error: result.error,
      },
      { status: result.status }
    )
  } catch (error: any) {
    logger.error({ err: error }, 'Chat send route error')

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
