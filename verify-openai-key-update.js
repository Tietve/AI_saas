#!/usr/bin/env node

/**
 * Verify OpenAI API Key Update Script
 * 
 * Checks if the old OpenAI API key has been replaced with the new one
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying OpenAI API Key Update')
console.log('==================================')

// Old and new keys
const OLD_KEY = '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'
const NEW_KEY = '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'

// Files to check
const filesToCheck = [
  '.env',
  '.env.production',
  '.env.local',
  '.env.development'
]

console.log('\n📁 Checking environment files...')

let foundOldKey = false
let foundNewKey = false
let filesChecked = 0

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    filesChecked++
    const content = fs.readFileSync(file, 'utf8')
    
    if (content.includes(OLD_KEY)) {
      console.log(`❌ ${file} - Still contains OLD key`)
      foundOldKey = true
    } else if (content.includes(NEW_KEY)) {
      console.log(`✅ ${file} - Contains NEW key`)
      foundNewKey = true
    } else if (content.includes('OPENAI_API_KEY')) {
      console.log(`⚠️ ${file} - Contains OPENAI_API_KEY but with different value`)
    } else {
      console.log(`ℹ️ ${file} - No OPENAI_API_KEY found`)
    }
  }
})

// Check source code files for hardcoded keys
console.log('\n🔍 Checking source code for hardcoded keys...')

const sourceFiles = [
  'src/app/api/chat/route.ts',
  'src/app/api/providers/health/route.ts',
  'src/lib/di/container.ts'
]

let hardcodedKeysFound = false

sourceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8')
    
    if (content.includes(OLD_KEY)) {
      console.log(`❌ ${file} - Contains hardcoded OLD key`)
      hardcodedKeysFound = true
    } else if (content.includes(NEW_KEY)) {
      console.log(`⚠️ ${file} - Contains hardcoded NEW key (should use env var)`)
      hardcodedKeysFound = true
    } else {
      console.log(`✅ ${file} - Uses environment variable`)
    }
  }
})

// Summary
console.log('\n📊 Summary')
console.log('==========')

if (foundOldKey) {
  console.log('❌ OLD key still found in some files!')
  console.log('🔧 Action needed: Replace remaining old keys')
} else {
  console.log('✅ No old keys found')
}

if (foundNewKey) {
  console.log('✅ New key found in environment files')
} else {
  console.log('⚠️ New key not found in any environment files')
}

if (hardcodedKeysFound) {
  console.log('⚠️ Hardcoded keys found in source code')
  console.log('🔧 Recommendation: Use environment variables instead')
} else {
  console.log('✅ No hardcoded keys in source code')
}

console.log(`\nℹ️ Checked ${filesChecked} environment files`)

// Recommendations
console.log('\n🎯 Next Steps:')

if (foundOldKey) {
  console.log('1. Replace remaining old keys with new key')
}

if (foundNewKey && !foundOldKey) {
  console.log('1. ✅ Key update completed successfully')
  console.log('2. Test the application to ensure it works with new key')
  console.log('3. Deploy to production if needed')
}

if (!foundNewKey && !foundOldKey) {
  console.log('1. Add the new OpenAI API key to your .env file:')
  console.log(`   OPENAI_API_KEY=${NEW_KEY}`)
}

console.log('\n🔐 Security Reminder:')
console.log('- Never commit API keys to version control')
console.log('- Use environment variables for all sensitive data')
console.log('- Rotate keys regularly for security')

// Exit with appropriate code
if (foundOldKey) {
  console.log('\n❌ Key update incomplete')
  process.exit(1)
} else if (foundNewKey) {
  console.log('\n✅ Key update successful')
  process.exit(0)
} else {
  console.log('\n⚠️ No OpenAI key configured')
  process.exit(1)
}
