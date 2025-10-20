/**
 * ========================================
 * Production Diagnostic Tool
 * ========================================
 * 
 * Kiểm tra toàn diện production environment
 * để tìm nguyên nhân lỗi 400/404
 */

// @ts-ignore
const fetch = globalThis.fetch || require('node-fetch')

const API_URL = process.env.TEST_API_URL || 'https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net'

console.log('=' .repeat(70))
console.log('🔍 Production Diagnostic Tool')
console.log('='.repeat(70))
console.log(`Target: ${API_URL}`)
console.log('')

interface DiagnosticResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

const results: DiagnosticResult[] = []

function addResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ test, status, message, details })
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} ${test}: ${message}`)
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
  }
}

// ========================================
// Tests
// ========================================

async function testHealthEndpoint() {
  console.log('\n📋 Testing Health Endpoint')
  console.log('-'.repeat(70))
  
  try {
    const response = await fetch(`${API_URL}/api/health`, { method: 'GET' })
    const data = await response.json()
    
    if (response.status === 200) {
      addResult('Health Check', 'PASS', 'API is responding', {
        status: data.status,
        timestamp: data.timestamp
      })
      return true
    } else {
      addResult('Health Check', 'FAIL', `HTTP ${response.status}`, data)
      return false
    }
  } catch (error: any) {
    addResult('Health Check', 'FAIL', error.message)
    return false
  }
}

async function testRouteAvailability() {
  console.log('\n📋 Testing Route Availability')
  console.log('-'.repeat(70))
  
  const routes = [
    { path: '/api/health', expectedCodes: [200] },
    { path: '/api/csrf', expectedCodes: [200] },
    { path: '/api/conversations', expectedCodes: [200, 401] },
    { path: '/api/chat', expectedCodes: [400, 401, 405] }, // POST route, GET should fail
    { path: '/api/chat/send', expectedCodes: [400, 401, 405] },
    { path: '/api/chat/stream', expectedCodes: [400, 401, 405] },
  ]
  
  let allPass = true
  
  for (const route of routes) {
    try {
      const response = await fetch(`${API_URL}${route.path}`, {
        method: 'GET',
        redirect: 'manual'
      })
      
      const status = response.status
      
      if (status === 404) {
        addResult(`Route ${route.path}`, 'FAIL', '404 Not Found - Route does not exist!', { status })
        allPass = false
      } else if (route.expectedCodes.includes(status)) {
        addResult(`Route ${route.path}`, 'PASS', `Exists (${status})`, { status })
      } else {
        addResult(`Route ${route.path}`, 'WARN', `Unexpected status ${status}`, { 
          status,
          expected: route.expectedCodes 
        })
      }
    } catch (error: any) {
      addResult(`Route ${route.path}`, 'FAIL', error.message)
      allPass = false
    }
  }
  
  return allPass
}

async function testCORS() {
  console.log('\n📋 Testing CORS Configuration')
  console.log('-'.repeat(70))
  
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      }
    })
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
    }
    
    if (corsHeaders['access-control-allow-origin']) {
      addResult('CORS', 'PASS', 'CORS headers present', corsHeaders)
    } else {
      addResult('CORS', 'WARN', 'No CORS headers found', corsHeaders)
    }
  } catch (error: any) {
    addResult('CORS', 'WARN', `Could not test CORS: ${error.message}`)
  }
}

async function testCookieHandling() {
  console.log('\n📋 Testing Cookie Handling')
  console.log('-'.repeat(70))
  
  try {
    // Test signup to see if cookies are set
    const testEmail = `test_${Date.now()}@example.com`
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test123456!',
        name: 'Test User'
      })
    })
    
    const setCookieHeader = response.headers.get('set-cookie')
    
    if (setCookieHeader) {
      // Parse cookie attributes
      const hasSecure = setCookieHeader.includes('Secure')
      const hasHttpOnly = setCookieHeader.includes('HttpOnly')
      const hasSameSite = setCookieHeader.includes('SameSite')
      
      const cookieConfig = {
        hasSecure,
        hasHttpOnly,
        hasSameSite,
        preview: setCookieHeader.substring(0, 100) + '...'
      }
      
      if (hasSecure && hasHttpOnly) {
        addResult('Cookie Config', 'PASS', 'Cookies properly configured', cookieConfig)
      } else {
        addResult('Cookie Config', 'WARN', 'Cookie security flags missing', cookieConfig)
      }
    } else if (response.status === 409) {
      addResult('Cookie Config', 'WARN', 'User exists, trying signin...')
      
      // Try signin
      const signinResponse = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'Test123456!'
        })
      })
      
      const signinCookie = signinResponse.headers.get('set-cookie')
      if (signinCookie) {
        addResult('Cookie Config', 'PASS', 'Cookies set on signin')
      } else {
        addResult('Cookie Config', 'FAIL', 'No cookies set on signin')
      }
    } else {
      addResult('Cookie Config', 'FAIL', `Signup failed with ${response.status}`, {
        status: response.status,
        body: await response.text()
      })
    }
  } catch (error: any) {
    addResult('Cookie Config', 'FAIL', error.message)
  }
}

async function testDatabaseEndpoint() {
  console.log('\n📋 Testing Database-Dependent Endpoints')
  console.log('-'.repeat(70))
  
  // First, authenticate
  const testEmail = `test_${Date.now()}@example.com`
  const testPassword = 'Test123456!'
  
  try {
    // Signup
    const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      })
    })
    
    let cookies = signupResponse.headers.get('set-cookie') || ''
    
    if (signupResponse.status === 409) {
      // Try signin
      const signinResponse = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      })
      cookies = signinResponse.headers.get('set-cookie') || ''
    }
    
    if (!cookies) {
      addResult('Database Check', 'FAIL', 'Could not authenticate to test database')
      return
    }
    
    // Extract session cookie
    const cookieMatch = cookies.match(/session=([^;]+)/)
    const sessionCookie = cookieMatch ? `session=${cookieMatch[1]}` : cookies
    
    // Test conversations endpoint (requires database)
    const convResponse = await fetch(`${API_URL}/api/conversations`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    })
    
    if (convResponse.status === 200) {
      const data = await convResponse.json()
      addResult('Database Check', 'PASS', 'Database queries working', {
        conversationsCount: data.items?.length || 0
      })
      
      // If there are conversations, test messages endpoint
      if (data.items && data.items.length > 0) {
        const convId = data.items[0].id
        const msgResponse = await fetch(`${API_URL}/api/conversations/${convId}/messages?limit=10`, {
          method: 'GET',
          headers: {
            'Cookie': sessionCookie
          }
        })
        
        if (msgResponse.status === 200) {
          const msgData = await msgResponse.json()
          addResult('Messages Endpoint', 'PASS', 'Messages endpoint working', {
            messagesCount: msgData.items?.length || 0
          })
        } else if (msgResponse.status === 400) {
          const errorData = await msgResponse.json()
          addResult('Messages Endpoint', 'FAIL', '400 Bad Request - This is the bug!', {
            status: 400,
            error: errorData
          })
        } else {
          addResult('Messages Endpoint', 'WARN', `Unexpected status ${msgResponse.status}`, {
            status: msgResponse.status
          })
        }
      }
    } else if (convResponse.status === 401) {
      addResult('Database Check', 'FAIL', 'Authentication failed - Session not working')
    } else {
      addResult('Database Check', 'FAIL', `Unexpected status ${convResponse.status}`)
    }
  } catch (error: any) {
    addResult('Database Check', 'FAIL', error.message)
  }
}

async function checkResponseHeaders() {
  console.log('\n📋 Checking Response Headers')
  console.log('-'.repeat(70))
  
  try {
    const response = await fetch(`${API_URL}/api/health`)
    
    const importantHeaders = {
      'content-type': response.headers.get('content-type'),
      'x-powered-by': response.headers.get('x-powered-by'),
      'server': response.headers.get('server'),
      'cache-control': response.headers.get('cache-control'),
    }
    
    addResult('Response Headers', 'PASS', 'Headers analyzed', importantHeaders)
  } catch (error: any) {
    addResult('Response Headers', 'WARN', error.message)
  }
}

// ========================================
// Summary
// ========================================

function printSummary() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 Diagnostic Summary')
  console.log('='.repeat(70))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  
  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warned}`)
  console.log('')
  
  if (failed > 0) {
    console.log('🔴 Critical Issues Found:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`)
    })
    console.log('')
  }
  
  if (warned > 0) {
    console.log('⚠️  Warnings:')
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`)
    })
    console.log('')
  }
  
  console.log('💡 Recommendations:')
  
  const routeFailures = results.filter(r => r.test.includes('Route') && r.status === 'FAIL')
  if (routeFailures.length > 0) {
    console.log('   1. Some routes are returning 404 - Check deployment includes all API routes')
    console.log('      → Redeploy: git commit --allow-empty -m "Redeploy" && git push')
  }
  
  const dbFailures = results.filter(r => r.test.includes('Database') && r.status === 'FAIL')
  if (dbFailures.length > 0) {
    console.log('   2. Database issues detected - Check:')
    console.log('      → DATABASE_URL environment variable')
    console.log('      → Prisma client generation: npx prisma generate')
    console.log('      → Run migrations: npx prisma migrate deploy')
  }
  
  const messageFailure = results.find(r => r.test === 'Messages Endpoint' && r.status === 'FAIL')
  if (messageFailure) {
    console.log('   3. Messages endpoint returning 400 - Check server logs:')
    console.log('      → az webapp log tail --name firbox-api --resource-group firbox-rg')
  }
  
  const cookieIssues = results.filter(r => r.test.includes('Cookie') && r.status !== 'PASS')
  if (cookieIssues.length > 0) {
    console.log('   4. Cookie/Session issues - Check:')
    console.log('      → AUTH_SECRET environment variable is set')
    console.log('      → Cookie secure flag is true in production')
    console.log('      → Session configuration in src/lib/auth/session.ts')
  }
  
  console.log('')
  console.log('📝 Next Steps:')
  console.log('   1. Address failed tests above')
  console.log('   2. Check server logs for detailed errors')
  console.log('   3. Run: npm run test:api:azure')
  console.log('   4. See: DEBUG_API_QUICK_START.md for fixes')
  console.log('')
}

// ========================================
// Main
// ========================================

async function main() {
  const healthOk = await testHealthEndpoint()
  
  if (!healthOk) {
    console.log('\n❌ API is not responding. Cannot continue tests.')
    console.log('Check if the API is running and accessible.')
    process.exit(1)
  }
  
  await testRouteAvailability()
  await testCORS()
  await testCookieHandling()
  await testDatabaseEndpoint()
  await checkResponseHeaders()
  
  printSummary()
}

main().catch(error => {
  console.error('\n❌ Diagnostic failed:', error)
  process.exit(1)
})

