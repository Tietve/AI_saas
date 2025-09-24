import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireUserId } from '@/lib/auth/session'

export const runtime = 'nodejs'

function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true })
}

export async function POST(req: NextRequest) {
    try {
        if (process.env.ENABLE_IMAGE_GENERATION && process.env.ENABLE_IMAGE_GENERATION !== 'true') {
            return json(403, { error: 'IMAGE_GENERATION_DISABLED' })
        }
        try {
            await requireUserId()
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            if (msg === 'UNAUTHORIZED') return json(401, { error: 'UNAUTHORIZED' })
            throw e
        }
        const body = await req.json()
        const prompt: string = (body?.prompt || '').toString().trim()
        const size: '256x256' | '512x512' | '1024x1024' = (body?.size || '1024x1024')
        const n: number = Math.max(1, Math.min(4, Number(body?.n) || 1))
        const requestedModel: string = (body?.model || 'gpt-image-1').toString()

        if (!prompt) return json(400, { error: 'MISSING_PROMPT' })
        if (!process.env.OPENAI_API_KEY) return json(500, { error: 'OPENAI_API_KEY missing' })

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        async function tryGenerate(model: string) {
            return await client.images.generate({
                model,
                prompt,
                n,
                size,
                response_format: 'b64_json'
            })
        }

        let result
        let usedModel = requestedModel
        try {
            result = await tryGenerate(requestedModel)
        } catch (err) {
            console.error('[images/generate] primary model failed:', err)
            // Fallback to dall-e-3 for broader compatibility
            usedModel = 'dall-e-3'
            result = await tryGenerate(usedModel)
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        await ensureDir(uploadDir)

        const attachments: Array<{ id: string; kind: 'image'; url: string; meta: any }> = []

        for (let i = 0; i < (result.data?.length || 0); i++) {
            const img = result.data[i]
            const b64 = (img as any).b64_json as string | undefined
            if (!b64) continue
            const id = randomUUID()
            const fileName = `${id}.png`
            const filePath = path.join(uploadDir, fileName)
            const buffer = Buffer.from(b64, 'base64')
            await fs.writeFile(filePath, buffer)
            attachments.push({
                id,
                kind: 'image',
                url: `/uploads/${fileName}`,
                meta: {
                    name: `${id}.png`,
                    size: buffer.length,
                    mimeType: 'image/png',
                    prompt,
                    model: usedModel,
                    sizeOption: size
                }
            })
        }

        return json(200, { attachments })
    } catch (e: unknown) {
        console.error('[images/generate] fatal error:', e)
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: msg })
    }
}


