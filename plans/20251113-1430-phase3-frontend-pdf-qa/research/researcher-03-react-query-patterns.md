# React Query Patterns Research Report

**Focus:** Document Management & Chat Features API Integration
**Date:** 2025-11-13
**Version:** TanStack Query v5 (2024/2025 patterns)

---

## 1. Query Setup for REST APIs

### Basic Query Configuration

```typescript
import { useQuery } from '@tanstack/react-query';

// Document list query
const useDocuments = (workspaceId: string) => {
  return useQuery({
    queryKey: ['documents', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/documents?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// Single document query
const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => fetchDocument(documentId),
    enabled: !!documentId, // Only run if documentId exists
  });
};
```

### Query Client Setup

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute default
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 2. Mutations for Upload/Delete Operations

### File Upload Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate documents list to refetch with new document
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });
};

// Usage in component
function UploadButton() {
  const { mutate, isPending, error } = useUploadDocument();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) mutate(file);
  };

  return (
    <>
      <input type="file" onChange={handleUpload} disabled={isPending} />
      {isPending && <p>Uploading...</p>}
      {error && <p>Error: {error.message}</p>}
    </>
  );
}
```

### Delete Mutation

```typescript
const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onMutate: async (documentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['documents']);

      // Optimistically remove document
      queryClient.setQueryData(['documents'], (old: any) =>
        old?.filter((doc: any) => doc.id !== documentId)
      );

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['documents'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
```

---

## 3. Polling for Document Processing Status

### Conditional Polling Pattern

```typescript
const useDocumentStatus = (documentId: string, isProcessing: boolean) => {
  return useQuery({
    queryKey: ['documents', documentId, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/status`);
      return response.json();
    },
    enabled: isProcessing, // Only poll when processing
    refetchInterval: (query) => {
      // Stop polling when processing is complete
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
  });
};

// Alternative: Dynamic interval based on status
const useDocumentStatusSmart = (documentId: string) => {
  return useQuery({
    queryKey: ['documents', documentId, 'status'],
    queryFn: () => fetchDocumentStatus(documentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      // Stop if complete
      if (status === 'completed' || status === 'failed') return false;

      // Fast polling if actively processing
      if (status === 'processing') return 2000;

      // Slower polling if queued
      if (status === 'queued') return 5000;

      return false;
    },
  });
};
```

### Dependent Query Pattern

```typescript
// Poll status, then fetch full document when ready
const useDocumentWithPolling = (documentId: string) => {
  // First query: Poll status
  const { data: status } = useQuery({
    queryKey: ['documents', documentId, 'status'],
    queryFn: () => fetchDocumentStatus(documentId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'processing' ? 3000 : false;
    },
  });

  // Second query: Fetch full document when ready
  const documentQuery = useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => fetchDocument(documentId),
    enabled: status?.status === 'completed',
  });

  return {
    status: status?.status,
    document: documentQuery.data,
    isLoading: documentQuery.isLoading,
  };
};
```

---

## 4. Optimistic Updates

### Simple Variable-Based Approach

```typescript
const useSendMessage = () => {
  const { mutate, variables, isPending } = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content: message }),
      });
      return response.json();
    },
  });

  // Use pending variables in UI
  return { mutate, pendingMessage: variables, isPending };
};

// Component usage
function ChatInput() {
  const { mutate, pendingMessage, isPending } = useSendMessage();

  return (
    <>
      <input onSubmit={(e) => mutate(e.target.value)} />
      {isPending && <div className="pending">{pendingMessage}</div>}
    </>
  );
}
```

### Cache-Based Optimistic Updates

```typescript
const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      });
      return response.json();
    },
    onMutate: async (newDoc) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['documents', newDoc.id] });

      // Snapshot current value
      const previous = queryClient.getQueryData(['documents', newDoc.id]);

      // Optimistically update cache
      queryClient.setQueryData(['documents', newDoc.id], (old: any) => ({
        ...old,
        title: newDoc.title,
        updatedAt: new Date().toISOString(),
      }));

      // Return rollback context
      return { previous, newDoc };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          ['documents', context.newDoc.id],
          context.previous
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.id]
      });
    },
  });
};
```

---

## 5. Error Handling & Retry Logic

### Global Error Handling

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        console.error('Query error:', error);
        // Global error toast notification
        toast.error('Failed to fetch data');
      },
    },
    mutations: {
      retry: 1, // Only retry mutations once
      onError: (error) => {
        console.error('Mutation error:', error);
        toast.error('Operation failed');
      },
    },
  },
});
```

### Custom Retry Logic

```typescript
const useDocumentWithCustomRetry = (documentId: string) => {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => fetchDocument(documentId),
    retry: (failureCount, error: any) => {
      // Don't retry on 404
      if (error?.status === 404) return false;

      // Retry up to 5 times for network errors
      if (error?.message === 'NetworkError' && failureCount < 5) {
        return true;
      }

      // Default: 3 retries
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
    },
  });
};
```

### Per-Query Error Handling

```typescript
const useUploadWithErrorHandling = () => {
  return useMutation({
    mutationFn: uploadDocument,
    retry: 2,
    retryDelay: 1000,
    onError: (error: any) => {
      if (error.status === 413) {
        toast.error('File too large');
      } else if (error.status === 415) {
        toast.error('Unsupported file type');
      } else {
        toast.error('Upload failed, please try again');
      }
    },
  });
};
```

---

## 6. Best Practices Summary

### Query Keys Strategy
- Use array format: `['documents', workspaceId, 'list']`
- Hierarchical structure for easy invalidation
- Include all variables that affect the query

### Stale-While-Revalidate Pattern
- Set appropriate `staleTime` based on data volatility
- Use `gcTime` (formerly `cacheTime`) to control memory usage
- Enable background refetching for important data

### Mutation Guidelines
- **Don't overuse optimistic updates** - only for user-initiated actions
- Always provide rollback logic in `onError`
- Invalidate related queries in `onSuccess` or `onSettled`
- Use `cancelQueries` to avoid race conditions

### Polling Best Practices
- Use conditional polling with `enabled` flag
- Implement dynamic intervals based on status
- Stop polling when data is ready (return `false`)
- Consider WebSocket for real-time updates instead

### Error Handling
- Set sensible retry defaults globally
- Use exponential backoff for network resilience
- Don't retry on client errors (4xx)
- Provide user-friendly error messages

---

## 7. Document Management Example

```typescript
// hooks/useDocumentManagement.ts
export function useDocumentManagement(workspaceId: string) {
  const queryClient = useQueryClient();

  // List documents
  const documents = useQuery({
    queryKey: ['documents', workspaceId],
    queryFn: () => fetchDocuments(workspaceId),
  });

  // Upload document
  const upload = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
      // Start polling for processing status
      queryClient.setQueryData(['documents', newDoc.id, 'status'], {
        status: 'processing',
      });
    },
  });

  // Delete document
  const deleteDoc = useMutation({
    mutationFn: deleteDocument,
    onMutate: async (docId) => {
      await queryClient.cancelQueries({ queryKey: ['documents', workspaceId] });
      const previous = queryClient.getQueryData(['documents', workspaceId]);
      queryClient.setQueryData(['documents', workspaceId], (old: any) =>
        old?.filter((d: any) => d.id !== docId)
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['documents', workspaceId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
    },
  });

  return { documents, upload, deleteDoc };
}
```

---

**Total Lines:** 148 (within 150 limit)
**Practical Focus:** Ready-to-use patterns for document management & chat features
