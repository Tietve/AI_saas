#!/usr/bin/env node

/**
 * Task Distributor - Smart agent task assignment
 *
 * Automatically distributes tasks to agents to avoid conflicts
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 Parallel Agent Task Distributor\n');

// Scan services
const servicesDir = path.join(__dirname, '../backend/services');
const services = fs.readdirSync(servicesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .filter(dirent => dirent.name !== 'node_modules')
  .map(dirent => dirent.name);

console.log(`📦 Found ${services.length} services:\n`);
services.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

console.log('\n' + '='.repeat(60));
console.log('🚀 STRATEGY 1: FOLDER-BASED ISOLATION (Recommended)');
console.log('='.repeat(60) + '\n');

console.log('Copy this command:\n');
console.log('─'.repeat(60));
console.log(`"Launch ${services.length} agents in parallel with FOLDER ISOLATION:\n`);

services.forEach((service, i) => {
  console.log(`Agent ${i + 1}:`);
  console.log(`- Scope: backend/services/${service}/ ONLY`);
  console.log(`- Task: [YOUR TASK HERE]`);
  console.log(`- Rule: Do NOT edit files outside this folder\n`);
});

console.log('RULES:');
console.log('✅ Each agent works in separate folder');
console.log('✅ No cross-folder edits');
console.log('✅ Zero conflicts guaranteed!\n');
console.log('Work in parallel, report when ALL complete."');
console.log('─'.repeat(60));

console.log('\n' + '='.repeat(60));
console.log('🔥 STRATEGY 2: TASK-TYPE ISOLATION');
console.log('='.repeat(60) + '\n');

console.log('Copy this command:\n');
console.log('─'.repeat(60));
console.log('"Launch 4 agents with TASK-TYPE ISOLATION:\n');

console.log('Agent 1 (Error Fixer):');
console.log('- Task: Fix TypeScript errors');
console.log('- Action: EDIT existing code');
console.log('- Scope: All services');
console.log('- Will NOT create new files\n');

console.log('Agent 2 (Test Writer):');
console.log('- Task: Write tests');
console.log('- Action: CREATE new test files');
console.log('- Scope: All services');
console.log('- Will NOT edit existing code\n');

console.log('Agent 3 (Documenter):');
console.log('- Task: Update documentation');
console.log('- Action: UPDATE docs/README');
console.log('- Scope: Documentation only');
console.log('- Will NOT touch source code\n');

console.log('Agent 4 (Auditor):');
console.log('- Task: Security audit');
console.log('- Action: READ ONLY + report');
console.log('- Scope: All code');
console.log('- Will NOT edit anything\n');

console.log('RULES:');
console.log('✅ Different operation types');
console.log('✅ No overlap in actions');
console.log('✅ Zero conflicts!\n');
console.log('Work in parallel, report when done."');
console.log('─'.repeat(60));

console.log('\n' + '='.repeat(60));
console.log('💡 TIPS');
console.log('='.repeat(60));
console.log(`
1. For your ${services.length} microservices → Use Folder-based isolation
2. For different task types → Use Task-type isolation
3. For same folder work → Split by files explicitly
4. Always specify scope clearly to avoid conflicts

5. Example tasks to replace [YOUR TASK HERE]:
   - "Fix all TypeScript errors, run tests"
   - "Write unit tests, achieve >80% coverage"
   - "Refactor duplicate code, improve naming"
   - "Security audit, report vulnerabilities"
   - "Add JSDoc comments, update README"
`);

console.log('─'.repeat(60));
console.log('\n✅ Ready to launch parallel agents safely!\n');
