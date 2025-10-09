/**
 * Environment Variables Verification Script
 *
 * Validates all required environment variables before deployment
 * Fails fast if critical variables are missing or invalid
 *
 * Usage:
 *   npm run env:verify
 *   npm run env:verify -- --strict  (fail on warnings too)
 */

import * as fs from 'fs'
import * as path from 'path'

// ANSI Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

class EnvValidator {
  private errors: string[] = []
  private warnings: string[] = []
  private info: string[] = []
  private strictMode: boolean = false

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode
  }

  /**
   * Main validation entry point
   */
  validate(): ValidationResult {
    console.log(`\n${colors.cyan}${colors.bright}=== Environment Variables Verification ===${colors.reset}\n`)

    // Check if .env file exists
    this.checkEnvFileExists()

    // Load environment variables
    this.loadEnv()

    // Run validation checks
    this.validateCoreVariables()
    this.validateAIProviders()
    this.validateDatabase()
    this.validateSecurity()
    this.validateEmail()
    this.validatePayment()
    this.validateCaching()
    this.validateMonitoring()
    this.checkDevelopmentFlags()
    this.checkDeprecatedVariables()

    // Print results
    this.printResults()

    const passed = this.errors.length === 0 && (!this.strictMode || this.warnings.length === 0)

    return {
      passed,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
    }
  }

  private checkEnvFileExists() {
    const envPaths = ['.env', '.env.local', '.env.production']
    const foundEnv = envPaths.find(p => fs.existsSync(path.resolve(process.cwd(), p)))

    if (!foundEnv) {
      this.warnings.push('No .env file found. Using system environment variables only.')
    } else {
      this.info.push(`Using environment file: ${foundEnv}`)
    }
  }

  private loadEnv() {
    try {
      // Try to load .env files
      const envFiles = ['.env.local', '.env', '.env.production']
      for (const file of envFiles) {
        const filepath = path.resolve(process.cwd(), file)
        if (fs.existsSync(filepath)) {
          const content = fs.readFileSync(filepath, 'utf-8')
          content.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
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
    } catch (error) {
      this.warnings.push('Failed to load .env files. Using system environment only.')
    }
  }

  private validateCoreVariables() {
    this.info.push('Checking core variables...')

    // NODE_ENV
    const nodeEnv = process.env.NODE_ENV
    if (!nodeEnv) {
      this.errors.push('NODE_ENV is not set')
    } else if (!['development', 'production', 'test'].includes(nodeEnv)) {
      this.warnings.push(`NODE_ENV="${nodeEnv}" is not a standard value (expected: development, production, or test)`)
    } else {
      this.info.push(`NODE_ENV: ${nodeEnv}`)
    }

    // NEXT_PUBLIC_APP_URL
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      this.errors.push('NEXT_PUBLIC_APP_URL is required')
    } else if (!this.isValidUrl(process.env.NEXT_PUBLIC_APP_URL)) {
      this.errors.push('NEXT_PUBLIC_APP_URL must be a valid URL')
    }
  }

  private validateAIProviders() {
    this.info.push('Checking AI provider keys...')

    const providers = [
      { name: 'OpenAI', key: 'OPENAI_API_KEY', pattern: /^sk-/ },
      { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', pattern: /^sk-ant-/ },
      { name: 'Google/Gemini', key: 'GOOGLE_API_KEY', pattern: /^AIza/ },
      { name: 'Google/Gemini (alt)', key: 'GEMINI_API_KEY', pattern: /^AIza/ },
      { name: 'Groq', key: 'GROQ_API_KEY', pattern: /^gsk_/ },
      { name: 'X.AI', key: 'XAI_API_KEY', pattern: /^xai-/ },
    ]

    const hasAtLeastOneProvider = providers.some(p => !!process.env[p.key])

    if (!hasAtLeastOneProvider) {
      this.errors.push('At least ONE AI provider key is required (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY)')
    } else {
      providers.forEach(provider => {
        if (process.env[provider.key]) {
          if (!provider.pattern.test(process.env[provider.key]!)) {
            this.warnings.push(`${provider.key} has unexpected format (expected pattern: ${provider.pattern})`)
          } else {
            this.info.push(`✓ ${provider.name} key configured`)
          }
        }
      })
    }
  }

  private validateDatabase() {
    this.info.push('Checking database configuration...')

    if (!process.env.DATABASE_URL) {
      this.errors.push('DATABASE_URL is required')
      return
    }

    const dbUrl = process.env.DATABASE_URL

    // Check if it's a PostgreSQL URL
    if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
      this.errors.push('DATABASE_URL must be a PostgreSQL connection string')
      return
    }

    // Check for connection pooling settings in production
    if (process.env.NODE_ENV === 'production') {
      if (!dbUrl.includes('connection_limit')) {
        this.warnings.push('DATABASE_URL should include connection_limit parameter for production (recommended: connection_limit=10)')
      }
      if (!dbUrl.includes('pool_timeout')) {
        this.warnings.push('DATABASE_URL should include pool_timeout parameter for production (recommended: pool_timeout=20)')
      }
    }

    this.info.push('✓ DATABASE_URL configured')
  }

  private validateSecurity() {
    this.info.push('Checking security configuration...')

    // AUTH_SECRET
    if (!process.env.AUTH_SECRET) {
      this.errors.push('AUTH_SECRET is required for JWT token signing')
      return
    }

    if (process.env.AUTH_SECRET.length < 32) {
      this.errors.push('AUTH_SECRET must be at least 32 characters long')
    }

    // Check if AUTH_SECRET looks like a placeholder
    const insecureSecrets = [
      'your-super-secret-key',
      'change-me',
      'secret',
      'dev-secret',
      'test-secret',
      '12345',
    ]
    if (insecureSecrets.some(s => process.env.AUTH_SECRET?.toLowerCase().includes(s))) {
      this.errors.push('AUTH_SECRET appears to be a placeholder or insecure value. Generate a cryptographically random secret.')
    }

    // Production security checks
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
        this.warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production')
      }
    }

    this.info.push('✓ Security variables configured')
  }

  private validateEmail() {
    // Only required if email verification is enabled
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      this.info.push('Checking email configuration (REQUIRE_EMAIL_VERIFICATION=true)...')

      const requiredEmailVars = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'SMTP_FROM',
      ]

      requiredEmailVars.forEach(varName => {
        if (!process.env[varName]) {
          this.errors.push(`${varName} is required when REQUIRE_EMAIL_VERIFICATION=true`)
        }
      })

      // Validate SMTP_PORT is a number
      if (process.env.SMTP_PORT && isNaN(Number(process.env.SMTP_PORT))) {
        this.errors.push('SMTP_PORT must be a number')
      }

      // Validate SMTP_FROM is an email
      if (process.env.SMTP_FROM && !this.isValidEmail(process.env.SMTP_FROM)) {
        this.warnings.push('SMTP_FROM should be a valid email address or formatted as "Name <email@domain.com>"')
      }
    }
  }

  private validatePayment() {
    // Check if any payment variable is set (indicates payment feature is used)
    const paymentVars = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY']
    const somePaymentVarSet = paymentVars.some(v => !!process.env[v])

    if (somePaymentVarSet) {
      this.info.push('Checking payment configuration...')

      paymentVars.forEach(varName => {
        if (!process.env[varName]) {
          this.errors.push(`${varName} is required when payment is enabled (found partial payment config)`)
        }
      })
    }
  }

  private validateCaching() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN

    if (redisUrl && !redisToken) {
      this.errors.push('REDIS_TOKEN is required when REDIS_URL is set')
    }

    if (!redisUrl && process.env.NODE_ENV === 'production') {
      this.warnings.push('Redis not configured. Rate limiting and caching will use in-memory storage (not recommended for production with multiple instances)')
    }

    if (redisUrl && !redisUrl.startsWith('https://')) {
      this.warnings.push('REDIS_URL should use HTTPS (https://) for security')
    }
  }

  private validateMonitoring() {
    if (!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
      this.warnings.push('SENTRY_DSN not set. Error tracking disabled in production (recommended to enable)')
    }

    if (process.env.SENTRY_DSN && !this.isValidUrl(process.env.SENTRY_DSN)) {
      this.warnings.push('SENTRY_DSN does not appear to be a valid URL')
    }
  }

  private checkDevelopmentFlags() {
    if (process.env.NODE_ENV === 'production') {
      this.info.push('Checking for development flags in production...')

      const dangerousDevFlags = [
        'DEV_BYPASS_LIMIT',
        'DEV_BYPASS_PAY',
        'MOCK_AI',
        'USE_FAKE_AI',
        'DEBUG_OPENAI',
        'DEBUG_AUTH',
      ]

      dangerousDevFlags.forEach(flag => {
        if (process.env[flag] === '1' || process.env[flag] === 'true') {
          this.errors.push(`⚠️ CRITICAL: ${flag} is enabled in production! This is a SECURITY RISK.`)
        }
      })
    }
  }

  private checkDeprecatedVariables() {
    const deprecated = [
      { old: 'NEXTAUTH_SECRET', new: 'AUTH_SECRET' },
      { old: 'NEXTAUTH_URL', new: 'NEXT_PUBLIC_APP_URL' },
    ]

    deprecated.forEach(({ old, new: newVar }) => {
      if (process.env[old]) {
        this.warnings.push(`${old} is deprecated. Use ${newVar} instead.`)
      }
    })
  }

  private isValidUrl(str: string): boolean {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  private isValidEmail(str: string): boolean {
    // Simple email validation (can be in "Name <email@domain.com>" format)
    const emailRegex = /<([^>]+)>|^([^\s@]+@[^\s@]+\.[^\s@]+)$/
    return emailRegex.test(str)
  }

  private printResults() {
    console.log(`\n${colors.bright}=== Validation Results ===${colors.reset}\n`)

    // Errors
    if (this.errors.length > 0) {
      console.log(`${colors.red}${colors.bright}✗ Errors (${this.errors.length})${colors.reset}`)
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${colors.red}${error}${colors.reset}`)
      })
      console.log('')
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}${colors.bright}⚠ Warnings (${this.warnings.length})${colors.reset}`)
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${colors.yellow}${warning}${colors.reset}`)
      })
      console.log('')
    }

    // Info
    if (this.info.length > 0) {
      console.log(`${colors.blue}${colors.bright}ℹ Info (${this.info.length})${colors.reset}`)
      this.info.forEach((info, i) => {
        console.log(`  ${i + 1}. ${colors.blue}${info}${colors.reset}`)
      })
      console.log('')
    }

    // Summary
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`${colors.green}${colors.bright}✓ All environment variables are valid!${colors.reset}\n`)
    } else if (this.errors.length === 0) {
      console.log(`${colors.yellow}${colors.bright}✓ No critical errors, but there are ${this.warnings.length} warning(s).${colors.reset}\n`)
    } else {
      console.log(`${colors.red}${colors.bright}✗ Validation failed with ${this.errors.length} error(s).${colors.reset}\n`)
    }

    // Strict mode message
    if (this.strictMode && this.warnings.length > 0) {
      console.log(`${colors.yellow}Running in strict mode: Warnings treated as errors.${colors.reset}\n`)
    }
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2)
  const strictMode = args.includes('--strict')

  const validator = new EnvValidator(strictMode)
  const result = validator.validate()

  // Exit with appropriate code
  if (!result.passed) {
    console.log(`${colors.red}Environment validation failed!${colors.reset}`)
    console.log(`Run ${colors.cyan}npm run env:verify${colors.reset} to see details.\n`)
    console.log(`See ${colors.cyan}docs/ENVIRONMENT_VARS.md${colors.reset} for configuration guide.\n`)
    process.exit(1)
  } else {
    console.log(`${colors.green}✓ Environment validation passed!${colors.reset}\n`)
    process.exit(0)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { EnvValidator }
