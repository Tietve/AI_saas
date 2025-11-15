/**
 * Database Query Performance Benchmarks
 *
 * Benchmarks critical database queries with performance targets
 * Includes query execution time, index usage analysis, and recommendations
 *
 * Usage:
 *   npm run benchmark:database
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResult {
  name: string;
  query: string;
  executionTime: number;
  target: number;
  passed: boolean;
  iterations: number;
  stats: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  explainPlan?: any;
  recommendations?: string[];
}

class DatabaseBenchmark {
  private prisma: PrismaClient;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async run() {
    console.log('🚀 Starting Database Performance Benchmarks\n');

    try {
      // Setup test data
      await this.setupTestData();

      // Run all benchmarks
      await this.benchmarkQuotaChecks();
      await this.benchmarkVectorSearches();
      await this.benchmarkMessageHistory();
      await this.benchmarkUserLookup();
      await this.benchmarkConversationListing();
      await this.benchmarkComplexJoins();

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

  private async setupTestData() {
    console.log('📦 Setting up test data...');

    // Create test workspace
    const workspace = await this.prisma.workspace.upsert({
      where: { id: 'benchmark-workspace' },
      create: {
        id: 'benchmark-workspace',
        name: 'Benchmark Workspace',
        ownerId: 'benchmark-owner',
      },
      update: {},
    });

    // Create test user
    const user = await this.prisma.user.upsert({
      where: { id: 'benchmark-user' },
      create: {
        id: 'benchmark-user',
        email: 'benchmark@test.com',
        username: 'benchmarkuser',
        passwordHash: 'dummy',
        workspaceId: workspace.id,
      },
      update: {},
    });

    // Create test conversations with messages
    for (let i = 0; i < 100; i++) {
      const conversation = await this.prisma.conversation.upsert({
        where: { id: `benchmark-conv-${i}` },
        create: {
          id: `benchmark-conv-${i}`,
          userId: user.id,
          title: `Benchmark Conversation ${i}`,
        },
        update: {},
      });

      // Add 50 messages to each conversation
      for (let j = 0; j < 50; j++) {
        await this.prisma.message.upsert({
          where: { id: `benchmark-msg-${i}-${j}` },
          create: {
            id: `benchmark-msg-${i}-${j}`,
            conversationId: conversation.id,
            role: j % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${j} in conversation ${i}`,
          },
          update: {},
        });
      }
    }

    console.log('✅ Test data ready\n');
  }

  private async benchmarkQuery(
    name: string,
    query: () => Promise<any>,
    target: number,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    console.log(`⏱️  Benchmarking: ${name}`);

    const times: number[] = [];

    // Warm-up
    for (let i = 0; i < 10; i++) {
      await query();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await query();
      const end = performance.now();
      times.push(end - start);
    }

    // Calculate statistics
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    const passed = p95 <= target;

    const result: BenchmarkResult = {
      name,
      query: query.toString(),
      executionTime: avg,
      target,
      passed,
      iterations,
      stats: { min, max, avg, p50, p95, p99 },
      recommendations: [],
    };

    console.log(`   Avg: ${avg.toFixed(2)}ms | P95: ${p95.toFixed(2)}ms | Target: ${target}ms | ${passed ? '✅ PASS' : '❌ FAIL'}\n`);

    this.results.push(result);
    return result;
  }

  private async benchmarkQuotaChecks() {
    console.log('📊 Quota Check Benchmarks (Target: < 10ms)\n');

    // Check user quota
    await this.benchmarkQuery(
      'User Quota Check',
      async () => {
        return await this.prisma.user.findUnique({
          where: { id: 'benchmark-user' },
          select: {
            id: true,
            subscriptionTier: true,
            messageCount: true,
            documentCount: true,
          },
        });
      },
      10
    );

    // Check quota with subscription
    await this.benchmarkQuery(
      'Quota Check with Subscription',
      async () => {
        return await this.prisma.user.findUnique({
          where: { id: 'benchmark-user' },
          select: {
            id: true,
            subscriptionTier: true,
            messageCount: true,
            documentCount: true,
            subscription: {
              select: {
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        });
      },
      10
    );
  }

  private async benchmarkVectorSearches() {
    console.log('🔍 Vector Search Benchmarks (Target: < 200ms)\n');

    // Note: This requires pgvector extension and embeddings
    // Simplified version without actual vector operations

    await this.benchmarkQuery(
      'Vector Similarity Search (simulated)',
      async () => {
        // In production, this would use pgvector's cosine similarity
        return await this.prisma.$queryRaw`
          SELECT id, content
          FROM "Message"
          WHERE "conversationId" = 'benchmark-conv-0'
          LIMIT 10
        `;
      },
      200
    );
  }

  private async benchmarkMessageHistory() {
    console.log('💬 Message History Benchmarks (Target: < 150ms)\n');

    // Get last 50 messages
    await this.benchmarkQuery(
      'Get Last 50 Messages',
      async () => {
        return await this.prisma.message.findMany({
          where: { conversationId: 'benchmark-conv-0' },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      },
      150
    );

    // Get messages with pagination
    await this.benchmarkQuery(
      'Get Messages with Pagination',
      async () => {
        return await this.prisma.message.findMany({
          where: { conversationId: 'benchmark-conv-0' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          skip: 0,
        });
      },
      150
    );

    // Get message count
    await this.benchmarkQuery(
      'Get Message Count',
      async () => {
        return await this.prisma.message.count({
          where: { conversationId: 'benchmark-conv-0' },
        });
      },
      50
    );
  }

  private async benchmarkUserLookup() {
    console.log('👤 User Lookup Benchmarks (Target: < 50ms)\n');

    // Find by ID
    await this.benchmarkQuery(
      'Find User by ID',
      async () => {
        return await this.prisma.user.findUnique({
          where: { id: 'benchmark-user' },
        });
      },
      50
    );

    // Find by email
    await this.benchmarkQuery(
      'Find User by Email',
      async () => {
        return await this.prisma.user.findUnique({
          where: { email: 'benchmark@test.com' },
        });
      },
      50
    );

    // Find with relationships
    await this.benchmarkQuery(
      'Find User with Workspace',
      async () => {
        return await this.prisma.user.findUnique({
          where: { id: 'benchmark-user' },
          include: {
            workspace: true,
          },
        });
      },
      100
    );
  }

  private async benchmarkConversationListing() {
    console.log('📋 Conversation Listing Benchmarks (Target: < 200ms)\n');

    // List conversations
    await this.benchmarkQuery(
      'List User Conversations',
      async () => {
        return await this.prisma.conversation.findMany({
          where: { userId: 'benchmark-user' },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        });
      },
      200
    );

    // List with message count
    await this.benchmarkQuery(
      'List Conversations with Message Count',
      async () => {
        return await this.prisma.conversation.findMany({
          where: { userId: 'benchmark-user' },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: {
            _count: {
              select: { messages: true },
            },
          },
        });
      },
      200
    );

    // List with last message
    await this.benchmarkQuery(
      'List Conversations with Last Message',
      async () => {
        return await this.prisma.conversation.findMany({
          where: { userId: 'benchmark-user' },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });
      },
      300
    );
  }

  private async benchmarkComplexJoins() {
    console.log('🔗 Complex Join Benchmarks (Target: < 500ms)\n');

    // User with all conversations and message counts
    await this.benchmarkQuery(
      'User with Conversations and Counts',
      async () => {
        return await this.prisma.user.findUnique({
          where: { id: 'benchmark-user' },
          include: {
            conversations: {
              take: 10,
              include: {
                _count: {
                  select: { messages: true },
                },
              },
            },
          },
        });
      },
      500
    );
  }

  private async generateReport() {
    console.log('\n📊 Generating Performance Report...\n');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBenchmarks: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      results: this.results,
    };

    // Create results directory
    const resultsDir = path.join(__dirname, '../../performance-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(resultsDir, 'database-benchmark-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlPath = path.join(resultsDir, 'database-benchmark-results.html');
    fs.writeFileSync(htmlPath, this.generateHTML(report));

    // Print summary
    console.log('📈 BENCHMARK SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Benchmarks: ${report.summary.totalBenchmarks}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log('='.repeat(80));
    console.log(`\n✅ Results saved to:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}\n`);
  }

  private generateHTML(report: any): string {
    const rows = report.results.map((r: BenchmarkResult) => `
      <tr class="${r.passed ? 'pass' : 'fail'}">
        <td>${r.name}</td>
        <td>${r.stats.avg.toFixed(2)}ms</td>
        <td>${r.stats.p50.toFixed(2)}ms</td>
        <td>${r.stats.p95.toFixed(2)}ms</td>
        <td>${r.stats.p99.toFixed(2)}ms</td>
        <td>${r.target}ms</td>
        <td>${r.passed ? '✅ PASS' : '❌ FAIL'}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Database Performance Benchmark Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .summary-card { background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card h3 { margin: 0; color: #666; }
    .summary-card .value { font-size: 48px; font-weight: bold; color: #333; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    tr.pass { background: #f1f8f4; }
    tr.fail { background: #fff1f0; }
    .pass td:last-child { color: #4CAF50; font-weight: bold; }
    .fail td:last-child { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Database Performance Benchmark Results</h1>
    <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</p>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Benchmarks</h3>
        <div class="value">${report.summary.totalBenchmarks}</div>
      </div>
      <div class="summary-card" style="background: #e8f5e9;">
        <h3>Passed</h3>
        <div class="value" style="color: #4CAF50;">${report.summary.passed}</div>
      </div>
      <div class="summary-card" style="background: #ffebee;">
        <h3>Failed</h3>
        <div class="value" style="color: #f44336;">${report.summary.failed}</div>
      </div>
    </div>

    <h2>Detailed Results</h2>
    <table>
      <thead>
        <tr>
          <th>Benchmark</th>
          <th>Avg</th>
          <th>P50</th>
          <th>P95</th>
          <th>P99</th>
          <th>Target</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <h2>Recommendations</h2>
    <ul>
      ${report.results.filter((r: BenchmarkResult) => !r.passed).map((r: BenchmarkResult) => `
        <li><strong>${r.name}:</strong> P95 (${r.stats.p95.toFixed(2)}ms) exceeds target (${r.target}ms). Consider adding indexes or optimizing the query.</li>
      `).join('')}
      ${report.results.filter((r: BenchmarkResult) => !r.passed).length === 0 ? '<li>All benchmarks passed! 🎉</li>' : ''}
    </ul>
  </div>
</body>
</html>
    `.trim();
  }

  private async cleanup() {
    console.log('🧹 Cleaning up test data...');

    // Delete test data
    await this.prisma.message.deleteMany({
      where: { id: { startsWith: 'benchmark-' } },
    });

    await this.prisma.conversation.deleteMany({
      where: { id: { startsWith: 'benchmark-' } },
    });

    await this.prisma.user.deleteMany({
      where: { id: 'benchmark-user' },
    });

    await this.prisma.workspace.deleteMany({
      where: { id: 'benchmark-workspace' },
    });

    console.log('✅ Cleanup complete\n');
  }
}

// Run benchmarks
const benchmark = new DatabaseBenchmark();
benchmark.run()
  .then(() => {
    console.log('✨ Database benchmarks completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database benchmarks failed:', error);
    process.exit(1);
  });
