/**
 * PDF Parser Service
 *
 * Extracts text from PDF files using pdf-parse (primary) with pdfjs-dist fallback
 */

import * as fs from 'fs/promises';
import { ParsedPdf, PdfParsingError, PdfParserOptions } from '../types/document.types';
import { TextCleaner } from '../utils/text-cleaner';

export class PdfParserService {
  /**
   * Parse PDF file and extract text
   * @param filePath Absolute path to PDF file
   * @param options Parser options
   * @returns Parsed PDF with text and metadata
   */
  async parsePdf(filePath: string, options: PdfParserOptions = {}): Promise<ParsedPdf> {
    try {
      // Read PDF file as buffer
      const buffer = await fs.readFile(filePath);

      // Validate PDF magic bytes (25 50 44 46 = %PDF)
      if (!this.isPdfFile(buffer)) {
        throw new PdfParsingError('Invalid PDF file: Missing PDF signature');
      }

      // Try primary parser (pdf-parse)
      try {
        return await this.extractWithPdfParse(buffer, options);
      } catch (primaryError) {
        console.warn('pdf-parse failed, trying fallback:', primaryError);

        // Try fallback parser if enabled
        if (options.useFallback) {
          return await this.extractWithPdfjsDist(buffer, options);
        }

        throw primaryError;
      }
    } catch (error) {
      if (error instanceof PdfParsingError) {
        throw error;
      }

      throw new PdfParsingError(
        `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract text using pdf-parse (fast, primary parser)
   */
  private async extractWithPdfParse(
    buffer: Buffer,
    options: PdfParserOptions
  ): Promise<ParsedPdf> {
    try {
      // Dynamic import for pdf-parse v2 (CommonJS module)
      const pdfParseModule: any = await import('pdf-parse');
      const PDFParseClass = pdfParseModule.PDFParse;
      const parser = new PDFParseClass({ data: buffer });
      const result = await parser.getText();
      const info = await parser.getInfo();
      await parser.destroy();

      let text = result.text;

      // Clean text if requested
      if (options.cleanText !== false) {
        text = TextCleaner.fullClean(text);
      }

      return {
        text,
        pageCount: result.numpages,
        metadata: {
          title: info?.Title,
          author: info?.Author,
          creationDate: info?.CreationDate
            ? this.parsePdfDate(info.CreationDate)
            : undefined,
        },
      };
    } catch (error) {
      throw new PdfParsingError(
        `pdf-parse extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract text using pdfjs-dist (fallback, slower but more robust)
   */
  private async extractWithPdfjsDist(
    buffer: Buffer,
    options: PdfParserOptions
  ): Promise<ParsedPdf> {
    // Note: pdfjs-dist requires dynamic import in Node.js
    // This is a placeholder - actual implementation would need pdfjs-dist setup
    throw new PdfParsingError('pdfjs-dist fallback not implemented yet');

    // Future implementation:
    // const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    // const loadingTask = pdfjsLib.getDocument({ data: buffer });
    // const pdf = await loadingTask.promise;
    // ... extract text page by page
  }

  /**
   * Check if buffer is a valid PDF file (magic bytes)
   */
  private isPdfFile(buffer: Buffer): boolean {
    // PDF files start with %PDF (25 50 44 46 in hex)
    if (buffer.length < 4) return false;

    return (
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46    // F
    );
  }

  /**
   * Parse PDF date string (D:YYYYMMDDHHmmSS format)
   * Example: D:20231115103045+00'00'
   */
  private parsePdfDate(dateString: string): Date | undefined {
    try {
      // Remove 'D:' prefix if present
      const cleaned = dateString.replace(/^D:/, '');

      // Extract components
      const year = parseInt(cleaned.substring(0, 4), 10);
      const month = parseInt(cleaned.substring(4, 6), 10) - 1; // 0-indexed
      const day = parseInt(cleaned.substring(6, 8), 10);
      const hour = parseInt(cleaned.substring(8, 10), 10) || 0;
      const minute = parseInt(cleaned.substring(10, 12), 10) || 0;
      const second = parseInt(cleaned.substring(12, 14), 10) || 0;

      const date = new Date(year, month, day, hour, minute, second);

      // Validate date
      if (isNaN(date.getTime())) {
        return undefined;
      }

      return date;
    } catch {
      return undefined;
    }
  }

  /**
   * Get PDF metadata without extracting full text (fast)
   */
  async getMetadata(filePath: string): Promise<{ pageCount: number; metadata?: any }> {
    try {
      const buffer = await fs.readFile(filePath);

      if (!this.isPdfFile(buffer)) {
        throw new PdfParsingError('Invalid PDF file');
      }

      const pdfParseModule: any = await import('pdf-parse');
      const PDFParseClass = pdfParseModule.PDFParse;
      const parser = new PDFParseClass({ data: buffer });
      const result = await parser.getText({ partial: [] }); // Don't extract text from any page
      const info = await parser.getInfo();
      await parser.destroy();

      return {
        pageCount: result.numpages,
        metadata: info,
      };
    } catch (error) {
      throw new PdfParsingError(
        `Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate PDF file without full parsing (quick check)
   */
  async validatePdf(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const buffer = await fs.readFile(filePath);

      // Check magic bytes
      if (!this.isPdfFile(buffer)) {
        return { valid: false, error: 'Invalid PDF signature' };
      }

      // Try to parse metadata (fast)
      const pdfParseModule: any = await import('pdf-parse');
      const PDFParseClass = pdfParseModule.PDFParse;
      const parser = new PDFParseClass({ data: buffer });
      await parser.getText({ partial: [] }); // Quick validation
      await parser.destroy();

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
