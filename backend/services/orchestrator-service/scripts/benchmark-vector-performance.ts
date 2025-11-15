/**
 * Vector Store Performance Benchmark
 *
 * Compares query performance between Pinecone and pgvector
 *
 * Usage:
 *   npm run build && node dist/scripts/benchmark-vector-performance.js
 */

import { PrismaClient } from '@prisma/client';
import { getPineconeIndex } from '../src/config/pinecone.config';
import { VectorStoreService } from '../src/services/vector-store.service.new';
import { EmbeddingService } from '../src/services/embedding.service';
import logger from '../src/config/logger.config';

const prisma = new PrismaClient();
const vectorStore = new VectorStoreService(prisma);
const embeddingService = new EmbeddingService();

interface BenchmarkResult {
  provider: 'pinecone' | 'pgvector';
  avgQueryTime: number;
  minQueryTime: number;
  maxQueryTime: number;
  p50: number;
  p95: number;
  p99: number;
  queriesPerSecond: number;
  totalQueries: number;
}

const TEST_QUERIES = [
  'What is the purpose of this system?',
  'How do I authenticate users?',
  'Explain the RAG implementation',
  'What are the performance optimization strategies?',
  'How does the multi-turn conversation work?',
  'What is the cost of embeddings?',
  'Explain prompt upgrading',
  'How to handle rate limiting?',
  'What databases are used?',
  'Describe the canary rollout process',
];

async function benchmarkPinecone(): Promise<BenchmarkResult> {
  try {
    logger.info('Benchmarking Pinecone...');

    const pineconeIndex = await getPineconeIndex();
    const queryTimes: number[] = [];

    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const query = TEST_QUERIES[i];

      // Generate embedding
      const embeddingResult = await embeddingService.embed(query);

      // Query Pinecone
      const startTime = Date.now();
      await pineconeIndex.query({
        vector: embeddingResult.embedding,
        topK: 5,
        includeMetadata: true,
      });
      const endTime = Date.now();

      const queryTime = endTime - startTime;
      queryTimes.push(queryTime);

      logger.info(`  Query ${i + 1}/${TEST_QUERIES.length}: ${queryTime}ms`);
    }

    // Calculate statistics
    const sortedTimes = [...queryTimes].sort((a, b) => a - b);
    const avgQueryTime = queryTimes.reduce((sum, t) => sum + t, 0) / queryTimes.length;

    return {
      provider: 'pinecone',
      avgQueryTime,
      minQueryTime: Math.min(...queryTimes),
      maxQueryTime: Math.max(...queryTimes),
      p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
      p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
      queriesPerSecond: 1000 / avgQueryTime,
      totalQueries: TEST_QUERIES.length,
    };
  } catch (error) {
    logger.error('Pinecone benchmark failed:', error);
    throw error;
  }
}

async function benchmarkPgvector(): Promise<BenchmarkResult> {
  try {
    logger.info('Benchmarking pgvector...');

    const queryTimes: number[] = [];

    // Get a test userId (use first KnowledgeBase owner)
    const kb = await prisma.knowledgeBase.findFirst();
    const userId = kb?.userId || 'test-user';

    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const query = TEST_QUERIES[i];

      // Generate embedding
      const embeddingResult = await embeddingService.embed(query);

      // Query pgvector
      const startTime = Date.now();
      await vectorStore.query(embeddingResult.embedding, {
        topK: 5,
        userId,
        includeMetadata: true,
      });
      const endTime = Date.now();

      const queryTime = endTime - startTime;
      queryTimes.push(queryTime);

      logger.info(`  Query ${i + 1}/${TEST_QUERIES.length}: ${queryTime}ms`);
    }

    // Calculate statistics
    const sortedTimes = [...queryTimes].sort((a, b) => a - b);
    const avgQueryTime = queryTimes.reduce((sum, t) => sum + t, 0) / queryTimes.length;

    return {
      provider: 'pgvector',
      avgQueryTime,
      minQueryTime: Math.min(...queryTimes),
      maxQueryTime: Math.max(...queryTimes),
      p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
      p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
      queriesPerSecond: 1000 / avgQueryTime,
      totalQueries: TEST_QUERIES.length,
    };
  } catch (error) {
    logger.error('pgvector benchmark failed:', error);
    throw error;
  }
}

function printResults(pineconeResult: BenchmarkResult, pgvectorResult: BenchmarkResult): void {
  logger.info('='.repeat(80));
  logger.info('BENCHMARK RESULTS');
  logger.info('='.repeat(80));
  logger.info('');

  // Table header
  logger.info('Metric                    | Pinecone      | pgvector      | Difference    | Winner');
  logger.info('-'.repeat(80));

  // Average query time
  const avgDiff = ((pgvectorResult.avgQueryTime - pineconeResult.avgQueryTime) / pineconeResult.avgQueryTime) * 100;
  logger.info(
    `Avg Query Time            | ${pineconeResult.avgQueryTime.toFixed(2)}ms       | ${pgvectorResult.avgQueryTime.toFixed(2)}ms       | ${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(1)}%        | ${avgDiff < 0 ? 'pgvector' : 'Pinecone'}`
  );

  // Min query time
  logger.info(
    `Min Query Time            | ${pineconeResult.minQueryTime.toFixed(2)}ms       | ${pgvectorResult.minQueryTime.toFixed(2)}ms       | -             | -`
  );

  // Max query time
  logger.info(
    `Max Query Time            | ${pineconeResult.maxQueryTime.toFixed(2)}ms       | ${pgvectorResult.maxQueryTime.toFixed(2)}ms       | -             | -`
  );

  // P50
  logger.info(
    `P50 (median)              | ${pineconeResult.p50.toFixed(2)}ms       | ${pgvectorResult.p50.toFixed(2)}ms       | -             | -`
  );

  // P95
  logger.info(
    `P95                       | ${pineconeResult.p95.toFixed(2)}ms       | ${pgvectorResult.p95.toFixed(2)}ms       | -             | -`
  );

  // P99
  logger.info(
    `P99                       | ${pineconeResult.p99.toFixed(2)}ms       | ${pgvectorResult.p99.toFixed(2)}ms       | -             | -`
  );

  // Queries per second
  const qpsDiff = ((pgvectorResult.queriesPerSecond - pineconeResult.queriesPerSecond) / pineconeResult.queriesPerSecond) * 100;
  logger.info(
    `Queries/Second            | ${pineconeResult.queriesPerSecond.toFixed(2)}/s      | ${pgvectorResult.queriesPerSecond.toFixed(2)}/s      | ${qpsDiff > 0 ? '+' : ''}${qpsDiff.toFixed(1)}%        | ${qpsDiff > 0 ? 'pgvector' : 'Pinecone'}`
  );

  logger.info('-'.repeat(80));
  logger.info('');

  // Overall assessment
  logger.info('OVERALL ASSESSMENT:');
  logger.info('');

  if (pgvectorResult.avgQueryTime < 200) {
    logger.info('✅ pgvector meets target performance (<200ms)');
  } else {
    logger.warn('⚠️  pgvector exceeds target performance (>200ms)');
  }

  if (pgvectorResult.avgQueryTime < pineconeResult.avgQueryTime * 1.2) {
    logger.info('✅ pgvector performance is comparable to Pinecone (within 20%)');
  } else {
    logger.warn('⚠️  pgvector is significantly slower than Pinecone (>20%)');
  }

  logger.info('');
  logger.info('COST COMPARISON:');
  logger.info(`  Pinecone: $70/month`);
  logger.info(`  pgvector: $0/month (included with PostgreSQL)`);
  logger.info(`  Savings: $70/month = $840/year`);
  logger.info('');

  if (pgvectorResult.avgQueryTime < 200 && pgvectorResult.avgQueryTime < pineconeResult.avgQueryTime * 1.5) {
    logger.info('✅ RECOMMENDATION: Migrate to pgvector (performance acceptable, major cost savings)');
  } else {
    logger.warn('⚠️  RECOMMENDATION: Review performance before migration');
  }

  logger.info('='.repeat(80));
}

// Run benchmark
(async () => {
  try {
    logger.info('Starting vector store performance benchmark...');
    logger.info('');

    // Benchmark Pinecone
    const pineconeResult = await benchmarkPinecone();

    logger.info('');

    // Benchmark pgvector
    const pgvectorResult = await benchmarkPgvector();

    logger.info('');

    // Print comparison
    printResults(pineconeResult, pgvectorResult);

    await prisma.$disconnect();
    await vectorStore.disconnect();

    process.exit(0);
  } catch (error) {
    logger.error('Benchmark failed:', error);
    process.exit(1);
  }
})();
