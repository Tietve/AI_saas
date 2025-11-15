/**
 * Embedding Dimension Compatibility Checker
 *
 * This script checks existing embeddings in the database and verifies
 * compatibility with the configured embedding provider.
 *
 * DIMENSION COMPATIBILITY:
 * - OpenAI text-embedding-3-small: 1536 dimensions
 * - Cloudflare @cf/baai/bge-base-en-v1.5: 768 dimensions
 *
 * CRITICAL: Embeddings from different providers CANNOT be mixed in the same vector store!
 * This would result in invalid similarity search results.
 *
 * USAGE:
 *   ts-node scripts/check-embedding-dimensions.ts
 *   ts-node scripts/check-embedding-dimensions.ts --fix
 */

import { PrismaClient } from '@prisma/client';
import { EmbeddingService, EmbeddingProvider } from '../../../shared/services';

interface EmbeddingStats {
  totalChunks: number;
  chunksWithEmbeddings: number;
  detectedDimension: number | null;
  detectedProvider: EmbeddingProvider | null;
  isCompatible: boolean;
  sampleEmbeddings: Array<{
    documentId: string;
    chunkIndex: number;
    dimension: number;
  }>;
}

async function checkDimensions(fix: boolean = false): Promise<void> {
  const prisma = new PrismaClient();
  const embeddingService = new EmbeddingService();

  try {
    console.log('\n========================================');
    console.log('EMBEDDING DIMENSION COMPATIBILITY CHECK');
    console.log('========================================\n');

    // Get current provider configuration
    const currentProvider = embeddingService.getProvider();
    const expectedDimension = embeddingService.getDimension();

    console.log(`✓ Current provider: ${currentProvider}`);
    console.log(`✓ Expected dimension: ${expectedDimension}\n`);

    // Get statistics
    const stats = await getEmbeddingStats(prisma);

    console.log('DATABASE STATISTICS:');
    console.log(`  Total chunks: ${stats.totalChunks}`);
    console.log(`  Chunks with embeddings: ${stats.chunksWithEmbeddings}`);

    if (stats.detectedDimension) {
      console.log(`  Detected dimension: ${stats.detectedDimension}`);
      console.log(`  Detected provider: ${stats.detectedProvider}`);
      console.log(`  Compatible: ${stats.isCompatible ? '✓ YES' : '✗ NO'}\n`);
    } else {
      console.log('  No embeddings found in database.\n');
    }

    // Show sample embeddings
    if (stats.sampleEmbeddings.length > 0) {
      console.log('SAMPLE EMBEDDINGS:');
      stats.sampleEmbeddings.slice(0, 5).forEach((sample, i) => {
        console.log(
          `  ${i + 1}. Document ${sample.documentId.substring(0, 8)}... chunk ${sample.chunkIndex}: ${sample.dimension}d`
        );
      });
      console.log('');
    }

    // Check compatibility
    if (!stats.isCompatible && stats.chunksWithEmbeddings > 0) {
      console.log('⚠️  WARNING: DIMENSION MISMATCH DETECTED!\n');
      console.log('Existing embeddings are incompatible with current provider.');
      console.log(`  Existing: ${stats.detectedDimension}d (${stats.detectedProvider})`);
      console.log(`  Current: ${expectedDimension}d (${currentProvider})\n`);

      if (fix) {
        console.log('🔧 FIXING: Regenerating all embeddings...\n');
        await regenerateAllEmbeddings(prisma, embeddingService);
      } else {
        console.log('RESOLUTION OPTIONS:\n');
        console.log('1. Switch provider back to match existing embeddings:');
        console.log(
          `   Set EMBEDDING_PROVIDER=${stats.detectedProvider?.toLowerCase()} in .env\n`
        );
        console.log('2. Regenerate all embeddings with current provider:');
        console.log('   Run: ts-node scripts/check-embedding-dimensions.ts --fix\n');
        console.log('3. Delete all embeddings and start fresh:');
        console.log('   Run: npx prisma db seed --reset-embeddings\n');
        console.log('⚠️  DO NOT proceed without fixing this issue!');
        console.log('   Mixing embeddings will cause incorrect search results.\n');
        process.exit(1);
      }
    } else if (stats.isCompatible && stats.chunksWithEmbeddings > 0) {
      console.log('✅ ALL CHECKS PASSED!\n');
      console.log('Existing embeddings are compatible with current provider.\n');
    } else {
      console.log('✅ NO EMBEDDINGS YET - Ready to start fresh!\n');
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function getEmbeddingStats(prisma: PrismaClient): Promise<EmbeddingStats> {
  // Get total chunks
  const totalChunks = await prisma.documentChunk.count();

  // Get chunks with embeddings
  const chunksWithEmbeddings = await prisma.documentChunk.count({
    where: {
      embedding: {
        not: null,
      },
    },
  });

  if (chunksWithEmbeddings === 0) {
    return {
      totalChunks,
      chunksWithEmbeddings: 0,
      detectedDimension: null,
      detectedProvider: null,
      isCompatible: true,
      sampleEmbeddings: [],
    };
  }

  // Get sample embeddings to check dimensions
  const samples = await prisma.documentChunk.findMany({
    where: {
      embedding: {
        not: null,
      },
    },
    select: {
      documentId: true,
      chunkIndex: true,
      embedding: true,
    },
    take: 10,
  });

  const sampleEmbeddings = samples.map((sample) => ({
    documentId: sample.documentId,
    chunkIndex: sample.chunkIndex,
    dimension: sample.embedding?.length || 0,
  }));

  // Detect dimension (should be consistent across all embeddings)
  const detectedDimension = sampleEmbeddings[0]?.dimension || null;

  // Detect provider based on dimension
  let detectedProvider: EmbeddingProvider | null = null;
  if (detectedDimension === 1536) {
    detectedProvider = EmbeddingProvider.OPENAI;
  } else if (detectedDimension === 768) {
    detectedProvider = EmbeddingProvider.CLOUDFLARE;
  }

  // Check if all embeddings have same dimension
  const allSameDimension = sampleEmbeddings.every((s) => s.dimension === detectedDimension);

  if (!allSameDimension) {
    console.error('⚠️  WARNING: Inconsistent embedding dimensions detected!');
    console.error('   This indicates corrupted data. Manual cleanup required.');
  }

  // Check compatibility with current provider
  const embeddingService = new EmbeddingService();
  const expectedDimension = embeddingService.getDimension();
  const isCompatible = detectedDimension === expectedDimension;

  return {
    totalChunks,
    chunksWithEmbeddings,
    detectedDimension,
    detectedProvider,
    isCompatible,
    sampleEmbeddings,
  };
}

async function regenerateAllEmbeddings(
  prisma: PrismaClient,
  embeddingService: EmbeddingService
): Promise<void> {
  // Get all chunks with content
  const chunks = await prisma.documentChunk.findMany({
    select: {
      id: true,
      content: true,
    },
  });

  console.log(`Found ${chunks.length} chunks to regenerate...\n`);

  // Process in batches of 100
  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

    try {
      // Generate embeddings
      const result = await embeddingService.embedBatch(texts);

      // Update database
      for (let j = 0; j < batch.length; j++) {
        await prisma.documentChunk.update({
          where: { id: batch[j].id },
          data: { embedding: result.embeddings[j].embedding },
        });
        processed++;
      }

      console.log(
        `  ✓ Processed ${processed}/${chunks.length} (tokens: ${result.totalTokens}, cost: $${result.totalCost?.toFixed(6)})`
      );
    } catch (error) {
      console.error(`  ✗ Batch failed:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  console.log(`\n✅ Successfully regenerated ${processed} embeddings!\n`);
}

// Main execution
const args = process.argv.slice(2);
const fix = args.includes('--fix');

checkDimensions(fix).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
