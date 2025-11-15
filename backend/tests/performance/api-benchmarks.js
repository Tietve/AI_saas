/**
 * API Response Time Benchmarks (k6)
 *
 * Tests API endpoint performance with realistic load patterns
 * Targets: Auth < 100ms, Chat < 500ms, Documents < 3s
 *
 * Usage:
 *   k6 run api-benchmarks.js
 *   k6 run --vus 10 --duration 30s api-benchmarks.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const authResponseTime = new Trend('auth_response_time');
const chatResponseTime = new Trend('chat_response_time');
const documentResponseTime = new Trend('document_response_time');
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:4000';
const API_KEY = __ENV.API_KEY || '';

// Load test stages
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Spike to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests < 500ms
    'auth_response_time': ['p(95)<100'], // Auth endpoints < 100ms
    'chat_response_time': ['p(95)<500'], // Chat endpoints < 500ms
    'document_response_time': ['p(95)<3000'], // Document endpoints < 3s
    'errors': ['rate<0.05'], // Error rate < 5%
  },
};

// Test data
let authToken = '';
let userId = '';
let chatId = '';

export function setup() {
  // Register test user
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    username: `testuser${Date.now()}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const registerData = registerRes.json();

  return {
    token: registerData.token || registerData.data?.token,
    userId: registerData.user?.id || registerData.data?.user?.id,
  };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // AUTH ENDPOINTS BENCHMARK
  group('Auth Endpoints', function() {
    // Login (should be < 100ms)
    group('POST /auth/login', function() {
      const start = Date.now();
      const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: `test@example.com`,
        password: 'Test123!@#',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      const duration = Date.now() - start;
      authResponseTime.add(duration);

      check(res, {
        'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'login response time < 100ms': (r) => duration < 100,
        'login has token': (r) => {
          try {
            const body = r.json();
            return body.token || body.data?.token;
          } catch(e) {
            return false;
          }
        },
      }) || errorRate.add(1);
    });

    // Refresh token (should be < 100ms)
    group('POST /auth/refresh', function() {
      const start = Date.now();
      const res = http.post(`${BASE_URL}/api/auth/refresh`, null, { headers });

      const duration = Date.now() - start;
      authResponseTime.add(duration);

      check(res, {
        'refresh status is 200': (r) => r.status === 200,
        'refresh response time < 100ms': (r) => duration < 100,
      }) || errorRate.add(1);
    });

    // Get current user (should be < 100ms)
    group('GET /auth/me', function() {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/auth/me`, { headers });

      const duration = Date.now() - start;
      authResponseTime.add(duration);

      check(res, {
        'me status is 200': (r) => r.status === 200,
        'me response time < 100ms': (r) => duration < 100,
      }) || errorRate.add(1);
    });
  });

  // CHAT ENDPOINTS BENCHMARK
  group('Chat Endpoints', function() {
    // Create chat (should be < 500ms)
    group('POST /chat/conversations', function() {
      const start = Date.now();
      const res = http.post(`${BASE_URL}/api/chat/conversations`, JSON.stringify({
        title: `Benchmark Chat ${Date.now()}`,
      }), { headers });

      const duration = Date.now() - start;
      chatResponseTime.add(duration);

      const success = check(res, {
        'create chat status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'create chat response time < 500ms': (r) => duration < 500,
      });

      if (success && res.status < 400) {
        try {
          const body = res.json();
          chatId = body.id || body.data?.id;
        } catch(e) {}
      } else {
        errorRate.add(1);
      }
    });

    // Send message (should be < 500ms)
    if (chatId) {
      group('POST /chat/messages', function() {
        const start = Date.now();
        const res = http.post(`${BASE_URL}/api/chat/conversations/${chatId}/messages`, JSON.stringify({
          content: 'What is the capital of France?',
          role: 'user',
        }), { headers });

        const duration = Date.now() - start;
        chatResponseTime.add(duration);

        check(res, {
          'send message status is 200 or 201': (r) => r.status === 200 || r.status === 201,
          'send message response time < 500ms': (r) => duration < 500,
        }) || errorRate.add(1);
      });

      // Get conversation history (should be < 500ms)
      group('GET /chat/conversations/:id', function() {
        const start = Date.now();
        const res = http.get(`${BASE_URL}/api/chat/conversations/${chatId}`, { headers });

        const duration = Date.now() - start;
        chatResponseTime.add(duration);

        check(res, {
          'get conversation status is 200': (r) => r.status === 200,
          'get conversation response time < 500ms': (r) => duration < 500,
        }) || errorRate.add(1);
      });
    }

    // List conversations (should be < 500ms)
    group('GET /chat/conversations', function() {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/chat/conversations`, { headers });

      const duration = Date.now() - start;
      chatResponseTime.add(duration);

      check(res, {
        'list conversations status is 200': (r) => r.status === 200,
        'list conversations response time < 500ms': (r) => duration < 500,
      }) || errorRate.add(1);
    });
  });

  // DOCUMENT ENDPOINTS BENCHMARK
  group('Document Endpoints', function() {
    // Note: Document upload requires multipart/form-data
    // This is a simplified version for benchmarking

    // Query document (should be < 3s)
    group('POST /documents/query', function() {
      const start = Date.now();
      const res = http.post(`${BASE_URL}/api/documents/query`, JSON.stringify({
        query: 'What is machine learning?',
        conversationId: chatId,
      }), { headers });

      const duration = Date.now() - start;
      documentResponseTime.add(duration);

      check(res, {
        'query document status is 200 or 404': (r) => r.status === 200 || r.status === 404,
        'query document response time < 3000ms': (r) => duration < 3000,
      }) || errorRate.add(1);
    });

    // List documents (should be < 500ms)
    group('GET /documents', function() {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/documents`, { headers });

      const duration = Date.now() - start;
      chatResponseTime.add(duration);

      check(res, {
        'list documents status is 200': (r) => r.status === 200,
        'list documents response time < 500ms': (r) => duration < 500,
      }) || errorRate.add(1);
    });
  });

  // Track successful requests
  successfulRequests.add(1);

  // Think time between iterations
  sleep(1);
}

export function teardown(data) {
  // Cleanup test data (optional)
  console.log('Benchmark complete!');
}

export function handleSummary(data) {
  return {
    'performance-results/api-benchmark-summary.json': JSON.stringify(data, null, 2),
    'performance-results/api-benchmark-summary.html': htmlReport(data),
  };
}

function htmlReport(data) {
  const metrics = data.metrics;

  return `
<!DOCTYPE html>
<html>
<head>
  <title>API Performance Benchmark Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    .metric { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
    .metric.warning { border-left-color: #ff9800; }
    .metric.error { border-left-color: #f44336; }
    .metric-name { font-weight: bold; font-size: 18px; }
    .metric-value { font-size: 24px; color: #333; margin: 5px 0; }
    .percentiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
    .percentile { background: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    .pass { color: #4CAF50; font-weight: bold; }
    .fail { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>API Performance Benchmark Results</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Base URL:</strong> ${BASE_URL}</p>

    <h2>Summary</h2>
    <div class="metric">
      <div class="metric-name">Total Requests</div>
      <div class="metric-value">${metrics.http_reqs?.count || 0}</div>
    </div>

    <div class="metric ${(metrics.errors?.values?.rate || 0) > 0.05 ? 'error' : ''}">
      <div class="metric-name">Error Rate</div>
      <div class="metric-value">${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%</div>
      <div>Target: < 5%</div>
    </div>

    <h2>Response Time Breakdown</h2>

    <div class="metric ${(metrics.auth_response_time?.values?.['p(95)'] || 0) > 100 ? 'warning' : ''}">
      <div class="metric-name">Auth Endpoints</div>
      <div class="percentiles">
        <div class="percentile">
          <div>Avg</div>
          <div><strong>${(metrics.auth_response_time?.values?.avg || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P50</div>
          <div><strong>${(metrics.auth_response_time?.values?.['p(50)'] || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P95</div>
          <div><strong>${(metrics.auth_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P99</div>
          <div><strong>${(metrics.auth_response_time?.values?.['p(99)'] || 0).toFixed(2)}ms</strong></div>
        </div>
      </div>
      <div>Target: P95 < 100ms</div>
    </div>

    <div class="metric ${(metrics.chat_response_time?.values?.['p(95)'] || 0) > 500 ? 'warning' : ''}">
      <div class="metric-name">Chat Endpoints</div>
      <div class="percentiles">
        <div class="percentile">
          <div>Avg</div>
          <div><strong>${(metrics.chat_response_time?.values?.avg || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P50</div>
          <div><strong>${(metrics.chat_response_time?.values?.['p(50)'] || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P95</div>
          <div><strong>${(metrics.chat_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P99</div>
          <div><strong>${(metrics.chat_response_time?.values?.['p(99)'] || 0).toFixed(2)}ms</strong></div>
        </div>
      </div>
      <div>Target: P95 < 500ms</div>
    </div>

    <div class="metric ${(metrics.document_response_time?.values?.['p(95)'] || 0) > 3000 ? 'warning' : ''}">
      <div class="metric-name">Document Endpoints</div>
      <div class="percentiles">
        <div class="percentile">
          <div>Avg</div>
          <div><strong>${(metrics.document_response_time?.values?.avg || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P50</div>
          <div><strong>${(metrics.document_response_time?.values?.['p(50)'] || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P95</div>
          <div><strong>${(metrics.document_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms</strong></div>
        </div>
        <div class="percentile">
          <div>P99</div>
          <div><strong>${(metrics.document_response_time?.values?.['p(99)'] || 0).toFixed(2)}ms</strong></div>
        </div>
      </div>
      <div>Target: P95 < 3000ms</div>
    </div>

    <h2>Threshold Status</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Target</th>
          <th>Actual</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>HTTP Request Duration (P95)</td>
          <td>< 500ms</td>
          <td>${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms</td>
          <td class="${(metrics.http_req_duration?.values?.['p(95)'] || 0) < 500 ? 'pass' : 'fail'}">
            ${(metrics.http_req_duration?.values?.['p(95)'] || 0) < 500 ? '✓ PASS' : '✗ FAIL'}
          </td>
        </tr>
        <tr>
          <td>Auth Response Time (P95)</td>
          <td>< 100ms</td>
          <td>${(metrics.auth_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms</td>
          <td class="${(metrics.auth_response_time?.values?.['p(95)'] || 0) < 100 ? 'pass' : 'fail'}">
            ${(metrics.auth_response_time?.values?.['p(95)'] || 0) < 100 ? '✓ PASS' : '✗ FAIL'}
          </td>
        </tr>
        <tr>
          <td>Chat Response Time (P95)</td>
          <td>< 500ms</td>
          <td>${(metrics.chat_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms</td>
          <td class="${(metrics.chat_response_time?.values?.['p(95)'] || 0) < 500 ? 'pass' : 'fail'}">
            ${(metrics.chat_response_time?.values?.['p(95)'] || 0) < 500 ? '✓ PASS' : '✗ FAIL'}
          </td>
        </tr>
        <tr>
          <td>Document Response Time (P95)</td>
          <td>< 3000ms</td>
          <td>${(metrics.document_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms</td>
          <td class="${(metrics.document_response_time?.values?.['p(95)'] || 0) < 3000 ? 'pass' : 'fail'}">
            ${(metrics.document_response_time?.values?.['p(95)'] || 0) < 3000 ? '✓ PASS' : '✗ FAIL'}
          </td>
        </tr>
        <tr>
          <td>Error Rate</td>
          <td>< 5%</td>
          <td>${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%</td>
          <td class="${(metrics.errors?.values?.rate || 0) < 0.05 ? 'pass' : 'fail'}">
            ${(metrics.errors?.values?.rate || 0) < 0.05 ? '✓ PASS' : '✗ FAIL'}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `.trim();
}
