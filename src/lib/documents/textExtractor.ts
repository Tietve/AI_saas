export async function extractTextFromPdfFile(filePath: string): Promise<string | undefined> {
  try {
    console.log('[TextExtractor] Extracting PDF from file:', filePath)
    const fs = require('fs')
    const pdfParse = require('pdf-parse')

    // Read file into buffer
    const dataBuffer = fs.readFileSync(filePath)
    console.log('[TextExtractor] PDF file loaded, size:', dataBuffer.length)

    // Parse PDF with pdf-parse first (faster for text PDFs)
    const data = await pdfParse(dataBuffer)
    console.log('[TextExtractor] PDF extracted:', data.text.length, 'chars')

    // Check if we got meaningful text
    if (!data.text || data.text.trim().length < 50) {
      console.log('[TextExtractor] PDF has little/no text - trying OCR...')

      // Try OCR with external service
      const ocrText = await extractTextWithOCR(filePath, dataBuffer)
      if (ocrText && ocrText.length > 10) {
        console.log('[TextExtractor] OCR extracted:', ocrText.length, 'chars')
        return ocrText
      }

      console.log('[TextExtractor] OCR failed or returned no text')
      return undefined
    }

    return data.text.trim()
  } catch (error: any) {
    console.error('[TextExtractor] PDF file parse error:', error.message)
    return undefined
  }
}

async function extractTextWithOCR(pdfPath: string, pdfBuffer: Buffer): Promise<string | undefined> {
  try {
    console.log('[OCR] Starting OCR for PDF:', pdfPath)

    // Use OCR.space API (free tier: 25,000 requests/month)
    const FormData = require('form-data')
    const fetch = require('node-fetch')

    const form = new FormData()
    form.append('file', pdfBuffer, {
      filename: 'document.pdf',
      contentType: 'application/pdf'
    })
    form.append('language', 'eng')
    form.append('isOverlayRequired', 'false')
    form.append('detectOrientation', 'true')
    form.append('scale', 'true')
    form.append('OCREngine', '2')

    const OCR_API_KEY = process.env.OCR_SPACE_API_KEY || 'K87899142388957' // Free API key

    console.log('[OCR] Sending to OCR.space API...')

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_API_KEY
      },
      body: form
    })

    const result = await response.json()

    if (result.IsErroredOnProcessing) {
      console.error('[OCR] Error:', result.ErrorMessage?.[0] || 'Unknown error')
      return undefined
    }

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const texts = result.ParsedResults
        .map((page: any) => page.ParsedText)
        .filter((text: string) => text && text.trim().length > 0)

      if (texts.length > 0) {
        const fullText = texts.join('\n\n--- Page Break ---\n\n')
        console.log('[OCR] Successfully extracted:', fullText.length, 'chars from', texts.length, 'pages')
        return fullText
      }
    }

    console.log('[OCR] No text extracted')
    return undefined

  } catch (error: any) {
    console.error('[OCR] Error:', error.message)
    return undefined
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string | undefined> {
  try {
    if (mimeType === 'application/pdf') {
      console.log('[TextExtractor] PDF from buffer - skipping (use file path instead)')
      return undefined
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('[TextExtractor] Extracting DOCX...')
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      console.log('[TextExtractor] DOCX extracted:', result.value.length, 'chars')
      return result.value.trim()
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log('[TextExtractor] Extracting XLSX...')
      const XLSX = require('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheets: string[] = []
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName]
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        if (csv.trim()) {
          sheets.push(`Sheet: ${sheetName}\n${csv}`)
        }
      })
      const text = sheets.join('\n\n')
      console.log('[TextExtractor] XLSX extracted:', text.length, 'chars')
      return text
    }

    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      console.log('[TextExtractor] Reading text file...')
      const text = buffer.toString('utf-8')
      console.log('[TextExtractor] Text file read:', text.length, 'chars')
      return text
    }

    console.log('[TextExtractor] Unsupported mime type:', mimeType)
    return undefined
  } catch (error) {
    console.error('[TextExtractor] Error extracting text:', error)
    return undefined
  }
}
