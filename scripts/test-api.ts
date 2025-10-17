/**
 * Simple API Test Script
 * Tests basic API endpoints to ensure they're working
 */

import { NextRequest } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testApiEndpoint(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const url = `${BASE_URL}${endpoint}`
    console.log(`\n🧪 Testing ${method} ${endpoint}`)
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const data = await response.text()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`)
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`)
    return {
      success: false,
      error: error
    }
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...')
  console.log(`Base URL: ${BASE_URL}`)

  const tests = [
    // Health check
    { endpoint: '/api/health', method: 'GET' },
    
    // Auth endpoints
    { endpoint: '/api/auth/signin', method: 'POST', body: { email: 'test@example.com', password: 'password' } },
    { endpoint: '/api/auth/signup', method: 'POST', body: { email: 'test@example.com', password: 'password', name: 'Test User' } },
    
    // Chat endpoints
    { endpoint: '/api/chat', method: 'POST', body: { message: 'Hello', conversationId: 'test' } },
    
    // Usage check
    { endpoint: '/api/usage/check', method: 'GET' },
    
    // Conversations
    { endpoint: '/api/conversations', method: 'GET' },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    const result = await testApiEndpoint(test.endpoint, test.method, test.body)
    
    if (result.success) {
      passed++
      console.log(`   ✅ PASS`)
    } else {
      failed++
      console.log(`   ❌ FAIL`)
    }
  }

  console.log(`\n📊 Test Results:`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed === 0) {
    console.log(`\n🎉 All tests passed!`)
  } else {
    console.log(`\n⚠️  Some tests failed. Check the logs above.`)
  }
}

// Run tests
runTests().catch(console.error)