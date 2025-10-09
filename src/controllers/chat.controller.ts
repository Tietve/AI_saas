/**
 * Chat Controller
 *
 * Handles HTTP request/response for chat operations.
 * Validates input, orchestrates service calls, returns responses.
 */

import { injectable, inject } from 'tsyringe'
import { ChatService, SendMessageInput } from '@/services/chat.service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Validation schemas
const sendMessageSchema = z.object({
  userId: z.string().min(1),
  conversationId: z.string().optional(),
  content: z.string().min(1).max(10000),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  botId: z.string().optional(),
  requestId: z.string().optional(),
  attachments: z.array(z.any()).optional(),
})

const getMessagesSchema = z.object({
  conversationId: z.string().min(1),
  userId: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
})

const getConversationsSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
})

const deleteConversationSchema = z.object({
  conversationId: z.string().min(1),
  userId: z.string().min(1),
})

export interface ControllerResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  status: number
}

@injectable()
export class ChatController {
  constructor(@inject(ChatService) private chatService: ChatService) {}

  /**
   * Send a chat message
   */
  async sendMessage(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = sendMessageSchema.parse(input)

      // Call service
      const result = await this.chatService.sendMessage(validated as SendMessageInput)

      return {
        success: true,
        data: result,
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'ChatController.sendMessage failed')

      // Handle quota errors
      if (error.name === 'QUOTA_EXCEEDED') {
        return {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: error.message || 'You have exceeded your quota limit',
          },
          status: 429,
        }
      }

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Handle not found errors
      if (error.message === 'CONVERSATION_NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found',
          },
          status: 404,
        }
      }

      // Handle forbidden errors
      if (error.message === 'FORBIDDEN') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this conversation',
          },
          status: 403,
        }
      }

      // Handle AI provider errors
      if (error.message === 'AI_PROVIDER_FAILED') {
        return {
          success: false,
          error: {
            code: 'AI_PROVIDER_FAILED',
            message: 'AI provider is currently unavailable',
          },
          status: 503,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(input: unknown): Promise<ControllerResponse> {
    try {
      const validated = getMessagesSchema.parse(input)

      const messages = await this.chatService.getMessages(
        validated.conversationId,
        validated.userId,
        validated.limit || 50
      )

      return {
        success: true,
        data: { messages },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'ChatController.getMessages failed')

      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      if (error.message === 'FORBIDDEN') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this conversation',
          },
          status: 403,
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(input: unknown): Promise<ControllerResponse> {
    try {
      const validated = getConversationsSchema.parse(input)

      const conversations = await this.chatService.getConversations(
        validated.userId,
        validated.limit || 50
      )

      return {
        success: true,
        data: { conversations },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'ChatController.getConversations failed')

      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(input: unknown): Promise<ControllerResponse> {
    try {
      const validated = deleteConversationSchema.parse(input)

      await this.chatService.deleteConversation(validated.conversationId, validated.userId)

      return {
        success: true,
        data: { deleted: true },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'ChatController.deleteConversation failed')

      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      if (error.message === 'FORBIDDEN') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this conversation',
          },
          status: 403,
        }
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }
}
