#!/usr/bin/env node

/**
 * Verify Infrastructure Health
 *
 * This script checks that all infrastructure services are running correctly:
 * - PostgreSQL
 * - MongoDB
 * - Redis
 * - RabbitMQ
 * - Kong Gateway
 * - Prometheus
 * - Grafana
 */

const http = require('http');
const https = require('https');

const SERVICES = [
  {
    name: 'PostgreSQL',
    host: 'localhost',
    port: 5432,
    type: 'tcp',
    critical: true
  },
  {
    name: 'MongoDB',
    host: 'localhost',
    port: 27017,
    type: 'tcp',
    critical: true
  },
  {
    name: 'Redis',
    host: 'localhost',
    port: 6379,
    type: 'tcp',
    critical: true
  },
  {
    name: 'RabbitMQ AMQP',
    host: 'localhost',
    port: 5672,
    type: 'tcp',
    critical: true
  },
  {
    name: 'RabbitMQ Management UI',
    url: 'http://localhost:15672',
    type: 'http',
    critical: false,
    expectedStatus: [200, 401] // 401 is OK (login required)
  },
  {
    name: 'Kong Gateway',
    url: 'http://localhost:8000',
    type: 'http',
    critical: true,
    expectedStatus: [404] // 404 is OK (no routes configured yet)
  },
  {
    name: 'Kong Admin API',
    url: 'http://localhost:8001',
    type: 'http',
    critical: true,
    expectedStatus: [200]
  },
  {
    name: 'Prometheus',
    url: 'http://localhost:9090/-/healthy',
    type: 'http',
    critical: false,
    expectedStatus: [200]
  },
  {
    name: 'Grafana',
    url: 'http://localhost:3100/api/health',
    type: 'http',
    critical: false,
    expectedStatus: [200]
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check TCP port
function checkTCP(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ ok: true });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'Connection timeout' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ ok: false, error: err.message });
    });

    socket.connect(port, host);
  });
}

// Check HTTP endpoint
function checkHTTP(url, expectedStatus = [200], timeout = 3000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Infrastructure-Checker/1.0'
      }
    }, (res) => {
      const statusOk = expectedStatus.includes(res.statusCode);
      resolve({
        ok: statusOk,
        status: res.statusCode,
        ...(!statusOk && {
          error: `Unexpected status code: ${res.statusCode} (expected: ${expectedStatus.join(', ')})`
        })
      });
      res.resume(); // Consume response
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Request timeout' });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
  });
}

async function checkService(service) {
  const startTime = Date.now();

  let result;
  if (service.type === 'tcp') {
    result = await checkTCP(service.host, service.port);
  } else if (service.type === 'http') {
    result = await checkHTTP(service.url, service.expectedStatus);
  }

  const latency = Date.now() - startTime;

  return {
    ...service,
    ...result,
    latency
  };
}

async function main() {
  log('\n🔍 Checking Infrastructure Health...\n', 'blue');

  const results = await Promise.all(
    SERVICES.map(service => checkService(service))
  );

  let allOk = true;
  let criticalFailed = false;

  // Display results
  for (const result of results) {
    const icon = result.ok ? '✅' : '❌';
    const color = result.ok ? 'green' : (result.critical ? 'red' : 'yellow');
    const statusText = result.ok ? 'OK' : 'FAILED';
    const latencyText = result.latency ? ` (${result.latency}ms)` : '';
    const errorText = result.error ? ` - ${result.error}` : '';

    log(`${icon} ${result.name}: ${statusText}${latencyText}${errorText}`, color);

    if (!result.ok) {
      allOk = false;
      if (result.critical) {
        criticalFailed = true;
      }
    }
  }

  // Summary
  log('\n' + '─'.repeat(50), 'cyan');

  const totalServices = results.length;
  const passedServices = results.filter(r => r.ok).length;
  const failedServices = totalServices - passedServices;
  const criticalServices = results.filter(r => r.critical).length;
  const criticalPassed = results.filter(r => r.critical && r.ok).length;

  log(`\n📊 Summary:`, 'cyan');
  log(`   Total: ${totalServices} services`);
  log(`   Passed: ${passedServices}/${totalServices}`, passedServices === totalServices ? 'green' : 'yellow');
  log(`   Failed: ${failedServices}/${totalServices}`, failedServices === 0 ? 'green' : 'red');
  log(`   Critical: ${criticalPassed}/${criticalServices}`, criticalPassed === criticalServices ? 'green' : 'red');

  // Recommendations
  if (!allOk) {
    log('\n⚠️  Some services are not running!', 'yellow');
    log('\nTo start infrastructure:', 'cyan');
    log('  npm run dev:infra', 'cyan');
    log('  # or', 'cyan');
    log('  docker-compose -f docker-compose.microservices.yml up -d', 'cyan');

    if (criticalFailed) {
      log('\n❌ Critical services are down! Cannot proceed with migration.', 'red');
      process.exit(1);
    } else {
      log('\n⚠️  Non-critical services are down. You can proceed but some features may not work.', 'yellow');
      process.exit(0);
    }
  } else {
    log('\n✅ All services are healthy!', 'green');
    log('\n🚀 Ready to start migration:', 'cyan');
    log('  npm run migrate:auth', 'cyan');
    log('  # or migrate all services:', 'cyan');
    log('  npm run migrate:all', 'cyan');
    process.exit(0);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
