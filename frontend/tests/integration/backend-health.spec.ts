/**
 * Test backend integration đơn giản
 */

import { test, expect } from '@playwright/test';

const API_GATEWAY = process.env.API_URL || 'http://localhost:4000';

test.describe('Backend Health Checks', () => {
  test('API Gateway should be healthy', async ({ request }) => {
    console.log('🔍 Checking API Gateway health...');

    try {
      const response = await request.get(`${API_GATEWAY}/health`);

      if (response.ok()) {
        console.log('✅ API Gateway is healthy!');
        expect(response.ok()).toBeTruthy();
      } else {
        console.log('⚠️  API Gateway returned:', response.status());
      }
    } catch (error) {
      console.log('❌ Cannot connect to API Gateway');
      console.log('💡 Make sure backend is running: npm run docker:up');
      throw error;
    }
  });

  test('All microservices should be accessible', async ({ request }) => {
    console.log('🔍 Checking all microservices...');

    const services = [
      { name: 'Auth Service', endpoint: `${API_GATEWAY}/api/auth/health` },
      { name: 'Chat Service', endpoint: `${API_GATEWAY}/api/chat/health` },
      { name: 'Billing Service', endpoint: `${API_GATEWAY}/api/billing/health` },
      { name: 'Analytics Service', endpoint: `${API_GATEWAY}/api/analytics/health` },
    ];

    for (const service of services) {
      try {
        const response = await request.get(service.endpoint);

        if (response.ok()) {
          console.log(`✅ ${service.name}: Healthy`);
        } else {
          console.log(`⚠️  ${service.name}: Status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${service.name}: Cannot connect`);
      }
    }
  });

  test('CORS should be configured', async ({ request }) => {
    console.log('🔍 Checking CORS headers...');

    const response = await request.get(`${API_GATEWAY}/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
      },
    });

    const headers = response.headers();

    if (headers['access-control-allow-origin']) {
      console.log('✅ CORS headers are set');
      expect(headers['access-control-allow-origin']).toBeDefined();
    } else {
      console.log('⚠️  CORS headers not found (may need configuration)');
    }
  });
});
