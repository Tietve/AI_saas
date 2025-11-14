/**
 * useDocuments Hook
 *
 * React Query hook for fetching document list
 */

import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentApi.getAll,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
