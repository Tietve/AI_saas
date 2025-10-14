import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import * as path from 'path'
import { extractTextFromBuffer } from '@/lib/documents/textExtractor'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'NO_FILES', message: 'Không có file nào được tải lên' }, { status: 400 })
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const uploaded = []

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        continue
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const ext = path.extname(file.name)
      const safeFilename = `${timestamp}-${randomStr}${ext}`
      const filePath = path.join(UPLOAD_DIR, safeFilename)

      // Save file to disk
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // Extract text content if applicable
      // For PDF, we need to pass the file path due to pdf-parse limitations
      let extractedText: string | undefined
      if (file.type === 'application/pdf') {
        const { extractTextFromPdfFile } = await import('@/lib/documents/textExtractor')
        extractedText = await extractTextFromPdfFile(filePath)
      } else {
        extractedText = await extractTextFromBuffer(buffer, file.type)
      }

      // Create file URL
      const fileUrl = `/uploads/${safeFilename}`

      uploaded.push({
        id: `${timestamp}-${randomStr}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
        kind: file.type.startsWith('image/') ? 'image' : 'file',
        meta: {
          name: file.name,
          mimeType: file.type,
          ...(extractedText && { extractedText: extractedText.slice(0, 10000) })
        }
      })

      console.log('[Upload] File processed:', {
        name: file.name,
        hasText: !!extractedText,
        textLength: extractedText?.length || 0
      })
    }

    return NextResponse.json({
      success: true,
      message: `Đã tải lên ${uploaded.length} file`,
      attachments: uploaded
    })

  } catch (error) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: 'Lỗi hệ thống khi tải file lên'
    }, { status: 500 })
  }
}
