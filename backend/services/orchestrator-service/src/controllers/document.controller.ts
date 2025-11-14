import { Request, Response } from 'express';
import multer from 'multer';
import { embeddingService } from '../services/embedding.service';
import { vectorStoreService } from '../services/vector-store.service';
import { pdfParserService } from '../services/pdf-parser.service';
import { chunkingService } from '../services/chunking.service';
import logger from '../config/logger.config';
import { sentryService } from '../services/sentry.service';
import { VectorDocument } from '../types/vector.types';
import { PrismaClient, DocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export interface UploadDocumentRequest {
  documents: {
    content: string;
    title?: string;
    category?: string;
    tags?: string[];
    source?: string;
    language?: string;
    [key: string]: any;
  }[];
  userId?: string;
}

export class DocumentController {
  /**
   * Get multer middleware for file upload
   */
  public getUploadMiddleware() {
    return upload.single('file');
  }

  /**
   * Upload and process PDF document
   * POST /api/documents/upload
   */
  public async uploadPDF(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validation
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No PDF file provided. Please upload a PDF file',
          },
        });
        return;
      }

      const userId = req.body.userId || 'anonymous';
      const title = req.body.title || req.file.originalname.replace('.pdf', '');

      logger.info(`[Documents] Starting PDF upload for user ${userId}: ${req.file.originalname}`);

      // Validate PDF
      if (!pdfParserService.validatePDF(req.file.buffer)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PDF',
            message: 'Invalid PDF file format',
          },
        });
        return;
      }

      // Create Document record with PROCESSING status
      const document = await prisma.document.create({
        data: {
          userId,
          title,
          fileName: req.file.originalname,
          contentType: req.file.mimetype,
          fileSize: req.file.size,
          status: DocumentStatus.PROCESSING,
        },
      });

      logger.info(`[Documents] Created document record: ${document.id}`);

      // Process PDF asynchronously (don't wait for Pinecone)
      this.processPDFAsync(document.id, req.file.buffer).catch((error) => {
        logger.error(`[Documents] Async PDF processing failed for ${document.id}:`, error);
      });

      // Return immediately with PROCESSING status
      res.json({
        success: true,
        data: {
          id: document.id,
          title: document.title,
          fileName: document.fileName,
          fileSize: document.fileSize,
          status: document.status,
          uploadedAt: document.uploadedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error('[Documents] PDF upload failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'uploadPDF',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload PDF',
        },
      });
    }
  }

  /**
   * Process PDF asynchronously
   * @private
   */
  private async processPDFAsync(documentId: string, buffer: Buffer): Promise<void> {
    try {
      logger.info(`[Documents] Processing PDF ${documentId}...`);

      // 1. Extract text from PDF
      const pdfData = await pdfParserService.parsePDF(buffer);
      logger.info(`[Documents] Extracted ${pdfData.text.length} chars from ${pdfData.pageCount} pages`);

      // 2. Chunk text
      const chunks = chunkingService.chunkText(pdfData.text);
      const chunkStats = chunkingService.getChunkStats(chunks);
      logger.info(`[Documents] Created ${chunks.length} chunks (avg ${chunkStats.avgTokens} tokens)`);

      // 3. Generate embeddings
      const texts = chunks.map((chunk) => chunk.content);
      const embeddingResult = await embeddingService.embedBatch(texts);
      logger.info(`[Documents] Generated ${embeddingResult.embeddings.length} embeddings`);

      // 4. Try to store in Pinecone (optional, non-blocking)
      let pineconeIds: string[] = [];
      try {
        const vectorDocuments: VectorDocument[] = chunks.map((chunk, i) => ({
          id: `doc-${documentId}-chunk-${i}`,
          embedding: embeddingResult.embeddings[i].embedding,
          metadata: {
            content: chunk.content,
            documentId,
            chunkIndex: chunk.index,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenEstimate: chunk.tokenEstimate,
          },
        }));

        const result = await vectorStoreService.upsert(vectorDocuments);
        pineconeIds = result.ids;
        logger.info(`[Documents] Stored ${pineconeIds.length} vectors in Pinecone`);
      } catch (pineconeError) {
        logger.warn(`[Documents] Pinecone storage failed (non-blocking): ${pineconeError}`);
      }

      // 5. Update document record to COMPLETED
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.COMPLETED,
          processedAt: new Date(),
          pageCount: pdfData.pageCount,
          chunksCount: chunks.length,
          pineconeIds,
        },
      });

      const duration = Date.now() - Date.now();
      logger.info(`[Documents] Successfully processed document ${documentId} in ${duration}ms`);
    } catch (error) {
      logger.error(`[Documents] PDF processing failed for ${documentId}:`, error);

      // Update document record to FAILED
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Legacy upload method for JSON documents to Pinecone
   * POST /api/documents/upload-json
   * @deprecated Use uploadPDF instead
   */
  public async upload(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { documents, userId } = req.body as UploadDocumentRequest;

      // Validation
      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'documents array is required and must not be empty',
          },
        });
        return;
      }

      // Validate each document has content
      for (const doc of documents) {
        if (!doc.content || typeof doc.content !== 'string' || doc.content.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DOCUMENT',
              message: 'Each document must have a non-empty content field',
            },
          });
          return;
        }
      }

      logger.info(`[Documents] Uploading ${documents.length} documents${userId ? ` for user ${userId}` : ''}`);

      // Generate embeddings
      const texts = documents.map((doc) => doc.content);
      const embeddingResult = await embeddingService.embedBatch(texts);

      // Create vector documents
      const vectorDocuments: VectorDocument[] = documents.map((doc, i) => ({
        id: `doc-${Date.now()}-${i}`,
        embedding: embeddingResult.embeddings[i].embedding,
        metadata: {
          content: doc.content, // Required by RAG
          title: doc.title || `Document ${i + 1}`,
          category: doc.category || 'general',
          tags: doc.tags || [],
          source: doc.source || 'api-upload',
          language: doc.language || 'general',
          createdAt: new Date().toISOString(),
          userId: userId || null,
          // Include any additional metadata fields
          ...Object.keys(doc)
            .filter((key) => !['content', 'title', 'category', 'tags', 'source', 'language'].includes(key))
            .reduce((acc, key) => ({ ...acc, [key]: doc[key] }), {}),
        },
      }));

      // Upsert to Pinecone
      const result = await vectorStoreService.upsert(vectorDocuments);

      const duration = Date.now() - startTime;

      logger.info(
        `[Documents] Uploaded ${result.upsertedCount} documents in ${duration}ms (${embeddingResult.totalTokens} tokens)`
      );

      res.json({
        success: true,
        data: {
          uploadedCount: result.upsertedCount,
          ids: result.ids,
          totalTokens: embeddingResult.totalTokens,
          cacheHits: embeddingResult.cacheHits,
          cacheMisses: embeddingResult.cacheMisses,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('[Documents] Upload failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'upload',
        userId: req.body.userId,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload documents',
        },
      });
    }
  }

  /**
   * Get index statistics
   * GET /api/documents/stats
   */
  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Try to get Pinecone stats, but don't fail if unavailable
      try {
        const stats = await vectorStoreService.getStats();
        logger.info('[Documents] Retrieved index stats from Pinecone');
        res.json({
          success: true,
          data: stats,
        });
      } catch (pineconeError) {
        logger.warn('[Documents] Pinecone unavailable, returning empty stats:', pineconeError);
        res.json({
          success: true,
          data: {
            totalVectors: 0,
            dimension: 1536,
            indexFullness: 0,
            pineconeAvailable: false,
          },
        });
      }
    } catch (error) {
      logger.error('[Documents] Get stats failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'getStats',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to retrieve index statistics',
        },
      });
    }
  }

  /**
   * Delete documents by IDs
   * DELETE /api/documents
   */
  public async deleteByIds(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ids array is required and must not be empty',
          },
        });
        return;
      }

      logger.info(`[Documents] Deleting ${ids.length} documents`);

      await vectorStoreService.delete(ids);

      res.json({
        success: true,
        data: {
          deletedCount: ids.length,
        },
      });
    } catch (error) {
      logger.error('[Documents] Delete failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'deleteByIds',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete documents',
        },
      });
    }
  }

  /**
   * Delete documents by filter
   * DELETE /api/documents/filter
   */
  public async deleteByFilter(req: Request, res: Response): Promise<void> {
    try {
      const { filter } = req.body;

      if (!filter || typeof filter !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'filter object is required',
          },
        });
        return;
      }

      logger.info('[Documents] Deleting documents by filter:', filter);

      await vectorStoreService.deleteByFilter(filter);

      res.json({
        success: true,
        message: 'Documents deleted successfully',
      });
    } catch (error) {
      logger.error('[Documents] Delete by filter failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'deleteByFilter',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete documents',
        },
      });
    }
  }

  /**
   * Fetch documents by IDs
   * POST /api/documents/fetch
   */
  public async fetch(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ids array is required and must not be empty',
          },
        });
        return;
      }

      logger.info(`[Documents] Fetching ${ids.length} documents`);

      const documents = await vectorStoreService.fetch(ids);

      // Convert Map to array
      const documentsArray = Array.from(documents.values()).map((doc) => ({
        id: doc.id,
        metadata: doc.metadata,
      }));

      res.json({
        success: true,
        data: {
          documents: documentsArray,
          count: documentsArray.length,
        },
      });
    } catch (error) {
      logger.error('[Documents] Fetch failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'fetch',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch documents',
        },
      });
    }
  }

  /**
   * Search documents by semantic similarity
   * POST /api/documents/search
   */
  public async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, topK = 5, filter, userId } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'query string is required',
          },
        });
        return;
      }

      logger.info(`[Documents] Searching for: "${query.substring(0, 50)}..."`);

      // Build filter with userId if provided
      const searchFilter = filter || {};
      if (userId) {
        searchFilter.userId = userId;
      }

      // Try semantic search, but don't fail if Pinecone unavailable
      try {
        const results = await vectorStoreService.semanticSearch(query, embeddingService, {
          topK,
          filter: Object.keys(searchFilter).length > 0 ? searchFilter : undefined,
        });

        res.json({
          success: true,
          data: {
            results: results.map((r) => ({
              id: r.id,
              score: r.score,
              title: r.metadata.title,
              content: r.metadata.content,
              category: r.metadata.category,
              tags: r.metadata.tags,
              source: r.metadata.source,
            })),
            count: results.length,
          },
        });
      } catch (pineconeError) {
        logger.warn('[Documents] Pinecone search unavailable, returning empty results:', pineconeError);
        res.json({
          success: true,
          data: {
            results: [],
            count: 0,
            pineconeAvailable: false,
          },
        });
      }
    } catch (error) {
      logger.error('[Documents] Search failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'search',
        userId: req.body.userId,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search documents',
        },
      });
    }
  }

  /**
   * List all documents for a user
   * GET /api/documents
   */
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'userId query parameter is required',
          },
        });
        return;
      }

      logger.info(`[Documents] Listing documents for user ${userId}`);

      const documents = await prisma.document.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          title: true,
          fileName: true,
          fileSize: true,
          contentType: true,
          status: true,
          uploadedAt: true,
          processedAt: true,
          pageCount: true,
          chunksCount: true,
          errorMessage: true,
        },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      logger.error('[Documents] List failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'list',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: 'Failed to list documents',
        },
      });
    }
  }

  /**
   * Get a single document by ID
   * GET /api/documents/:id
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'userId query parameter is required',
          },
        });
        return;
      }

      logger.info(`[Documents] Getting document ${id} for user ${userId}`);

      const document = await prisma.document.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!document) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      logger.error('[Documents] Get by ID failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'getById',
        documentId: req.params.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_FAILED',
          message: 'Failed to get document',
        },
      });
    }
  }

  /**
   * Delete a document by ID
   * DELETE /api/documents/:id
   */
  public async deleteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'userId query parameter is required',
          },
        });
        return;
      }

      logger.info(`[Documents] Deleting document ${id} for user ${userId}`);

      // First, verify the document exists and belongs to the user
      const document = await prisma.document.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!document) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        });
        return;
      }

      // Delete from database
      await prisma.document.delete({
        where: { id },
      });

      // Try to delete from Pinecone (optional, don't fail if Pinecone fails)
      if (document.pineconeIds && document.pineconeIds.length > 0) {
        try {
          await vectorStoreService.delete(document.pineconeIds);
          logger.info(`[Documents] Deleted ${document.pineconeIds.length} vectors from Pinecone`);
        } catch (pineconeError) {
          logger.warn('[Documents] Failed to delete from Pinecone (non-blocking):', pineconeError);
        }
      }

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      logger.error('[Documents] Delete failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'deleteById',
        documentId: req.params.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete document',
        },
      });
    }
  }

  /**
   * Query document with Q&A
   * POST /api/documents/:id/query
   */
  public async query(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { query, userId } = req.body;

      // Validation
      if (!userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'userId is required',
          },
        });
        return;
      }

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_QUERY',
            message: 'query string is required',
          },
        });
        return;
      }

      logger.info(`[Documents] Q&A query for document ${id}: "${query.substring(0, 50)}..."`);

      // 1. Verify document exists and belongs to user
      const document = await prisma.document.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!document) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        });
        return;
      }

      // Check if document is processed
      if (document.status !== DocumentStatus.COMPLETED) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_READY',
            message: `Document is not ready for Q&A. Current status: ${document.status}`,
          },
        });
        return;
      }

      // Check if document has Pinecone vectors
      if (!document.pineconeIds || document.pineconeIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_VECTORS',
            message: 'Document has no searchable content (Pinecone vectors missing)',
          },
        });
        return;
      }

      // 2. Generate query embedding
      const embeddingResult = await embeddingService.embedBatch([query]);
      const queryEmbedding = embeddingResult.embeddings[0].embedding;

      // 3. Search Pinecone for relevant chunks (filtered by documentId)
      try {
        const searchResults = await vectorStoreService.search(queryEmbedding, {
          topK: 5,
          filter: {
            documentId: id,
          },
        });

        // Format results
        const chunks = searchResults.map((result) => ({
          id: result.id,
          content: result.metadata.content,
          score: result.score,
          metadata: {
            chunkIndex: result.metadata.chunkIndex,
            tokenEstimate: result.metadata.tokenEstimate,
            startChar: result.metadata.startChar,
            endChar: result.metadata.endChar,
          },
        }));

        logger.info(`[Documents] Found ${chunks.length} relevant chunks for query`);

        res.json({
          success: true,
          data: {
            query,
            documentId: id,
            documentTitle: document.title,
            chunks,
            note: 'OpenAI chat completion not implemented yet - showing relevant chunks from vector search',
          },
        });
      } catch (pineconeError) {
        logger.error('[Documents] Pinecone search failed:', pineconeError);
        res.status(503).json({
          success: false,
          error: {
            code: 'SEARCH_UNAVAILABLE',
            message: 'Pinecone vector search is currently unavailable. Please try again later.',
          },
        });
      }
    } catch (error) {
      logger.error('[Documents] Q&A query failed:', error);
      sentryService.captureException(error as Error, {
        component: 'document-controller',
        operation: 'query',
        documentId: req.params.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to process Q&A query',
        },
      });
    }
  }
}

// Export singleton instance
export const documentController = new DocumentController();
