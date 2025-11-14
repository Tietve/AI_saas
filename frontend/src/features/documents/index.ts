/**
 * Documents Feature - Public API
 *
 * Export all public components, hooks, and types
 */

// API
export { documentApi } from './api/documentApi';

// Types
export type {
  Document,
  DocumentStatus,
  UploadProgress,
  UploadDocumentResponse,
  ListDocumentsResponse,
  GetDocumentResponse,
} from './types/document.types';

// Hooks
export { useDocuments } from './hooks/useDocuments';
export { useDocumentUpload } from './hooks/useDocumentUpload';
export { useDocumentDelete } from './hooks/useDocumentDelete';
export { useDocumentStatus } from './hooks/useDocumentStatus';

// Components
export { DocumentUploadZone } from './components/DocumentUploadZone';
export { DocumentList } from './components/DocumentList';
export { DocumentItem } from './components/DocumentItem';
export { DocumentQuotaBar } from './components/DocumentQuotaBar';
export { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
