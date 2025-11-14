import { Router } from 'express';
import { documentController } from '../controllers/document.controller';

const router = Router();

/**
 * Document Management Routes
 * Base path: /api/documents
 */

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload PDF document for processing and Q&A
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload (max 10MB)
 *               title:
 *                 type: string
 *                 description: Document title (optional, defaults to filename)
 *               userId:
 *                 type: string
 *                 description: User ID (optional, defaults to anonymous)
 *     responses:
 *       200:
 *         description: PDF uploaded successfully (processing started)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [PROCESSING]
 *                     uploadedAt:
 *                       type: string
 *       400:
 *         description: Invalid input (no file, wrong format, etc.)
 *       500:
 *         description: Server error
 */
router.post('/upload', documentController.getUploadMiddleware(), (req, res) =>
  documentController.uploadPDF(req, res)
);

/**
 * @swagger
 * /api/documents/upload-json:
 *   post:
 *     summary: Legacy - Upload JSON documents to Pinecone
 *     tags: [Documents]
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documents
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - content
 *                   properties:
 *                     content:
 *                       type: string
 *                       description: Document content (required for RAG)
 *                     title:
 *                       type: string
 *                       description: Document title
 *                     category:
 *                       type: string
 *                       description: Document category
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Document tags
 *                     source:
 *                       type: string
 *                       description: Source of document
 *                     language:
 *                       type: string
 *                       description: Programming language or content language
 *               userId:
 *                 type: string
 *                 description: User ID for multi-tenant RAG
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/upload-json', (req, res) => documentController.upload(req, res));

/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     summary: Get Pinecone index statistics
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Index statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVectors:
 *                       type: number
 *                     dimension:
 *                       type: number
 *                     indexFullness:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/stats', (req, res) => documentController.getStats(req, res));

/**
 * @swagger
 * /api/documents/search:
 *   post:
 *     summary: Search documents by semantic similarity
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               topK:
 *                 type: number
 *                 description: Number of results to return (default 5)
 *               filter:
 *                 type: object
 *                 description: Metadata filter
 *               userId:
 *                 type: string
 *                 description: Filter by user ID
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/search', (req, res) => documentController.search(req, res));

/**
 * @swagger
 * /api/documents/fetch:
 *   post:
 *     summary: Fetch documents by IDs
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs
 *     responses:
 *       200:
 *         description: Documents fetched successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/fetch', (req, res) => documentController.fetch(req, res));

/**
 * @swagger
 * /api/documents:
 *   delete:
 *     summary: Delete documents by IDs
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to delete
 *     responses:
 *       200:
 *         description: Documents deleted successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.delete('/', (req, res) => documentController.deleteByIds(req, res));

/**
 * @swagger
 * /api/documents/filter:
 *   delete:
 *     summary: Delete documents by metadata filter
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filter
 *             properties:
 *               filter:
 *                 type: object
 *                 description: Metadata filter for deletion
 *                 example: { "category": "outdated" }
 *     responses:
 *       200:
 *         description: Documents deleted successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.delete('/filter', (req, res) => documentController.deleteByFilter(req, res));

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List all documents for a user
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to filter documents
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing userId parameter
 *       500:
 *         description: Server error
 */
router.get('/', (req, res) => documentController.list(req, res));

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a single document by ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for authorization
 *     responses:
 *       200:
 *         description: Document details
 *       400:
 *         description: Missing userId parameter
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id', (req, res) => documentController.getById(req, res));

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document by ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for authorization
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       400:
 *         description: Missing userId parameter
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', (req, res) => documentController.deleteById(req, res));

/**
 * @swagger
 * /api/documents/{id}/query:
 *   post:
 *     summary: Query document with Q&A (returns relevant chunks)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - userId
 *             properties:
 *               query:
 *                 type: string
 *                 description: Question to ask about the document
 *               userId:
 *                 type: string
 *                 description: User ID for authorization
 *     responses:
 *       200:
 *         description: Query successful, relevant chunks returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:
 *                       type: string
 *                     documentId:
 *                       type: string
 *                     documentTitle:
 *                       type: string
 *                     chunks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           score:
 *                             type: number
 *                           metadata:
 *                             type: object
 *                     note:
 *                       type: string
 *       400:
 *         description: Invalid input or document not ready
 *       404:
 *         description: Document not found
 *       503:
 *         description: Pinecone search unavailable
 *       500:
 *         description: Server error
 */
router.post('/:id/query', (req, res) => documentController.query(req, res));

export default router;
