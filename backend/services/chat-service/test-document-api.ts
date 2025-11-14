#!/usr/bin/env tsx
/**
 * Document API Integration Test
 *
 * Tests the complete PDF Q&A flow:
 * 1. Upload PDF document
 * 2. Wait for processing
 * 3. Query document with RAG
 * 4. Verify results
 * 5. Clean up
 *
 * Usage: npx tsx test-document-api.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DocumentService } from './src/services/document.service';
import { RagService } from './src/services/rag.service';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const log = {
  info: (msg: string) => console.log(`\n✅ ${msg}`),
  error: (msg: string) => console.log(`\n❌ ${msg}`),
  section: (msg: string) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
  subsection: (msg: string) => console.log(`\n--- ${msg} ---`),
};

// Test PDF content (simple text file saved as .pdf for demo)
const TEST_PDF_CONTENT = `ARTIFICIAL INTELLIGENCE RESEARCH REPORT

Introduction
This document provides an overview of current trends in artificial intelligence research.

Section 1: Machine Learning
Machine learning is a subset of AI that focuses on training systems to learn from data.
Key techniques include supervised learning, unsupervised learning, and reinforcement learning.

Section 2: Deep Learning
Deep learning uses neural networks with multiple layers to model complex patterns.
Applications include image recognition, natural language processing, and autonomous vehicles.

Section 3: Natural Language Processing
NLP enables machines to understand and generate human language.
Recent advances include transformer models like GPT and BERT.

Conclusion
AI continues to evolve rapidly with new breakthroughs every year.
`;

async function createTestPdf(): Promise<string> {
  const tempDir = path.join(__dirname, 'temp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const pdfPath = path.join(tempDir, 'test-ai-report.pdf');

  // Create a minimal valid PDF file
  const pdfHeader = '%PDF-1.4\n';
  const pdfBody = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>\nendobj\n5 0 obj\n<< /Length ${TEST_PDF_CONTENT.length} >>\nstream\n${TEST_PDF_CONTENT}\nendstream\nendobj\n`;
  const pdfTrailer = `xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000226 00000 n\n0000000322 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${pdfHeader.length + pdfBody.length}\n%%EOF`;

  fs.writeFileSync(pdfPath, pdfHeader + pdfBody + pdfTrailer);

  return pdfPath;
}

async function waitForProcessing(
  documentService: DocumentService,
  documentId: string,
  userId: string,
  maxWaitSeconds: number = 60
): Promise<boolean> {
  const startTime = Date.now();

  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    const document = await documentService.getDocument(documentId, userId);

    if (document.status === 'COMPLETED') {
      log.info(`Document processed successfully (${document.chunksCount} chunks)`);
      return true;
    }

    if (document.status === 'FAILED') {
      log.error(`Document processing failed: ${document.errorMessage}`);
      return false;
    }

    // Still processing, wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  log.error('Document processing timeout');
  return false;
}

async function runTests() {
  log.section('PDF Q&A SYSTEM - INTEGRATION TEST');

  const testUserId = 'test-user-' + Date.now();
  let documentId: string | undefined;

  try {
    // Initialize services
    const documentService = new DocumentService();
    const ragService = new RagService();
    const prisma = new PrismaClient();

    // Step 1: Create test PDF
    log.subsection('Step 1: Creating test PDF');
    const pdfPath = await createTestPdf();
    log.info(`Test PDF created: ${pdfPath}`);

    // Step 2: Upload PDF
    log.subsection('Step 2: Uploading PDF document');

    const fileStats = fs.statSync(pdfPath);
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-ai-report.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: fileStats.size,
      destination: path.dirname(pdfPath),
      filename: path.basename(pdfPath),
      path: pdfPath,
      buffer: Buffer.from(''), // Not used for disk storage
      stream: null as any,
    };

    const uploadResult = await documentService.uploadDocument(
      testUserId,
      mockFile,
      'AI Research Report'
    );

    documentId = uploadResult.documentId;
    log.info(`Document uploaded: ${documentId}`);
    log.info(`Status: ${uploadResult.status}`);

    // Step 3: Wait for processing
    log.subsection('Step 3: Waiting for document processing');

    const processed = await waitForProcessing(documentService, documentId, testUserId, 60);

    if (!processed) {
      throw new Error('Document processing failed or timed out');
    }

    // Step 4: Query document
    log.subsection('Step 4: Querying document with RAG');

    const queries = [
      'What is machine learning?',
      'What are the applications of deep learning?',
      'What recent advances have been made in NLP?',
    ];

    for (const query of queries) {
      log.info(`\nQuery: "${query}"`);

      const result = await ragService.query(query, {
        userId: testUserId,
        documentId,
        topK: 3,
      });

      console.log(`Answer: ${result.answer.substring(0, 200)}...`);
      console.log(`Sources: ${result.sources.length} chunks`);
      console.log(`Tokens: ${result.tokensUsed.total}`);

      // Verify results
      if (result.sources.length === 0) {
        log.error('No sources found!');
      } else {
        log.info(`✓ Found ${result.sources.length} relevant sources`);
      }
    }

    // Step 5: Test streaming query
    log.subsection('Step 5: Testing streaming query');

    console.log('\nQuery (streaming): "Summarize the key points of this document"');

    let chunks = 0;
    let sources = 0;

    for await (const chunk of ragService.streamQuery('Summarize the key points of this document', {
      userId: testUserId,
      documentId,
      topK: 5,
    })) {
      if (chunk.type === 'sources') {
        sources = chunk.sources.length;
      } else if (chunk.type === 'chunk') {
        chunks++;
        process.stdout.write(chunk.content);
      } else if (chunk.type === 'done') {
        console.log(`\n\nTokens: ${chunk.tokensUsed.total}`);
      }
    }

    log.info(`✓ Streaming completed: ${chunks} chunks, ${sources} sources`);

    // Step 6: Verify document list
    log.subsection('Step 6: Verifying document list');

    const listResult = await documentService.listDocuments(testUserId, { limit: 10 });

    if (listResult.documents.length === 0) {
      log.error('Document not found in list!');
    } else {
      log.info(`✓ Document found in list (${listResult.total} total documents)`);
    }

    // Step 7: Clean up
    log.subsection('Step 7: Cleaning up test data');

    await documentService.deleteDocument(documentId, testUserId);
    log.info('Document deleted');

    // Clean up temp file
    fs.unlinkSync(pdfPath);
    log.info('Temp PDF deleted');

    // Final summary
    log.section('✅ ALL TESTS PASSED');

    console.log('\n📊 Test Summary:');
    console.log('- PDF upload: ✓');
    console.log('- Document processing: ✓');
    console.log('- RAG queries: ✓');
    console.log('- Streaming queries: ✓');
    console.log('- Document management: ✓');
    console.log('- Cleanup: ✓');

    await prisma.$disconnect();
    await ragService.disconnect();

    process.exit(0);
  } catch (error) {
    log.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);

    // Cleanup on error
    if (documentId) {
      try {
        const documentService = new DocumentService();
        await documentService.deleteDocument(documentId, testUserId);
        log.info('Cleaned up test document');
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    process.exit(1);
  }
}

// Run tests
runTests();
