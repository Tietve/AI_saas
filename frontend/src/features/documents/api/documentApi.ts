/**
 * Document API Client
 *
 * API functions for document upload, list, get, and delete operations
 */

import { apiClient } from '@/shared/api/client';
import type {
  Document,
  UploadProgress,
  UploadDocumentResponse,
  ListDocumentsResponse,
  GetDocumentResponse,
} from '../types/document.types';

export const documentApi = {
  /**
   * Upload a PDF document
   */
  upload: async (
    file: File,
    title?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await apiClient.post<{ success: boolean; data: UploadDocumentResponse }>(
      '/documents/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              percent: Math.round((progressEvent.loaded * 100) / progressEvent.total),
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            });
          }
        },
      }
    );

    return response.data.data;
  },

  /**
   * Get all documents for current user
   */
  getAll: async (): Promise<Document[]> => {
    const response = await apiClient.get<{ success: boolean; data: ListDocumentsResponse }>(
      '/documents'
    );
    return response.data.data.documents;
  },

  /**
   * Get a single document by ID
   */
  getById: async (id: string): Promise<GetDocumentResponse> => {
    const response = await apiClient.get<{ success: boolean; data: GetDocumentResponse }>(
      `/documents/${id}`
    );
    return response.data.data;
  },

  /**
   * Delete a document
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
