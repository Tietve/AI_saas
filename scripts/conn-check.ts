/**
 * Connection Check Script
 *
 * Non-invasive connectivity tests for production services
 * Tests database, Redis, and Sentry connections without modifying data
 *
 * Usage:
 *   npm run conn:check
 *   npm run conn:check -- --verbose
 */

import * as fs from 'fs'
import * as path from 'path'

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

interface ConnectionResult {
  service: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  error?: string
  details?: any
}

class ConnectionChecker {
  private results: ConnectionResult[] = []
  private verbose: boolean = false

  constructor(verbose: boolean = false) {
    this.verbose = verbose
  }

  /**
   * Main check entry point
   */
  async check(): Promise<{ passed: number; failed: number; skipped: number }> {
    console.log(`\n${colors.cyan}${colors.bright}=== Connection Check ===${colors.reset}`)
    console.log(`Time: ${new Date().toISOString()}\n`)

    // Load environment variables
    this.loadEnv()

    // Run checks
    await this.checkDatabase()
    await this.checkRedis()
    await this.checkSentry()

    // Print results
    this.printResults()

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length

    return { passed, failed, skipped }
  }

  /**
   * Load environment variables from .env.production
   */
  private loadEnv() {
    const envFiles = ['.env.production', '.env.local', '.env']

    for (const file of envFiles) {
      const filepath = path.resolve(process.cwd(), file)
      if (fs.existsSync(filepath)) {
        if (this.verbose) {
          console.log(`${colors.blue}Loading ${file}${colors.reset}`)
        }

        const content = fs.readFileSync(filepath, 'utf-8')
        content.split('\n').forEach(line => {
          const match = line.match(/^\s*([\\w.-]+)\s*=\s*(.*?)\s*$/)
          if (match && !match[1].startsWith('#')) {
            const key = match[1]
            const value = match[2] || ''
            // Only set if not already in process.env
            if (!process.env[key]) {
              process.env[key] = value.replace(/^["'](.+)["']$/, '$1')
            }
          }
        })
      }
    }
  }

  /**
   * Test Database Connection (PostgreSQL via Prisma)
   */
  private async checkDatabase(): Promise<void> {
    const service = 'Database (PostgreSQL)'
    console.log(`\n${colors.cyan}Testing: ${service}${colors.reset}`)

    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl || dbUrl.startsWith('REQUIRED_') || dbUrl.startsWith('OPTIONAL_')) {
      this.results.push({
        service,
        status: 'skip',
        duration: 0,
        details: { reason: 'DATABASE_URL not configured' },
      })
      console.log(`${colors.yellow}⊘ SKIP${colors.reset} - DATABASE_URL not configured`)
      return
    }

    try {
      const startTime = Date.now()

      // Dynamically import Prisma (might not be built yet)
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      })

      // Test connection with simple query
      await prisma.$queryRaw`SELECT 1 as result`

      // Disconnect
      await prisma.$disconnect()

      const duration = Date.now() - startTime

      this.results.push({
        service,
        status: 'pass',
        duration,
        details: { query: 'SELECT 1' },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - Database connection successful (${duration}ms)`)
    } catch (error: any) {
      this.results.push({
        service,
        status: 'fail',
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${error.message}`)
      if (this.verbose) {
        console.log(error.stack)
      }
    }
  }

  /**
   * Test Redis Connection (Upstash or standard Redis)
   */
  private async checkRedis(): Promise<void> {
    const service = 'Redis (Cache)'
    console.log(`\n${colors.cyan}Testing: ${service}${colors.reset}`)

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    const redisUrl = process.env.REDIS_URL

    // Check if Redis is configured
    const hasUpstash = upstashUrl && upstashToken &&
                       !upstashUrl.startsWith('REQUIRED_') &&
                       !upstashUrl.startsWith('OPTIONAL_')
    const hasStandardRedis = redisUrl &&
                             !redisUrl.startsWith('REQUIRED_') &&
                             !redisUrl.startsWith('OPTIONAL_')

    if (!hasUpstash && !hasStandardRedis) {
      this.results.push({
        service,
        status: 'skip',
        duration: 0,
        details: { reason: 'Redis not configured (optional)' },
      })
      console.log(`${colors.yellow}⊘ SKIP${colors.reset} - Redis not configured (optional)`)
      return
    }

    try {
      const startTime = Date.now()

      if (hasUpstash) {
        // Test Upstash Redis REST API
        const response = await fetch(`${upstashUrl}/ping`, {
          headers: {
            Authorization: `Bearer ${upstashToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Upstash responded with ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.result !== 'PONG') {
          throw new Error(`Unexpected response: ${JSON.stringify(data)}`)
        }

        const duration = Date.now() - startTime

        this.results.push({
          service: service + ' (Upstash)',
          status: 'pass',
          duration,
          details: { method: 'PING', response: 'PONG' },
        })

        console.log(`${colors.green}✓ PASS${colors.reset} - Upstash Redis connection successful (${duration}ms)`)
      } else {
        // Test standard Redis (using ioredis if available)
        try {
          const { default: Redis } = await import('ioredis')
          const redis = new Redis(redisUrl!)

          const result = await redis.ping()

          if (result !== 'PONG') {
            throw new Error(`Expected PONG, got ${result}`)
          }

          redis.disconnect()

          const duration = Date.now() - startTime

          this.results.push({
            service: service + ' (IORedis)',
            status: 'pass',
            duration,
            details: { method: 'PING', response: 'PONG' },
          })

          console.log(`${colors.green}✓ PASS${colors.reset} - Redis connection successful (${duration}ms)`)
        } catch (importError) {
          throw new Error('ioredis package not installed. Run: npm install ioredis')
        }
      }
    } catch (error: any) {
      this.results.push({
        service,
        status: 'fail',
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${error.message}`)
      if (this.verbose) {
        console.log(error.stack)
      }
    }
  }

  /**
   * Test Sentry Connection
   */
  private async checkSentry(): Promise<void> {
    const service = 'Sentry (Monitoring)'
    console.log(`\n${colors.cyan}Testing: ${service}${colors.reset}`)

    const sentryDsn = process.env.SENTRY_DSN

    if (!sentryDsn || sentryDsn.startsWith('REQUIRED_') || sentryDsn.startsWith('OPTIONAL_')) {
      this.results.push({
        service,
        status: 'skip',
        duration: 0,
        details: { reason: 'SENTRY_DSN not configured (optional)' },
      })
      console.log(`${colors.yellow}⊘ SKIP${colors.reset} - SENTRY_DSN not configured (optional)`)
      return
    }

    try {
      const startTime = Date.now()

      // Dynamically import Sentry
      const Sentry = await import('@sentry/nextjs')

      // Initialize Sentry
      Sentry.init({
        dsn: sentryDsn,
        environment: 'connection-check',
        beforeSend(event) {
          // Mark event as test
          if (event.tags) {
            event.tags['test'] = 'connection-check'
          } else {
            event.tags = { test: 'connection-check' }
          }
          return event
        },
      })

      // Send test event
      const eventId = Sentry.captureMessage('Connection check test event', {
        level: 'info',
        tags: {
          test: 'connection-check',
          timestamp: new Date().toISOString(),
        },
      })

      // Flush events to ensure they're sent
      await Sentry.flush(2000)

      const duration = Date.now() - startTime

      this.results.push({
        service,
        status: 'pass',
        duration,
        details: { eventId, message: 'Test event sent successfully' },
      })

      console.log(`${colors.green}✓ PASS${colors.reset} - Sentry connection successful (${duration}ms)`)
      console.log(`  Event ID: ${eventId}`)
      console.log(`  ${colors.blue}Check your Sentry dashboard: https://sentry.io${colors.reset}`)
    } catch (error: any) {
      this.results.push({
        service,
        status: 'fail',
        duration: 0,
        error: error.message,
      })
      console.log(`${colors.red}✗ FAIL${colors.reset} - ${error.message}`)
      if (this.verbose) {
        console.log(error.stack)
      }
    }
  }

  /**
   * Print results summary
   */
  private printResults(): void {
    console.log(`\n${colors.bright}=== Connection Check Results ===${colors.reset}\n`)

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length

    console.log(`Total Checks: ${this.results.length}`)
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`)
    if (failed > 0) {
      console.log(`${colors.red}Failed: ${failed}${colors.reset}`)
    }
    if (skipped > 0) {
      console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`)
    }
    console.log('')

    // Show failed services
    if (failed > 0) {
      console.log(`${colors.red}${colors.bright}Failed Services:${colors.reset}`)
      this.results
        .filter(r => r.status === 'fail')
        .forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.service}`)
          console.log(`     ${colors.red}Error: ${r.error}${colors.reset}`)
        })
      console.log('')
    }

    // Show skipped services
    if (skipped > 0 && this.verbose) {
      console.log(`${colors.yellow}${colors.bright}Skipped Services:${colors.reset}`)
      this.results
        .filter(r => r.status === 'skip')
        .forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.service}`)
          console.log(`     Reason: ${r.details?.reason}`)
        })
      console.log('')
    }

    // Final verdict
    if (failed === 0) {
      console.log(`${colors.green}${colors.bright}✓ All configured services are reachable!${colors.reset}\n`)
      if (skipped > 0) {
        console.log(`${colors.yellow}Note: ${skipped} service(s) skipped due to missing configuration.${colors.reset}`)
        console.log(`${colors.yellow}This is OK if those services are optional.${colors.reset}\n`)
      }
    } else {
      console.log(`${colors.red}${colors.bright}✗ Some services failed connection tests.${colors.reset}`)
      console.log(`${colors.red}Review errors above and check your .env.production file.${colors.reset}\n`)
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')

  const checker = new ConnectionChecker(verbose)
  const { passed, failed, skipped } = await checker.check()

  // Exit with error code if any checks failed
  if (failed > 0) {
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

export { ConnectionChecker }
