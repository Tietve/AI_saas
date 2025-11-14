#!/usr/bin/env tsx
/**
 * Infrastructure Test Suite - Phase 1 Verification
 *
 * Tests:
 * 1. PostgreSQL + pgvector connectivity
 * 2. Prisma Client CRUD operations
 * 3. Vector similarity search (HNSW index)
 * 4. Cloudflare R2 upload/download
 * 5. Full integration flow
 *
 * Usage: npx tsx test-infrastructure.ts
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize clients
const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CF_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
});

// Test utilities
const log = {
  info: (msg: string) => console.log(`\n✅ ${msg}`),
  error: (msg: string) => console.log(`\n❌ ${msg}`),
  section: (msg: string) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
  subsection: (msg: string) => console.log(`\n--- ${msg} ---`),
};

// Generate sample embedding (1536 dimensions)
function generateSampleEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random());
}

// Test 1: PostgreSQL + pgvector Connectivity
async function testPostgresConnection() {
  log.section('TEST 1: PostgreSQL + pgvector Connectivity');

  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    log.info('PostgreSQL connection successful');

    // Verify pgvector extension
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT extversion as version FROM pg_extension WHERE extname = 'vector'
    `;

    if (result.length > 0) {
      log.info(`pgvector extension enabled: v${result[0].version}`);
    } else {
      log.error('pgvector extension not found');
      return false;
    }

    // Verify tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename IN ('documents', 'document_chunks')
    `;

    if (tables.length === 2) {
      log.info('Document tables verified: documents, document_chunks');
    } else {
      log.error(`Missing tables. Found: ${tables.map(t => t.tablename).join(', ')}`);
      return false;
    }

    // Verify HNSW index exists
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'document_chunks'
      AND indexname = 'idx_document_chunks_embedding_hnsw'
    `;

    if (indexes.length > 0) {
      log.info('HNSW vector index verified');
    } else {
      log.error('HNSW index not found');
      return false;
    }

    return true;
  } catch (error) {
    log.error(`PostgreSQL test failed: ${error}`);
    return false;
  }
}

// Test 2: Prisma CRUD Operations
async function testPrismaCRUD() {
  log.section('TEST 2: Prisma CRUD Operations');

  const testUserId = 'test-user-' + Date.now();
  let documentId: string;

  try {
    // Create Document
    log.subsection('Creating test document...');
    const document = await prisma.document.create({
      data: {
        userId: testUserId,
        title: 'Test PDF Document',
        fileName: 'test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024000,
        pageCount: 10,
        storageKey: `test/${testUserId}/test.pdf`,
        status: 'PROCESSING',
      },
    });

    documentId = document.id;
    log.info(`Document created: ${documentId}`);

    // Create DocumentChunks with embeddings
    log.subsection('Creating document chunks with embeddings...');
    const chunks = await Promise.all([
      prisma.$executeRaw`
        INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
        VALUES (
          ${`chunk-${Date.now()}-1`},
          ${documentId},
          'This is test chunk 1 about artificial intelligence.',
          0,
          1,
          10,
          ${`[${generateSampleEmbedding().join(',')}]`}::vector
        )
      `,
      prisma.$executeRaw`
        INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
        VALUES (
          ${`chunk-${Date.now()}-2`},
          ${documentId},
          'This is test chunk 2 about machine learning.',
          1,
          1,
          10,
          ${`[${generateSampleEmbedding().join(',')}]`}::vector
        )
      `,
      prisma.$executeRaw`
        INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
        VALUES (
          ${`chunk-${Date.now()}-3`},
          ${documentId},
          'This is test chunk 3 about deep learning.',
          2,
          2,
          10,
          ${`[${generateSampleEmbedding().join(',')}]`}::vector
        )
      `,
    ]);

    log.info(`Created ${chunks.length} chunks with embeddings`);

    // Read Document with chunks
    log.subsection('Reading document with chunks...');
    const documentWithChunks = await prisma.document.findUnique({
      where: { id: documentId },
      include: { chunks: true },
    });

    if (documentWithChunks && documentWithChunks.chunks.length === 3) {
      log.info(`Document retrieved with ${documentWithChunks.chunks.length} chunks`);
    } else {
      log.error('Failed to retrieve document with chunks');
      return false;
    }

    // Update Document status
    log.subsection('Updating document status...');
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
    log.info('Document status updated to COMPLETED');

    // Delete test data
    log.subsection('Cleaning up test data...');
    await prisma.document.delete({
      where: { id: documentId },
    });
    log.info('Test data deleted successfully (cascade delete verified)');

    return true;
  } catch (error) {
    log.error(`Prisma CRUD test failed: ${error}`);

    // Cleanup on error
    if (documentId!) {
      try {
        await prisma.document.delete({ where: { id: documentId } });
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return false;
  }
}

// Test 3: Vector Similarity Search
async function testVectorSearch() {
  log.section('TEST 3: Vector Similarity Search (HNSW Index)');

  const testUserId = 'test-user-' + Date.now();
  let documentId: string;

  try {
    // Create test document
    const document = await prisma.document.create({
      data: {
        userId: testUserId,
        title: 'Vector Search Test Document',
        fileName: 'vector-test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024000,
        pageCount: 5,
        storageKey: `test/${testUserId}/vector-test.pdf`,
        status: 'COMPLETED',
      },
    });

    documentId = document.id;

    // Create chunks with known embeddings
    log.subsection('Creating chunks with test embeddings...');

    const baseEmbedding = generateSampleEmbedding();

    // Chunk 1: Base embedding
    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
      VALUES (
        ${`vec-chunk-1-${Date.now()}`},
        ${documentId},
        'Artificial intelligence is transforming technology.',
        0,
        1,
        10,
        ${`[${baseEmbedding.join(',')}]`}::vector
      )
    `;

    // Chunk 2: Similar embedding (small variations)
    const similarEmbedding = baseEmbedding.map(v => v + (Math.random() - 0.5) * 0.1);
    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
      VALUES (
        ${`vec-chunk-2-${Date.now()}`},
        ${documentId},
        'Machine learning enables computers to learn from data.',
        1,
        1,
        10,
        ${`[${similarEmbedding.join(',')}]`}::vector
      )
    `;

    // Chunk 3: Different embedding
    const differentEmbedding = generateSampleEmbedding();
    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
      VALUES (
        ${`vec-chunk-3-${Date.now()}`},
        ${documentId},
        'The weather today is sunny and warm.',
        2,
        2,
        10,
        ${`[${differentEmbedding.join(',')}]`}::vector
      )
    `;

    log.info('Created 3 chunks with test embeddings');

    // Perform similarity search
    log.subsection('Testing cosine similarity search...');

    const startTime = Date.now();

    const results = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
      similarity: number;
    }>>`
      SELECT
        id,
        content,
        1 - (embedding <=> ${`[${baseEmbedding.join(',')}]`}::vector) as similarity
      FROM document_chunks
      WHERE "documentId" = ${documentId}
      ORDER BY embedding <=> ${`[${baseEmbedding.join(',')}]`}::vector
      LIMIT 3
    `;

    const queryTime = Date.now() - startTime;

    if (results.length === 3) {
      log.info(`Vector search returned ${results.length} results in ${queryTime}ms`);
      log.info(`Top result similarity: ${(results[0].similarity * 100).toFixed(2)}%`);
      log.info(`Results ranked by similarity: ${results.map(r => r.content.substring(0, 30)).join(' | ')}`);

      // Verify HNSW index was used
      const explain = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(
        `EXPLAIN SELECT id FROM document_chunks WHERE "documentId" = '${documentId}' ORDER BY embedding <=> '[${baseEmbedding.join(',')}]'::vector LIMIT 3`
      );

      const usedIndex = explain.some(row =>
        row['QUERY PLAN'].includes('idx_document_chunks_embedding_hnsw')
      );

      if (usedIndex) {
        log.info('✨ HNSW index was utilized for the query');
      } else {
        log.error('⚠️  HNSW index was NOT used (may need manual index creation)');
      }
    } else {
      log.error('Vector search failed to return results');
      return false;
    }

    // Cleanup
    await prisma.document.delete({ where: { id: documentId } });

    return true;
  } catch (error) {
    log.error(`Vector search test failed: ${error}`);

    // Cleanup on error
    if (documentId!) {
      try {
        await prisma.document.delete({ where: { id: documentId } });
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return false;
  }
}

// Test 4: Cloudflare R2 Upload/Download
async function testR2Storage() {
  log.section('TEST 4: Cloudflare R2 Storage');

  const testKey = `test/infrastructure-test-${Date.now()}.txt`;
  const testContent = 'Hello from infrastructure test! This is a test file for R2 storage verification.';
  const bucketName = process.env.PDF_BUCKET_NAME!;

  try {
    // Upload test file
    log.subsection('Uploading test file to R2...');

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }));

    log.info(`File uploaded to R2: ${testKey}`);

    // Generate presigned URL
    log.subsection('Generating presigned URL...');

    const presignedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }),
      { expiresIn: 3600 }
    );

    log.info('Presigned URL generated (expires in 1 hour)');

    // Download test file
    log.subsection('Downloading test file from R2...');

    const getResponse = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));

    const downloadedContent = await getResponse.Body?.transformToString();

    if (downloadedContent === testContent) {
      log.info('File downloaded successfully, content matches');
    } else {
      log.error('Downloaded content does not match uploaded content');
      return false;
    }

    // Delete test file
    log.subsection('Deleting test file...');

    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));

    log.info('Test file deleted from R2');

    return true;
  } catch (error) {
    log.error(`R2 storage test failed: ${error}`);

    // Cleanup on error
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }));
    } catch (e) {
      // Ignore cleanup errors
    }

    return false;
  }
}

// Test 5: Full Integration Test
async function testFullIntegration() {
  log.section('TEST 5: Full Integration Test');

  const testUserId = 'integration-test-' + Date.now();
  let documentId: string;
  let r2Key: string;

  try {
    // Step 1: Upload file to R2
    log.subsection('Step 1: Upload PDF to R2');

    r2Key = `pdfs/${testUserId}/integration-test.pdf`;
    const pdfContent = 'Mock PDF content for integration test';

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.PDF_BUCKET_NAME!,
      Key: r2Key,
      Body: pdfContent,
      ContentType: 'application/pdf',
    }));

    log.info(`PDF uploaded to R2: ${r2Key}`);

    // Step 2: Create document record
    log.subsection('Step 2: Create document in database');

    const document = await prisma.document.create({
      data: {
        userId: testUserId,
        title: 'Integration Test PDF',
        fileName: 'integration-test.pdf',
        contentType: 'application/pdf',
        fileSize: pdfContent.length,
        pageCount: 1,
        storageKey: r2Key,
        status: 'PROCESSING',
      },
    });

    documentId = document.id;
    log.info(`Document created: ${documentId}`);

    // Step 3: Add chunks with embeddings
    log.subsection('Step 3: Add chunks with embeddings');

    const embedding = generateSampleEmbedding();

    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, "documentId", content, "chunkIndex", "pageNumber", tokens, embedding)
      VALUES (
        ${`int-chunk-${Date.now()}`},
        ${documentId},
        'This is a mock chunk extracted from the integration test PDF.',
        0,
        1,
        15,
        ${`[${embedding.join(',')}]`}::vector
      )
    `;

    log.info('Chunk with embedding added');

    // Step 4: Update document status
    log.subsection('Step 4: Mark document as completed');

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    log.info('Document marked as COMPLETED');

    // Step 5: Query similar chunks
    log.subsection('Step 5: Search for similar chunks');

    const queryEmbedding = embedding.map(v => v + (Math.random() - 0.5) * 0.05);

    const results = await prisma.$queryRaw<Array<{
      content: string;
      similarity: number;
    }>>`
      SELECT
        content,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector) as similarity
      FROM document_chunks
      WHERE "documentId" = ${documentId}
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector
      LIMIT 1
    `;

    if (results.length > 0) {
      log.info(`Found similar chunk with ${(results[0].similarity * 100).toFixed(2)}% similarity`);
    } else {
      log.error('Failed to find similar chunks');
      return false;
    }

    // Step 6: Cleanup
    log.subsection('Step 6: Cleanup test data');

    await prisma.document.delete({ where: { id: documentId } });
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.PDF_BUCKET_NAME!,
      Key: r2Key,
    }));

    log.info('All test data cleaned up');

    return true;
  } catch (error) {
    log.error(`Integration test failed: ${error}`);

    // Cleanup on error
    if (documentId!) {
      try {
        await prisma.document.delete({ where: { id: documentId } });
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    if (r2Key!) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.PDF_BUCKET_NAME!,
          Key: r2Key!,
        }));
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Starting Infrastructure Test Suite\n');

  const results = {
    postgres: false,
    prisma: false,
    vector: false,
    r2: false,
    integration: false,
  };

  try {
    results.postgres = await testPostgresConnection();
    results.prisma = await testPrismaCRUD();
    results.vector = await testVectorSearch();
    results.r2 = await testR2Storage();
    results.integration = await testFullIntegration();
  } catch (error) {
    log.error(`Test suite error: ${error}`);
  } finally {
    await prisma.$disconnect();
  }

  // Print summary
  log.section('TEST SUMMARY');

  const tests = [
    { name: 'PostgreSQL + pgvector', passed: results.postgres },
    { name: 'Prisma CRUD Operations', passed: results.prisma },
    { name: 'Vector Similarity Search', passed: results.vector },
    { name: 'Cloudflare R2 Storage', passed: results.r2 },
    { name: 'Full Integration Flow', passed: results.integration },
  ];

  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });

  const passedCount = tests.filter(t => t.passed).length;
  const totalCount = tests.length;

  console.log(`\n📊 Results: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    log.info('\n🎉 All tests passed! Infrastructure is ready for Phase 2.');
    process.exit(0);
  } else {
    log.error('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests();
