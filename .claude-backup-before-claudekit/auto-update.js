#!/usr/bin/env node

/**
 * Auto-update script - Intelligent memory files updater
 *
 * Chạy script này để:
 * 1. Detect changes trong codebase
 * 2. Tự động regenerate CODEBASE_INDEX.md
 * 3. Suggest updates cho CLAUDE.md
 * 4. Commit changes (optional)
 *
 * Usage:
 *   node .claude/auto-update.js              # Check và report
 *   node .claude/auto-update.js --update     # Auto-update index
 *   node .claude/auto-update.js --commit     # Update và commit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const shouldUpdate = args.includes('--update') || args.includes('--commit');
const shouldCommit = args.includes('--commit');

console.log('🔍 Checking for changes that need memory updates...\n');

// Get git status
let gitStatus = '';
try {
    gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
} catch (e) {
    console.log('⚠️  Not a git repository or git not available');
    process.exit(0);
}

const changedFiles = gitStatus.split('\n').filter(Boolean);

// Analyze changes
let needsIndexUpdate = false;
let needsClaudeMdUpdate = false;
const reasons = [];

// Check for structural changes
const structuralChanges = changedFiles.filter(line =>
    line.match(/src\/(controllers|services|routes)\/.*\.(ts|js)$/)
);

if (structuralChanges.length > 0) {
    needsIndexUpdate = true;
    reasons.push(`📂 ${structuralChanges.length} controller/service/route file(s) changed`);
}

// Check for new services
const serviceChanges = changedFiles.filter(line =>
    line.match(/backend\/services\/[^/]+\/(src|prisma)/)
);

if (serviceChanges.length > 0) {
    needsIndexUpdate = true;
    reasons.push(`📦 Service structure changes detected`);
}

// Check for config changes
const configChanges = changedFiles.filter(line =>
    line.match(/\.(env|config|json)$/)
);

if (configChanges.length > 0) {
    needsClaudeMdUpdate = true;
    reasons.push(`⚙️  Config file changes detected`);
}

// Check for package.json
const packageJsonChanges = changedFiles.filter(line =>
    line.includes('package.json')
);

if (packageJsonChanges.length > 0) {
    needsClaudeMdUpdate = true;
    reasons.push(`📦 package.json modified (check for new commands/dependencies)`);
}

// Report findings
console.log('📊 Analysis Results:\n');

if (reasons.length > 0) {
    console.log('Changes detected:');
    reasons.forEach(reason => console.log(`  ${reason}`));
    console.log('');
} else {
    console.log('✅ No changes requiring memory updates\n');
    process.exit(0);
}

// Recommendations
console.log('💡 Recommendations:\n');

if (needsIndexUpdate) {
    console.log('  1. Regenerate CODEBASE_INDEX.md');
    console.log('     Command: node .claude/regenerate-index.js\n');
}

if (needsClaudeMdUpdate) {
    console.log('  2. Update CLAUDE.md');
    console.log('     - Review changes and update conventions');
    console.log('     - Add new commands if any');
    console.log('     - Update tech stack if changed\n');
}

// Auto-update if requested
if (shouldUpdate && needsIndexUpdate) {
    console.log('🔄 Auto-updating CODEBASE_INDEX.md...\n');

    try {
        execSync('node .claude/regenerate-index.js', { stdio: 'inherit' });
        console.log('\n✅ Index updated successfully!\n');

        if (shouldCommit) {
            console.log('📝 Committing changes...\n');
            try {
                execSync('git add .claude/CODEBASE_INDEX.md');
                execSync('git commit -m "docs: auto-update CODEBASE_INDEX.md"', { stdio: 'inherit' });
                console.log('\n✅ Changes committed!\n');
            } catch (e) {
                console.log('\n⚠️  Could not commit changes (maybe no changes to commit?)\n');
            }
        }
    } catch (e) {
        console.log('\n❌ Error updating index:', e.message, '\n');
        process.exit(1);
    }
}

if (needsClaudeMdUpdate) {
    console.log('⚠️  Manual update required for CLAUDE.md');
    console.log('   Use: /memory command trong Claude Code\n');
}

// Summary
console.log('─'.repeat(50));
console.log('\n📌 Summary:');
console.log(`   Index update needed: ${needsIndexUpdate ? '✅ YES' : '❌ NO'}`);
console.log(`   CLAUDE.md review needed: ${needsClaudeMdUpdate ? '✅ YES' : '❌ NO'}`);

if (shouldUpdate) {
    console.log(`   Auto-updated: ${needsIndexUpdate ? '✅ YES' : '❌ NO'}`);
}

console.log('\n💡 Tips:');
console.log('   - Run with --update to auto-regenerate index');
console.log('   - Run with --commit to auto-commit changes');
console.log('   - Add to package.json scripts for easy access\n');
