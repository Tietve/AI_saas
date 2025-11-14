/**
 * useDocumentUpload Hook
 *
 * React Query mutation hook for uploading documents with progress tracking
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import type { UploadProgress } from '../types/document.types';

interface UploadOptions {
  file: File;
  title?: string;
}

export const useDocumentUpload = (onProgress?: (progress: UploadProgress) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: UploadOptions) =>
      documentApi.upload(file, title, onProgress),
    onSuccess: () => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error('Upload failed:', error);
      // Error handling can be extended here
    },
  });
};
