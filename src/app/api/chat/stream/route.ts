/**
 * @swagger
 * /api/chat/stream:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Stream chat response (legacy)
 *     description: Streams AI chat responses using Server-Sent Events. This is a legacy endpoint - prefer /api/chat/send for production use.
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - conversationId
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to send
 *                 example: What is machine learning?
 *               conversationId:
 *                 type: string
 *                 description: ID of the conversation
 *     responses:
 *       200:
 *         description: Streaming response
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream with chat chunks
 *       401:
 *         description: Unauthorized - user not authenticated
 *       404:
 *         description: Conversation not found or doesn't belong to user
 *       500:
 *         description: Internal server error
 */

import { NextRequest } from 'next/server';
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway';
import { requireUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
const gateway = new MultiProviderGateway({
    openai: process.env.OPENAI_API_KEY!,
    claude: process.env.ANTHROPIC_API_KEY!
});

export async function POST(req: NextRequest) {
    try {
        
        const userId = await requireUserId();

        const { message, conversationId } = await req.json();

        
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
                    
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: 'start',
                            conversationId
                        })}\n\n`)
                    );

                    
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

                    
                    const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    
                    await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'USER',
                            content: message,
                            idempotencyKey: `${idempotencyKey}_user`
                        }
                    });

                    
                    await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'ASSISTANT',
                            content: fullContent,
                            model: conversation.model || 'gpt-4o-mini',
                            idempotencyKey: `${idempotencyKey}_assistant`
                        }
                    });

                    
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