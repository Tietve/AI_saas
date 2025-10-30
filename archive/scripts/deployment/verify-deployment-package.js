#!/usr/bin/env node

/**
 * Verify Deployment Package Script
 * 
 * Checks if all required files are present for Azure deployment
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying Deployment Package')
console.log('===============================')

// Required files for Azure deployment
const requiredFiles = [
  '.next/BUILD_ID',
  '.next/package.json', 
  '.next/server/app/api/health/route.js',
  'src/app/api/health/route.ts',
  'package.json',
  'server.js',
  'web.config',
  'node_modules/next/package.json',
  'prisma/schema.prisma'
]

// Required directories
const requiredDirs = [
  '.next',
  '.next/server',
  '.next/static',
  'src',
  'src/app',
  'src/app/api',
  'node_modules',
  'prisma',
  'public'
]

console.log('\n📁 Checking required directories...')
let allDirsExist = true

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    console.log(`✅ ${dir}/`)
  } else {
    console.log(`❌ ${dir}/ - MISSING`)
    allDirsExist = false
  }
})

console.log('\n📄 Checking required files...')
let allFilesExist = true

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING`)
    allFilesExist = false
  }
})

// Check .next build output
console.log('\n🏗️ Checking Next.js build output...')
if (fs.existsSync('.next')) {
  const nextContents = fs.readdirSync('.next')
  console.log(`📦 .next contains: ${nextContents.join(', ')}`)
  
  // Check for critical Next.js files
  const criticalNextFiles = ['BUILD_ID', 'package.json', 'server', 'static']
  criticalNextFiles.forEach(file => {
    if (nextContents.includes(file)) {
      console.log(`✅ .next/${file}`)
    } else {
      console.log(`❌ .next/${file} - MISSING`)
      allFilesExist = false
    }
  })
} else {
  console.log('❌ .next directory missing - run "npm run build" first')
  allFilesExist = false
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts...')
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  
  if (pkg.scripts && pkg.scripts.start === 'node server.js') {
    console.log('✅ Start script configured correctly')
  } else {
    console.log('❌ Start script should be "node server.js"')
  }
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log('✅ Build script exists')
  } else {
    console.log('❌ Build script missing')
  }
}

// Check server.js
console.log('\n🖥️ Checking server.js...')
if (fs.existsSync('server.js')) {
  const serverContent = fs.readFileSync('server.js', 'utf8')
  
  if (serverContent.includes('process.env.PORT')) {
    console.log('✅ Server.js uses process.env.PORT')
  } else {
    console.log('❌ Server.js should use process.env.PORT')
  }
  
  if (serverContent.includes('0.0.0.0')) {
    console.log('✅ Server.js binds to 0.0.0.0')
  } else {
    console.log('❌ Server.js should bind to 0.0.0.0')
  }
}

// Check web.config for Azure
console.log('\n🌐 Checking web.config...')
if (fs.existsSync('web.config')) {
  const webConfigContent = fs.readFileSync('web.config', 'utf8')
  
  if (webConfigContent.includes('server.js')) {
    console.log('✅ web.config references server.js')
  } else {
    console.log('❌ web.config should reference server.js')
  }
  
  if (webConfigContent.includes('iisnode')) {
    console.log('✅ web.config has iisnode configuration')
  } else {
    console.log('❌ web.config should have iisnode configuration')
  }
}

// Summary
console.log('\n📊 Summary')
console.log('==========')

if (allDirsExist && allFilesExist) {
  console.log('✅ All required files and directories present')
  console.log('🚀 Package ready for Azure deployment')
  
  console.log('\n🎯 Next steps:')
  console.log('1. Commit and push changes to trigger GitHub Actions')
  console.log('2. Monitor deployment in GitHub Actions')
  console.log('3. Check Azure App Service logs after deployment')
  console.log('4. Test health endpoint: /api/health')
  
  process.exit(0)
} else {
  console.log('❌ Missing required files or directories')
  console.log('\n🔧 To fix:')
  
  if (!fs.existsSync('.next')) {
    console.log('1. Run: npm run build')
  }
  if (!fs.existsSync('server.js')) {
    console.log('2. Create server.js file')
  }
  if (!fs.existsSync('web.config')) {
    console.log('3. Create web.config file')
  }
  
  process.exit(1)
}
