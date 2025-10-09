/**
 * Post-Deploy Verification Script
 *
 * Automated smoke test suite that verifies all critical flows after deployment
 * Run this immediately after deployment to ensure system health
 *
 * Usage:
 *   npm run verify:production
 *   npm run verify:production -- --verbose
 */

import * as https from 'https'
import * as http from 'http'

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

interface VerificationResult {
  totalTests: number
  passed: number
  failed: number
  duration: number
  results: TestResult[]
}

class PostDeployVerifier {
  private apiUrl: string
  private verbose: boolean
  private results: TestResult[] = []
  private testEmail: string
  private testPassword: string
  private sessionCookie: string = ''
  private conversationId: string = ''

  constructor(apiUrl: string, verbose: boolean = false) {
    this.apiUrl = apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.verbose = verbose
    this.testEmail = `test-${Date.now()}@example.com`
    this.testPassword = 'TestPassword123!'
  }

  /**
   * Main verification entry point
   */
  async verify(): Promise<VerificationResult> {
    console.log(`\n${colors.cyan}${colors.bright}=== Post-Deploy Verification ===${colors.reset}`)
    console.log(`Target: ${colors.blue}${this.apiUrl}${colors.reset}`)
    console.log(`Time: ${new Date().toISOString()}\n`)

    const startTime = Date.now()

    try {
      // Run all test suites
      await this.testHealthEndpoint()
      await this.testAuthFlow()
      await this.testChatFlow()
      await this.testMetricsEndpoints()
      await this.testRateLimiting()
      await this.testSecurityHeaders()
      await this.testCsrfProtection()
      await this.testCorsPolicy()
      await this.testFileUpload()
      await this.testPerformance()

    } catch (error) {
      console.error(`${colors.red}Fatal error during verification:${colors.reset}`, error)
    }

    const duration = Date.now() - startTime
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length

    this.printResults({
      totalTests: this.results.length,
      passed,
      failed,
      duration,
      results: this.results,
    })

    return {
      totalTests: this.results.length,
      passed,
      failed,
      duration,
      results: this.results,
    }
  }

  /**
   * Test 1: Health endpoint
   */
  private async testHealthEndpoint(): Promise<void> {
    const testName = 'Health Endpoint'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/health')
      const duration = Date.now() - startTime

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const body = await response.json()

      if (body.status !== 'ok') {
        throw new Error(`Health check failed: ${JSON.stringify(body)}`)
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: body,
      })

      console.log(`${colors.green}✓ PASS${colors.reset} (${duration}ms)`)
      if (this.verbose) {
        console.log('Response:', body)
      }
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${error.message}`)
    }
  }

  /**
   * Test 2: Authentication flow
   */
  private async testAuthFlow(): Promise<void> {
    console.log(`\n${colors.cyan}Testing: Authentication Flow${colors.reset}`)

    // 2.1 Sign Up
    await this.testSignup()

    // 2.2 Sign In (skip verification for test)
    await this.testSignin()

    // 2.3 Get Current User
    if (this.sessionCookie) {
      await this.testGetMe()
    }

    // 2.4 Token Refresh
    if (this.sessionCookie) {
      await this.testTokenRefresh()
    }
  }

  private async testSignup(): Promise<void> {
    const testName = 'Auth: Signup'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.testEmail,
          password: this.testPassword,
          name: 'Test User Verifier',
        }),
      })
      const duration = Date.now() - startTime

      const body = await response.json()

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Expected 200/201, got ${response.status}: ${JSON.stringify(body)}`)
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { code: body.code },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  private async testSignin(): Promise<void> {
    const testName = 'Auth: Signin'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.testEmail,
          password: this.testPassword,
        }),
      })
      const duration = Date.now() - startTime

      const body = await response.json()

      // Extract session cookie from Set-Cookie header
      const setCookie = response.headers.get('set-cookie')
      if (setCookie) {
        const match = setCookie.match(/session=([^;]+)/)
        if (match) {
          this.sessionCookie = match[1]
        }
      }

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(body)}`)
      }

      if (!this.sessionCookie) {
        throw new Error('No session cookie received')
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { hasSession: !!this.sessionCookie },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  private async testGetMe(): Promise<void> {
    const testName = 'Auth: Get Current User'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/me', {
        headers: {
          'Cookie': `session=${this.sessionCookie}`,
        },
      })
      const duration = Date.now() - startTime

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const body = await response.json()

      if (!body.email || body.email !== this.testEmail) {
        throw new Error('User data mismatch')
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { email: body.email, tier: body.tier },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  private async testTokenRefresh(): Promise<void> {
    const testName = 'Auth: Token Refresh'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Cookie': `session=${this.sessionCookie}`,
        },
      })
      const duration = Date.now() - startTime

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const body = await response.json()

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { code: body.code },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 3: Chat flow
   */
  private async testChatFlow(): Promise<void> {
    console.log(`\n${colors.cyan}Testing: Chat Flow${colors.reset}`)

    if (!this.sessionCookie) {
      console.log(`${colors.yellow}⊘ SKIP${colors.reset} - Chat Flow (no session)`)
      return
    }

    await this.testCreateConversation()

    if (this.conversationId) {
      await this.testSendMessage()
      await this.testListConversations()
    }
  }

  private async testCreateConversation(): Promise<void> {
    const testName = 'Chat: Create Conversation'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${this.sessionCookie}`,
        },
        body: JSON.stringify({
          title: 'Post-Deploy Test Conversation',
        }),
      })
      const duration = Date.now() - startTime

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Expected 200/201, got ${response.status}`)
      }

      const body = await response.json()
      this.conversationId = body.id

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { conversationId: this.conversationId },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  private async testSendMessage(): Promise<void> {
    const testName = 'Chat: Send Message (SSE)'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${this.sessionCookie}`,
        },
        body: JSON.stringify({
          conversationId: this.conversationId,
          message: 'Test message: Reply with OK',
          model: 'gpt-4o-mini',
        }),
      })

      // For SSE, we just check if stream starts
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      // Read first few chunks to verify streaming
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let receivedData = false
      const timeout = setTimeout(() => {
        reader.cancel()
      }, 10000) // 10 second timeout

      try {
        const { done, value } = await reader.read()
        if (!done && value) {
          receivedData = true
        }
      } finally {
        clearTimeout(timeout)
        reader.releaseLock()
      }

      const duration = Date.now() - startTime

      if (!receivedData) {
        throw new Error('No SSE data received')
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { streaming: true },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  private async testListConversations(): Promise<void> {
    const testName = 'Chat: List Conversations'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/conversations', {
        headers: {
          'Cookie': `session=${this.sessionCookie}`,
        },
      })
      const duration = Date.now() - startTime

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const body = await response.json()

      if (!Array.isArray(body)) {
        throw new Error('Response is not an array')
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { count: body.length },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 4: Metrics endpoints
   */
  private async testMetricsEndpoints(): Promise<void> {
    console.log(`\n${colors.cyan}Testing: Metrics Endpoints${colors.reset}`)

    await this.testMetricsSystem()
    await this.testMetricsProviders()
  }

  private async testMetricsSystem(): Promise<void> {
    const testName = 'Metrics: System'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/metrics/system')
      const duration = Date.now() - startTime

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const body = await response.json()

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: body,
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  private async testMetricsProviders(): Promise<void> {
    const testName = 'Metrics: Providers'

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/metrics/providers')
      const duration = Date.now() - startTime

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }

      const body = await response.json()

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: body,
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 5: Rate limiting
   */
  private async testRateLimiting(): Promise<void> {
    const testName = 'Security: Rate Limiting'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    try {
      const startTime = Date.now()

      // Send multiple requests rapidly
      const requests = []
      for (let i = 0; i < 10; i++) {
        requests.push(this.fetch('/api/health'))
      }

      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      // Check for rate limit headers
      const firstResponse = responses[0]
      const hasRateLimitHeaders =
        firstResponse.headers.has('x-ratelimit-limit') ||
        firstResponse.headers.has('ratelimit-limit')

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { hasRateLimitHeaders, requestCount: requests.length },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
      if (this.verbose) {
        console.log('Rate limit headers:', hasRateLimitHeaders)
      }
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 6: Security headers
   */
  private async testSecurityHeaders(): Promise<void> {
    const testName = 'Security: Headers'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    try {
      const startTime = Date.now()
      const response = await this.fetch('/api/health')
      const duration = Date.now() - startTime

      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'strict-transport-security',
      ]

      const missingHeaders = requiredHeaders.filter(
        header => !response.headers.has(header)
      )

      if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`)
      }

      this.results.push({
        name: testName,
        passed: true,
        duration,
        details: { securityHeaders: requiredHeaders },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 7: CSRF Protection
   */
  private async testCsrfProtection(): Promise<void> {
    const testName = 'Security: CSRF Protection'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    try {
      const startTime = Date.now()

      // Test POST request without CSRF header (should fail)
      const response = await this.fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Intentionally omit CSRF token header
        },
        body: JSON.stringify({
          email: `csrf-test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: 'CSRF Test User',
        }),
      })

      const duration = Date.now() - startTime

      // Check if request was rejected (403 or 400 status expected)
      if (response.status === 403 || response.status === 400) {
        this.results.push({
          name: testName,
          passed: true,
          duration,
          details: {
            status: response.status,
            message: 'CSRF protection working - request rejected without token'
          },
        })
        console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
      } else {
        // If request succeeded, CSRF protection may not be enabled
        this.results.push({
          name: testName,
          passed: false,
          duration,
          error: `Expected 403/400, got ${response.status}. CSRF protection may not be enabled.`,
        })
        console.log(`${colors.yellow}⚠ WARN${colors.reset} - ${testName}: CSRF protection may not be enabled (got ${response.status})`)
      }
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 8: CORS Policy
   */
  private async testCorsPolicy(): Promise<void> {
    const testName = 'Security: CORS Policy'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    try {
      const startTime = Date.now()

      // Test request from invalid origin
      const response = await this.fetch('/api/health', {
        headers: {
          'Origin': 'https://malicious-site.com',
        },
      })

      const duration = Date.now() - startTime

      // Check CORS headers
      const corsHeader = response.headers.get('access-control-allow-origin')

      if (!corsHeader || corsHeader === 'https://malicious-site.com') {
        this.results.push({
          name: testName,
          passed: false,
          duration,
          error: 'CORS not configured or allows all origins (security risk)',
        })
        console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: CORS misconfigured`)
      } else {
        this.results.push({
          name: testName,
          passed: true,
          duration,
          details: {
            allowedOrigin: corsHeader,
            message: 'CORS properly configured'
          },
        })
        console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)
      }

      if (this.verbose) {
        console.log('CORS Headers:', {
          'Access-Control-Allow-Origin': corsHeader,
          'Access-Control-Allow-Credentials': response.headers.get('access-control-allow-credentials'),
        })
      }
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 9: File Upload
   */
  private async testFileUpload(): Promise<void> {
    const testName = 'Feature: File Upload'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    if (!this.sessionCookie) {
      console.log(`${colors.yellow}⊘ SKIP${colors.reset} - ${testName} (no session)`)
      return
    }

    try {
      const startTime = Date.now()

      // Create a simple text file for testing
      const testFileContent = 'This is a test file for upload verification'
      const blob = new Blob([testFileContent], { type: 'text/plain' })

      // Create FormData
      const formData = new FormData()
      formData.append('file', blob, 'test-file.txt')

      // Upload file
      const response = await this.fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Cookie': `session=${this.sessionCookie}`,
          // Note: Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      })

      const duration = Date.now() - startTime

      if (response.status === 200 || response.status === 201) {
        const body = await response.json()

        // Check if response contains upload URL
        if (body.url || body.fileUrl || body.location) {
          const uploadUrl = body.url || body.fileUrl || body.location

          this.results.push({
            name: testName,
            passed: true,
            duration,
            details: {
              uploadUrl,
              message: 'File uploaded successfully'
            },
          })
          console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (${duration}ms)`)

          if (this.verbose) {
            console.log('Upload response:', body)
          }
        } else {
          throw new Error('Upload succeeded but no URL in response')
        }
      } else if (response.status === 404) {
        // Upload endpoint may not exist
        this.results.push({
          name: testName,
          passed: false,
          duration,
          error: 'Upload endpoint not found (404). File upload may not be implemented.',
        })
        console.log(`${colors.yellow}⊘ SKIP${colors.reset} - ${testName}: Upload endpoint not found`)
      } else {
        throw new Error(`Expected 200/201, got ${response.status}`)
      }
    } catch (error: any) {
      // File upload is optional, so we treat errors as warnings
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.yellow}⊘ SKIP${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Test 10: Performance benchmarks
   */
  private async testPerformance(): Promise<void> {
    const testName = 'Performance: Response Times'
    console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`)

    try {
      const measurements: number[] = []

      // Measure 5 requests
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        await this.fetch('/api/health')
        const duration = Date.now() - startTime
        measurements.push(duration)
      }

      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
      const max = Math.max(...measurements)
      const min = Math.min(...measurements)

      // Warn if average > 500ms
      const passed = avg < 1000 // Fail only if > 1000ms

      this.results.push({
        name: testName,
        passed,
        duration: avg,
        details: { avg, max, min, samples: measurements.length },
      })

      if (passed) {
        console.log(`${colors.green}✓ PASS${colors.reset} - ${testName} (avg: ${avg.toFixed(0)}ms)`)
      } else {
        console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName} (avg: ${avg.toFixed(0)}ms > 1000ms)`)
      }

      if (this.verbose) {
        console.log(`Min: ${min}ms, Max: ${max}ms, Avg: ${avg.toFixed(0)}ms`)
      }
    } catch (error: any) {
      this.results.push({
        name: testName,
        passed: false,
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}: ${error.message}`)
    }
  }

  /**
   * Helper: Fetch wrapper
   */
  private async fetch(path: string, options: any = {}): Promise<any> {
    const url = `${this.apiUrl}${path}`

    // Use native fetch if available (Node 18+)
    if (typeof fetch !== 'undefined') {
      return fetch(url, options)
    }

    // Fallback for older Node versions
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const client = urlObj.protocol === 'https:' ? https : http

      const req = client.request(
        url,
        {
          method: options.method || 'GET',
          headers: options.headers || {},
        },
        (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: {
                get: (name: string) => res.headers[name.toLowerCase()],
                has: (name: string) => name.toLowerCase() in res.headers,
              },
              json: async () => JSON.parse(data),
              body: null, // Not implemented for Node fetch fallback
            })
          })
        }
      )

      req.on('error', reject)

      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }

  /**
   * Print results summary
   */
  private printResults(result: VerificationResult): void {
    console.log(`\n${colors.bright}=== Verification Results ===${colors.reset}\n`)

    // Summary
    const passRate = (result.passed / result.totalTests * 100).toFixed(1)
    console.log(`Total Tests: ${result.totalTests}`)
    console.log(`${colors.green}Passed: ${result.passed}${colors.reset}`)
    if (result.failed > 0) {
      console.log(`${colors.red}Failed: ${result.failed}${colors.reset}`)
    }
    console.log(`Pass Rate: ${passRate}%`)
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s\n`)

    // Failed tests
    if (result.failed > 0) {
      console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`)
      result.results
        .filter(r => !r.passed)
        .forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.name}`)
          console.log(`     ${colors.red}Error: ${r.error}${colors.reset}`)
        })
      console.log('')
    }

    // Performance summary
    const perfTest = result.results.find(r => r.name.includes('Performance'))
    if (perfTest && perfTest.details) {
      console.log(`${colors.cyan}Performance Metrics:${colors.reset}`)
      console.log(`  Average: ${perfTest.details.avg.toFixed(0)}ms`)
      console.log(`  Min: ${perfTest.details.min}ms`)
      console.log(`  Max: ${perfTest.details.max}ms`)
      console.log('')
    }

    // Final verdict
    if (result.failed === 0) {
      console.log(`${colors.green}${colors.bright}✓ All tests passed! System is healthy.${colors.reset}\n`)
    } else {
      console.log(`${colors.red}${colors.bright}✗ Some tests failed. Review errors above.${colors.reset}\n`)
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.API_URL || 'http://localhost:3000'

  if (!apiUrl) {
    console.error(`${colors.red}Error: API_URL not set${colors.reset}`)
    console.error('Set NEXT_PUBLIC_APP_URL or API_URL environment variable')
    process.exit(1)
  }

  const verifier = new PostDeployVerifier(apiUrl, verbose)
  const result = await verifier.verify()

  // Exit with error code if tests failed
  if (result.failed > 0) {
    process.exit(1)
  }

  process.exit(0)
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { PostDeployVerifier }
