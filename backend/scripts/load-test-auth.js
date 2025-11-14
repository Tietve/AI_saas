/**
 * Load Test for Auth Service
 * Tests authentication endpoints under load
 */

const autocannon = require('autocannon');

async function runAuthLoadTest() {
  console.log('🔥 Starting Auth Service Load Test...\n');

  // Test 1: Health endpoint
  console.log('Test 1: Health endpoint');
  const healthResult = await autocannon({
    url: 'http://localhost:3001/health',
    connections: 10,
    duration: 10,
    pipelining: 1,
  });

  console.log('\n📊 Health Endpoint Results:');
  console.log(`  Requests: ${healthResult.requests.total}`);
  console.log(`  Throughput: ${healthResult.throughput.total} bytes`);
  console.log(`  Latency avg: ${healthResult.latency.mean}ms`);
  console.log(`  Latency p99: ${healthResult.latency.p99}ms`);
  console.log(`  Success rate: ${(healthResult.non2xx === 0 ? 100 : ((healthResult['2xx'] / healthResult.requests.total) * 100)).toFixed(2)}%\n`);

  // Test 2: Signup endpoint (lighter load due to rate limiting)
  console.log('Test 2: Signup endpoint (rate limited)');
  const signupResult = await autocannon({
    url: 'http://localhost:3001/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `loadtest-${Date.now()}@example.com`,
      password: 'LoadTest123!',
    }),
    connections: 5,
    duration: 5,
  });

  console.log('\n📊 Signup Endpoint Results:');
  console.log(`  Requests: ${signupResult.requests.total}`);
  console.log(`  Latency avg: ${signupResult.latency.mean}ms`);
  console.log(`  Latency p99: ${signupResult.latency.p99}ms`);
  console.log(`  2xx responses: ${signupResult['2xx']}`);
  console.log(`  4xx responses: ${signupResult['4xx']} (expected due to rate limiting)`);
  console.log(`  5xx responses: ${signupResult['5xx']}\n`);

  // Summary
  console.log('✅ Auth Service Load Test Complete\n');
  console.log('Summary:');
  console.log(`  Health endpoint can handle ~${Math.round(healthResult.requests.average)} req/sec`);
  console.log(`  Average latency: ${healthResult.latency.mean}ms`);
  console.log(`  P99 latency: ${healthResult.latency.p99}ms`);

  // Performance assessment
  if (healthResult.latency.mean < 50) {
    console.log('  ✅ Performance: EXCELLENT (avg < 50ms)');
  } else if (healthResult.latency.mean < 100) {
    console.log('  ✅ Performance: GOOD (avg < 100ms)');
  } else if (healthResult.latency.mean < 200) {
    console.log('  ⚠️  Performance: ACCEPTABLE (avg < 200ms)');
  } else {
    console.log('  ❌ Performance: NEEDS IMPROVEMENT (avg > 200ms)');
  }

  return {
    health: healthResult,
    signup: signupResult,
  };
}

// Run the test
runAuthLoadTest()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
