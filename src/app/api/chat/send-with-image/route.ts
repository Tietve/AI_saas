import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { getUserIdFromSession } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromSession()
        if (!userId) {
            return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
        }

        const body = await req.json()
        const { conversationId, prompt, attachments, requestId } = body

        // Save the image generation as assistant message
        const imageMessage = `Tôi đã tạo ${attachments.length} ảnh theo yêu cầu "${prompt}". 

Dưới đây là kết quả:
- Kích thước: ${attachments[0]?.meta?.sizeOption || '1024x1024'}
- Model sử dụng: ${attachments[0]?.meta?.model || 'DALL-E'}

Bạn có thể tải ảnh về hoặc yêu cầu tôi chỉnh sửa prompt để tạo ảnh khác nếu chưa hài lòng.`

        // Save assistant message with attachments
        const assistantMsg = await prisma.message.create({
            data: {
                conversationId,
                role: Role.ASSISTANT,
                content: imageMessage,
                idempotencyKey: requestId
            }
        })

        // Save attachments
        if (attachments?.length > 0) {
            await prisma.attachment.createMany({
                data: attachments.map((att: any) => ({
                    conversationId,
                    messageId: assistantMsg.id,
                    kind: att.kind,
                    url: att.url,
                    meta: att.meta
                }))
            })
        }

        return NextResponse.json({
            success: true,
            message: imageMessage,
            attachments
        })
    } catch (error) {
        console.error('Error saving image message:', error)
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
    }
}