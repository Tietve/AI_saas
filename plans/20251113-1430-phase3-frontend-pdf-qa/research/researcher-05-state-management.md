# State Management Architecture for PDF Q&A Feature

## Executive Summary

**Recommendation:** Hybrid approach combining **Zustand (local UI state)** + **TanStack Query (server state)** + **useState (component state)**

Current architecture already uses this pattern effectively. Extend existing patterns for PDF Q&A feature.

---

## 1. Current State Management Audit

### Existing Architecture

```typescript
// Already in use:
- TanStack Query v5 (server state, caching, mutations)
- Zustand (global UI state, persistence)
- useState/useRef (component-local state)
```

### Current Patterns Analysis

**TanStack Query:**
- ✅ 5min staleTime, 10min gcTime
- ✅ Retry limit: 1 attempt
- ✅ Disabled auto-refetch (performance optimized)
- ✅ Query invalidation for data freshness

**Zustand Stores:**
- `themeStore`: Theme/dark mode with persistence
- `chatStore`: Active conversation, model selection, sidebar state
- Uses `persist` middleware for localStorage
- Partialize strategy for selective persistence

**Component State:**
- `useStreamingChat`: Local streaming state with RAF optimization
- Optimistic updates with ref-based result tracking
- Performance: Batched updates (~60fps instead of 100+ renders)

---

## 2. State Management Decision Matrix

### Local State (Component-Level)

**Use `useState` when:**
- ❌ Form input values (ephemeral, no sharing)
- ❌ UI toggles (collapse/expand, modal visibility)
- ❌ Temporary animations/transitions
- ✅ Upload progress tracking (temporary, single-use)
- ✅ File validation errors (temporary)

**Best for:** Ephemeral data, no cross-component sharing needed

### Global UI State (Zustand)

**Use Zustand when:**
- ✅ Selected document ID (shared across components)
- ✅ PDF viewer state (zoom level, page number)
- ✅ Q&A mode toggle (enabled/disabled)
- ✅ Document panel collapsed/expanded
- ✅ UI preferences (persist to localStorage)

**Best for:** Shared UI state, user preferences, cross-component coordination

### Server State (TanStack Query)

**Use TanStack Query when:**
- ✅ Document list fetching
- ✅ Document upload mutations
- ✅ Document deletion
- ✅ Q&A query mutations (ask question → get answer)
- ✅ Message history with document context
- ✅ Document metadata/stats

**Best for:** Backend data, caching, synchronization, optimistic updates

---

## 3. PDF Q&A State Architecture

### 3.1 Document Selection State (Zustand)

```typescript
// Extend chatStore.ts
interface ChatState {
  // Existing...
  activeConversationId: string | null;
  selectedModel: string;

  // NEW: Document state
  selectedDocumentId: string | null;
  setSelectedDocument: (id: string | null) => void;

  isDocumentPanelCollapsed: boolean;
  toggleDocumentPanel: () => void;

  // Q&A mode (when asking questions about document)
  isQAMode: boolean;
  setQAMode: (enabled: boolean) => void;

  // PDF viewer state (if implementing viewer)
  pdfZoomLevel: number;
  setPdfZoomLevel: (zoom: number) => void;
}

// Persistence strategy
persist(
  // ...
  partialize: (state) => ({
    selectedModel: state.selectedModel,
    isSidebarCollapsed: state.isSidebarCollapsed,
    isDocumentPanelCollapsed: state.isDocumentPanelCollapsed, // NEW
    pdfZoomLevel: state.pdfZoomLevel, // NEW
    // NOT persisted: selectedDocumentId (URL-based), isQAMode (session-only)
  })
)
```

**Why Zustand:**
- Shared across DocumentList, ChatInput, MessageList
- Persist user preferences (panel state, zoom)
- Simple API, no context boilerplate
- Works great with existing chatStore

### 3.2 Upload Progress State (Component-Level)

```typescript
// In DocumentUploadButton.tsx
interface UploadState {
  isUploading: boolean;
  progress: number; // 0-100
  fileName: string;
  error: string | null;
}

const [uploadState, setUploadState] = useState<UploadState>({
  isUploading: false,
  progress: 0,
  fileName: '',
  error: null,
});

// Update during upload
onUploadProgress: (progressEvent) => {
  const percentCompleted = Math.round(
    (progressEvent.loaded * 100) / progressEvent.total
  );
  setUploadState(prev => ({ ...prev, progress: percentCompleted }));
}
```

**Why useState:**
- Temporary state (only during upload)
- Single component scope
- No need to persist or share
- Automatic cleanup on unmount

### 3.3 Document List State (TanStack Query)

```typescript
// In useDocuments.ts
export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentApi.getDocuments,
    staleTime: 60 * 1000, // 1 minute (documents change less often)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentApi.uploadDocument,
    onSuccess: () => {
      // Invalidate to refetch list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      // Error handled by component (toast notification)
      console.error('Upload failed:', error);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentApi.deleteDocument,
    // Optimistic update (instant UI feedback)
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });

      const previousDocs = queryClient.getQueryData(['documents']);

      queryClient.setQueryData(['documents'], (old: any) =>
        old?.filter((doc: any) => doc.id !== documentId)
      );

      return { previousDocs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['documents'], context?.previousDocs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
```

**Why TanStack Query:**
- Automatic caching and deduplication
- Built-in loading/error states
- Optimistic updates for instant UX
- Background refetching
- Follows existing pattern in codebase

### 3.4 Chat Message History with Document Context

```typescript
// Extend useConversation to include document context
export const useConversation = (conversationId?: string) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
    select: (data) => ({
      ...data,
      // Enrich messages with document references
      messages: data.messages.map(msg => ({
        ...msg,
        documentId: msg.metadata?.documentId,
        documentName: msg.metadata?.documentName,
        relevantPages: msg.metadata?.pages,
      })),
    }),
  });
};

// NEW: Q&A mutation
export const useDocumentQA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      question,
      documentId,
      conversationId,
    }: {
      question: string;
      documentId: string;
      conversationId?: string;
    }) => chatApi.askDocumentQuestion(question, documentId, conversationId),

    onSuccess: (response) => {
      // Invalidate conversations and current conversation
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', response.conversationId],
      });
    },
  });
};
```

### 3.5 Error State Handling

**Error Boundary Patterns:**

```typescript
// Component-level error states (TanStack Query)
const { data, error, isLoading, isError } = useDocuments();

if (isError) {
  return <ErrorMessage error={error} retry={refetch} />;
}

// Global error toast (for mutations)
const uploadMutation = useUploadDocument();

const handleUpload = async (file: File) => {
  try {
    await uploadMutation.mutateAsync(file);
    toast.success('Document uploaded successfully');
  } catch (error) {
    toast.error(`Upload failed: ${error.message}`);
  }
};

// Network error recovery
queryClient.setDefaultOptions({
  queries: {
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      return failureCount < 2; // Retry twice on network errors
    },
  },
});
```

---

## 4. Zustand vs Context API

### Why Zustand (Recommended)

**Pros:**
- ✅ Already in use (consistency)
- ✅ No context provider boilerplate
- ✅ Better TypeScript inference
- ✅ Persistence middleware built-in
- ✅ Selective re-renders (no context re-render issues)
- ✅ Simpler debugging with devtools
- ✅ 3KB bundle size

**Cons:**
- ❌ External dependency (minimal concern)

### Why NOT Context API

**Cons for this use case:**
- ❌ Unnecessary re-renders (all consumers re-render)
- ❌ Boilerplate (provider, hooks, context creation)
- ❌ No built-in persistence
- ❌ Harder to debug
- ❌ Not currently used in project (inconsistency)

**When Context is better:**
- Rarely changing data (theme, i18n)
- Already using for auth (one-time login state)

**Decision:** Stick with Zustand for consistency and performance.

---

## 5. Performance Optimizations

### 5.1 Batched State Updates (Streaming)

```typescript
// Already implemented in useStreamingChat
let rafId: number | null = null;
let pendingUpdate = false;

onChunk: (content: string) => {
  fullContent += content;

  if (!pendingUpdate) {
    pendingUpdate = true;
    rafId = requestAnimationFrame(() => {
      setStreamingState(prev => ({ ...prev, streamingContent: fullContent }));
      pendingUpdate = false;
    });
  }
}
```

**Apply to:** Document upload progress, PDF page rendering

### 5.2 Query Deduplication

```typescript
// Multiple components requesting same document list
// TanStack Query automatically deduplicates
const { data } = useDocuments(); // Component A
const { data } = useDocuments(); // Component B
// Result: Only ONE network request
```

### 5.3 Selective Persistence

```typescript
// Only persist user preferences, not runtime state
partialize: (state) => ({
  // PERSIST
  isSidebarCollapsed: state.isSidebarCollapsed,
  pdfZoomLevel: state.pdfZoomLevel,

  // DO NOT PERSIST (URL-based or session-only)
  // selectedDocumentId: state.selectedDocumentId,
  // activeConversationId: state.activeConversationId,
})
```

### 5.4 Optimistic Updates

```typescript
// Delete document: instant UI update, rollback on error
onMutate: async (documentId) => {
  await queryClient.cancelQueries({ queryKey: ['documents'] });

  const previousDocs = queryClient.getQueryData(['documents']);

  queryClient.setQueryData(['documents'], (old) =>
    old?.filter(doc => doc.id !== documentId)
  );

  return { previousDocs };
}
```

---

## 6. Recommended State Structure

### File Organization

```
frontend/src/features/documents/
├── store/
│   └── documentStore.ts          # Zustand (UI state only)
├── hooks/
│   ├── useDocuments.ts            # TanStack Query (server state)
│   ├── useDocumentQA.ts           # Q&A mutations
│   └── useDocumentUpload.ts       # Upload with progress
├── components/
│   ├── DocumentList.tsx           # Uses useDocuments + documentStore
│   ├── DocumentUploadButton.tsx   # Uses useDocumentUpload + local state
│   └── DocumentQAInput.tsx        # Uses useDocumentQA + chatStore
```

### State Ownership

| State | Storage | Reason |
|-------|---------|--------|
| Document list | TanStack Query | Server data, caching |
| Selected document ID | Zustand | Shared UI state |
| Upload progress | useState | Temporary, component-only |
| Q&A history | TanStack Query | Server data, cached |
| PDF zoom level | Zustand | User preference, persist |
| Document panel collapsed | Zustand | User preference, persist |
| Error messages | useState | Temporary, component-only |
| Q&A mode toggle | Zustand | Shared UI state |

---

## 7. Implementation Checklist

### Phase 1: Extend Existing Stores
- [ ] Add document fields to `chatStore.ts`
- [ ] Implement `documentStore.ts` (if needed for complex PDF viewer state)
- [ ] Update persistence partialize config

### Phase 2: Server State Hooks
- [ ] Create `useDocuments()` hook
- [ ] Create `useUploadDocument()` mutation
- [ ] Create `useDeleteDocument()` mutation
- [ ] Create `useDocumentQA()` mutation

### Phase 3: Component State
- [ ] Upload progress in `DocumentUploadButton`
- [ ] Validation errors in upload form
- [ ] Temporary UI feedback states

### Phase 4: Error Handling
- [ ] Global error toast for mutations
- [ ] Query error boundaries
- [ ] Network retry strategy
- [ ] Offline state detection

---

## 8. Anti-Patterns to Avoid

❌ **DON'T:**
- Store server data in Zustand (use TanStack Query)
- Put everything in global state (use local state when possible)
- Manually invalidate queries everywhere (use onSuccess callbacks)
- Persist temporary state (upload progress, errors)
- Use Context for frequently updating UI state

✅ **DO:**
- Follow existing patterns in codebase
- Use TanStack Query for all server data
- Use Zustand for shared UI state only
- Keep upload progress in component state
- Implement optimistic updates for better UX

---

## Conclusion

**Architecture:** Zustand + TanStack Query + useState (hybrid)

**Rationale:**
1. **Consistency:** Matches existing codebase patterns
2. **Performance:** Optimized for React rendering
3. **Developer Experience:** Simple, maintainable, type-safe
4. **User Experience:** Fast, responsive, offline-capable

**Next Steps:**
1. Extend `chatStore` with document-related fields
2. Create `useDocuments` hooks following `useConversations` pattern
3. Implement upload component with local progress state
4. Add Q&A mutations with conversation integration
