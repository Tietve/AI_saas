#!/usr/bin/env node

/**
 * Script để tự động regenerate CODEBASE_INDEX.md
 *
 * Usage: node .claude/regenerate-index.js
 *
 * Scans codebase và tạo index chi tiết của:
 * - All controllers
 * - All services
 * - All routes
 * - All middleware
 * - All prisma schemas
 * - Function locations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVICES_DIR = path.join(__dirname, '../backend/services');
const OUTPUT_FILE = path.join(__dirname, 'CODEBASE_INDEX.md');

console.log('🔍 Scanning codebase...\n');

// Scan all services
const services = fs.readdirSync(SERVICES_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => name !== 'node_modules');

console.log('📦 Found services:', services.join(', '));

let indexContent = `# 🗂️ CODEBASE INDEX - Smart Navigation

> **Auto-generated:** ${new Date().toISOString()}
> **Regenerate:** node .claude/regenerate-index.js

---

## 📋 SERVICES OVERVIEW

\`\`\`
my-saas-chat/backend/services/
${services.map(s => `├── ${s}`).join('\n')}
\`\`\`

---
`;

// For each service, scan structure
services.forEach(service => {
  console.log(`\n📂 Scanning ${service}...`);

  const serviceDir = path.join(SERVICES_DIR, service);
  const srcDir = path.join(serviceDir, 'src');

  if (!fs.existsSync(srcDir)) {
    console.log(`   ⚠️  No src/ directory found`);
    return;
  }

  indexContent += `\n## 🎯 ${service.toUpperCase()}\n\n`;

  // Scan controllers
  const controllersDir = path.join(srcDir, 'controllers');
  if (fs.existsSync(controllersDir)) {
    const controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));
    if (controllers.length > 0) {
      indexContent += `### Controllers\n`;
      controllers.forEach(file => {
        indexContent += `- \`${file}\` → \`${service}/src/controllers/${file}\`\n`;
      });
      indexContent += '\n';
    }
  }

  // Scan services
  const servicesDir = path.join(srcDir, 'services');
  if (fs.existsSync(servicesDir)) {
    const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
    if (serviceFiles.length > 0) {
      indexContent += `### Services\n`;
      serviceFiles.forEach(file => {
        indexContent += `- \`${file}\` → \`${service}/src/services/${file}\`\n`;
      });
      indexContent += '\n';
    }
  }

  // Scan routes
  const routesDir = path.join(srcDir, 'routes');
  if (fs.existsSync(routesDir)) {
    const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
    if (routes.length > 0) {
      indexContent += `### Routes\n`;
      routes.forEach(file => {
        indexContent += `- \`${file}\` → \`${service}/src/routes/${file}\`\n`;
      });
      indexContent += '\n';
    }
  }

  // Check for Prisma schema
  const prismaSchema = path.join(serviceDir, 'prisma/schema.prisma');
  if (fs.existsSync(prismaSchema)) {
    indexContent += `### Database\n`;
    indexContent += `- \`schema.prisma\` → \`${service}/prisma/schema.prisma\`\n\n`;
  }

  indexContent += `---\n`;
});

// Write to file
fs.writeFileSync(OUTPUT_FILE, indexContent);

console.log('\n✅ Index regenerated successfully!');
console.log(`📄 Output: ${OUTPUT_FILE}`);
console.log('\n💡 Tips:');
console.log('   - Commit this file to git');
console.log('   - Regenerate when adding new services/files');
console.log('   - Claude will use this for fast navigation!');
