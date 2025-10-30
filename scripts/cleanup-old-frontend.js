/**
 * Cleanup Old Frontend
 * Removes old Next.js frontend code
 * Keeps: Config files, Backend, Documentation
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting cleanup of old frontend...\n');

// Files and folders to DELETE
const itemsToDelete = [
  // Frontend Code
  'src/app',
  'src/components',
  'src/hooks',
  'src/lib',
  'src/styles',
  'src/types',
  'src/config',
  'src/middleware.ts',
  'public',

  // Frontend specific folders
  '.next',
  '.storybook',
  '__tests__',

  // Frontend config files (will recreate for new frontend)
  'next-env.d.ts',
  'postcss.config.js',
  'tailwind.config.ts',
  'components.json',

  // Old test configs
  'jest.config.js',
  'jest.setup.js',
  'vitest.config.ts',
  'vitest.shims.d.ts',

  // Sentry configs (old)
  'sentry.client.config.ts',
  'sentry.edge.config.ts',
  'sentry.server.config.ts',

  // Old Next.js config
  'next.config.js',

  // Old env files (keep main .env)
  '.env.example',
  '.env.docker.example',

  // TypeScript build artifacts
  'tsconfig.tsbuildinfo',

  // Old patches
  'patches',

  // Old changelog (frontend specific)
  'CHANGELOG.md',
  'CLAUDE.md',
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

// Delete src/ folder if empty
const srcPath = path.join(process.cwd(), 'src');
if (fs.existsSync(srcPath)) {
  const srcFiles = fs.readdirSync(srcPath);
  if (srcFiles.length === 0) {
    fs.rmdirSync(srcPath);
    console.log('📁 Deleted: src/ (empty folder)');
    deletedCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ FRONTEND CLEANUP COMPLETE\n');
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
console.log('   ✅ Backend Microservices (services/, api-gateway/, shared/)');
console.log('   ✅ Infrastructure (docker-compose, k8s/)');
console.log('   ✅ Documentation (Phase 10-12, README.md)');
console.log('   ✅ Essential configs (package.json, tsconfig.json, .env)');
console.log('   ✅ Scripts & Testing (scripts/, tests/, test-*.js)');

console.log('\n📝 Ready for new frontend:');
console.log('   🎨 You can now build a fresh Next.js/React app');
console.log('   🎨 Connect to API Gateway at http://localhost:4000');
console.log('   🎨 Use existing backend services via gateway');

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
  path.join(process.cwd(), 'FRONTEND_CLEANUP_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Cleanup report saved: FRONTEND_CLEANUP_REPORT.json\n');
