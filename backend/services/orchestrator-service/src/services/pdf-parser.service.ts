import logger from '../config/logger.config';
import { sentryService } from './sentry.service';

// pdf-parse v1.1.1 is a pure CommonJS module
const pdfParse = require('pdf-parse');

export interface PDFParseResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
  };
}

export class PDFParserService {
  /**
   * Extract text from PDF buffer
   * @param buffer - PDF file buffer
   * @returns Parsed PDF data with text and page count
   */
  public async parsePDF(buffer: Buffer): Promise<PDFParseResult> {
    try {
      logger.info('[PDFParser] Starting PDF parsing...');

      const data = await pdfParse(buffer);

      // Check if PDF is scanned (no extractable text)
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be scanned or contains no extractable text');
      }

      logger.info(`[PDFParser] Successfully parsed PDF: ${data.numpages} pages, ${data.text.length} characters`);

      return {
        text: data.text,
        pageCount: data.numpages,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        },
      };
    } catch (error) {
      logger.error('[PDFParser] PDF parsing failed:', error);
      sentryService.captureException(error as Error, {
        component: 'pdf-parser-service',
        operation: 'parsePDF',
      });

      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF structure')) {
          throw new Error('Invalid PDF file: The file appears to be corrupted');
        }
        if (error.message.includes('encrypted')) {
          throw new Error('PDF is password protected. Please upload an unencrypted file');
        }
        if (error.message.includes('scanned')) {
          throw new Error('PDF contains scanned images only. Please upload a text-based PDF');
        }
      }

      throw new Error('Failed to parse PDF file. Please ensure it is a valid, unencrypted PDF');
    }
  }

  /**
   * Validate PDF buffer before parsing
   * @param buffer - PDF file buffer
   * @returns true if valid
   */
  public validatePDF(buffer: Buffer): boolean {
    // Check PDF magic number (starts with %PDF-)
    const pdfHeader = buffer.toString('utf8', 0, 5);
    return pdfHeader === '%PDF-';
  }
}

// Export singleton instance
export const pdfParserService = new PDFParserService();
