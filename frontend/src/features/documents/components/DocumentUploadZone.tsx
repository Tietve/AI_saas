/**
 * DocumentUploadZone Component
 *
 * Drag-and-drop upload zone with progress tracking and validation
 */

import React, { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import CloudUpload from '@mui/icons-material/CloudUpload';
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

      uploadMutation.mutate(
        { file },
        {
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
        }
      );
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
