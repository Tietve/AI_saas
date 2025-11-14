/**
 * DeleteConfirmDialog Component
 *
 * Confirmation dialog for document deletion
 */

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
