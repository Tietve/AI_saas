/**
 * Test Document Fixtures
 *
 * Sample PDF documents and document metadata for testing
 */

import { Buffer } from 'buffer';

export interface TestDocument {
  title: string;
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}

/**
 * Generate simple PDF buffer for testing
 * Note: This is a minimal valid PDF structure
 */
export function generateTestPDF(content: string): Buffer {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length ${content.length + 50}
>>
stream
BT
/F1 12 Tf
50 750 Td
(${content}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000300 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${400 + content.length}
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}

/**
 * Sample test documents
 */
export const TEST_DOCUMENTS: Record<string, TestDocument> = {
  SIMPLE_PDF: {
    title: 'Simple Test PDF',
    filename: 'simple-test.pdf',
    content: 'This is a simple test PDF document with minimal content for testing purposes.',
    mimeType: 'application/pdf',
    size: 1024 // ~1KB
  },

  MEDIUM_PDF: {
    title: 'Medium Test PDF',
    filename: 'medium-test.pdf',
    content: 'This is a medium-sized test PDF. '.repeat(100),
    mimeType: 'application/pdf',
    size: 10 * 1024 // ~10KB
  },

  LARGE_PDF: {
    title: 'Large Test PDF',
    filename: 'large-test.pdf',
    content: 'This is a large test PDF with lots of content. '.repeat(1000),
    mimeType: 'application/pdf',
    size: 100 * 1024 // ~100KB
  },

  TECHNICAL_DOC: {
    title: 'Technical Documentation',
    filename: 'technical-doc.pdf',
    content: `
# Technical Documentation

## Introduction
This document describes the architecture of our system.

## Components
- Authentication Service: Handles user login and registration
- Chat Service: Processes AI chat requests
- Billing Service: Manages subscriptions and payments

## API Endpoints
- POST /api/auth/signin - User login
- POST /api/chat - Send chat message
- GET /api/billing/plans - Get subscription plans
    `.trim(),
    mimeType: 'application/pdf',
    size: 2048 // ~2KB
  }
};

/**
 * Generate oversized document for quota testing
 */
export function generateOversizedDocument(sizeMB: number): TestDocument {
  const sizeBytes = sizeMB * 1024 * 1024;
  const content = 'A'.repeat(Math.floor(sizeBytes / 2)); // Approximate size

  return {
    title: `Oversized ${sizeMB}MB Document`,
    filename: `oversized-${sizeMB}mb.pdf`,
    content,
    mimeType: 'application/pdf',
    size: sizeBytes
  };
}

/**
 * Sample document queries for RAG testing
 */
export const DOCUMENT_QUERIES = {
  SIMPLE: 'What is this document about?',
  SPECIFIC: 'What does the authentication service do?',
  MULTI_PART: 'List all the API endpoints mentioned in the document',
  COMPLEX: 'How do the authentication and billing services interact?',
  NOT_IN_DOC: 'What is the weather like today?'
};

/**
 * Expected embeddings metadata
 */
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  chunkSize: 1000,
  chunkOverlap: 200
};
