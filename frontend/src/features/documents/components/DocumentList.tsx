/**
 * DocumentList Component
 *
 * Container with document list and quota display
 */

import React from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
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
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
          {documents?.map((doc) => (
            <DocumentItem key={doc.id} document={doc} />
          ))}
        </Box>
      )}
    </Box>
  );
};
