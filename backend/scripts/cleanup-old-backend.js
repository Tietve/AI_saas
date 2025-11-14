/**
 * Cleanup Old Monolithic Backend
 * Removes all old backend code and outdated documentation
 * Keeps: Frontend, Microservices, New Docs, Infrastructure
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting cleanup of old monolithic backend...\n');

// Files and folders to DELETE
const itemsToDelete = [
  // Old Backend Code
  'src/controllers',
  'src/services',
  'src/repositories',
  'src/middleware', // folder, not middleware.ts file
  'prisma',
  'server.js',
  'instrumentation.ts',
  'src/app/api',
  'src/app/debug-api',

  // Old Documentation (keeping Phase 10-12)
  'AZURE_DEPLOYMENT_FIX.md',
  'AZURE_DEPLOY_CONFIG.md',
  'AZURE_ENV_VAR_FIX.md',
  'BACKEND_ROBUSTNESS_IMPROVEMENTS.md',
  'CLEANUP_ANALYSIS.md',
  'CRITICAL_ISSUE_FOUND.md',
  'CRITICAL_NEXT_STEPS.md',
  'DEBUGGING_TOOLS_SUMMARY.md',
  'DEBUG_API_QUICK_START.md',
  'DEBUG_README.md',
  'DEPLOYMENT_FIX_SUMMARY.md',
  'DEPLOYMENT_INSTRUCTIONS.md',
  'DEPLOYMENT_OPTIMIZATION_SUMMARY.md',
  'DEPLOYMENT_OPTIONS.md',
  'DEPLOYMENT_SUMMARY.md',
  'DEPLOY_SUMMARY.md',
  'FINAL_DEPLOYMENT_CONFIG.md',
  'FINAL_SUMMARY.md',
  'FIXED_TYPE_ERRORS.md',
  'FIXES_APPLIED_SUMMARY.md',
  'FIX_AUTH_SECRET_AZURE.md',
  'FIX_PRISMA_CLI.md',
  'FIX_STORYBOOK_VERSIONS.md',
  'HEALTH_CHECK_FIXES.md',
  'HOW_TO_DEBUG_API.md',
  'HOW_TO_USE_TESTS.md',
  'IMPROVEMENTS_SUMMARY.md',
  'MEMORY_OPTIMIZATION_GUIDE.md',
  'MEMORY_OPTIMIZATION_SUMMARY.md',
  'MICROSERVICES_MIGRATION_GUIDE.md',
  'MULTI_CLOUD_DEPLOYMENT_REPORT.md',
  'PHASE_1_COMPLETE.md',
  'POST_DEPLOY_TEST.md',
  'PRE_COMMIT_CHECKLIST.md',
  'PRISMA_FIX_COMPLETE.md',
  'PRODUCTION_400_ERROR_AUDIT.md',
  'QUICK_FIX_REFERENCE.md',
  'README-MICROSERVICES.md',
  'READY_TO_DEPLOY.md',
  'ROOT_CAUSE_CONFIRMED.md',
  'SOLUTION_FINAL.md',
  'START_HERE_DEBUG.md',
  'TEST_RESULTS_SUMMARY.md',
  'TYPESCRIPT_CACHE_FIXES.md',
  'TYPESCRIPT_PRISMA_FIXES.md',
  'TYPE_CHECK_STATUS.md',
  'URGENT_FIX_STEPS.md',
  'VERCEL_DEPLOY_FIXES.md',
  'VERCEL_DEPLOY_GUIDE.md',
  'WAIT_AND_TEST.md',
  'check-azure-status.md',
  'OPENAI_KEY_UPDATE_SUMMARY.md',
  'SECURITY_TESTING_COMPLETE.md',

  // Old test files
  'check-debug-response.js',
  'diagnose-final.js',
  'test-email.ts',
  'test-health-endpoints.ts',
  'validate-health-fixes.js',
  'verify-deployment-package.js',
  'verify-deployment.js',
  'verify-openai-key-update.js',
  'test-auth-events.js',
  'test-prisma-billing.js',

  // Old cookies/logs
  'billing-test-cookies.txt',
  'chat-cookies.txt',
  'cookies.txt',
  'final-test-cookies.txt',
  'gateway-cookies.txt',
  'phase5-cookies.txt',
  'test-cookies.txt',
  'test-session.txt',
  'trace-cookies.txt',
  'integration-test-output.log',
  'integration-test-output-final.log',
  'quality-guard-output.log',
  'dev.err',
  'dev.err.log',
  'dev.out',
  'dev.out.log',
  'dev2.err.log',
  'dev2.out.log',
  'dev3.err.log',
  'dev3.out.log',
  'dev4.err.log',
  'dev4.out.log',
  'dev5.err.log',
  'dev5.out.log',
  'nul',

  // Old deployment files
  'deploy.zip',
  'web.config',
  'vercel.json',
  '.vercelignore',
  '.deployment',
  '.env.azure',
  '.env.vercel',
  '.env.production',

  // Old infrastructure (replaced by microservices)
  'gateway', // old gateway folder
  'infrastructure', // old infrastructure
  'kubernetes', // old k8s (we have new k8s/)
  'nginx',

  // Postman collections (outdated)
  'AI_SaaS_Day3_Postman_Collection.json',
  'AI_SaaS_Local_Day2.postman_environment.json',
  'AI_SaaS_Local_Day3.postman_environment.json',

  // Old Docker files
  'docker-compose.prod.yml',
  'Dockerfile',

  // Old session docs
  'API_TEST_RESULTS.md',
  'AUTO_QUALITY_GUARD_TEST_RESULTS.md',
  'BUG_FIX_SUMMARY.md',
  'BUGS_FOUND_AND_FIXED.md',
  'CLEANUP_COMPLETE.md',
  'CURRENT_DEPLOYMENT_STATUS.md',
  'CURRENT_STATUS_REPORT.md',
  'DISTRIBUTED_TRACING_COMPLETION.md',
  'DOCUMENTATION_ORGANIZED.md',
  'ERROR_TRACKING_COMPLETION.md',
  'FINAL_SESSION_REPORT.md',
  'FIXES_APPLIED.md',
  'MICROSERVICES_PROGRESS.md',
  'NEXT_PHASES_PLAN.md',
  'PHASE_2_COMPLETED.md',
  'PHASE_3_COMPLETED.md',
  'PHASE_7_PROGRESS.md',
  'PHASE_8_COMPLETE_SUMMARY.md',
  'PHASE_9_COMPLETE.md',
  'PHASE_9_SUMMARY.md',
  'SESSION_SUMMARY.md',
  'QUICK_START_DEPLOYMENT.md',
];

let deletedCount = 0;
let skippedCount = 0;
let errors = [];

function deleteRecursive(filePath) {
  if (fs.existsSync(filePath)) {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.readdirSync(filePath).forEach((file) => {
        deleteRecursive(path.join(filePath, file));
      });
      fs.rmdirSync(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }
}

// Delete items
itemsToDelete.forEach((item) => {
  const fullPath = path.join(process.cwd(), item);

  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.lstatSync(fullPath);
      const type = stats.isDirectory() ? '📁' : '📄';

      deleteRecursive(fullPath);
      console.log(`${type} Deleted: ${item}`);
      deletedCount++;
    } else {
      skippedCount++;
    }
  } catch (error) {
    errors.push({ item, error: error.message });
    console.error(`❌ Error deleting ${item}: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('✅ CLEANUP COMPLETE\n');
console.log(`📊 Summary:`);
console.log(`   - Deleted: ${deletedCount} items`);
console.log(`   - Skipped (not found): ${skippedCount} items`);
console.log(`   - Errors: ${errors.length} items`);

if (errors.length > 0) {
  console.log('\n❌ Errors encountered:');
  errors.forEach(({ item, error }) => {
    console.log(`   - ${item}: ${error}`);
  });
}

console.log('\n🎯 What remains:');
console.log('   ✅ Frontend (src/app, src/components, src/hooks, etc.)');
console.log('   ✅ Microservices (services/, api-gateway/, shared/)');
console.log('   ✅ Infrastructure (docker-compose.microservices.yml, k8s/)');
console.log('   ✅ Current documentation (Phase 10-12, README.md)');
console.log('   ✅ Configuration files (package.json, tsconfig.json, etc.)');

console.log('\n💾 Creating cleanup report...');

// Create cleanup report
const report = {
  timestamp: new Date().toISOString(),
  deletedCount,
  skippedCount,
  errorCount: errors.length,
  deletedItems: itemsToDelete.filter(item =>
    fs.existsSync(path.join(process.cwd(), item)) === false
  ),
  errors: errors
};

fs.writeFileSync(
  path.join(process.cwd(), 'CLEANUP_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Cleanup report saved: CLEANUP_REPORT.json\n');
