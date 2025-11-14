/**
 * Document Types
 *
 * Type definitions for PDF document management
 */

export interface Document {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  pageCount: number | null;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
  chunksCount?: number;
}

export type DocumentStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UploadDocumentResponse {
  documentId: string;
  title: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface ListDocumentsResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetDocumentResponse {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  chunksCount: number;
}
