import { injectable, inject } from 'tsyringe';
import { ConversationRepository, CreateConversationInput } from '@/repositories/conversation.repository';

@injectable()
export class ConversationCrudService {
    constructor(
        @inject(ConversationRepository) private conversationRepository: ConversationRepository
    ) {}

    public async createConversation(userId: string, data: Omit<CreateConversationInput, 'userId'>) {
        const conversation = await this.conversationRepository.create({ ...data, userId });
        return {
            id: conversation.id,
            title: conversation.title,
            model: conversation.model,
            systemPrompt: conversation.systemPrompt,
            botId: conversation.botId,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
        };
    }

    public async listConversations(userId: string, options: {
        page?: number;
        pageSize?: number;
        projectId?: string;
        q?: string;
    }) {
        const { total, items } = await this.conversationRepository.list(userId, options);

        const formattedItems = items.map(conv => ({
            id: conv.id,
            title: conv.title || 'Untitled',
            model: conv.model,
            systemPrompt: conv.systemPrompt,
            botId: conv.botId,
            projectId: conv.projectId,
            pinned: conv.pinned,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            messageCount: conv._count.messages,
            lastMessage: conv.messages[0]?.content?.slice(0, 100) || '',
        }));

        return {
            page: options.page || 1,
            pageSize: options.pageSize || 20,
            total,
            totalPages: Math.ceil(total / (options.pageSize || 20)),
            items: formattedItems,
        };
    }
}
