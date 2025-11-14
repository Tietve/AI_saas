#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkChunks() {
  try {
    // Get recent chunks
    const chunks = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        id,
        "documentId",
        "chunkIndex",
        LEFT(content, 100) as preview,
        LENGTH(content) as length,
        tokens
      FROM document_chunks
      ORDER BY "createdAt" DESC
      LIMIT 3
    `);

    console.log('\n📄 Recent chunks:', JSON.stringify(chunks, null, 2));

    // Test vector search with low threshold
    const testEmbedding = new Array(1536).fill(0).map(() => Math.random());
    const embeddingVector = `[${testEmbedding.join(',')}]`;

    const searchResults = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        dc.id,
        dc.content,
        1 - (dc.embedding <=> '${embeddingVector}'::vector) as similarity
      FROM document_chunks dc
      ORDER BY dc.embedding <=> '${embeddingVector}'::vector
      LIMIT 5
    `);

    console.log('\n🔍 Search test (random embedding):', JSON.stringify(searchResults, null, 2));

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkChunks();
