/**
 * useDocumentDelete Hook
 *
 * React Query mutation hook for deleting documents with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import type { Document } from '../types/document.types';

export const useDocumentDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentApi.delete,
    // Optimistic update - remove document from list immediately
    onMutate: async (documentId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] });

      // Snapshot previous value
      const previousDocs = queryClient.getQueryData<Document[]>(['documents']);

      // Optimistically update to new value
      queryClient.setQueryData<Document[]>(['documents'], (old) =>
        old?.filter((doc) => doc.id !== documentId) ?? []
      );

      // Return context with previous value
      return { previousDocs };
    },
    // Rollback on error
    onError: (err, _variables, context) => {
      console.error('Delete failed, rolling back:', err);
      if (context?.previousDocs) {
        queryClient.setQueryData(['documents'], context.previousDocs);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
