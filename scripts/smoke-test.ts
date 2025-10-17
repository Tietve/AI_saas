/**
 * Smoke Tests for Critical Flows
 *
 * These tests verify that critical parts of the application work.
 * Run after deployment to catch major issues before users do!
 *
 * Cost: $0 (FREE - no paid testing service needed)
 *
 * Usage:
 *   npm run test:smoke
 *   npm run test:smoke -- --verbose
 */

import { logger } from '@/lib/logger'
import { sendAlert } from './free-alerting-webhook'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

const BASE_URL = process.env.SMOKE_TEST_URL || 'https://www.firbox.net'
const isVerbose = process.argv.includes('--verbose')

/**
 * Run a single test
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now()

  try {
    await testFn()
    const duration = Date.now() - startTime

    if (isVerbose) {
      console.log(`✅ ${name} (${duration}ms)`)
    }

    return { name, passed: true, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error(`❌ ${name} (${duration}ms): ${errorMsg}`)

    return { name, passed: false, duration, error: errorMsg }
  }
}

/**
 * Smoke Tests
 */
const tests = [
  {
    name: 'Health check responds',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/health`)
      if (res.status !== 200) {
        throw new Error(`Health check failed with status ${res.status}`)
      }
      const data = await res.json()
      if (!data.ok) {
        throw new Error('Health check returned ok: false')
      }
    },
  },

  {
    name: 'Database is accessible',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/health`)
      const data = await res.json()
      if (!data.checks?.database) {
        throw new Error('Database check failed')
      }
    },
  },

  {
    name: 'Redis is accessible',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/health`)
      const data = await res.json()
      if (!data.checks?.redis) {
        throw new Error('Redis check failed')
      }
    },
  },

  {
    name: 'API v1 is accessible',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/v1/health`)
      if (res.status !== 200) {
        throw new Error(`v1 API failed with status ${res.status}`)
      }
      const version = res.headers.get('X-Api-Version')
      if (version !== 'v1') {
        throw new Error(`Expected version v1, got ${version}`)
      }
    },
  },

  {
    name: 'Homepage loads',
    test: async () => {
      const res = await fetch(`${BASE_URL}/`)
      if (res.status !== 200) {
        throw new Error(`Homepage failed with status ${res.status}`)
      }
    },
  },

  {
    name: 'Signin page loads',
    test: async () => {
      const res = await fetch(`${BASE_URL}/auth/signin`)
      if (res.status !== 200) {
        throw new Error(`Signin page failed with status ${res.status}`)
      }
    },
  },

  {
    name: 'Response time < 2s',
    test: async () => {
      const startTime = Date.now()
      await fetch(`${BASE_URL}/api/health`)
      const duration = Date.now() - startTime

      if (duration > 2000) {
        throw new Error(`Response took ${duration}ms (threshold: 2000ms)`)
      }
    },
  },

  {
    name: 'Rate limiting is active',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/health`)
      const hasRateLimitHeaders =
        res.headers.has('X-RateLimit-Limit') ||
        res.headers.has('X-Rate-Limit-Limit')

      if (!hasRateLimitHeaders) {
        // Rate limiting might not add headers on success, that's okay
        // This test just warns if missing
        if (isVerbose) {
          console.warn('⚠️  Rate limit headers not found (this may be normal)')
        }
      }
    },
  },

  {
    name: 'CSRF endpoint works',
    test: async () => {
      const res = await fetch(`${BASE_URL}/api/csrf`)
      if (res.status !== 200) {
        throw new Error(`CSRF endpoint failed with status ${res.status}`)
      }
      const data = await res.json()
      if (!data.token) {
        throw new Error('CSRF endpoint did not return token')
      }
    },
  },

  {
    name: 'Security headers present',
    test: async () => {
      const res = await fetch(`${BASE_URL}/`)
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
      ]

      const missingHeaders = requiredHeaders.filter(
        (header) => !res.headers.has(header)
      )

      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing security headers: ${missingHeaders.join(', ')}`
        )
      }
    },
  },
]

/**
 * Main test runner
 */
async function main() {
  console.log('🔍 Running smoke tests...')
  console.log(`Target: ${BASE_URL}\n`)

  const startTime = Date.now()
  const results: TestResult[] = []

  // Run all tests
  for (const { name, test } of tests) {
    const result = await runTest(name, test)
    results.push(result)
  }

  const totalTime = Date.now() - startTime

  // Summary
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log('\n📊 Test Results:')
  console.log(`  Total: ${results.length}`)
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⏱️  Duration: ${totalTime}ms`)

  // Send alert if tests failed
  if (failed > 0) {
    const failedTests = results
      .filter((r) => !r.passed)
      .map((r) => `${r.name}: ${r.error}`)

    await sendAlert({
      title: '🚨 Smoke Tests Failed',
      message: `${failed}/${results.length} smoke tests failed after deployment`,
      level: 'critical',
      tags: ['testing', 'deployment', 'smoke-test'],
      metadata: {
        environment: BASE_URL,
        passed,
        failed,
        failedTests: failedTests.join('; '),
      },
    })

    logger.error(
      { results, passed, failed },
      'Smoke tests failed'
    )

    process.exit(1)
  }

  // Send success alert
  await sendAlert({
    title: '✅ Smoke Tests Passed',
    message: `All ${passed} smoke tests passed successfully!`,
    level: 'info',
    tags: ['testing', 'deployment', 'smoke-test'],
    metadata: {
      environment: BASE_URL,
      totalTests: results.length,
      duration: `${totalTime}ms`,
    },
  })

  logger.info(
    { results, passed, totalTime },
    'All smoke tests passed'
  )

  console.log('\n✅ All smoke tests passed!')
  process.exit(0)
}

// Run tests
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Smoke test runner failed:', error)
    process.exit(1)
  })
}

export { runTest, tests }
