import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { assetManager } from '@/lib/cdn/asset-manager'
import { performanceMonitor } from '@/lib/monitoring/performance'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function getKind(mimeType: string | undefined) {
    if (!mimeType) return 'file'
    return mimeType.startsWith('image/') ? 'image' : 'file'
}

async function ensureUploadDir() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

export async function POST(request: Request) {
    return performanceMonitor.measureApi('/api/upload', 'POST', async () => {
        try {
            const formData = await request.formData()
            const files = formData.getAll('files').filter((item): item is File => item instanceof File)

            if (!files.length) {
                return NextResponse.json({ error: 'NO_FILES' }, { status: 400 })
            }

            const tooLarge = files.find(file => file.size > MAX_FILE_SIZE)
            if (tooLarge) {
                return NextResponse.json(
                    { error: 'FILE_TOO_LARGE', message: 'Mỗi tệp chỉ được tối đa 10MB.' },
                    { status: 400 }
                )
            }

            await ensureUploadDir()

            const attachments = []

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const ext = path.extname(file.name) || ''
                const id = randomUUID()
                const fileName = ext ? `${id}${ext}` : id

                // Try CDN upload first, fallback to local
                let uploadResult
                try {
                    uploadResult = await assetManager.uploadFile(
                        buffer,
                        fileName,
                        {
                            quality: 85,
                            format: 'auto'
                        }
                    )
                } catch (error) {
                    console.warn('[Upload] CDN upload failed, using local:', error)
                    // Fallback to local storage
                    const filePath = path.join(UPLOAD_DIR, fileName)
                    await fs.writeFile(filePath, buffer)
                    uploadResult = {
                        url: `/uploads/${fileName}`,
                        size: file.size
                    }
                }

                attachments.push({
                    id,
                    kind: getKind(file.type),
                    url: uploadResult.url,
                    meta: {
                        name: file.name,
                        size: file.size,
                        mimeType: file.type || undefined,
                        cdnOptimized: uploadResult.url !== `/uploads/${fileName}`,
                        ...(uploadResult.publicId && { publicId: uploadResult.publicId }),
                        ...(uploadResult.width && { width: uploadResult.width }),
                        ...(uploadResult.height && { height: uploadResult.height }),
                    }
                })
            }

            return NextResponse.json({ attachments })
        } catch (error) {
            console.error('[Upload API] Error:', error)
            return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
        }
    })
}
