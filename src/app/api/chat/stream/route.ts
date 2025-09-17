import { NextRequest } from 'next/server';
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway';
import { requireUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const gateway = new MultiProviderGateway({
    openai: process.env.OPENAI_API_KEY!,
    claude: process.env.ANTHROPIC_API_KEY!
});

export async function POST(req: NextRequest) {
    try {
        // Use your auth method instead of getServerSession
        const userId = await requireUserId();

        const { message, conversationId } = await req.json();

        // Verify conversation ownership
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: userId
            }
        });

        if (!conversation) {
            return new Response('Conversation not found', { status: 404 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial metadata
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: 'start',
                            conversationId
                        })}\n\n`)
                    );

                    // Get system prompt from conversation if exists
                    const systemPrompt = conversation.systemPrompt || 'You are a helpful AI assistant.';

                    const generator = await gateway.routeStreamRequest(message, {
                        systemPrompt,
                        maxTokens: 2000
                    });

                    let fullContent = '';
                    for await (const chunk of generator) {
                        fullContent += chunk;
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({
                                type: 'chunk',
                                content: chunk
                            })}\n\n`)
                        );
                    }

                    // Save messages to database after streaming completes
                    const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    // Save user message
                    await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'USER',
                            content: message,
                            idempotencyKey: `${idempotencyKey}_user`
                        }
                    });

                    // Save assistant message
                    await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'ASSISTANT',
                            content: fullContent,
                            model: conversation.model || 'gpt-4o-mini',
                            idempotencyKey: `${idempotencyKey}_assistant`
                        }
                    });

                    // Update conversation's updatedAt
                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: { updatedAt: new Date() }
                    });

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: 'error',
                            error: error instanceof Error ? error.message : 'Stream failed'
                        })}\n\n`)
                    );
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (error) {
        console.error('Stream route error:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return new Response('Unauthorized', { status: 401 });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
}