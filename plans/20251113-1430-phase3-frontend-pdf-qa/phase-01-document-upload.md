# Phase 1: Document Upload & Management

**Parent Plan:** [plan.md](./plan.md)
**Dependencies:** Backend API (Phase 1), RAG System (Phase 2)
**Duration:** 4-6 hours
**Priority:** High

---

## Context Links

**Research Reports:**
- [PDF Upload Patterns](./research/researcher-01-pdf-upload-patterns.md) - react-dropzone implementation
- [React Query Patterns](./research/researcher-03-react-query-patterns.md) - Mutations, polling, optimistic updates
- [State Management](./research/researcher-05-state-management.md) - Zustand + React Query architecture

**Scout Report:**
- [Frontend Structure](./scout/scout-01-frontend-structure.md) - FSD architecture, existing patterns

---

## Overview

**Date:** 2025-11-13
**Description:** Implement PDF upload with drag-drop, document list management, real-time processing status, quota display, and delete functionality.

**Implementation Status:** Not Started
**Review Status:** Not Reviewed

---

## Key Insights from Research

### React Dropzone (researcher-01)
- **Library:** react-dropzone v14+ (TypeScript-native, 20KB gzipped)
- **Features:** Built-in file validation, rejection handling, drag-drop states
- **Integration:** Use with Axios for upload progress tracking

### React Query Patterns (researcher-03)
- **Polling:** Conditional polling with `refetchInterval` for processing status
- **Mutations:** `useMutation` with `onSuccess` invalidation for upload/delete
- **Optimistic Updates:** Instant UI feedback for delete operations

### State Management (researcher-05)
- **Architecture:** Zustand (UI state) + React Query (server state) + useState (component state)
- **Upload Progress:** Component-level useState (temporary, not shared)
- **Document Selection:** Zustand store (shared across components)
- **Document List:** React Query (server data with caching)

---

## Requirements

### Functional Requirements

1. **PDF Upload**
   - Drag-and-drop interface
   - Click to browse alternative
   - Multi-file upload (up to quota limit)
   - File validation (PDF only, max 10MB per file)
   - Upload progress bar (0-100%)
   - Error handling (quota exceeded, invalid file, network errors)

2. **Document List**
   - Display all uploaded documents
   - Show status: PROCESSING, COMPLETED, FAILED
   - Real-time status updates (polling every 3s during PROCESSING)
   - Document metadata (name, size, upload date, page count)
   - Empty state when no documents

3. **Quota Display**
   - Visual quota bar (X / 5 documents)
   - Warning at 80% (4/5 documents)
   - Disabled upload at 100% (5/5 documents)
   - Clear messaging about limits

4. **Delete Functionality**
   - Delete button per document
   - Confirmation dialog
   - Optimistic UI update (instant removal)
   - Rollback on error
   - Invalidate queries after deletion

### Non-Functional Requirements

- **Performance:** Upload progress updates at 60fps max (RAF batching)
- **Type Safety:** Strict TypeScript, no `any` types
- **Accessibility:** Keyboard navigation, ARIA labels, screen reader support
- **Responsive:** Mobile-friendly design (tablets, phones)
- **Error Recovery:** Retry failed uploads, clear error messages
- **UX:** Smooth animations, loading states, feedback toasts

---

## Architecture

### Component Structure (Feature-Sliced Design)

```
frontend/src/features/documents/
├── api/
│   └── documentApi.ts              # Axios API client
├── hooks/
│   ├── useDocuments.ts             # React Query: GET documents
│   ├── useDocumentUpload.ts        # React Query: POST upload
│   ├── useDocumentDelete.ts        # React Query: DELETE document
│   └── useDocumentStatus.ts        # React Query: Polling for status
├── store/
│   └── documentStore.ts            # Zustand: UI state (optional, if needed)
├── components/
│   ├── DocumentUploadZone.tsx      # Drag-drop area (react-dropzone)
│   ├── DocumentList.tsx            # List of documents
│   ├── DocumentItem.tsx            # Single document card
│   ├── DocumentQuotaBar.tsx        # Quota visualization
│   ├── UploadProgressBar.tsx       # Progress indicator
│   └── DeleteConfirmDialog.tsx     # MUI Dialog for confirmation
├── types/
│   └── document.types.ts           # TypeScript interfaces
└── index.ts                        # Public exports
```

### State Management

**React Query (Server State):**
- `useDocuments()` - Fetch document list (staleTime: 1min)
- `useDocumentUpload()` - Upload mutation with progress
- `useDocumentDelete()` - Delete mutation with optimistic update
- `useDocumentStatus(id)` - Conditional polling for PROCESSING status

**Component State (useState):**
- Upload progress (0-100%)
- Drag-over state (boolean)
- Validation errors (string[])
- Delete confirmation dialog open state

**Zustand (Optional, if needed):**
- Selected document ID (if extending existing chatStore)

### API Integration

**Base URL:** `/api/documents`

**Endpoints:**
1. `POST /upload` - Upload PDF (multipart/form-data)
2. `GET /` - List all documents
3. `GET /:id` - Get single document details
4. `DELETE /:id` - Delete document

**Request/Response Types:**

```typescript
// Upload Request
interface UploadRequest {
  file: File; // FormData key: 'file'
}

// Upload Response
interface UploadResponse {
  id: string;
  filename: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
}

// Document List Response
interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

// Document Status Response
interface DocumentStatus {
  id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  errorMessage: string | null;
}
```

---

## Related Code Files

### Existing Patterns to Follow

**Chat Store (Zustand):**
- `frontend/src/entities/chat/model/chatStore.ts` - Extend for document selection

**API Client Pattern:**
- `frontend/src/shared/api/client.ts` - Base Axios instance with auth

**React Query Setup:**
- `frontend/src/app/providers.tsx` - QueryClientProvider config

**MUI Components:**
- `frontend/src/shared/ui/` - Reusable UI components (Button, Card, Dialog, etc.)

**Routing:**
- `frontend/src/app/router.tsx` - Add `/documents` route

---

## Implementation Steps

### Step 1: Setup Feature Structure (30 min)

**Files to Create:**
```
frontend/src/features/documents/
├── api/documentApi.ts
├── types/document.types.ts
└── index.ts
```

**Tasks:**
1. Create FSD folder structure: `features/documents/`
2. Define TypeScript types in `document.types.ts`
3. Create API client in `documentApi.ts` using existing Axios instance
4. Export public API in `index.ts`

**Code Scaffold:**

```typescript
// types/document.types.ts
export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export type DocumentStatus = Document['status'];
```

```typescript
// api/documentApi.ts
import { apiClient } from '@/shared/api/client';
import type { Document, UploadProgress } from '../types/document.types';

export const documentApi = {
  upload: async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Document>('/documents/upload', formData, {
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
    });

    return response.data;
  },

  getAll: async (): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/documents');
    return response.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await apiClient.get<Document>(`/documents/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
```

### Step 2: React Query Hooks (45 min)

**Files to Create:**
```
frontend/src/features/documents/hooks/
├── useDocuments.ts
├── useDocumentUpload.ts
├── useDocumentDelete.ts
└── useDocumentStatus.ts
```

**Code Scaffold:**

```typescript
// hooks/useDocuments.ts
import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentApi.getAll,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

```typescript
// hooks/useDocumentUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import type { UploadProgress } from '../types/document.types';

export const useDocumentUpload = (
  onProgress?: (progress: UploadProgress) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => documentApi.upload(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
```

```typescript
// hooks/useDocumentDelete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import type { Document } from '../types/document.types';

export const useDocumentDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentApi.delete,
    // Optimistic update
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });

      const previousDocs = queryClient.getQueryData<Document[]>(['documents']);

      queryClient.setQueryData<Document[]>(['documents'], (old) =>
        old?.filter((doc) => doc.id !== documentId) ?? []
      );

      return { previousDocs };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousDocs) {
        queryClient.setQueryData(['documents'], context.previousDocs);
      }
    },
    // Refetch after settled
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
```

```typescript
// hooks/useDocumentStatus.ts
import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import type { Document } from '../types/document.types';

export const useDocumentStatus = (documentId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => documentApi.getById(documentId),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data as Document | undefined;
      // Stop polling when processing is complete
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      return 3000; // Poll every 3 seconds while PROCESSING
    },
  });
};
```

### Step 3: UI Components - Upload Zone (60 min)

**File:** `frontend/src/features/documents/components/DocumentUploadZone.tsx`

**Dependencies:** `npm install react-dropzone`

**Key Features:**
- Drag-drop with visual feedback
- File validation (PDF only, max 10MB)
- Multi-file support (respecting quota)
- Upload progress per file

**Code Scaffold:**

```typescript
import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import type { UploadProgress } from '../types/document.types';

interface UploadState {
  fileName: string;
  progress: number;
  isUploading: boolean;
  error: string | null;
}

interface DocumentUploadZoneProps {
  currentDocumentCount: number;
  maxDocuments?: number;
  onUploadComplete?: () => void;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  currentDocumentCount,
  maxDocuments = 5,
  onUploadComplete,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    fileName: '',
    progress: 0,
    isUploading: false,
    error: null,
  });

  const isQuotaReached = currentDocumentCount >= maxDocuments;

  const uploadMutation = useDocumentUpload((progress: UploadProgress) => {
    setUploadState((prev) => ({ ...prev, progress: progress.percent }));
  });

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejections
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((r) =>
          r.errors.map((e) => e.message).join(', ')
        );
        setUploadState({
          fileName: '',
          progress: 0,
          isUploading: false,
          error: errors.join('; '),
        });
        return;
      }

      // Check quota
      if (currentDocumentCount + acceptedFiles.length > maxDocuments) {
        setUploadState({
          fileName: '',
          progress: 0,
          isUploading: false,
          error: `Maximum ${maxDocuments} documents allowed. You have ${currentDocumentCount}.`,
        });
        return;
      }

      // Upload first file (can extend to batch upload)
      const file = acceptedFiles[0];
      setUploadState({
        fileName: file.name,
        progress: 0,
        isUploading: true,
        error: null,
      });

      uploadMutation.mutate(file, {
        onSuccess: () => {
          setUploadState({
            fileName: '',
            progress: 0,
            isUploading: false,
            error: null,
          });
          onUploadComplete?.();
        },
        onError: (error: any) => {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: error.response?.data?.message || 'Upload failed',
          }));
        },
      });
    },
    [currentDocumentCount, maxDocuments, uploadMutation, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: maxDocuments - currentDocumentCount,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isQuotaReached || uploadState.isUploading,
  });

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          padding: 4,
          textAlign: 'center',
          cursor: isQuotaReached ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.2s',
          opacity: isQuotaReached || uploadState.isUploading ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6">
          {isDragActive
            ? 'Drop PDF files here...'
            : isQuotaReached
            ? 'Document quota reached'
            : 'Drag & drop PDFs or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          PDF files only, max 10MB per file
        </Typography>
      </Box>

      {uploadState.isUploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading: {uploadState.fileName}
          </Typography>
          <LinearProgress variant="determinate" value={uploadState.progress} />
          <Typography variant="caption" color="text.secondary">
            {uploadState.progress}%
          </Typography>
        </Box>
      )}

      {uploadState.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadState.error}
        </Alert>
      )}
    </Box>
  );
};
```

### Step 4: UI Components - Document List (60 min)

**Files:**
- `DocumentList.tsx` - Container with polling logic
- `DocumentItem.tsx` - Individual document card
- `DocumentQuotaBar.tsx` - Quota visualization

**Code Scaffold:**

```typescript
// components/DocumentList.tsx
import React from 'react';
import { Box, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentItem } from './DocumentItem';
import { DocumentQuotaBar } from './DocumentQuotaBar';

export const DocumentList: React.FC = () => {
  const { data: documents, isLoading, error, refetch } = useDocuments();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<button onClick={() => refetch()}>Retry</button>}>
        Failed to load documents
      </Alert>
    );
  }

  return (
    <Box>
      <DocumentQuotaBar current={documents?.length ?? 0} max={5} />

      {documents?.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="body1" color="text.secondary">
            No documents uploaded yet
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {documents?.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <DocumentItem document={doc} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
```

```typescript
// components/DocumentItem.tsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { Delete, PictureAsPdf, CheckCircle, Error } from '@mui/icons-material';
import { useDocumentDelete } from '../hooks/useDocumentDelete';
import { useDocumentStatus } from '../hooks/useDocumentStatus';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Document } from '../types/document.types';

interface DocumentItemProps {
  document: Document;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({ document: initialDoc }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useDocumentDelete();

  // Poll status if document is processing
  const { data: latestDoc } = useDocumentStatus(
    initialDoc.id,
    initialDoc.status === 'PROCESSING'
  );

  const document = latestDoc ?? initialDoc;

  const handleDelete = () => {
    deleteMutation.mutate(document.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  const getStatusChip = () => {
    switch (document.status) {
      case 'PROCESSING':
        return (
          <Chip
            icon={<CircularProgress size={16} />}
            label="Processing"
            size="small"
            color="info"
          />
        );
      case 'COMPLETED':
        return (
          <Chip icon={<CheckCircle />} label="Ready" size="small" color="success" />
        );
      case 'FAILED':
        return <Chip icon={<Error />} label="Failed" size="small" color="error" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PictureAsPdf color="error" />
            <Typography variant="h6" noWrap title={document.originalName}>
              {document.originalName}
            </Typography>
          </Box>

          {getStatusChip()}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {document.pageCount ? `${document.pageCount} pages` : 'Processing...'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB
          </Typography>
        </CardContent>

        <CardActions>
          <IconButton
            size="small"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Delete />
          </IconButton>
        </CardActions>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        documentName={document.originalName}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
```

```typescript
// components/DocumentQuotaBar.tsx
import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface DocumentQuotaBarProps {
  current: number;
  max: number;
}

export const DocumentQuotaBar: React.FC<DocumentQuotaBarProps> = ({ current, max }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2" fontWeight="medium">
          Document Quota
        </Typography>
        <Typography
          variant="body2"
          color={isAtLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'text.secondary'}
        >
          {current} / {max} documents
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={isAtLimit ? 'error' : isNearLimit ? 'warning' : 'primary'}
      />
    </Box>
  );
};
```

```typescript
// components/DeleteConfirmDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface DeleteConfirmDialogProps {
  open: boolean;
  documentName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  documentName,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Document?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "{documentName}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Step 5: Page Integration (30 min)

**File:** `frontend/src/pages/DocumentsPage.tsx`

```typescript
import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import { DocumentUploadZone, DocumentList } from '@/features/documents';
import { useDocuments } from '@/features/documents/hooks/useDocuments';

export const DocumentsPage: React.FC = () => {
  const { data: documents, refetch } = useDocuments();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Document Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload PDF documents to ask questions and get AI-powered answers.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <DocumentUploadZone
          currentDocumentCount={documents?.length ?? 0}
          maxDocuments={5}
          onUploadComplete={refetch}
        />
      </Paper>

      <DocumentList />
    </Container>
  );
};
```

**Add Route:** `frontend/src/app/router.tsx`

```typescript
import { DocumentsPage } from '@/pages/DocumentsPage';

// Add to routes:
{
  path: '/documents',
  element: <DocumentsPage />,
},
```

### Step 6: Testing & Polish (45 min)

**Manual Testing Checklist:**
1. Upload single PDF - verify progress bar
2. Upload multiple PDFs - verify quota enforcement
3. Drag-drop PDF - verify visual feedback
4. Upload invalid file - verify error message
5. Upload oversized file - verify rejection
6. Monitor processing status - verify polling updates
7. Delete document - verify optimistic update
8. Delete with network error - verify rollback
9. Test on mobile viewport - verify responsive design
10. Test keyboard navigation - verify accessibility

**Code Quality:**
- Run ESLint: `npm run lint`
- Type check: `npm run type-check`
- Format code: `npm run format`

---

## Todo List

### Setup (30 min)
- [ ] Create `features/documents/` folder structure
- [ ] Define TypeScript types in `types/document.types.ts`
- [ ] Create API client in `api/documentApi.ts`
- [ ] Export public API in `index.ts`

### React Query Hooks (45 min)
- [ ] Implement `useDocuments()` hook
- [ ] Implement `useDocumentUpload()` with progress callback
- [ ] Implement `useDocumentDelete()` with optimistic update
- [ ] Implement `useDocumentStatus()` with conditional polling

### UI Components (2 hours)
- [ ] Build `DocumentUploadZone` with react-dropzone
- [ ] Build `DocumentList` container
- [ ] Build `DocumentItem` card with status chip
- [ ] Build `DocumentQuotaBar` progress indicator
- [ ] Build `DeleteConfirmDialog` MUI dialog

### Integration (45 min)
- [ ] Create `DocumentsPage.tsx`
- [ ] Add `/documents` route to router
- [ ] Add navigation link in sidebar/header
- [ ] Test upload flow end-to-end
- [ ] Test delete flow with optimistic update

### Testing & Polish (45 min)
- [ ] Manual testing (10 scenarios)
- [ ] Fix TypeScript errors
- [ ] Add error toast notifications
- [ ] Mobile responsive testing
- [ ] Accessibility audit (keyboard, ARIA)

---

## Success Criteria

**Functional:**
- [ ] Users can drag-drop or browse to upload PDFs
- [ ] Upload progress shows 0-100%
- [ ] Document list shows all uploaded PDFs
- [ ] Processing status updates every 3 seconds
- [ ] Quota bar displays X/5 documents
- [ ] Delete removes document with instant UI feedback
- [ ] Errors show clear, actionable messages

**Technical:**
- [ ] Zero TypeScript errors
- [ ] All components use strict types (no `any`)
- [ ] React Query cache invalidation works correctly
- [ ] Optimistic updates rollback on error
- [ ] Polling stops when status is COMPLETED/FAILED

**UX:**
- [ ] Mobile-responsive layout
- [ ] Smooth animations (drag-drop, progress)
- [ ] Accessible (keyboard, screen reader)
- [ ] Clear visual feedback (loading, success, error)

---

## Risk Assessment

### Potential Issues

1. **Backend Not Ready**
   - **Mitigation:** Use mock API responses with MSW for development
   - **Fallback:** Implement UI first, integrate API later

2. **Polling Performance**
   - **Risk:** Too many requests if many documents processing
   - **Mitigation:** Conditional polling (only for PROCESSING status), stop after 5 minutes

3. **Large File Upload Timeout**
   - **Risk:** 10MB files take long on slow networks
   - **Mitigation:** Increase Axios timeout, show clear progress feedback

4. **Quota Enforcement**
   - **Risk:** Race condition (upload while at 5/5)
   - **Mitigation:** Backend must enforce quota, frontend is UX optimization

5. **Mobile UX**
   - **Risk:** Drag-drop not intuitive on mobile
   - **Mitigation:** Large tap targets, file browser fallback

---

## Security Considerations

### Frontend Security

1. **File Validation**
   - Validate file type client-side (PDF only)
   - Validate file size client-side (max 10MB)
   - Trust backend for final validation (client can be bypassed)

2. **Authentication**
   - All API requests include auth token (existing Axios interceptor)
   - Handle 401 Unauthorized gracefully (redirect to login)

3. **XSS Prevention**
   - Sanitize file names before display (React handles by default)
   - Avoid dangerouslySetInnerHTML with user content

4. **CSRF Protection**
   - Use existing CSRF token strategy (if implemented)

### Backend Validation (Reminder)

- Verify JWT token on all endpoints
- Validate file type by magic bytes (not just extension)
- Enforce quota per user (database constraint)
- Sanitize file names before storage
- Virus scan uploads (production requirement)

---

## Next Steps

After Phase 1 completion:

**Phase 2: Q&A Chat Interface**
- Extend chat feature to include document context
- Implement SSE streaming for AI responses
- Add source citations with page numbers
- Build message history with document references

**Dependencies for Phase 2:**
- Phase 1 completed (document upload working)
- Document ID selection state (from Phase 1)
- Backend Q&A API endpoints functional

**Preview:**
- Chat input with document selector dropdown
- Streaming AI responses (EventSource)
- Citation pills `[1]` linking to PDF pages
- Message history grouped by document context

---

**Total Lines:** ~850 lines (comprehensive, ready for implementation)
