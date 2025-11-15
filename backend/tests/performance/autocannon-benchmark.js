/**
 * Autocannon API Benchmark (Alternative to k6)
 *
 * Uses autocannon (already installed) for quick API performance testing
 * Good for CI/CD pipelines and quick local testing
 *
 * Usage:
 *   node autocannon-benchmark.js
 *   npm run benchmark:autocannon
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:4000';

const results = {
  timestamp: new Date().toISOString(),
  baseUrl: API_URL,
  benchmarks: [],
};

// Test configuration
const testConfigs = [
  {
    name: 'Auth - Login',
    url: `${API_URL}/api/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!@#',
    }),
    target: 100, // ms
  },
  {
    name: 'Auth - Refresh Token',
    url: `${API_URL}/api/auth/refresh`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    target: 100, // ms
  },
  {
    name: 'Chat - List Conversations',
    url: `${API_URL}/api/chat/conversations`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Note: In real tests, add Authorization header
    },
    target: 500, // ms
  },
];

// Run benchmark for a single endpoint
async function runBenchmark(config) {
  console.log(`\n📊 Benchmarking: ${config.name}`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Target: < ${config.target}ms (P95)`);

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: config.url,
        method: config.method || 'GET',
        headers: config.headers || {},
        body: config.body || null,
        connections: 10, // concurrent connections
        duration: 10, // seconds
        pipelining: 1,
        timeout: 10, // seconds
      },
      (err, result) => {
        if (err) {
          console.error(`   ❌ Error: ${err.message}`);
          resolve(null);
          return;
        }

        const p95 = result.latency.p95;
        const passed = p95 <= config.target;

        const benchmark = {
          name: config.name,
          url: config.url,
          method: config.method || 'GET',
          target: config.target,
          results: {
            requests: result.requests.total,
            duration: result.duration,
            throughput: result.throughput.total,
            latency: {
              mean: result.latency.mean,
              p50: result.latency.p50,
              p95: result.latency.p95,
              p99: result.latency.p99,
              max: result.latency.max,
            },
            errors: result.errors,
            timeouts: result.timeouts,
          },
          passed,
        };

        console.log(`   Mean: ${result.latency.mean.toFixed(2)}ms`);
        console.log(`   P50: ${result.latency.p50.toFixed(2)}ms`);
        console.log(`   P95: ${result.latency.p95.toFixed(2)}ms`);
        console.log(`   P99: ${result.latency.p99.toFixed(2)}ms`);
        console.log(`   Throughput: ${result.throughput.total.toFixed(2)} req/sec`);
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}`);

        results.benchmarks.push(benchmark);
        resolve(benchmark);
      }
    );

    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
}

// Run all benchmarks
async function runAllBenchmarks() {
  console.log('🚀 Starting Autocannon API Benchmarks\n');
  console.log(`Base URL: ${API_URL}\n`);

  for (const config of testConfigs) {
    await runBenchmark(config);
  }

  // Generate report
  await generateReport();

  // Print summary
  printSummary();
}

// Generate JSON and HTML reports
async function generateReport() {
  const resultsDir = path.join(__dirname, '../../performance-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save JSON
  const jsonPath = path.join(resultsDir, 'autocannon-benchmark-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  // Generate HTML
  const htmlPath = path.join(resultsDir, 'autocannon-benchmark-results.html');
  fs.writeFileSync(htmlPath, generateHTML());

  console.log(`\n✅ Results saved to:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   HTML: ${htmlPath}`);
}

// Generate HTML report
function generateHTML() {
  const rows = results.benchmarks
    .map(
      (b) => `
      <tr class="${b.passed ? 'pass' : 'fail'}">
        <td>${b.name}</td>
        <td>${b.method}</td>
        <td>${b.results.latency.mean.toFixed(2)}ms</td>
        <td>${b.results.latency.p50.toFixed(2)}ms</td>
        <td>${b.results.latency.p95.toFixed(2)}ms</td>
        <td>${b.results.latency.p99.toFixed(2)}ms</td>
        <td>${b.target}ms</td>
        <td>${b.results.throughput.toFixed(2)} req/sec</td>
        <td>${b.passed ? '✅ PASS' : '❌ FAIL'}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Autocannon API Benchmark Results</title>
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
    <h1>Autocannon API Benchmark Results</h1>
    <p><strong>Timestamp:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
    <p><strong>Base URL:</strong> ${results.baseUrl}</p>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${results.benchmarks.length}</div>
      </div>
      <div class="summary-card" style="background: #e8f5e9;">
        <h3>Passed</h3>
        <div class="value" style="color: #4CAF50;">
          ${results.benchmarks.filter((b) => b.passed).length}
        </div>
      </div>
      <div class="summary-card" style="background: #ffebee;">
        <h3>Failed</h3>
        <div class="value" style="color: #f44336;">
          ${results.benchmarks.filter((b) => !b.passed).length}
        </div>
      </div>
    </div>

    <h2>Detailed Results</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Method</th>
          <th>Mean</th>
          <th>P50</th>
          <th>P95</th>
          <th>P99</th>
          <th>Target</th>
          <th>Throughput</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>
  `.trim();
}

// Print summary
function printSummary() {
  console.log('\n📈 BENCHMARK SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.benchmarks.length}`);
  console.log(`Passed: ${results.benchmarks.filter((b) => b.passed).length} ✅`);
  console.log(`Failed: ${results.benchmarks.filter((b) => !b.passed).length} ❌`);
  console.log('='.repeat(80));
}

// Run benchmarks
runAllBenchmarks()
  .then(() => {
    console.log('\n✨ Autocannon benchmarks completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Autocannon benchmarks failed:', error);
    process.exit(1);
  });
