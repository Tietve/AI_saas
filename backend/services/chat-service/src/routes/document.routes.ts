/**
 * Document Routes
 *
 * API routes for PDF document upload, management, and RAG queries
 */

import express from 'express';
import { DocumentController } from '../controllers/document.controller';
import { uploadMiddleware, handleUploadError } from '../middleware/upload.middleware';
import { quotaMiddleware } from '../middleware/quota.middleware';
// Assuming auth middleware exists
// import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const controller = new DocumentController();

// Note: All routes should be protected with authMiddleware
// router.use(authMiddleware);

/**
 * POST /api/documents/upload
 * Upload PDF document
 *
 * Body (multipart/form-data):
 * - file: PDF file (required, max 10MB)
 * - title: Custom title (optional)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     documentId: string,
 *     title: string,
 *     fileName: string,
 *     fileSize: number,
 *     status: 'PROCESSING',
 *     uploadedAt: string
 *   }
 * }
 */
router.post(
  '/upload',
  quotaMiddleware,
  uploadMiddleware.single('file'),
  handleUploadError,
  controller.upload
);

/**
 * GET /api/documents
 * List user's documents
 *
 * Query params:
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * - status: 'PROCESSING' | 'COMPLETED' | 'FAILED' (optional)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     documents: Array<{...}>,
 *     total: number,
 *     limit: number,
 *     offset: number
 *   }
 * }
 */
router.get('/', controller.list);

/**
 * GET /api/documents/:id
 * Get document by ID
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     title: string,
 *     fileName: string,
 *     fileSize: number,
 *     pageCount: number | null,
 *     status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
 *     errorMessage: string | null,
 *     uploadedAt: string,
 *     processedAt: string | null,
 *     chunksCount: number
 *   }
 * }
 */
router.get('/:id', controller.get);

/**
 * DELETE /api/documents/:id
 * Delete document (soft delete)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     message: 'Document deleted successfully'
 *   }
 * }
 */
router.delete('/:id', controller.delete);

/**
 * POST /api/documents/query
 * Query documents with RAG
 *
 * Body:
 * {
 *   query: string,
 *   documentId?: string,  // Optional: search specific document
 *   topK?: number,         // Default: 5, max: 10
 *   stream?: boolean       // Enable SSE streaming (default: false)
 * }
 *
 * Response (non-streaming):
 * {
 *   success: true,
 *   data: {
 *     answer: string,
 *     sources: Array<{
 *       documentId: string,
 *       documentTitle: string,
 *       chunkIndex: number,
 *       pageNumber: number | null,
 *       similarity: number,
 *       excerpt: string
 *     }>,
 *     tokensUsed: {
 *       prompt: number,
 *       completion: number,
 *       total: number
 *     }
 *   }
 * }
 *
 * Response (streaming):
 * Server-Sent Events:
 * - data: {"type": "sources", "sources": [...]}
 * - data: {"type": "chunk", "content": "..."}
 * - data: {"type": "done", "tokensUsed": {...}}
 */
router.post('/query', controller.query);

export default router;
