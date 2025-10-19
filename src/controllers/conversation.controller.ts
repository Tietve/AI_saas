import { NextRequest, NextResponse } from 'next/server';
import { injectable, inject } from 'tsyringe';
import { ConversationCrudService } from '@/services/conversation.crud.service';
import { requireUserId } from '@/lib/auth/session';
import { AppError } from '@/lib/errors/AppError';

function handleApiError(error: any): NextResponse {
    if (error instanceof AppError) {
        return NextResponse.json({ error: error.message, details: error.details }, { status: error.statusCode });
    }
    console.error('[Controller] Unknown error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

@injectable()
export class ConversationController {
    constructor(
        @inject(ConversationCrudService) private conversationCrudService: ConversationCrudService
    ) {}

    public async createConversation(req: NextRequest): Promise<NextResponse> {
        try {
            const userId = await requireUserId();
            const body = await req.json().catch(() => ({}));
            
            const result = await this.conversationCrudService.createConversation(userId, {
                title: body.title,
                systemPrompt: body.systemPrompt,
                model: body.model,
                botId: body.botId,
                projectId: body.projectId,
            });

            return NextResponse.json({ item: result }, { status: 201 });
        } catch (error) {
            return handleApiError(error);
        }
    }

    public async getConversations(req: NextRequest): Promise<NextResponse> {
        try {
            const userId = await requireUserId();
            const { searchParams } = new URL(req.url);

            const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
            const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
            const q = searchParams.get('q')?.trim() || undefined;
            const projectId = searchParams.get('projectId')?.trim() || undefined;

            const result = await this.conversationCrudService.listConversations(userId, { page, pageSize, q, projectId });

            return NextResponse.json(result);
        } catch (error) {
            return handleApiError(error);
        }
    }
}
