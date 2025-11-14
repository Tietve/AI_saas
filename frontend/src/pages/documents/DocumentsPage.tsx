/**
 * DocumentsPage
 *
 * Document management page with upload and list functionality
 */

import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
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
