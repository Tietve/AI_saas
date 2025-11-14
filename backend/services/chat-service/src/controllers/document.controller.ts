/**
 * Document Controller
 *
 * HTTP handlers for document upload, management, and RAG queries
 */

import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { RagService } from '../services/rag.service';
import {
  DocumentError,
  QuotaExceededError,
  RagQueryRequest,
} from '../types/document.types';

export class DocumentController {
  private documentService: DocumentService;
  private ragService: RagService;

  constructor() {
    this.documentService = new DocumentService();
    this.ragService = new RagService();
  }

  /**
   * POST /api/documents/upload
   * Upload PDF document
   */
  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        });
        return;
      }

      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: { message: 'No file uploaded', code: 'NO_FILE' },
        });
        return;
      }

      const title = req.body.title as string | undefined;

      const result = await this.documentService.uploadDocument(userId, file, title);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /api/documents
   * List user's documents
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as any;

      const result = await this.documentService.listDocuments(userId, {
        limit,
        offset,
        status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /api/documents/:id
   * Get document by ID
   */
  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        });
        return;
      }

      const documentId = req.params.id;

      const result = await this.documentService.getDocument(documentId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * DELETE /api/documents/:id
   * Delete document
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        });
        return;
      }

      const documentId = req.params.id;

      await this.documentService.deleteDocument(documentId, userId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Document deleted successfully',
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /api/documents/query
   * Query documents with RAG
   */
  query = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        });
        return;
      }

      const { query, documentId, topK, stream } = req.body as RagQueryRequest;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'Query is required', code: 'INVALID_QUERY' },
        });
        return;
      }

      // Handle streaming response
      if (stream) {
        await this.queryStream(req, res);
        return;
      }

      // Regular (non-streaming) response
      const result = await this.ragService.query(query, {
        userId,
        documentId,
        topK,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /api/documents/query (with stream=true)
   * Query documents with SSE streaming
   */
  queryStream = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { query, documentId, topK } = req.body as RagQueryRequest;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Stream RAG response
      const stream = this.ragService.streamQuery(query, {
        userId,
        documentId,
        topK,
      });

      for await (const chunk of stream) {
        // Send SSE event
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.end();
    } catch (error) {
      // Send error as SSE event
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`
      );
      res.end();
    }
  };

  /**
   * Error handler
   */
  private handleError(error: unknown, res: Response): void {
    console.error('Document controller error:', error);

    if (error instanceof QuotaExceededError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      return;
    }

    if (error instanceof DocumentError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      return;
    }

    // Unknown error
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
