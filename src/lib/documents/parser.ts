/**
 * Document Parser - Extract text from various document formats
 * Supports: PDF, Word (.docx), Excel (.xlsx), Text
 */

import { promises as fs } from 'fs'

// Dynamic imports for CommonJS modules
const pdfParse = require('pdf-parse')
const xlsx = require('xlsx')
const mammoth = require('mammoth')

export interface ParsedDocument {
    text: string
    metadata?: {
        pageCount?: number
        wordCount?: number
        sheetNames?: string[]
        [key: string]: any
    }
}

/**
 * Parse PDF file and extract text
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const data = await pdfParse(buffer)
        return {
            text: data.text,
            metadata: {
                pageCount: data.numpages,
                wordCount: data.text.split(/\s+/).length
            }
        }
    } catch (error) {
        console.error('[PDF Parser] Error:', error)
        throw new Error('Failed to parse PDF file')
    }
}

/**
 * Parse Word (.docx) file and extract text
 */
export async function parseWord(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const result = await mammoth.extractRawText({ buffer })
        return {
            text: result.value,
            metadata: {
                wordCount: result.value.split(/\s+/).length
            }
        }
    } catch (error) {
        console.error('[Word Parser] Error:', error)
        throw new Error('Failed to parse Word file')
    }
}

/**
 * Parse Excel (.xlsx) file and extract text from all sheets
 */
export async function parseExcel(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const workbook = xlsx.read(buffer, { type: 'buffer' })
        const sheetNames = workbook.SheetNames

        let allText = ''
        const sheetData: any[] = []

        for (const sheetName of sheetNames) {
            const worksheet = workbook.Sheets[sheetName]
            const csvText = xlsx.utils.sheet_to_csv(worksheet)
            allText += `\n--- Sheet: ${sheetName} ---\n${csvText}\n`

            // Also get JSON format for structured data
            const jsonData = xlsx.utils.sheet_to_json(worksheet)
            sheetData.push({ sheetName, data: jsonData })
        }

        return {
            text: allText.trim(),
            metadata: {
                sheetNames,
                sheetCount: sheetNames.length,
                sheetData: sheetData.slice(0, 3) // Only include first 3 sheets' data
            }
        }
    } catch (error) {
        console.error('[Excel Parser] Error:', error)
        throw new Error('Failed to parse Excel file')
    }
}

/**
 * Parse text file
 */
export async function parseText(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const text = buffer.toString('utf-8')
        return {
            text,
            metadata: {
                wordCount: text.split(/\s+/).length,
                lineCount: text.split('\n').length
            }
        }
    } catch (error) {
        console.error('[Text Parser] Error:', error)
        throw new Error('Failed to parse text file')
    }
}

/**
 * Main parser function - automatically detects type and parses
 */
export async function parseDocument(
    buffer: Buffer,
    mimeType: string,
    filename?: string
): Promise<ParsedDocument> {
    // Detect file type
    if (mimeType === 'application/pdf') {
        return parsePDF(buffer)
    } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
    ) {
        return parseWord(buffer)
    } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel'
    ) {
        return parseExcel(buffer)
    } else if (mimeType === 'text/plain') {
        return parseText(buffer)
    } else {
        throw new Error(`Unsupported file type: ${mimeType}`)
    }
}

/**
 * Parse document from file path
 */
export async function parseDocumentFromPath(
    filePath: string,
    mimeType: string
): Promise<ParsedDocument> {
    try {
        const buffer = await fs.readFile(filePath)
        return parseDocument(buffer, mimeType)
    } catch (error) {
        console.error('[Parser] Error reading file:', error)
        throw new Error('Failed to read document file')
    }
}

/**
 * Truncate text to maximum length (for API limits)
 */
export function truncateText(text: string, maxLength: number = 50000): string {
    if (text.length <= maxLength) return text

    return text.substring(0, maxLength) + '\n\n[... Text truncated due to length ...]'
}
