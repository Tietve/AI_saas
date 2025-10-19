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
        const page = options.page || 1;
        const pageSize = options.pageSize || 20;
        const offset = (page - 1) * pageSize;

        // Note: countByUserId in repo doesn't support projectId, so this count might be inaccurate when filtering
        const total = await this.conversationRepository.countByUserId(userId);
        const items = await this.conversationRepository.findByUserId(userId, {
            limit: pageSize,
            offset,
            projectId: options.projectId,
            includeLastMessage: true
        });

        const formattedItems = items.map((conv: any) => ({ // Using any to bypass type issue with included relations
            id: conv.id,
            title: conv.title || 'Untitled',
            model: conv.model,
            systemPrompt: conv.systemPrompt,
            botId: conv.botId,
            projectId: conv.projectId,
            pinned: conv.pinned,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            // FIXME: Original code had conv._count.messages, which is not available anymore.
            // This needs a more performant solution than counting messages for each conversation.
            messageCount: 0,
            lastMessage: conv.messages?.[0]?.content?.slice(0, 100) || '',
        }));

        return {
            page: page,
            pageSize: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items: formattedItems,
        };
    }
}
