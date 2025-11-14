/**
 * K6 Load Test Script
 *
 * FREE load testing tool: https://k6.io/
 *
 * Installation:
 *   - Windows: choco install k6 OR download from https://k6.io/docs/get-started/installation/
 *   - macOS: brew install k6
 *   - Linux: sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6
 *
 * Usage:
 *   k6 run scripts/load-test.js
 *
 * Test scenarios:
 *   - Smoke test: 1 user for 30s
 *   - Load test: Ramp to 100 users over 5 minutes
 *   - Stress test: Ramp to 200 users to find breaking point
 *   - Spike test: Sudden traffic spike
 *
 * Cost: $0 (completely free!)
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  // Scenarios for different test types
  scenarios: {
    // Smoke test - verify system works with minimal load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
      exec: 'smokeTest',
    },

    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 }, // Ramp up to 50 users
        { duration: '5m', target: 50 }, // Stay at 50 for 5 min
        { duration: '2m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 for 5 min
        { duration: '2m', target: 0 }, // Ramp down to 0
      ],
      tags: { test_type: 'load' },
      exec: 'loadTest',
      startTime: '30s', // Start after smoke test
    },

    // Stress test - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'stress' },
      exec: 'stressTest',
      startTime: '16m', // Start after load test
    },
  },

  // Thresholds - test will fail if these are not met
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'], // Error rate must be below 5%
    errors: ['rate<0.05'], // Custom error rate below 5%
  },
}

// Base URL - change this to your production or staging URL
const BASE_URL = __ENV.BASE_URL || 'https://www.firbox.net'

// Smoke test function
export function smokeTest() {
  const res = http.get(`${BASE_URL}/api/health`)

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has ok field': (r) => JSON.parse(r.body).ok !== undefined,
  }) || errorRate.add(1)

  sleep(1)
}

// Load test function - simulates realistic user behavior
export function loadTest() {
  // Health check
  let res = http.get(`${BASE_URL}/api/health`)
  check(res, {
    'health check OK': (r) => r.status === 200,
  }) || errorRate.add(1)

  sleep(Math.random() * 3) // Random wait 0-3s

  // Try to access home page
  res = http.get(`${BASE_URL}/`)
  check(res, {
    'homepage loads': (r) => r.status === 200,
  }) || errorRate.add(1)

  sleep(Math.random() * 5)

  // API version check
  res = http.get(`${BASE_URL}/api/v1/health`)
  check(res, {
    'v1 health check OK': (r) => r.status === 200,
    'has version header': (r) => r.headers['X-Api-Version'] !== undefined,
  }) || errorRate.add(1)

  sleep(Math.random() * 10) // Realistic user "reading" time
}

// Stress test function - more aggressive
export function stressTest() {
  const endpoints = [
    '/api/health',
    '/api/v1/health',
    '/',
    '/auth/signin',
  ]

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
  const res = http.get(`${BASE_URL}${endpoint}`)

  check(res, {
    'status is < 500': (r) => r.status < 500,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
  }) || errorRate.add(1)

  sleep(Math.random() * 2) // Shorter sleep for stress test
}

// Setup function - runs once at start
export function setup() {
  console.log(`🚀 Starting load test against ${BASE_URL}`)
  console.log('Test scenarios: Smoke → Load → Stress')

  // Verify server is reachable
  const res = http.get(`${BASE_URL}/api/health`)
  if (res.status !== 200) {
    throw new Error(`Server not reachable: ${res.status}`)
  }

  console.log('✅ Server reachable, starting tests...')
  return { baseUrl: BASE_URL }
}

// Teardown function - runs once at end
export function teardown(data) {
  console.log('✅ Load test completed')
  console.log(`Tested against: ${data.baseUrl}`)
}

/**
 * Run specific test scenarios:
 *
 * Smoke test only (quick check):
 *   k6 run --scenarios smoke scripts/load-test.js
 *
 * Load test only (realistic traffic):
 *   k6 run --scenarios load scripts/load-test.js
 *
 * Stress test only (find limits):
 *   k6 run --scenarios stress scripts/load-test.js
 *
 * Custom URL:
 *   BASE_URL=https://staging.firbox.net k6 run scripts/load-test.js
 *
 * Generate HTML report:
 *   k6 run --out json=results.json scripts/load-test.js
 *   k6 run --out csv=results.csv scripts/load-test.js
 */
