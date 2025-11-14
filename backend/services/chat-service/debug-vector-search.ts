#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './src/services/embedding.service';

const prisma = new PrismaClient();
const embedding = new EmbeddingService();

async function debugVectorSearch() {
  try {
    // Get test document
    const doc = await prisma.document.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { uploadedAt: 'desc' },
    });

    if (!doc) {
      console.log('❌ No completed documents found');
      await prisma.$disconnect();
      return;
    }

    console.log('\n📄 Test Document:', {
      id: doc.id,
      title: doc.title,
      userId: doc.userId,
      status: doc.status,
    });

    // Generate query embedding
    const query = 'What is machine learning?';
    console.log('\n🔍 Query:', query);

    const queryEmbedding = await embedding.generateSingleEmbedding(query);
    console.log('✅ Query embedding generated:', queryEmbedding.length, 'dimensions');

    // Test vector search WITHOUT filters
    const embeddingVector = `[${queryEmbedding.join(',')}]`;

    console.log('\n🧪 Test 1: Search WITHOUT any filters');
    const results1 = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        dc.id,
        dc."documentId",
        LEFT(dc.content, 100) as preview,
        1 - (dc.embedding <=> '${embeddingVector}'::vector) as similarity
      FROM document_chunks dc
      ORDER BY dc.embedding <=> '${embeddingVector}'::vector
      LIMIT 5
    `);
    console.log('Results:', results1.length);
    results1.forEach((r, i) => {
      console.log(`  ${i + 1}. Similarity: ${r.similarity.toFixed(4)}, Preview: ${r.preview}...`);
    });

    console.log('\n🧪 Test 2: Search WITH userId filter');
    const results2 = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        dc.id,
        dc."documentId",
        d.title,
        d."userId",
        d.status,
        d."deletedAt",
        LEFT(dc.content, 100) as preview,
        1 - (dc.embedding <=> '${embeddingVector}'::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc."documentId" = d.id
      WHERE d."userId" = '${doc.userId}'
      ORDER BY dc.embedding <=> '${embeddingVector}'::vector
      LIMIT 5
    `);
    console.log('Results:', results2.length);
    results2.forEach((r, i) => {
      console.log(`  ${i + 1}. Similarity: ${r.similarity.toFixed(4)}, UserId: ${r.userId}, Status: ${r.status}, Preview: ${r.preview}...`);
    });

    console.log('\n🧪 Test 3: Search WITH ALL filters (like production)');
    const results3 = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        dc.id,
        dc."documentId",
        d.title,
        LEFT(dc.content, 100) as preview,
        1 - (dc.embedding <=> '${embeddingVector}'::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc."documentId" = d.id
      WHERE d."userId" = '${doc.userId}'
        AND d."deletedAt" IS NULL
        AND d.status = 'COMPLETED'
        AND (1 - (dc.embedding <=> '${embeddingVector}'::vector)) >= 0.3
      ORDER BY dc.embedding <=> '${embeddingVector}'::vector
      LIMIT 5
    `);
    console.log('Results:', results3.length);
    results3.forEach((r, i) => {
      console.log(`  ${i + 1}. Similarity: ${r.similarity.toFixed(4)}, Preview: ${r.preview}...`);
    });

    if (results3.length === 0 && results1.length > 0) {
      console.log('\n⚠️  ISSUE: Filters are removing all results!');
      console.log('   Similarities from Test 1:', results1.map(r => r.similarity.toFixed(4)).join(', '));
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debugVectorSearch();
