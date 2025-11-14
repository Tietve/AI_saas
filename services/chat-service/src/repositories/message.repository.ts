import { PrismaClient, Message } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMessageData {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount?: number;
  model?: string;
}

export class MessageRepository {
  /**
   * Create new message
   */
  async create(data: CreateMessageData): Promise<Message> {
    return prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        tokenCount: data.tokenCount || 0,
        model: data.model
      }
    });
  }

  /**
   * Get messages for conversation with pagination
   */
  async findByConversationId(
    conversationId: string,
    options?: {
      take?: number;
      skip?: number;
      cursor?: string;
    }
  ): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: options?.take || 100, // Default limit to 100 messages
      skip: options?.skip || 0,
      ...(options?.cursor && {
        cursor: { id: options.cursor },
      }),
    });
  }

  /**
   * Get total count of messages in conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    return prisma.message.count({
      where: { conversationId }
    });
  }

  /**
   * Delete all messages in conversation
   */
  async deleteByConversationId(conversationId: string): Promise<void> {
    await prisma.message.deleteMany({
      where: { conversationId }
    });
  }
}

export const messageRepository = new MessageRepository();
