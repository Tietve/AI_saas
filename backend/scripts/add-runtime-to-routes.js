#!/usr/bin/env node
/**
 * Script to add 'export const runtime = "nodejs"' to all API routes that use Prisma
 * but don't have runtime config yet.
 *
 * Usage: node scripts/add-runtime-to-routes.js
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

const API_ROUTES_PATTERN = 'src/app/api/**/route.ts'
const RUNTIME_EXPORT = "export const runtime = 'nodejs'"

function hasRuntimeExport(content) {
  return /export\s+const\s+runtime\s*=/.test(content)
}

function hasPrismaImport(content) {
  return /from\s+['"]@\/lib\/prisma['"]/.test(content)
}

function addRuntimeExport(content) {
  // Find the position after imports
  const lines = content.split('\n')
  let insertIndex = 0
  let inImportSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Track import section
    if (line.startsWith('import ')) {
      inImportSection = true
      insertIndex = i + 1
    } else if (inImportSection && line === '') {
      // Found blank line after imports
      insertIndex = i + 1
      break
    } else if (inImportSection && !line.startsWith('import ') && line !== '') {
      // End of imports without blank line
      insertIndex = i
      break
    }
  }

  // Insert runtime export
  const newLines = [...lines]
  newLines.splice(insertIndex, 0, '', `// Force Node.js runtime (required for Prisma)`, RUNTIME_EXPORT)

  return newLines.join('\n')
}

async function main() {
  console.log('🔍 Finding API routes with Prisma imports...\n')

  const files = glob.sync(API_ROUTES_PATTERN)

  let processedCount = 0
  let skippedCount = 0

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')

    // Check if file uses Prisma
    if (!hasPrismaImport(content)) {
      continue
    }

    // Check if file already has runtime export
    if (hasRuntimeExport(content)) {
      console.log(`⏭️  Skipped (already has runtime): ${file}`)
      skippedCount++
      continue
    }

    // Add runtime export
    const newContent = addRuntimeExport(content)
    fs.writeFileSync(file, newContent, 'utf8')

    console.log(`✅ Added runtime to: ${file}`)
    processedCount++
  }

  console.log(`\n📊 Summary:`)
  console.log(`   - Processed: ${processedCount} files`)
  console.log(`   - Skipped: ${skippedCount} files`)
  console.log(`   - Total API routes: ${files.length} files`)

  if (processedCount > 0) {
    console.log(`\n✨ Done! ${processedCount} files updated.`)
  } else {
    console.log(`\n✨ All files already have runtime config!`)
  }
}

main().catch(console.error)
