#!/usr/bin/env node

/**
 * Parallel Frontend Testing Orchestrator
 *
 * Runs 5 testing agents simultaneously:
 * - E2E tests
 * - Visual regression
 * - Backend integration
 * - Layout checks
 * - Performance audits
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Parallel Frontend Testing...\n');

const agents = [
  {
    name: 'E2E Tester',
    emoji: '🌐',
    command: 'npx',
    args: ['playwright', 'test', 'tests/e2e'],
    cwd: path.join(__dirname, '../frontend'),
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'Visual Tester',
    emoji: '🎨',
    command: 'npx',
    args: ['playwright', 'test', 'tests/visual'],
    cwd: path.join(__dirname, '../frontend'),
    color: '\x1b[35m', // Magenta
  },
  {
    name: 'Integration Tester',
    emoji: '🔌',
    command: 'npm',
    args: ['run', 'test:integration'],
    cwd: path.join(__dirname, '../frontend'),
    color: '\x1b[33m', // Yellow
  },
  {
    name: 'Layout Tester',
    emoji: '📐',
    command: 'npx',
    args: ['playwright', 'test', 'tests/layout'],
    cwd: path.join(__dirname, '../frontend'),
    color: '\x1b[32m', // Green
  },
  {
    name: 'Performance Tester',
    emoji: '⚡',
    command: 'npm',
    args: ['run', 'test:performance'],
    cwd: path.join(__dirname, '../frontend'),
    color: '\x1b[34m', // Blue
  },
];

const results = {
  passed: [],
  failed: [],
  startTime: Date.now(),
};

let completedAgents = 0;

// Start all agents in parallel
agents.forEach((agent, index) => {
  console.log(`${agent.emoji} Launching ${agent.name}...`);

  const proc = spawn(agent.command, agent.args, {
    cwd: agent.cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  let errors = '';

  proc.stdout.on('data', (data) => {
    const line = data.toString();
    output += line;
    console.log(`${agent.color}[${agent.name}]${'\x1b[0m'} ${line.trim()}`);
  });

  proc.stderr.on('data', (data) => {
    const line = data.toString();
    errors += line;
    console.error(`${agent.color}[${agent.name} ERROR]${'\x1b[0m'} ${line.trim()}`);
  });

  proc.on('close', (code) => {
    completedAgents++;

    if (code === 0) {
      results.passed.push(agent.name);
      console.log(`\n✅ ${agent.emoji} ${agent.name} COMPLETED\n`);
    } else {
      results.failed.push({ name: agent.name, code, errors });
      console.log(`\n❌ ${agent.emoji} ${agent.name} FAILED (exit code ${code})\n`);
    }

    // All agents completed
    if (completedAgents === agents.length) {
      printSummary();
    }
  });

  proc.on('error', (err) => {
    console.error(`\n❌ ${agent.emoji} ${agent.name} ERROR: ${err.message}\n`);
    results.failed.push({ name: agent.name, error: err.message });
    completedAgents++;

    if (completedAgents === agents.length) {
      printSummary();
    }
  });
});

function printSummary() {
  const duration = ((Date.now() - results.startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('🎯 PARALLEL TESTING RESULTS');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Total Duration: ${duration} minutes\n`);

  console.log('✅ PASSED AGENTS:');
  if (results.passed.length > 0) {
    results.passed.forEach(name => console.log(`   ✓ ${name}`));
  } else {
    console.log('   None');
  }

  console.log('\n❌ FAILED AGENTS:');
  if (results.failed.length > 0) {
    results.failed.forEach(item => {
      console.log(`   ✗ ${item.name} (exit code: ${item.code || 'error'})`);
      if (item.errors) {
        console.log(`     Error: ${item.errors.split('\n')[0]}`);
      }
    });
  } else {
    console.log('   None');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${results.passed.length}/${agents.length} agents passed`);
  console.log('='.repeat(60) + '\n');

  // Exit with error if any agent failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Stopping all test agents...\n');
  process.exit(1);
});
