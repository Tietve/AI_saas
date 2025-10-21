import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from '@/lib/auth/session';


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;
        const userId = await requireUserId();
        
        // Validate conversationId (don't cast to Number, it's a cuid string)
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return new Response(JSON.stringify({ 
                error: "INVALID_CONVERSATION_ID",
                message: "conversationId must be a valid string"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const body = await req.json().catch(() => ({}));
        
        // Accept both {title} and {name} for compatibility
        const titleField = typeof body?.title === 'string' ? body.title : 
                          typeof body?.name === 'string' ? body.name : 
                          undefined;

        if (!titleField?.trim()) {
            return new Response(JSON.stringify({ 
                error: "EMPTY_TITLE",
                message: "Title or name must be provided and not empty"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const convo = await prisma.conversation.findFirst({ 
            where: { id: id.trim(), userId } 
        });
        
        if (!convo) {
            return new Response(JSON.stringify({ 
                error: "NOT_FOUND",
                message: "Conversation not found or unauthorized"
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updated = await prisma.conversation.update({
            where: { id: id.trim() },
            data: { title: titleField.trim() },
        });

        return Response.json({ 
            conversation: updated,
            message: "Conversation renamed successfully"
        });
    } catch (e: unknown) {
        // Check if it's an authentication error
        if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
            return new Response(JSON.stringify({ 
                error: 'UNAUTHENTICATED',
                message: 'Authentication required'
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const msg = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ 
            error: 'INTERNAL_ERROR',
            message: msg
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
