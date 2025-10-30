// Final diagnostic - find exact issue
const AZURE = 'https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net'

console.log('🔍 FINAL DIAGNOSTIC')
console.log('='.repeat(50))
console.log('')

async function diagnose() {
  // Test debug endpoint
  console.log('1️⃣ Checking debug endpoint...')
  const debugRes = await fetch(`${AZURE}/api/debug/env`)
  const debug = await debugRes.json()
  
  console.log('Environment:')
  console.log('  AUTH_SECRET_LENGTH:', debug.environment.AUTH_SECRET_LENGTH)
  console.log('  NODE_ENV:', debug.environment.NODE_ENV)
  console.log('  REQUIRE_EMAIL_VERIFICATION:', debug.environment.REQUIRE_EMAIL_VERIFICATION)
  console.log('')
  
  // Analyze
  if (debug.environment.AUTH_SECRET_LENGTH === 0) {
    console.log('🚨 PROBLEM IDENTIFIED:')
    console.log('  AUTH_SECRET is NOT being read by the app!')
    console.log('')
    console.log('This could mean:')
    console.log('  A) Variable name mismatch')
    console.log('     - You set: AUTH_SECRET')
    console.log('     - App reads: process.env.AUTH_SECRET')
    console.log('     - Check spelling exactly!')
    console.log('')
    console.log('  B) App not restarted properly')
    console.log('     - Try: Stop app completely, then Start')
    console.log('     - Not just Restart')
    console.log('')
    console.log('  C) Deployment slot mismatch')
    console.log('     - Check if using deployment slots')
    console.log('     - Env vars might be in wrong slot')
    console.log('')
    console.log('  D) Old build cached')
    console.log('     - Try: Clear cache and redeploy')
    console.log('')
    
    console.log('💡 SOLUTIONS:')
    console.log('  1. In Azure Portal:')
    console.log('     - Go to Configuration → Application settings')
    console.log('     - Find AUTH_SECRET → Copy the name EXACTLY')
    console.log('     - Make sure it says "AUTH_SECRET" not "auth_secret"')
    console.log('')
    console.log('  2. Stop and Start app (not just Restart):')
    console.log('     - Azure Portal → Overview → Stop')
    console.log('     - Wait 10 seconds')
    console.log('     - Click Start')
    console.log('')
    console.log('  3. Check our code reads the right variable:')
    console.log('     - src/lib/auth/session.ts line 13')
    console.log('     - const secret = process.env.AUTH_SECRET')
    console.log('')
    
    return false
  } else {
    console.log('✅ AUTH_SECRET is loaded correctly!')
    console.log('')
    return true
  }
}

diagnose().then(ok => {
  if (ok) {
    console.log('✅ Environment is configured correctly!')
    console.log('If still getting 400, the issue is elsewhere.')
    console.log('Run: node test-specific-conversation.js')
  }
}).catch(err => {
  console.error('Error:', err)
})

