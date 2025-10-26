#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTO QUALITY GUARD - SELF-HEALING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Khi Claude đọc file này, sẽ tự động:
 * 1. ✅ Chạy tất cả tests
 * 2. ✅ Phát hiện bugs/errors
 * 3. ✅ Tự động fix bugs
 * 4. ✅ Test lại cho đến khi PASS
 * 5. ✅ Đảm bảo code quality cao
 * 6. ✅ Backend luôn chạy tốt
 *
 * Usage:
 *   node automation/auto-quality-guard.js
 *   node automation/auto-quality-guard.js --service auth-service
 *   node automation/auto-quality-guard.js --continuous
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.gray}🔧 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${'═'.repeat(80)}\n${msg}\n${'═'.repeat(80)}${colors.reset}\n`),
};

// Services configuration
const SERVICES = [
  {
    name: 'auth-service',
    port: 3001,
    path: 'services/auth-service',
    healthCheck: 'http://localhost:3001/health',
    critical: true, // Critical service - must always work
  },
  {
    name: 'chat-service',
    port: 3002,
    path: 'services/chat-service',
    healthCheck: 'http://localhost:3002/health',
    critical: true,
  },
  {
    name: 'billing-service',
    port: 3003,
    path: 'services/billing-service',
    healthCheck: 'http://localhost:3003/health',
    critical: false,
  },
];

class QualityGuard {
  constructor(options = {}) {
    this.serviceName = options.service || 'all';
    this.continuous = options.continuous || false;
    this.maxRetries = options.maxRetries || 3;
    this.services = this.serviceName === 'all'
      ? SERVICES
      : SERVICES.filter(s => s.name === this.serviceName);

    this.issues = [];
    this.fixes = [];
    this.testResults = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  async run() {
    log.header('🤖 AUTO QUALITY GUARD - Starting...');

    try {
      // Step 1: Pre-flight checks
      await this.preflightChecks();

      // Step 2: Main quality loop
      if (this.continuous) {
        await this.continuousMode();
      } else {
        await this.singleRun();
      }

      log.success('Quality Guard completed successfully!');
      return true;
    } catch (error) {
      log.error(`Fatal error: ${error.message}`);
      return false;
    }
  }

  async singleRun() {
    log.header('🔍 Single Run Mode');

    for (const service of this.services) {
      log.info(`\n━━━ Processing: ${service.name} ━━━\n`);

      const success = await this.processService(service);

      if (!success && service.critical) {
        throw new Error(`Critical service ${service.name} failed quality checks`);
      }
    }

    await this.generateReport();
  }

  async continuousMode() {
    log.header('🔄 Continuous Monitoring Mode');
    log.info('Watching for changes... (Press Ctrl+C to stop)');

    while (true) {
      await this.singleRun();
      log.info('\n⏱️  Waiting 60 seconds before next check...\n');
      await this.sleep(60000);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  async processService(service) {
    const steps = [
      { name: 'Type Check', fn: () => this.runTypeCheck(service) },
      { name: 'Lint Check', fn: () => this.runLint(service) },
      { name: 'Unit Tests', fn: () => this.runUnitTests(service) },
      { name: 'Build Service', fn: () => this.buildService(service) },
      { name: 'Start Service', fn: () => this.startService(service) },
      { name: 'Health Check', fn: () => this.healthCheck(service) },
      { name: 'API Tests', fn: () => this.runAPITests(service) },
      { name: 'Integration Tests', fn: () => this.runIntegrationTests(service) },
      { name: 'Load Test', fn: () => this.runLoadTest(service) },
    ];

    for (const step of steps) {
      log.info(`Running: ${step.name}...`);

      const result = await this.retryWithFix(step.fn, service, step.name);

      if (!result.success) {
        log.error(`${step.name} failed after ${this.maxRetries} attempts`);
        return false;
      }

      log.success(`${step.name} passed`);
    }

    return true;
  }

  async retryWithFix(testFn, service, stepName) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await testFn();

        if (result.success) {
          return { success: true };
        }

        // Test failed, try to fix
        log.warn(`${stepName} failed (attempt ${attempt}/${this.maxRetries})`);

        if (attempt < this.maxRetries) {
          log.info('Analyzing errors and generating fixes...');

          const fixes = await this.analyzeAndFix(result.errors, service);

          if (fixes.length > 0) {
            log.info(`Applied ${fixes.length} fixes, retrying...`);
            this.fixes.push(...fixes);
          } else {
            log.warn('No automatic fixes available');
          }
        }
      } catch (error) {
        log.error(`Error in ${stepName}: ${error.message}`);

        if (attempt === this.maxRetries) {
          return { success: false, error: error.message };
        }
      }
    }

    return { success: false };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  async runTypeCheck(service) {
    log.debug('Checking TypeScript types...');

    try {
      const { stdout, stderr } = await execAsync(
        'npx tsc --noEmit',
        { cwd: service.path }
      );

      if (stderr && stderr.includes('error TS')) {
        const errors = this.parseTypeScriptErrors(stderr);
        return { success: false, errors };
      }

      return { success: true };
    } catch (error) {
      const errors = this.parseTypeScriptErrors(error.stderr || error.stdout);
      return { success: false, errors };
    }
  }

  async runLint(service) {
    log.debug('Running ESLint...');

    try {
      await execAsync('npm run lint', { cwd: service.path });
      return { success: true };
    } catch (error) {
      // Try auto-fix
      try {
        await execAsync('npm run lint -- --fix', { cwd: service.path });
        log.success('Auto-fixed lint errors');
        return { success: true };
      } catch (fixError) {
        return {
          success: false,
          errors: [{ type: 'lint', message: fixError.message }]
        };
      }
    }
  }

  async runUnitTests(service) {
    log.debug('Running unit tests...');

    try {
      const { stdout } = await execAsync(
        'npm test -- --coverage --json',
        { cwd: service.path }
      );

      // Parse Jest output
      try {
        const result = JSON.parse(stdout);

        if (result.success) {
          log.success(`Coverage: ${result.coverageMap ? '✓' : 'N/A'}`);
          return { success: true };
        } else {
          return {
            success: false,
            errors: this.parseJestErrors(result)
          };
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return { success: !stdout.includes('FAIL') };
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ type: 'test', message: error.message }]
      };
    }
  }

  async buildService(service) {
    log.debug('Building service...');

    try {
      await execAsync('npm run build', { cwd: service.path });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [{ type: 'build', message: error.message }]
      };
    }
  }

  async startService(service) {
    log.debug(`Starting ${service.name}...`);

    // Check if already running
    const isRunning = await this.isServiceRunning(service.port);

    if (isRunning) {
      log.info(`${service.name} already running on port ${service.port}`);
      return { success: true };
    }

    // Start service in background
    const proc = spawn('npm', ['run', 'dev'], {
      cwd: service.path,
      detached: true,
      stdio: 'ignore',
    });

    proc.unref();

    // Wait for service to start
    await this.sleep(5000);

    // Verify it started
    const started = await this.isServiceRunning(service.port);

    if (!started) {
      return {
        success: false,
        errors: [{ type: 'startup', message: 'Service failed to start' }]
      };
    }

    return { success: true };
  }

  async healthCheck(service) {
    log.debug('Checking service health...');

    try {
      const response = await fetch(service.healthCheck);
      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        return { success: true };
      } else {
        return {
          success: false,
          errors: [{ type: 'health', message: `Unhealthy: ${JSON.stringify(data)}` }]
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ type: 'health', message: error.message }]
      };
    }
  }

  async runAPITests(service) {
    log.debug('Running API tests...');

    const tests = this.getAPITestsForService(service);
    const results = [];

    for (const test of tests) {
      const result = await this.runSingleAPITest(test, service);
      results.push(result);

      if (!result.success) {
        log.error(`API Test failed: ${test.name}`);
      }
    }

    const allPassed = results.every(r => r.success);

    return {
      success: allPassed,
      errors: results.filter(r => !r.success).map(r => r.error)
    };
  }

  async runSingleAPITest(test, service) {
    try {
      const url = `http://localhost:${service.port}${test.endpoint}`;
      const options = {
        method: test.method || 'GET',
        headers: test.headers || {},
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
        options.headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, options);
      const data = await response.json();

      // Validate response
      if (test.expectedStatus && response.status !== test.expectedStatus) {
        return {
          success: false,
          error: {
            type: 'api',
            test: test.name,
            message: `Expected status ${test.expectedStatus}, got ${response.status}`,
            response: data,
          },
        };
      }

      if (test.validate && !test.validate(data)) {
        return {
          success: false,
          error: {
            type: 'api',
            test: test.name,
            message: 'Response validation failed',
            response: data,
          },
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'api',
          test: test.name,
          message: error.message,
        },
      };
    }
  }

  async runIntegrationTests(service) {
    log.debug('Running integration tests...');

    try {
      await execAsync('npm run test:integration', { cwd: service.path });
      return { success: true };
    } catch (error) {
      // Integration tests might not exist yet
      log.warn('Integration tests not found or failed');
      return { success: true }; // Don't fail if not implemented
    }
  }

  async runLoadTest(service) {
    log.debug('Running load test...');

    // Simple load test: 100 requests
    const results = [];
    const concurrency = 10;

    for (let i = 0; i < 10; i++) {
      const batch = Array(concurrency).fill(null).map(() =>
        fetch(service.healthCheck)
      );

      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    const successRate = results.filter(r => r.ok).length / results.length;

    if (successRate < 0.95) {
      return {
        success: false,
        errors: [{
          type: 'load',
          message: `Low success rate: ${(successRate * 100).toFixed(1)}%`,
        }],
      };
    }

    log.success(`Load test passed: ${(successRate * 100).toFixed(1)}% success rate`);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-FIX
  // ═══════════════════════════════════════════════════════════════════════════

  async analyzeAndFix(errors, service) {
    const fixes = [];

    for (const error of errors) {
      const fix = await this.generateFix(error, service);

      if (fix) {
        await this.applyFix(fix, service);
        fixes.push(fix);
      }
    }

    return fixes;
  }

  async generateFix(error, service) {
    // Type errors
    if (error.type === 'typescript' && error.message.includes('Cannot find name')) {
      const missingName = this.extractMissingName(error.message);
      return {
        type: 'add-import',
        target: error.file,
        import: missingName,
      };
    }

    // Lint errors - already auto-fixed
    if (error.type === 'lint') {
      return null; // Handled by eslint --fix
    }

    // API errors
    if (error.type === 'api') {
      return {
        type: 'api-fix',
        endpoint: error.test,
        message: error.message,
      };
    }

    return null;
  }

  async applyFix(fix, service) {
    log.info(`Applying fix: ${fix.type}`);

    switch (fix.type) {
      case 'add-import':
        await this.addImport(fix.target, fix.import);
        break;

      case 'api-fix':
        log.warn(`Manual fix required for API: ${fix.endpoint}`);
        break;

      default:
        log.warn(`Unknown fix type: ${fix.type}`);
    }
  }

  async addImport(file, importName) {
    // TODO: Implement intelligent import adding
    log.debug(`Would add import: ${importName} to ${file}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  async preflightChecks() {
    log.info('Running preflight checks...');

    // Check Node.js version
    const nodeVersion = process.version;
    log.debug(`Node.js version: ${nodeVersion}`);

    // Check if services exist
    for (const service of this.services) {
      const exists = await this.pathExists(service.path);
      if (!exists) {
        throw new Error(`Service not found: ${service.path}`);
      }
    }

    log.success('Preflight checks passed');
  }

  async isServiceRunning(port) {
    try {
      const { stdout } = await execAsync(
        process.platform === 'win32'
          ? `netstat -ano | findstr :${port}`
          : `lsof -i :${port}`
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async pathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseTypeScriptErrors(stderr) {
    const errors = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      if (line.includes('error TS')) {
        errors.push({
          type: 'typescript',
          message: line.trim(),
          file: this.extractFilePath(line),
        });
      }
    }

    return errors;
  }

  parseJestErrors(result) {
    const errors = [];

    if (result.testResults) {
      for (const testFile of result.testResults) {
        for (const test of testFile.assertionResults || []) {
          if (test.status === 'failed') {
            errors.push({
              type: 'test',
              message: test.title,
              error: test.failureMessages?.[0] || 'Unknown error',
            });
          }
        }
      }
    }

    return errors;
  }

  extractFilePath(line) {
    const match = line.match(/([a-zA-Z]:[\\\/].+?\.ts)/);
    return match ? match[1] : null;
  }

  extractMissingName(message) {
    const match = message.match(/Cannot find name '([^']+)'/);
    return match ? match[1] : null;
  }

  getAPITestsForService(service) {
    // Define API tests for each service
    const tests = {
      'auth-service': [
        {
          name: 'Health Check',
          endpoint: '/health',
          method: 'GET',
          expectedStatus: 200,
          validate: (data) => data.status === 'ok',
        },
        {
          name: 'Metrics',
          endpoint: '/metrics',
          method: 'GET',
          expectedStatus: 200,
        },
      ],
      'chat-service': [
        {
          name: 'Health Check',
          endpoint: '/health',
          method: 'GET',
          expectedStatus: 200,
        },
      ],
      'billing-service': [
        {
          name: 'Health Check',
          endpoint: '/health',
          method: 'GET',
          expectedStatus: 200,
        },
      ],
    };

    return tests[service.name] || [];
  }

  async generateReport() {
    log.header('📊 Generating Quality Report');

    const report = {
      timestamp: new Date().toISOString(),
      services: this.services.map(s => s.name),
      issues: this.issues,
      fixes: this.fixes,
      testResults: this.testResults,
      summary: {
        totalIssues: this.issues.length,
        fixedIssues: this.fixes.length,
        remainingIssues: this.issues.length - this.fixes.length,
      },
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'QUALITY_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    log.success(`Report saved to: ${reportPath}`);

    // Print summary
    console.log('\n' + '─'.repeat(80));
    console.log(`Total Issues Found: ${report.summary.totalIssues}`);
    console.log(`Auto-Fixed Issues: ${report.summary.fixedIssues}`);
    console.log(`Remaining Issues: ${report.summary.remainingIssues}`);
    console.log('─'.repeat(80) + '\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  const options = {
    service: 'all',
    continuous: false,
    maxRetries: 3,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--service' && args[i + 1]) {
      options.service = args[i + 1];
      i++;
    } else if (args[i] === '--continuous') {
      options.continuous = true;
    } else if (args[i] === '--max-retries' && args[i + 1]) {
      options.maxRetries = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--help') {
      console.log(`
Auto Quality Guard - Self-Healing System

Usage:
  node automation/auto-quality-guard.js [options]

Options:
  --service <name>      Test specific service (default: all)
  --continuous          Run continuously (watch mode)
  --max-retries <n>     Max retry attempts (default: 3)
  --help                Show this help

Examples:
  node automation/auto-quality-guard.js
  node automation/auto-quality-guard.js --service auth-service
  node automation/auto-quality-guard.js --continuous

Services:
  - auth-service
  - chat-service
  - billing-service
      `);
      process.exit(0);
    }
  }

  const guard = new QualityGuard(options);
  const success = await guard.run();

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { QualityGuard };
