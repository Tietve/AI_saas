/**
 * useDocumentStatus Hook
 *
 * React Query hook with conditional polling for document processing status
 */

import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import type { GetDocumentResponse } from '../types/document.types';

interface UseDocumentStatusOptions {
  enabled?: boolean;
  pollingEnabled?: boolean;
}

export const useDocumentStatus = (
  documentId: string,
  options: UseDocumentStatusOptions = {}
) => {
  const { enabled = true, pollingEnabled = true } = options;

  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => documentApi.getById(documentId),
    enabled,
    refetchInterval: (query) => {
      if (!pollingEnabled) return false;

      const data = query.state.data as GetDocumentResponse | undefined;
      // Stop polling when processing is complete
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      // Poll every 3 seconds while PROCESSING
      return 3000;
    },
    // Don't retry failed status checks
    retry: false,
  });
};
