#!/usr/bin/env node

/**
 * Project Cleanup Script
 *
 * Automatically move legacy/unnecessary files to archive
 * and reorganize project structure for microservices
 */

const fs = require('fs').promises;
const path = require('path');

const ROOT = process.cwd();

// Files to archive (move to archive/)
const ARCHIVE_MAP = {
  'archive/docs/azure': [
    'AZURE_DEPLOYMENT_FIX.md',
    'AZURE_DEPLOY_CONFIG.md',
    'AZURE_ENV_VAR_FIX.md',
    'DEPLOYMENT_FIX_SUMMARY.md',
    'DEPLOYMENT_INSTRUCTIONS.md',
    'DEPLOYMENT_OPTIMIZATION_SUMMARY.md',
    'DEPLOYMENT_OPTIONS.md',
    'DEPLOYMENT_SUMMARY.md',
    'DEPLOY_SUMMARY.md',
    'FINAL_DEPLOYMENT_CONFIG.md',
    'FIX_AUTH_SECRET_AZURE.md',
    'ROOT_CAUSE_CONFIRMED.md',
    'URGENT_FIX_STEPS.md',
    'WAIT_AND_TEST.md',
    'check-azure-status.md'
  ],
  'archive/docs/debugging': [
    '.debug-tools-info.md',
    'DEBUG_API_QUICK_START.md',
    'DEBUG_README.md',
    'DEBUGGING_TOOLS_SUMMARY.md',
    'HOW_TO_DEBUG_API.md',
    'START_HERE_DEBUG.md',
    'CRITICAL_ISSUE_FOUND.md',
    'CRITICAL_NEXT_STEPS.md',
    'HEALTH_CHECK_FIXES.md'
  ],
  'archive/docs/fixes': [
    'FIXED_TYPE_ERRORS.md',
    'FIXES_APPLIED_SUMMARY.md',
    'FIX_PRISMA_CLI.md',
    'FIX_STORYBOOK_VERSIONS.md',
    'TYPESCRIPT_CACHE_FIXES.md',
    'TYPESCRIPT_PRISMA_FIXES.md',
    'TYPE_CHECK_STATUS.md',
    'PRE_COMMIT_CHECKLIST.md',
    'QUICK_FIX_REFERENCE.md'
  ],
  'archive/docs/production-issues': [
    'PRODUCTION_400_ERROR_AUDIT.md',
    'ABSOLUTE_FINAL_SUMMARY.md',
    'FINAL_SUMMARY.md',
    'SOLUTION_FINAL.md'
  ],
  'archive/docs/historical': [
    'BACKEND_ROBUSTNESS_IMPROVEMENTS.md',
    'IMPROVEMENTS_SUMMARY.md',
    'MEMORY_OPTIMIZATION_GUIDE.md',
    'MEMORY_OPTIMIZATION_SUMMARY.md',
    'MULTI_CLOUD_DEPLOYMENT_REPORT.md',
    'VERCEL_DEPLOY_FIXES.md',
    'VERCEL_DEPLOY_GUIDE.md',
    'PRISMA_FIX_COMPLETE.md',
    'READY_TO_DEPLOY.md',
    'TEST_RESULTS_SUMMARY.md',
    'POST_DEPLOY_TEST.md'
  ],
  'archive/scripts/azure': [
    'check-azure-env.ps1',
    'check-azure-logs.ps1',
    'check-deployed-code.ps1',
    'deploy-azure-fix.ps1',
    'deploy-azure-standalone.ps1',
    'test-azure-health.ps1',
    'test-azure-signup.ps1',
    'test-azure-curl.sh',
    'set-auth-secret.ps1'
  ],
  'archive/scripts/testing': [
    'diagnose-final.js',
    'check-debug-response.js',
    'test-code-version.js',
    'test-messages-direct.js',
    'test-specific-conversation.js',
    'test-and-watch-logs.ps1',
    'test-api-errors.ps1',
    'test-build-local.ps1',
    'test-fixes.ps1',
    'test-typescript-fixes.ps1'
  ],
  'archive/scripts/deployment': [
    'verify-deployment.js',
    'verify-deployment-package.js',
    'validate-health-fixes.js',
    'verify-and-test.ps1'
  ]
};

// Files to move to new organized locations
const MOVE_MAP = {
  'scripts/testing': [
    'test-email.ts',
    'test-existing-user.js',
    'test-health-endpoints.ts'
  ],
  'infrastructure/scripts': [
    'fix-database-now.ps1',
    'run-prisma-migration.ps1',
    'safe-create-tables.ps1'
  ],
  'docs': [
    'MICROSERVICES_MIGRATION_GUIDE.md',
    'PHASE_1_COMPLETE.md',
    'README-MICROSERVICES.md',
    'CLEANUP_ANALYSIS.md',
    'HOW_TO_USE_TESTS.md'
  ]
};

// Files to keep in root (no action needed)
const KEEP_IN_ROOT = [
  'README.md',
  'CHANGELOG.md',
  'package.json',
  'package-lock.json',
  'package-microservices.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'docker-compose.yml',
  'docker-compose.prod.yml',
  'docker-compose.microservices.yml',
  'Dockerfile',
  'jest.config.js',
  'jest.setup.js',
  '.env',
  '.env.example',
  '.env.production',
  '.gitignore',
  '.npmrc',
  'server.js',
  'verify-infrastructure.js',
  'instrumentation.ts',
  'next-env.d.ts',
  'vercel.json',
  'web.config',
  'components.json',
  'vitest.config.ts',
  'vitest.shims.d.ts',
  'sentry.client.config.ts',
  'sentry.edge.config.ts',
  'sentry.server.config.ts'
];

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function moveFile(source, destination) {
  const sourcePath = path.join(ROOT, source);
  const destPath = path.join(ROOT, destination);

  if (await fileExists(sourcePath)) {
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.rename(sourcePath, destPath);
      return true;
    } catch (error) {
      console.error(`Error moving ${source}: ${error.message}`);
      return false;
    }
  }
  return false;
}

async function cleanup() {
  log('\n🧹 Starting Project Cleanup...\n', 'blue');

  let movedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  // Archive files
  log('📦 Archiving legacy files...', 'cyan');
  for (const [destDir, files] of Object.entries(ARCHIVE_MAP)) {
    log(`\n  → ${destDir}/`, 'yellow');

    for (const file of files) {
      const dest = path.join(destDir, file);
      const moved = await moveFile(file, dest);

      if (moved) {
        log(`    ✓ ${file}`, 'green');
        movedCount++;
      } else {
        log(`    ⚠ ${file} (not found)`, 'yellow');
        notFoundCount++;
      }
    }
  }

  // Reorganize keeper files
  log('\n📁 Reorganizing keeper files...', 'cyan');
  for (const [destDir, files] of Object.entries(MOVE_MAP)) {
    log(`\n  → ${destDir}/`, 'yellow');

    for (const file of files) {
      const dest = path.join(destDir, file);
      const moved = await moveFile(file, dest);

      if (moved) {
        log(`    ✓ ${file}`, 'green');
        movedCount++;
      } else {
        log(`    ⚠ ${file} (not found)`, 'yellow');
        notFoundCount++;
      }
    }
  }

  // Summary
  log('\n' + '─'.repeat(50), 'cyan');
  log(`\n📊 Cleanup Summary:`, 'cyan');
  log(`   Moved: ${movedCount} files`, 'green');
  log(`   Not found: ${notFoundCount} files`, 'yellow');
  log(`   Errors: ${errorCount} files`, errorCount > 0 ? 'red' : 'green');

  log(`\n✅ Cleanup complete!`, 'green');
  log(`\n📁 Project structure is now organized for microservices`, 'cyan');
  log(`\n💡 Next steps:`, 'blue');
  log(`   1. Review changes: git status`, 'cyan');
  log(`   2. Update README.md`, 'cyan');
  log(`   3. Commit cleanup: git commit -m "chore: cleanup project structure"`, 'cyan');
  log(`   4. Start Phase 2: npm run migrate:auth\n`, 'cyan');
}

// Execute
cleanup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
