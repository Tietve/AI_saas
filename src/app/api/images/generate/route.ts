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
            console.log(`[images/generate] Trying model: ${model}`)
            // DALL-E 3 doesn't support response_format, only DALL-E 2 does
            if (model === 'dall-e-3') {
                console.log('[images/generate] Using DALL-E 3 (URL response)')
                return await client.images.generate({
                    model,
                    prompt,
                    n,
                    size,
                    quality: 'standard'
                })
            } else {
                console.log('[images/generate] Using DALL-E 2 (base64 response)')
                return await client.images.generate({
                    model,
                    prompt,
                    n,
                    size,
                    response_format: 'b64_json'
                })
            }
        }

        let result
        let usedModel = requestedModel
        try {
            result = await tryGenerate(requestedModel)
        } catch (err) {
            console.error('[images/generate] primary model failed:', err)
            
            // Check if it's a content policy violation
            if (err instanceof Error && err.message.includes('safety system')) {
                return json(400, { 
                    error: 'CONTENT_POLICY_VIOLATION',
                    message: 'Your prompt contains content that violates OpenAI\'s safety guidelines. Please try a different prompt.'
                })
            }
            
            // Check if it's a response_format error
            if (err instanceof Error && err.message.includes('response_format')) {
                console.log('[images/generate] response_format error, trying DALL-E 3 fallback')
                usedModel = 'dall-e-3'
                try {
                    result = await tryGenerate(usedModel)
                } catch (fallbackErr) {
                    console.error('[images/generate] fallback also failed:', fallbackErr)
                    return json(500, { error: 'All image generation models failed' })
                }
            } else {
                // Other errors - try DALL-E 3 fallback
                usedModel = 'dall-e-3'
                try {
                    result = await tryGenerate(usedModel)
                } catch (fallbackErr) {
                    console.error('[images/generate] fallback also failed:', fallbackErr)
                    return json(500, { error: 'All image generation models failed' })
                }
            }
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        await ensureDir(uploadDir)

        const attachments: Array<{ id: string; kind: 'image'; url: string; meta: any }> = []

        if (!result.data || result.data.length === 0) {
            return json(500, { error: 'No images generated' })
        }

        for (let i = 0; i < result.data.length; i++) {
            const img = result.data[i]
            const id = randomUUID()
            const fileName = `${id}.png`
            const filePath = path.join(uploadDir, fileName)
            
            // Handle both DALL-E 2 (base64) and DALL-E 3 (URL) responses
            if ((img as any).b64_json) {
                // DALL-E 2: base64 response
                const b64 = (img as any).b64_json as string
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
            } else if ((img as any).url) {
                // DALL-E 3: URL response - download and save locally
                const imageUrl = (img as any).url as string
                try {
                    const response = await fetch(imageUrl)
                    const buffer = Buffer.from(await response.arrayBuffer())
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
                            sizeOption: size,
                            originalUrl: imageUrl
                        }
                    })
                } catch (downloadError) {
                    console.error(`Failed to download image ${i}:`, downloadError)
                    // Fallback: use the original URL directly
                    attachments.push({
                        id,
                        kind: 'image',
                        url: imageUrl,
                        meta: {
                            name: `${id}.png`,
                            size: 0,
                            mimeType: 'image/png',
                            prompt,
                            model: usedModel,
                            sizeOption: size,
                            isExternal: true
                        }
                    })
                }
            }
        }

        console.log(`[images/generate] Generated ${attachments.length} images for prompt: "${prompt}"`)
        return json(200, { attachments })
    } catch (e: unknown) {
        console.error('[images/generate] fatal error:', e)
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: msg })
    }
}


