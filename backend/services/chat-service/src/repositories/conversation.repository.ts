import { Conversation, Message } from '@prisma/client';
import { db as prisma, withRetry } from '../config/database';

export class ConversationRepository {
  /**
   * Create new conversation
   */
  async create(userId: string, title: string = 'New Chat', model: string = 'gpt-4'): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        userId,
        title,
        model
      }
    });
  }

  /**
   * Get conversation by ID
   */
  async findById(id: string): Promise<Conversation | null> {
    return withRetry(() =>
      prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    );
  }

  /**
   * Get all conversations for user
   */
  async findByUserId(userId: string): Promise<Conversation[]> {
    return withRetry(() =>
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    );
  }

  /**
   * Update conversation title
   */
  async updateTitle(id: string, title: string): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: { title }
    });
  }

  /**
   * Update conversation pinned status
   */
  async updatePinned(id: string, pinned: boolean): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: { pinned }
    });
  }

  /**
   * Delete conversation
   */
  async delete(id: string): Promise<void> {
    await prisma.conversation.delete({
      where: { id }
    });
  }

  /**
   * Check if user owns conversation
   */
  async isOwner(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId
      }
    });
    return !!conversation;
  }
}

export const conversationRepository = new ConversationRepository();
