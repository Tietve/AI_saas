/**
 * Document Service
 *
 * Main orchestrator for PDF document upload, processing, and management
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentStatus } from '@prisma/client';
import {
  Document,
  DocumentError,
  QuotaExceededError,
  UploadDocumentResponse,
  GetDocumentResponse,
  ListDocumentsRequest,
  ListDocumentsResponse,
} from '../types/document.types';
import { PdfParserService } from './pdf-parser.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';

export class DocumentService {
  private prisma: PrismaClient;
  private s3Client: S3Client;
  private pdfParser: PdfParserService;
  private chunking: ChunkingService;
  private embedding: EmbeddingService;
  private vectorStore: VectorStoreService;
  private bucketName: string;
  private maxFileSize: number;

  constructor() {
    this.prisma = new PrismaClient();

    // Initialize S3 client (Cloudflare R2)
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CF_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
      },
    });

    this.pdfParser = new PdfParserService();
    this.chunking = new ChunkingService();
    this.embedding = new EmbeddingService();
    this.vectorStore = new VectorStoreService(this.prisma);

    this.bucketName = process.env.PDF_BUCKET_NAME || 'my-saas-chat-pdfs';
    this.maxFileSize = parseInt(process.env.PDF_MAX_SIZE || '10485760', 10); // 10MB
  }

  /**
   * Upload PDF and start processing
   * @param userId User ID
   * @param file Multer file object
   * @param title Optional custom title
   * @returns Document metadata
   */
  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    title?: string
  ): Promise<UploadDocumentResponse> {
    // Validate file
    this.validateFile(file);

    // Check user quota (async, don't block upload)
    await this.checkQuota(userId);

    try {
      // Generate storage key
      const storageKey = this.generateStorageKey(userId, file.originalname);

      // Upload to R2
      await this.uploadToR2(storageKey, file.path, file.mimetype);

      // Create document record
      const document = await this.prisma.document.create({
        data: {
          userId,
          title: title || this.extractTitle(file.originalname),
          fileName: file.originalname,
          contentType: file.mimetype,
          fileSize: file.size,
          storageKey,
          status: DocumentStatus.PROCESSING,
        },
      });

      // Process document in background
      this.processDocument(document.id, file.path).catch((error) => {
        console.error(`Background processing failed for document ${document.id}:`, error);
      });

      return {
        documentId: document.id,
        title: document.title,
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt.toISOString(),
      };
    } finally {
      // Clean up temp file
      await fs.unlink(file.path).catch(() => {});
    }
  }

  /**
   * Process document: extract text, chunk, generate embeddings, store vectors
   * Runs in background after upload
   */
  private async processDocument(documentId: string, filePath: string): Promise<void> {
    try {
      console.log(`Starting processing for document ${documentId}`);

      // Step 1: Parse PDF
      const parsed = await this.pdfParser.parsePdf(filePath, {
        cleanText: true,
        useFallback: true,
      });

      // Update page count
      await this.prisma.document.update({
        where: { id: documentId },
        data: { pageCount: parsed.pageCount },
      });

      console.log(`Extracted ${parsed.text.length} characters, ${parsed.pageCount} pages`);

      // Step 2: Chunk text
      const chunks = await this.chunking.chunkText(parsed.text, {
        maxTokens: 512,
        overlapPercentage: 20,
        preserveSentences: true,
      });

      console.log(`Created ${chunks.length} chunks`);

      // Step 3: Generate embeddings
      const texts = chunks.map((chunk) => chunk.content);
      const embeddingResponse = await this.embedding.generateEmbeddings(texts);

      console.log(`Generated ${embeddingResponse.embeddings.length} embeddings (${embeddingResponse.tokensUsed} tokens)`);

      // Step 4: Store chunks with embeddings
      const chunksWithEmbeddings = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddingResponse.embeddings[index],
      }));

      await this.vectorStore.insertChunks(documentId, chunksWithEmbeddings);

      // Step 5: Mark as completed
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      console.log(`✅ Document ${documentId} processed successfully`);
    } catch (error) {
      console.error(`❌ Processing failed for document ${documentId}:`, error);

      // Mark as failed
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get document by ID
   * @param documentId Document ID
   * @param userId User ID (for authorization)
   * @returns Document details
   */
  async getDocument(documentId: string, userId: string): Promise<GetDocumentResponse> {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new DocumentError('Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    // Get chunk count
    const chunksCount = await this.vectorStore.getChunkCount(documentId);

    return {
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      fileSize: document.fileSize,
      pageCount: document.pageCount,
      status: document.status,
      errorMessage: document.errorMessage,
      uploadedAt: document.uploadedAt.toISOString(),
      processedAt: document.processedAt?.toISOString() || null,
      chunksCount,
    };
  }

  /**
   * List user's documents
   * @param userId User ID
   * @param options Pagination and filter options
   * @returns List of documents
   */
  async listDocuments(
    userId: string,
    options: ListDocumentsRequest = {}
  ): Promise<ListDocumentsResponse> {
    const { limit = 20, offset = 0, status } = options;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        pageCount: doc.pageCount,
        status: doc.status,
        uploadedAt: doc.uploadedAt.toISOString(),
        processedAt: doc.processedAt?.toISOString() || null,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Delete document (soft delete)
   * @param documentId Document ID
   * @param userId User ID (for authorization)
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new DocumentError('Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    // Soft delete
    await this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Delete from R2 in background
    this.deleteFromR2(document.storageKey).catch((error) => {
      console.error(`Failed to delete from R2: ${error.message}`);
    });

    console.log(`Document ${documentId} soft deleted`);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new DocumentError(
        `File too large (max ${this.maxFileSize / 1024 / 1024}MB)`,
        'FILE_TOO_LARGE',
        400
      );
    }

    if (file.mimetype !== 'application/pdf') {
      throw new DocumentError('Only PDF files are allowed', 'INVALID_FILE_TYPE', 400);
    }
  }

  private async checkQuota(userId: string): Promise<void> {
    // Count user's documents
    const count = await this.prisma.document.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // TODO: Get quota from billing service
    const maxDocuments = 5; // Free tier limit

    if (count >= maxDocuments) {
      throw new QuotaExceededError(`PDF upload limit reached (${maxDocuments} max)`);
    }
  }

  private generateStorageKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `pdfs/${userId}/${timestamp}-${sanitized}`;
  }

  private extractTitle(fileName: string): string {
    // Remove extension and clean up
    return path.basename(fileName, path.extname(fileName)).replace(/[_-]/g, ' ').trim();
  }

  private async uploadToR2(key: string, filePath: string, contentType: string): Promise<void> {
    const fileBuffer = await fs.readFile(filePath);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    console.log(`Uploaded to R2: ${key}`);
  }

  private async deleteFromR2(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );

    console.log(`Deleted from R2: ${key}`);
  }
}
