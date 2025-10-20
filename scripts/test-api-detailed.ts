/**
 * ========================================
 * Detailed API Testing Script
 * ========================================
 * 
 * Test các API endpoints để debug lỗi 400/404
 * Đặc biệt focus vào:
 * - GET /api/conversations/{id}/messages (lỗi 400)
 * - POST /api/chat/send (lỗi 404)
 */

// Use built-in fetch (Node 18+)
// @ts-ignore - Using global fetch
const fetchFn = globalThis.fetch || require('node-fetch')

// ========================================
// Configuration
// ========================================
const API_URL_TEST = process.env.TEST_API_URL || 'https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net'
const TEST_EMAIL = process.env.TEST_EMAIL || `test_${Date.now()}@example.com`
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123456!'

interface ApiResponse {
  status: number
  data?: any
  error?: string
  headers?: any
}

// ========================================
// Helpers
// ========================================
async function request(
  method: string,
  path: string,
  options: {
    body?: any
    headers?: Record<string, string>
    cookies?: string[]
  } = {}
): Promise<ApiResponse> {
  const url = `${API_URL_TEST}${path}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Test-Script/1.0',
    ...options.headers,
  }

  if (options.cookies && options.cookies.length > 0) {
    headers['Cookie'] = options.cookies.join('; ')
  }

  console.log(`\n🔵 ${method} ${path}`)
  console.log(`   URL: ${url}`)
  if (options.body) {
    console.log(`   Body: ${JSON.stringify(options.body, null, 2)}`)
  }
  if (headers['Cookie']) {
    console.log(`   Cookies: ${headers['Cookie'].substring(0, 100)}...`)
  }

  try {
    const response = await fetchFn(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    let data: any
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else if (contentType.includes('text/event-stream')) {
      data = await response.text()
    } else {
      data = await response.text()
    }

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`)
    } else {
      console.log(`   ❌ Status: ${response.status}`)
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`)
    }

    return {
      status: response.status,
      data,
      headers: responseHeaders,
    }
  } catch (error) {
    const err = error as Error
    console.log(`   ❌ Request failed: ${err.message}`)
    return {
      status: 0,
      error: err.message,
    }
  }
}

function extractCookies(headers: any): string[] {
  const setCookie = headers['set-cookie']
  if (!setCookie) return []
  
  const cookies: string[] = []
  const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie]
  
  for (const cookie of cookieStrings) {
    // Extract cookie name=value part (before first semicolon)
    const match = cookie.match(/^([^=]+=[^;]+)/)
    if (match) {
      cookies.push(match[1])
    }
  }
  
  return cookies
}

// ========================================
// Test Functions
// ========================================
async function testHealthCheck() {
  console.log('\n' + '='.repeat(50))
  console.log('📋 Test 1: Health Check')
  console.log('='.repeat(50))
  
  const result = await request('GET', '/api/health')
  
  if (result.status === 200) {
    console.log('✅ Health check passed')
    return true
  } else {
    console.log('❌ Health check failed')
    return false
  }
}

async function testAvailableRoutes() {
  console.log('\n' + '='.repeat(50))
  console.log('📋 Test 2: Available Routes')
  console.log('='.repeat(50))
  
  const routes = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/v1/health' },
    { method: 'GET', path: '/api/csrf' },
    { method: 'POST', path: '/api/auth/signup' },
    { method: 'POST', path: '/api/auth/signin' },
    { method: 'POST', path: '/api/chat' },
    { method: 'POST', path: '/api/chat/send' },
    { method: 'POST', path: '/api/chat/stream' },
    { method: 'GET', path: '/api/conversations' },
  ]
  
  const results: Record<string, number> = {}
  
  for (const route of routes) {
    const result = await request(route.method, route.path, {
      body: route.method === 'POST' ? {} : undefined
    })
    results[`${route.method} ${route.path}`] = result.status
  }
  
  console.log('\n📊 Route Status Summary:')
  Object.entries(results).forEach(([route, status]) => {
    const icon = status === 404 ? '❌' : status >= 200 && status < 300 ? '✅' : '⚠️'
    console.log(`   ${icon} ${route}: ${status}`)
  })
  
  return results
}

async function testAuthentication() {
  console.log('\n' + '='.repeat(50))
  console.log('📋 Test 3: Authentication Flow')
  console.log('='.repeat(50))
  
  // Step 1: Get CSRF token
  console.log('\n🔹 Step 1: Get CSRF Token')
  const csrfResult = await request('GET', '/api/csrf')
  
  if (csrfResult.status !== 200) {
    console.log('❌ Failed to get CSRF token')
    return null
  }
  
  const csrfToken = csrfResult.data?.token
  console.log(`✅ CSRF Token: ${csrfToken}`)
  
  // Step 2: Signup
  console.log('\n🔹 Step 2: Signup')
  const signupResult = await request('POST', '/api/auth/signup', {
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: `Test User ${Date.now()}`,
    },
  })
  
  let cookies: string[] = []
  
  if (signupResult.status === 201 || signupResult.status === 200) {
    console.log('✅ Signup successful')
    cookies = extractCookies(signupResult.headers)
    console.log(`   Cookies received: ${cookies.length}`)
  } else if (signupResult.status === 409) {
    console.log('⚠️  User already exists, trying signin...')
  } else {
    console.log('❌ Signup failed')
    return null
  }
  
  // Step 3: Signin
  console.log('\n🔹 Step 3: Signin')
  const signinResult = await request('POST', '/api/auth/signin', {
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  })
  
  if (signinResult.status === 200) {
    console.log('✅ Signin successful')
    const signinCookies = extractCookies(signinResult.headers)
    if (signinCookies.length > 0) {
      cookies = signinCookies
    }
    console.log(`   Cookies: ${cookies.length}`)
  } else {
    console.log('❌ Signin failed')
    return null
  }
  
  if (cookies.length === 0) {
    console.log('❌ No auth cookies received')
    return null
  }
  
  console.log('✅ Authentication complete')
  return cookies
}

async function testConversationsAndMessages(cookies: string[]) {
  console.log('\n' + '='.repeat(50))
  console.log('📋 Test 4: Conversations & Messages')
  console.log('='.repeat(50))
  
  // Get conversations list
  console.log('\n🔹 Step 1: Get Conversations')
  const convResult = await request('GET', '/api/conversations', { cookies })
  
  if (convResult.status !== 200) {
    console.log('❌ Failed to get conversations')
    console.log(`   Status: ${convResult.status}`)
    console.log(`   Response: ${JSON.stringify(convResult.data, null, 2)}`)
    return
  }
  
  const conversations = convResult.data?.items || []
  console.log(`✅ Found ${conversations.length} conversations`)
  
  if (conversations.length === 0) {
    console.log('⚠️  No conversations found to test messages')
    return
  }
  
  // Test getting messages for each conversation
  console.log('\n🔹 Step 2: Get Messages for Each Conversation')
  for (let i = 0; i < Math.min(conversations.length, 3); i++) {
    const conv = conversations[i]
    console.log(`\n  Testing conversation ${i + 1}/${Math.min(conversations.length, 3)}`)
    console.log(`  ID: ${conv.id}`)
    console.log(`  Title: ${conv.title || '(no title)'}`)
    
    const msgResult = await request('GET', `/api/conversations/${conv.id}/messages?limit=100`, { cookies })
    
    if (msgResult.status === 200) {
      const messages = msgResult.data?.items || []
      console.log(`  ✅ Got ${messages.length} messages`)
    } else if (msgResult.status === 400) {
      console.log(`  ❌ 400 Bad Request - This is the error!`)
      console.log(`  Response: ${JSON.stringify(msgResult.data, null, 2)}`)
      
      // Try to get more details
      console.log('\n  🔍 Debugging 400 Error:')
      console.log(`     - Conversation ID: ${conv.id} (length: ${conv.id.length})`)
      console.log(`     - Cookies present: ${cookies.length > 0 ? 'Yes' : 'No'}`)
      console.log(`     - Request URL: ${API_URL_TEST}/api/conversations/${conv.id}/messages?limit=100`)
    } else if (msgResult.status === 404) {
      console.log(`  ❌ 404 Not Found - Conversation not found`)
    } else if (msgResult.status === 401) {
      console.log(`  ❌ 401 Unauthorized - Auth failed`)
    } else {
      console.log(`  ❌ Unexpected status: ${msgResult.status}`)
      console.log(`  Response: ${JSON.stringify(msgResult.data, null, 2)}`)
    }
  }
}

async function testChatSend(cookies: string[]) {
  console.log('\n' + '='.repeat(50))
  console.log('📋 Test 5: Chat Send')
  console.log('='.repeat(50))
  
  const endpoints = ['/api/chat/send', '/api/chat', '/api/chat/stream']
  
  for (const endpoint of endpoints) {
    console.log(`\n🔹 Testing: POST ${endpoint}`)
    
    const result = await request('POST', endpoint, {
      cookies,
      body: {
        content: 'Hello, this is a test message',
        conversationId: 'new',
        model: 'gpt-4o-mini',
      },
    })
    
    if (result.status === 404) {
      console.log(`  ❌ 404 Not Found - Endpoint does not exist!`)
    } else if (result.status === 200 || result.status === 201) {
      console.log(`  ✅ Success`)
    } else if (result.status === 401) {
      console.log(`  ❌ 401 Unauthorized`)
    } else if (result.status === 400) {
      console.log(`  ❌ 400 Bad Request`)
      console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`)
    } else {
      console.log(`  ⚠️  Status: ${result.status}`)
    }
  }
}

// ========================================
// Main Test Runner
// ========================================
async function runTests() {
  console.log('=' .repeat(70))
  console.log('🧪 API Error Debugging Script')
  console.log('='.repeat(70))
  console.log(`Target: ${API_URL_TEST}`)
  console.log(`Email: ${TEST_EMAIL}`)
  console.log('')
  
  try {
    // Test 1: Health Check
    const healthOk = await testHealthCheck()
    if (!healthOk) {
      console.log('\n❌ Health check failed - API might be down')
      process.exit(1)
    }
    
    // Test 2: Available Routes
    await testAvailableRoutes()
    
    // Test 3: Authentication
    const cookies = await testAuthentication()
    if (!cookies) {
      console.log('\n❌ Authentication failed - cannot test authenticated endpoints')
      process.exit(1)
    }
    
    // Test 4: Conversations & Messages (THIS IS WHERE 400 ERROR HAPPENS)
    await testConversationsAndMessages(cookies)
    
    // Test 5: Chat Send (THIS IS WHERE 404 ERROR HAPPENS)
    await testChatSend(cookies)
    
    console.log('\n' + '='.repeat(70))
    console.log('✅ All Tests Complete!')
    console.log('='.repeat(70))
    
    console.log('\n💡 Summary:')
    console.log('   - Check logs above for any ❌ or ⚠️  indicators')
    console.log('   - 400 errors usually mean: bad request data or server-side validation issue')
    console.log('   - 404 errors mean: route not deployed or incorrect path')
    console.log('\n📝 Next Steps:')
    console.log('   1. If /api/chat/send returns 404: Check if route file is deployed')
    console.log('   2. If /api/conversations/.../messages returns 400: Check server logs')
    console.log('   3. Azure logs: az webapp log tail --name firbox-api --resource-group firbox-rg')
    console.log('   4. Check DATABASE_URL and Prisma client on production')
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

// Run tests
runTests()

