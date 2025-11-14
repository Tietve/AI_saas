import { PrismaClient, Conversation, Message } from '@prisma/client';

const prisma = new PrismaClient();

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
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Get all conversations for user with pagination
   */
  async findByUserId(
    userId: string,
    options?: {
      take?: number;
      skip?: number;
    }
  ): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: options?.take || 50, // Default limit to 50 conversations
      skip: options?.skip || 0,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Get total count of conversations for user
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.conversation.count({
      where: { userId }
    });
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
