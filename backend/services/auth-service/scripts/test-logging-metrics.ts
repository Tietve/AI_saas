/**
 * Test script to verify logging and metrics are working correctly
 *
 * Usage:
 *   npx tsx scripts/test-logging-metrics.ts
 */

import { logger } from '../src/config/logger';
import { metrics } from '../src/config/metrics';

async function testLogging() {
  console.log('\n=== Testing Structured Logging ===\n');

  // Test different log levels
  logger.debug({ test: 'debug' }, 'Debug message (only in LOG_LEVEL=debug)');
  logger.info({ test: 'info', userId: '12345' }, 'Info message with context');
  logger.warn({ test: 'warn', warning: 'potential issue' }, 'Warning message');

  // Test error logging (should send to Sentry if SENTRY_DSN is set)
  const testError = new Error('Test error for Sentry verification');
  logger.error({ err: testError, context: 'test' }, 'Error message (check Sentry)');

  console.log('\n✅ Logging test complete\n');
}

async function testMetrics() {
  console.log('\n=== Testing Metrics Collection ===\n');

  // Track some test metrics
  metrics.trackSignup('web');
  metrics.trackSignup('mobile');
  metrics.trackLogin('password');
  metrics.trackLogin('oauth');

  // Simulate some AI token usage
  metrics.trackAITokens(100, 'gpt-4', 'user-123');
  metrics.trackAITokens(50, 'gpt-3.5-turbo', 'user-456');

  // Update gauge metrics
  metrics.updateActiveSessions(42);
  metrics.updateDatabaseConnections(10);
  metrics.updateRedisConnections(5);

  console.log('✅ Metrics incremented\n');

  // Get and display metrics
  console.log('=== Current Metrics ===\n');
  const metricsData = await metrics.getMetrics();

  // Filter to show only our custom metrics
  const lines = metricsData.split('\n');
  const customMetrics = lines.filter(line =>
    line.includes('user_signups') ||
    line.includes('user_logins') ||
    line.includes('ai_tokens') ||
    line.includes('active_sessions') ||
    line.includes('database_connections')
  );

  console.log(customMetrics.join('\n'));
  console.log('\n✅ Metrics test complete\n');
}

async function testSentryIntegration() {
  console.log('\n=== Testing Sentry Integration ===\n');

  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  SENTRY_DSN not set - Sentry integration not active');
    console.log('   Set SENTRY_DSN in .env to enable error reporting\n');
    return;
  }

  console.log('✅ SENTRY_DSN is configured');
  console.log('   Logging an error - check your Sentry dashboard in ~30 seconds\n');

  // Log a test error
  const sentryTestError = new Error('Test error from test-logging-metrics.ts');
  sentryTestError.stack = 'This is a test error to verify Sentry integration';

  logger.error({
    err: sentryTestError,
    testId: Date.now(),
    environment: process.env.NODE_ENV
  }, 'Sentry integration test error');

  console.log('✅ Error logged - check Sentry for event\n');
}

async function testEnvironment() {
  console.log('\n=== Environment Configuration ===\n');

  const config = {
    'NODE_ENV': process.env.NODE_ENV || 'not set',
    'LOG_LEVEL': process.env.LOG_LEVEL || 'not set (default: info)',
    'SENTRY_DSN': process.env.SENTRY_DSN ? 'configured ✅' : 'not set ⚠️'
  };

  Object.entries(config).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Auth-Service Logging & Metrics Verification Test  ║');
  console.log('╚════════════════════════════════════════════════════╝');

  try {
    await testEnvironment();
    await testLogging();
    await testMetrics();
    await testSentryIntegration();

    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  ✅ All tests passed!                         ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('1. Check logs are structured JSON (if NODE_ENV=production)');
    console.log('2. Verify metrics at: curl http://localhost:3001/metrics');
    console.log('3. Check Sentry dashboard for test error event');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
