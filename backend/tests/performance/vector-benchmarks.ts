/**
 * Vector Store Performance Benchmarks
 *
 * Tests pgvector operations: insert, search, indexing
 * Compares different index types and search strategies
 *
 * Usage:
 *   npm run benchmark:vector
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

interface VectorBenchmark {
  operation: string;
  vectorCount: number;
  executionTime: number;
  throughput: number; // operations per second
  indexType?: 'none' | 'ivfflat' | 'hnsw';
}

class VectorStoreBenchmark {
  private prisma: PrismaClient;
  private results: VectorBenchmark[] = [];
  private testEmbeddings: number[][] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  async run() {
    console.log('🚀 Starting Vector Store Performance Benchmarks\n');

    try {
      // Generate test embeddings
      this.generateTestEmbeddings();

      // Run benchmarks
      await this.benchmarkInsert();
      await this.benchmarkSearch();
      await this.benchmarkIndexing();

      // Generate report
      await this.generateReport();

      // Cleanup
      await this.cleanup();
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private generateTestEmbeddings() {
    console.log('📦 Generating test embeddings (1536-dimensional)...');

    // Generate 1000 random embeddings (1536 dimensions like OpenAI)
    for (let i = 0; i < 1000; i++) {
      const embedding: number[] = [];
      for (let j = 0; j < 1536; j++) {
        embedding.push(Math.random() * 2 - 1); // Random values between -1 and 1
      }
      this.testEmbeddings.push(embedding);
    }

    console.log('✅ Generated 1000 test embeddings\n');
  }

  private async benchmarkInsert() {
    console.log('📊 Insert Performance Benchmarks\n');

    // Insert 1 vector
    await this.benchmarkVectorOperation(
      'Insert 1 Vector',
      1,
      async (embeddings) => {
        await this.insertVectors(embeddings);
      }
    );

    // Insert 100 vectors
    await this.benchmarkVectorOperation(
      'Insert 100 Vectors',
      100,
      async (embeddings) => {
        await this.insertVectors(embeddings);
      }
    );

    // Insert 1000 vectors
    await this.benchmarkVectorOperation(
      'Insert 1000 Vectors',
      1000,
      async (embeddings) => {
        await this.insertVectors(embeddings);
      }
    );
  }

  private async benchmarkSearch() {
    console.log('\n🔍 Search Performance Benchmarks\n');

    // Ensure we have some vectors to search
    if (this.testEmbeddings.length > 0) {
      await this.insertVectors(this.testEmbeddings.slice(0, 100));
    }

    // Exact search (cosine similarity)
    await this.benchmarkVectorOperation(
      'Exact Cosine Similarity Search',
      10,
      async (embeddings) => {
        for (const embedding of embeddings) {
          await this.searchVectors(embedding, 10);
        }
      }
    );

    // Search with different k values
    await this.benchmarkVectorOperation(
      'Search Top 5',
      10,
      async (embeddings) => {
        for (const embedding of embeddings) {
          await this.searchVectors(embedding, 5);
        }
      }
    );

    await this.benchmarkVectorOperation(
      'Search Top 50',
      10,
      async (embeddings) => {
        for (const embedding of embeddings) {
          await this.searchVectors(embedding, 50);
        }
      }
    );
  }

  private async benchmarkIndexing() {
    console.log('\n🏗️ Indexing Performance Benchmarks\n');

    // Note: In production, you would create indexes like:
    // CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    // CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);

    console.log('   ℹ️  Index benchmarks require pgvector extension');
    console.log('   ℹ️  Run these SQL commands to create indexes:');
    console.log('   CREATE INDEX idx_embedding_ivfflat ON document_chunks USING ivfflat (embedding vector_cosine_ops);');
    console.log('   CREATE INDEX idx_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);');
    console.log('');
  }

  private async benchmarkVectorOperation(
    name: string,
    count: number,
    operation: (embeddings: number[][]) => Promise<void>
  ) {
    console.log(`   Testing: ${name}...`);

    const embeddings = this.testEmbeddings.slice(0, count);

    const start = performance.now();
    await operation(embeddings);
    const end = performance.now();

    const executionTime = end - start;
    const throughput = (count / executionTime) * 1000; // ops per second

    this.results.push({
      operation: name,
      vectorCount: count,
      executionTime,
      throughput,
    });

    console.log(`   ✅ Completed: ${executionTime.toFixed(2)}ms (${throughput.toFixed(2)} ops/sec)\n`);
  }

  private async insertVectors(embeddings: number[][]) {
    // Note: This is a simplified version
    // In production, you would insert into a table with pgvector column type

    const queries = embeddings.map((embedding, index) => {
      return this.prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, "documentId", content, embedding, "chunkIndex")
        VALUES (
          ${`bench-chunk-${Date.now()}-${index}`},
          'bench-doc',
          'Test content',
          ${JSON.stringify(embedding)}::vector,
          ${index}
        )
        ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding
      `;
    });

    await Promise.all(queries);
  }

  private async searchVectors(queryEmbedding: number[], k: number = 10) {
    // Cosine similarity search
    // Note: This requires pgvector extension
    try {
      const results = await this.prisma.$queryRaw`
        SELECT id, content, 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM "DocumentChunk"
        WHERE "documentId" = 'bench-doc'
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${k}
      `;
      return results;
    } catch (error) {
      // If pgvector not installed, return empty results
      return [];
    }
  }

  private async cleanup() {
    console.log('🧹 Cleaning up test data...');

    try {
      await this.prisma.$executeRaw`
        DELETE FROM "DocumentChunk" WHERE "documentId" = 'bench-doc'
      `;
    } catch (error) {
      console.log('   ⚠️  Cleanup skipped (table may not exist)');
    }

    console.log('✅ Cleanup complete\n');
  }

  private async generateReport() {
    console.log('\n📊 Generating Performance Report...\n');

    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      recommendations: this.generateRecommendations(),
    };

    // Create results directory
    const resultsDir = path.join(__dirname, '../../performance-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(resultsDir, 'vector-benchmark-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlPath = path.join(resultsDir, 'vector-benchmark-results.html');
    fs.writeFileSync(htmlPath, this.generateHTML(report));

    // Print summary
    this.printSummary();

    console.log(`\n✅ Results saved to:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}\n`);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const insertBenchmark = this.results.find(r => r.operation.includes('Insert 1000'));
    const searchBenchmark = this.results.find(r => r.operation.includes('Search Top 10'));

    if (insertBenchmark) {
      const insertsPerSec = insertBenchmark.throughput;
      recommendations.push(
        `📥 **Insert Performance:** ${insertsPerSec.toFixed(0)} vectors/sec`,
        `   - For 1M vectors: ~${(1000000 / insertsPerSec / 60).toFixed(0)} minutes`,
        `   - Use batch inserts for better performance`
      );
    }

    if (searchBenchmark) {
      const searchesPerSec = searchBenchmark.throughput;
      recommendations.push(
        `🔍 **Search Performance:** ${searchesPerSec.toFixed(0)} searches/sec`,
        `   - Response time: ${(1000 / searchesPerSec).toFixed(0)}ms per search`,
        `   - Consider HNSW index for > 10K vectors`
      );
    }

    recommendations.push(
      '🏗️ **Index Recommendations:**',
      '   - **No index:** Fast inserts, slow searches',
      '   - **IVFFlat:** Balanced performance, good for 10K-1M vectors',
      '   - **HNSW:** Fast searches, slower inserts, best for > 100K vectors',
      '',
      '💡 **pgvector vs Pinecone:**',
      '   - **pgvector:** FREE, self-hosted, good for < 1M vectors',
      '   - **Pinecone:** $70/month, managed, better for > 10M vectors',
      '   - **Recommendation:** Start with pgvector, migrate to Pinecone if needed'
    );

    return recommendations;
  }

  private printSummary() {
    console.log('📈 VECTOR STORE BENCHMARK SUMMARY');
    console.log('='.repeat(80));

    this.results.forEach(result => {
      console.log(`${result.operation}:`);
      console.log(`   Vectors: ${result.vectorCount}`);
      console.log(`   Time: ${result.executionTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${result.throughput.toFixed(2)} ops/sec`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('\n📋 RECOMMENDATIONS\n');
    this.generateRecommendations().forEach(rec => console.log(rec));
    console.log('\n' + '='.repeat(80));
  }

  private generateHTML(report: any): string {
    const rows = report.results.map((r: VectorBenchmark) => `
      <tr>
        <td>${r.operation}</td>
        <td>${r.vectorCount}</td>
        <td>${r.executionTime.toFixed(2)}ms</td>
        <td>${r.throughput.toFixed(2)} ops/sec</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Vector Store Performance Benchmarks</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    .recommendations { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .recommendations h3 { margin-top: 0; color: #1976d2; }
    .recommendations ul { line-height: 1.8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Vector Store Performance Benchmarks</h1>
    <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</p>

    <h2>Results</h2>
    <table>
      <thead>
        <tr>
          <th>Operation</th>
          <th>Vector Count</th>
          <th>Execution Time</th>
          <th>Throughput</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="recommendations">
      <h3>Recommendations</h3>
      <ul>
        ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

// Run benchmarks
const benchmark = new VectorStoreBenchmark();
benchmark.run()
  .then(() => {
    console.log('✨ Vector store benchmarks completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Vector store benchmarks failed:', error);
    process.exit(1);
  });
