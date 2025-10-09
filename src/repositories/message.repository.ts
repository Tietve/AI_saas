/**
 * Message Repository
 *
 * Handles all database operations related to messages.
 */

import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { Message, Role, Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface CreateMessageInput {
  conversationId: string
  role: Role
  content: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
  idempotencyKey?: string
}

export interface MessageWithAttachments extends Message {
  attachments: {
    kind: string
    url: string
    meta: Prisma.JsonValue | null
  }[]
}

@injectable()
export class MessageRepository {
  /**
   * Find message by ID
   */
  async findById(messageId: string): Promise<Message | null> {
    try {
      return await prisma.message.findUnique({
        where: { id: messageId },
      })
    } catch (error) {
      logger.error({ err: error, messageId }, 'Failed to find message')
      throw error
    }
  }

  /**
   * Find messages by conversation ID
   */
  async findByConversationId(
    conversationId: string,
    options: {
      limit?: number
      offset?: number
      includeAttachments?: boolean
    } = {}
  ): Promise<MessageWithAttachments[]> {
    try {
      const { limit = 20, offset = 0, includeAttachments = true } = options

      return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: includeAttachments
          ? {
              attachments: {
                select: {
                  kind: true,
                  url: true,
                  meta: true,
                },
              },
            }
          : undefined,
      }) as MessageWithAttachments[]
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to find messages')
      throw error
    }
  }

  /**
   * Create message
   */
  async create(data: CreateMessageInput): Promise<Message> {
    try {
      return await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          latencyMs: data.latencyMs,
          idempotencyKey: data.idempotencyKey,
        },
      })
    } catch (error) {
      logger.error({ err: error, conversationId: data.conversationId }, 'Failed to create message')
      throw error
    }
  }

  /**
   * Find message by idempotency key (for deduplication)
   */
  async findByIdempotencyKey(
    conversationId: string,
    idempotencyKey: string
  ): Promise<Message | null> {
    try {
      return await prisma.message.findFirst({
        where: {
          conversationId,
          idempotencyKey,
          role: 'ASSISTANT',
        },
      })
    } catch (error) {
      logger.error({ err: error, conversationId, idempotencyKey }, 'Failed to find message by idempotency key')
      throw error
    }
  }

  /**
   * Delete message
   */
  async delete(messageId: string): Promise<void> {
    try {
      await prisma.message.delete({
        where: { id: messageId },
      })
    } catch (error) {
      logger.error({ err: error, messageId }, 'Failed to delete message')
      throw error
    }
  }

  /**
   * Count messages in conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    try {
      return await prisma.message.count({
        where: { conversationId },
      })
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to count messages')
      throw error
    }
  }

  /**
   * Get recent messages for context (reversed order for AI)
   */
  async getRecentForContext(
    conversationId: string,
    limit: number = 20
  ): Promise<MessageWithAttachments[]> {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          attachments: {
            select: {
              kind: true,
              url: true,
              meta: true,
            },
          },
        },
      })

      // Reverse to get chronological order (oldest first)
      return messages.reverse() as MessageWithAttachments[]
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to get recent messages for context')
      throw error
    }
  }
}
