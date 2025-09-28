import { NextRequest, NextResponse } from 'next/server';
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway';
import { SemanticCache } from '@/lib/ai-providers/semantic-cache';
import { requireUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { ModelId } from '@prisma/client';

const gateway = new MultiProviderGateway({
    openai: process.env.OPENAI_API_KEY!,
    claude: process.env.ANTHROPIC_API_KEY!,
    gemini: process.env.GEMINI_API_KEY!
});

const cache = new SemanticCache(
    process.env.UPSTASH_REDIS_URL!,
    process.env.UPSTASH_REDIS_TOKEN!
);


function getModelId(provider: string, model: string): ModelId {
    const mapping: Record<string, ModelId> = {
        'openai/gpt-4o': ModelId.gpt_4o,
        'openai/gpt-4o-mini': ModelId.gpt_4o_mini,
        'openai/gpt-5-nano': ModelId.gpt_5_nano,
        'openai/gpt-3.5-turbo': ModelId.gpt_3_5_turbo,
        'claude/claude-3-5-sonnet-20241022': ModelId.claude_3_5_sonnet,
        'claude/claude-3-haiku-20240307': ModelId.claude_3_5_haiku,
    };

    const key = `${provider}/${model}`;
    return mapping[key] || ModelId.gpt_4o_mini;
}

export async function POST(req: NextRequest) {
    try {
        
        const userId = await requireUserId();

        const { message, conversationId, useCache = true } = await req.json();

        
        const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        
        if (useCache) {
            const cached = await cache.get(message);
            if (cached) {
                return NextResponse.json({
                    ...cached,
                    fromCache: true
                });
            }
        }

        
        let conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: userId
            }
        });

        if (!conversation) {
            
            conversation = await prisma.conversation.create({
                data: {
                    id: conversationId,
                    userId: userId,
                    title: message.slice(0, 100),
                    model: 'gpt-4o-mini'
                }
            });
        }

        
        const startTime = Date.now();
        const systemPrompt = conversation.systemPrompt || 'You are a helpful AI assistant.';

        const response = await gateway.routeRequest(message, {
            systemPrompt,
            maxTokens: 2000
        });

        const latencyMs = Date.now() - startTime;

        
        if (useCache) {
            await cache.set(message, response);
        }

        
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'USER',
                content: message,
                idempotencyKey: `${idempotencyKey}_user`
            }
        });

        
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'ASSISTANT',
                content: response.content,
                model: `${response.provider}/${response.model}`,
                promptTokens: response.usage.promptTokens,
                completionTokens: response.usage.completionTokens,
                latencyMs: latencyMs,
                idempotencyKey: `${idempotencyKey}_assistant`
            }
        });

        
        const modelId = getModelId(response.provider, response.model);

        await prisma.tokenUsage.create({
            data: {
                userId: userId,
                tokensIn: response.usage.promptTokens,
                tokensOut: response.usage.completionTokens,
                costUsd: response.usage.totalCost,
                model: modelId,
                meta: {
                    provider: response.provider,
                    model: response.model,
                    conversationId: conversation.id
                }
            }
        });

        
        await prisma.user.update({
            where: { id: userId },
            data: {
                monthlyTokenUsed: {
                    increment: response.usage.promptTokens + response.usage.completionTokens
                }
            }
        });

        
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            ...response,
            conversationId: conversation.id
        });
    } catch (error) {
        console.error('Chat API error:', error);

        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process message' },
            { status: 500 }
        );
    }
}