/**
 * Conversation Repository
 *
 * Handles all database operations related to conversations.
 */

import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { Conversation, Message, Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface CreateConversationInput {
  userId: string
  title?: string
  model?: string
  systemPrompt?: string
  botId?: string
  projectId?: string
}

export interface UpdateConversationInput {
  title?: string
  systemPrompt?: string
  model?: string
  pinned?: boolean
  projectId?: string | null
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

@injectable()
export class ConversationRepository {
  /**
   * Find conversation by ID
   */
  async findById(conversationId: string): Promise<Conversation | null> {
    try {
      return await prisma.conversation.findUnique({
        where: { id: conversationId },
      })
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to find conversation')
      throw error
    }
  }

  /**
   * Find conversation with messages
   */
  async findByIdWithMessages(
    conversationId: string,
    options: {
      limit?: number
      offset?: number
      includeAttachments?: boolean
    } = {}
  ): Promise<ConversationWithMessages | null> {
    try {
      const { limit = 20, offset = 0, includeAttachments = true } = options

      return await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
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
          },
        },
      }) as ConversationWithMessages | null
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to find conversation with messages')
      throw error
    }
  }

  /**
   * Find user conversations
   */
  async findByUserId(
    userId: string,
    options: {
      limit?: number
      offset?: number
      projectId?: string
      includeLastMessage?: boolean
    } = {}
  ): Promise<Conversation[]> {
    try {
      const { limit = 50, offset = 0, projectId, includeLastMessage = true } = options

      const where: Prisma.ConversationWhereInput = { userId }
      if (projectId) {
        where.projectId = projectId
      }

      return await prisma.conversation.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        take: limit,
        skip: offset,
        include: includeLastMessage
          ? {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  role: true,
                  content: true,
                  createdAt: true,
                },
              },
            }
          : undefined,
      })
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find user conversations')
      throw error
    }
  }

  /**
   * Create conversation
   */
  async create(data: CreateConversationInput): Promise<Conversation> {
    try {
      return await prisma.conversation.create({
        data: {
          userId: data.userId,
          title: data.title ?? 'New chat',
          model: data.model ?? 'gpt-4o-mini',
          systemPrompt: data.systemPrompt,
          botId: data.botId,
          projectId: data.projectId,
        },
      })
    } catch (error) {
      logger.error({ err: error, userId: data.userId }, 'Failed to create conversation')
      throw error
    }
  }

  /**
   * Update conversation
   */
  async update(conversationId: string, data: UpdateConversationInput): Promise<Conversation> {
    try {
      return await prisma.conversation.update({
        where: { id: conversationId },
        data,
      })
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to update conversation')
      throw error
    }
  }

  /**
   * Update conversation timestamp
   */
  async touch(conversationId: string): Promise<void> {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to touch conversation')
      throw error
    }
  }

  /**
   * Delete conversation (cascade deletes messages)
   */
  async delete(conversationId: string): Promise<void> {
    try {
      await prisma.conversation.delete({
        where: { id: conversationId },
      })
    } catch (error) {
      logger.error({ err: error, conversationId }, 'Failed to delete conversation')
      throw error
    }
  }

  /**
   * Verify conversation belongs to user
   */
  async belongsToUser(conversationId: string, userId: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      })

      return conversation?.userId === userId
    } catch (error) {
      logger.error({ err: error, conversationId, userId }, 'Failed to verify conversation ownership')
      throw error
    }
  }

  /**
   * Count user conversations
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.conversation.count({
        where: { userId },
      })
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to count user conversations')
      throw error
    }
  }
}
