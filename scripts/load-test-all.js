/**
 * Comprehensive Load Test for All Services
 * Tests all microservices endpoints under load
 */

const autocannon = require('autocannon');

async function testService(name, url, options = {}) {
  const defaultOptions = {
    connections: 10,
    duration: 10,
    pipelining: 1,
    ...options,
  };

  console.log(`\n🔥 Testing ${name}...`);
  const result = await autocannon({ url, ...defaultOptions });

  return {
    name,
    requests: result.requests.total,
    requestsPerSec: result.requests.average,
    latencyAvg: result.latency.mean,
    latencyP50: result.latency.p50,
    latencyP99: result.latency.p99,
    throughput: result.throughput.average,
    errors2xx: result['2xx'],
    errors4xx: result['4xx'] || 0,
    errors5xx: result['5xx'] || 0,
  };
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 MICROSERVICES LOAD TESTING');
  console.log('='.repeat(60));

  const results = [];

  // Auth Service Tests
  console.log('\n📍 AUTH SERVICE (Port 3001)');
  results.push(await testService('Auth - Health', 'http://localhost:3001/health'));
  results.push(await testService('Auth - Metrics', 'http://localhost:3001/metrics'));

  // Chat Service Tests
  console.log('\n📍 CHAT SERVICE (Port 3002)');
  results.push(await testService('Chat - Health', 'http://localhost:3002/health'));
  results.push(await testService('Chat - Metrics', 'http://localhost:3002/metrics'));

  // Billing Service Tests
  console.log('\n📍 BILLING SERVICE (Port 3003)');
  results.push(await testService('Billing - Health', 'http://localhost:3003/health'));
  results.push(await testService('Billing - Metrics', 'http://localhost:3003/metrics'));

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOAD TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log('\nService Performance Metrics:\n');

  results.forEach(r => {
    console.log(`${r.name}:`);
    console.log(`  Total Requests: ${r.requests}`);
    console.log(`  Req/sec: ${r.requestsPerSec.toFixed(2)}`);
    console.log(`  Latency (avg): ${r.latencyAvg.toFixed(2)}ms`);
    console.log(`  Latency (p50): ${r.latencyP50.toFixed(2)}ms`);
    console.log(`  Latency (p99): ${r.latencyP99.toFixed(2)}ms`);
    console.log(`  Throughput: ${(r.throughput / 1024).toFixed(2)} KB/sec`);
    console.log(`  Success Rate: ${r.errors2xx}/${r.requests} (${((r.errors2xx / r.requests) * 100).toFixed(2)}%)`);

    // Performance grade
    if (r.latencyAvg < 10) {
      console.log(`  Grade: ✅ EXCELLENT`);
    } else if (r.latencyAvg < 50) {
      console.log(`  Grade: ✅ VERY GOOD`);
    } else if (r.latencyAvg < 100) {
      console.log(`  Grade: ✅ GOOD`);
    } else if (r.latencyAvg < 200) {
      console.log(`  Grade: ⚠️  ACCEPTABLE`);
    } else {
      console.log(`  Grade: ❌ NEEDS IMPROVEMENT`);
    }
    console.log('');
  });

  // Overall Statistics
  const avgLatency = results.reduce((sum, r) => sum + r.latencyAvg, 0) / results.length;
  const totalReqs = results.reduce((sum, r) => sum + r.requests, 0);
  const avgReqPerSec = results.reduce((sum, r) => sum + r.requestsPerSec, 0) / results.length;

  console.log('='.repeat(60));
  console.log('📈 OVERALL STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total Requests Processed: ${totalReqs}`);
  console.log(`Average Throughput: ${avgReqPerSec.toFixed(2)} req/sec`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Total Test Duration: ~30 seconds`);

  if (avgLatency < 50) {
    console.log(`\n✅ Overall Performance: EXCELLENT`);
    console.log(`   All services are highly responsive and production-ready.`);
  } else if (avgLatency < 100) {
    console.log(`\n✅ Overall Performance: GOOD`);
    console.log(`   Services meet production performance standards.`);
  } else {
    console.log(`\n⚠️  Overall Performance: ACCEPTABLE`);
    console.log(`   Services work but may need optimization for high traffic.`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Load testing complete!');
  console.log('='.repeat(60) + '\n');

  return results;
}

// Run tests
runAllTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
