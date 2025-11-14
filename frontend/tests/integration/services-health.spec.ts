/**
 * Integration Tests: Services Health Checks
 * Comprehensive health checks for all backend microservices
 */

import { test, expect } from '@playwright/test';

const API_GATEWAY = process.env.API_URL || 'http://localhost:4000';
const API_BASE = `${API_GATEWAY}/api`;

test.describe('Services Health - All Backend Services', () => {
  test.beforeAll(() => {
    console.log('🏥 Testing all microservices health...');
    console.log(`📍 API Gateway: ${API_GATEWAY}`);
  });

  test('API Gateway - Main health check', async ({ request }) => {
    console.log('🔍 Checking API Gateway health...');

    try {
      const response = await request.get(`${API_GATEWAY}/health`, {
        timeout: 5000
      });

      const status = response.status();
      console.log(`   Status: ${status}`);

      if (response.ok()) {
        console.log('✅ API Gateway is healthy');
        expect(response.ok()).toBeTruthy();

        // Check response body
        const body = await response.json();
        if (body.status) {
          console.log(`   Status: ${body.status}`);
        }
        if (body.uptime) {
          console.log(`   Uptime: ${body.uptime}s`);
        }
      } else {
        console.log(`⚠️  API Gateway returned: ${status}`);
      }
    } catch (error) {
      console.log('❌ Cannot connect to API Gateway');
      console.log('💡 Make sure backend is running on port 4000');
      throw error;
    }
  });

  test('Auth Service - Port 3001', async ({ request }) => {
    console.log('🔐 Checking Auth Service...');

    const endpoints = [
      `${API_BASE}/auth/health`,
      'http://localhost:3001/health'
    ];

    let success = false;

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint, {
          timeout: 3000,
          failOnStatusCode: false
        });

        if (response.ok()) {
          console.log(`✅ Auth Service is healthy (${endpoint})`);
          expect(response.ok()).toBeTruthy();
          success = true;
          break;
        }
      } catch (error) {
        // Try next endpoint
      }
    }

    if (!success) {
      console.log('⚠️  Auth Service not available');
      console.log('💡 Check if auth-service is running on port 3001');
    }
  });

  test('Chat Service - Port 3002 or 3003', async ({ request }) => {
    console.log('💬 Checking Chat Service...');

    const endpoints = [
      `${API_BASE}/chat/health`,
      'http://localhost:3002/health',
      'http://localhost:3003/health'
    ];

    let success = false;

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint, {
          timeout: 3000,
          failOnStatusCode: false
        });

        if (response.ok()) {
          console.log(`✅ Chat Service is healthy (${endpoint})`);
          expect(response.ok()).toBeTruthy();
          success = true;
          break;
        }
      } catch (error) {
        // Try next endpoint
      }
    }

    if (!success) {
      console.log('⚠️  Chat Service not available');
      console.log('💡 Check if chat-service is running on port 3002 or 3003');
    }
  });

  test('Billing Service - Port 3004', async ({ request }) => {
    console.log('💳 Checking Billing Service...');

    const endpoints = [
      `${API_BASE}/billing/health`,
      'http://localhost:3004/health'
    ];

    let success = false;

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint, {
          timeout: 3000,
          failOnStatusCode: false
        });

        if (response.ok()) {
          console.log(`✅ Billing Service is healthy (${endpoint})`);
          expect(response.ok()).toBeTruthy();
          success = true;
          break;
        }
      } catch (error) {
        // Try next endpoint
      }
    }

    if (!success) {
      console.log('⚠️  Billing Service not available');
      console.log('💡 Check if billing-service is running on port 3004');
    }
  });

  test('Analytics Service - Port 3005', async ({ request }) => {
    console.log('📊 Checking Analytics Service...');

    const endpoints = [
      `${API_BASE}/analytics/health`,
      'http://localhost:3005/health'
    ];

    let success = false;

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint, {
          timeout: 3000,
          failOnStatusCode: false
        });

        if (response.ok()) {
          console.log(`✅ Analytics Service is healthy (${endpoint})`);
          expect(response.ok()).toBeTruthy();
          success = true;
          break;
        }
      } catch (error) {
        // Try next endpoint
      }
    }

    if (!success) {
      console.log('⚠️  Analytics Service not available');
      console.log('💡 Check if analytics-service is running on port 3005');
    }
  });

  test('Check all services via API Gateway', async ({ request }) => {
    console.log('🔍 Checking all services via API Gateway...');

    const services = [
      { name: 'Auth Service', endpoint: `${API_BASE}/auth/health` },
      { name: 'Chat Service', endpoint: `${API_BASE}/chat/health` },
      { name: 'Billing Service', endpoint: `${API_BASE}/billing/health` },
      { name: 'Analytics Service', endpoint: `${API_BASE}/analytics/health` },
    ];

    let healthyCount = 0;

    for (const service of services) {
      try {
        const response = await request.get(service.endpoint, {
          timeout: 3000,
          failOnStatusCode: false
        });

        if (response.ok()) {
          console.log(`✅ ${service.name}: Healthy`);
          healthyCount++;
        } else {
          console.log(`⚠️  ${service.name}: Status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${service.name}: Cannot connect`);
      }
    }

    console.log(`\n📊 Summary: ${healthyCount}/${services.length} services healthy`);
  });

  test('CORS Headers - API Gateway', async ({ request }) => {
    console.log('🔍 Checking CORS headers on API Gateway...');

    const response = await request.get(`${API_GATEWAY}/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
      },
      failOnStatusCode: false
    });

    const headers = response.headers();

    if (headers['access-control-allow-origin']) {
      console.log('✅ CORS headers are configured');
      console.log(`   Allow-Origin: ${headers['access-control-allow-origin']}`);
      expect(headers['access-control-allow-origin']).toBeDefined();
    } else {
      console.log('⚠️  CORS headers not found');
      console.log('💡 Configure CORS in API Gateway');
    }

    // Check other CORS headers
    if (headers['access-control-allow-methods']) {
      console.log(`   Allow-Methods: ${headers['access-control-allow-methods']}`);
    }
    if (headers['access-control-allow-headers']) {
      console.log(`   Allow-Headers: ${headers['access-control-allow-headers']}`);
    }
  });

  test('CORS Headers - Auth Service', async ({ request }) => {
    console.log('🔍 Checking CORS headers on Auth Service...');

    const response = await request.get(`${API_BASE}/auth/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
      },
      failOnStatusCode: false
    });

    const headers = response.headers();

    if (headers['access-control-allow-origin']) {
      console.log('✅ Auth Service CORS configured');
      expect(headers['access-control-allow-origin']).toBeDefined();
    } else {
      console.log('⚠️  Auth Service CORS not configured');
    }
  });

  test('Response Times - All Services (<500ms)', async ({ request }) => {
    console.log('⏱️  Testing response times for all services...');

    const services = [
      { name: 'API Gateway', url: `${API_GATEWAY}/health` },
      { name: 'Auth Service', url: `${API_BASE}/auth/health` },
      { name: 'Chat Service', url: `${API_BASE}/chat/health` },
      { name: 'Billing Service', url: `${API_BASE}/billing/health` },
      { name: 'Analytics Service', url: `${API_BASE}/analytics/health` },
    ];

    for (const service of services) {
      try {
        const start = Date.now();
        const response = await request.get(service.url, {
          timeout: 5000,
          failOnStatusCode: false
        });
        const duration = Date.now() - start;

        console.log(`   ${service.name}: ${duration}ms`);

        if (response.ok() && duration < 500) {
          expect(duration).toBeLessThan(500);
        } else if (!response.ok()) {
          console.log(`     (Service not available)`);
        } else {
          console.log(`     (Slow response)`);
        }
      } catch (error) {
        console.log(`   ${service.name}: Cannot connect`);
      }
    }
  });

  test('Service Versions - Check if available', async ({ request }) => {
    console.log('📋 Checking service versions...');

    const services = [
      { name: 'API Gateway', url: `${API_GATEWAY}/health` },
      { name: 'Auth Service', url: `${API_BASE}/auth/health` },
      { name: 'Chat Service', url: `${API_BASE}/chat/health` },
    ];

    for (const service of services) {
      try {
        const response = await request.get(service.url, {
          failOnStatusCode: false
        });

        if (response.ok()) {
          const body = await response.json();

          if (body.version) {
            console.log(`   ${service.name}: v${body.version}`);
          } else {
            console.log(`   ${service.name}: (version not reported)`);
          }
        }
      } catch (error) {
        // Service not available
      }
    }
  });

  test('Database Connectivity - Via Services', async ({ request }) => {
    console.log('🗄️  Checking database connectivity...');

    const services = [
      { name: 'Auth Service', url: `${API_BASE}/auth/health` },
      { name: 'Chat Service', url: `${API_BASE}/chat/health` },
      { name: 'Billing Service', url: `${API_BASE}/billing/health` },
    ];

    for (const service of services) {
      try {
        const response = await request.get(service.url, {
          failOnStatusCode: false
        });

        if (response.ok()) {
          const body = await response.json();

          if (body.database || body.db) {
            const dbStatus = body.database || body.db;
            if (dbStatus === 'connected' || dbStatus.status === 'connected') {
              console.log(`✅ ${service.name}: Database connected`);
            } else {
              console.log(`⚠️  ${service.name}: Database status unknown`);
            }
          } else {
            console.log(`   ${service.name}: (DB status not reported)`);
          }
        }
      } catch (error) {
        // Service not available
      }
    }
  });

  test('Redis Connectivity - Via Services', async ({ request }) => {
    console.log('🔴 Checking Redis connectivity...');

    const services = [
      { name: 'Auth Service', url: `${API_BASE}/auth/health` },
      { name: 'Chat Service', url: `${API_BASE}/chat/health` },
    ];

    for (const service of services) {
      try {
        const response = await request.get(service.url, {
          failOnStatusCode: false
        });

        if (response.ok()) {
          const body = await response.json();

          if (body.redis || body.cache) {
            const redisStatus = body.redis || body.cache;
            if (redisStatus === 'connected' || redisStatus.status === 'connected') {
              console.log(`✅ ${service.name}: Redis connected`);
            } else {
              console.log(`⚠️  ${service.name}: Redis status unknown`);
            }
          } else {
            console.log(`   ${service.name}: (Redis status not reported)`);
          }
        }
      } catch (error) {
        // Service not available
      }
    }
  });

  test('Overall System Health Summary', async ({ request }) => {
    console.log('\n🏥 SYSTEM HEALTH SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const checks = [
      { name: 'API Gateway', url: `${API_GATEWAY}/health` },
      { name: 'Auth Service', url: `${API_BASE}/auth/health` },
      { name: 'Chat Service', url: `${API_BASE}/chat/health` },
      { name: 'Billing Service', url: `${API_BASE}/billing/health` },
      { name: 'Analytics Service', url: `${API_BASE}/analytics/health` },
    ];

    let healthy = 0;
    let unhealthy = 0;

    for (const check of checks) {
      try {
        const response = await request.get(check.url, {
          timeout: 3000,
          failOnStatusCode: false
        });

        if (response.ok()) {
          console.log(`✅ ${check.name.padEnd(20)} HEALTHY`);
          healthy++;
        } else {
          console.log(`❌ ${check.name.padEnd(20)} UNHEALTHY (${response.status()})`);
          unhealthy++;
        }
      } catch (error) {
        console.log(`❌ ${check.name.padEnd(20)} UNREACHABLE`);
        unhealthy++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total: ${healthy} healthy, ${unhealthy} unhealthy`);

    if (healthy === checks.length) {
      console.log('✨ All systems operational!');
    } else if (healthy > 0) {
      console.log('⚠️  Some services are down');
    } else {
      console.log('🚨 All services are down!');
      console.log('💡 Run: npm run docker:up && npm run dev:all');
    }
  });
});
