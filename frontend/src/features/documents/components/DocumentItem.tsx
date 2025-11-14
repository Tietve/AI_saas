/**
 * DocumentItem Component
 *
 * Individual document card with status polling and delete action
 */

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
import Delete from '@mui/icons-material/Delete';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
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
  const { data: latestDoc } = useDocumentStatus(initialDoc.id, {
    enabled: initialDoc.status === 'PROCESSING',
    pollingEnabled: initialDoc.status === 'PROCESSING',
  });

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
        return <Chip icon={<CheckCircle />} label="Ready" size="small" color="success" />;
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
            <Typography variant="h6" noWrap title={document.fileName}>
              {document.title || document.fileName}
            </Typography>
          </Box>

          {getStatusChip()}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {document.pageCount ? `${document.pageCount} pages` : 'Processing...'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(document.fileSize / 1024 / 1024).toFixed(2)} MB
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
        documentName={document.title || document.fileName}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
