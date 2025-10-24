#!/usr/bin/env tsx

/**
 * Health Endpoint Test Script
 * 
 * Tests all health endpoints to ensure they work correctly
 * in both local and Azure production environments.
 */

import { performance } from 'perf_hooks'

interface TestResult {
  endpoint: string
  status: 'PASS' | 'FAIL' | 'WARN'
  httpStatus: number
  responseTime: number
  response?: any
  error?: string
}

class HealthEndpointTester {
  private baseUrl: string
  private results: TestResult[] = []

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async runAllTests(): Promise<void> {
    console.log('🏥 Health Endpoint Test Suite')
    console.log('============================')
    console.log(`Base URL: ${this.baseUrl}`)
    console.log('')

    const endpoints = [
      '/api/health',
      '/api/health-simple', 
      '/api/v1/health',
      '/api/health-edge'
    ]

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint)
    }

    this.printResults()
  }

  private async testEndpoint(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`
    const startTime = performance.now()

    try {
      console.log(`🔍 Testing ${endpoint}...`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Health-Check-Test/1.0'
        }
      })

      const responseTime = Math.round(performance.now() - startTime)
      const responseData = await response.json()

      const result: TestResult = {
        endpoint,
        status: this.determineStatus(response.status, responseData),
        httpStatus: response.status,
        responseTime,
        response: responseData
      }

      this.results.push(result)
      this.logResult(result)

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime)
      const result: TestResult = {
        endpoint,
        status: 'FAIL',
        httpStatus: 0,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      this.results.push(result)
      this.logResult(result)
    }
  }

  private determineStatus(httpStatus: number, response: any): 'PASS' | 'FAIL' | 'WARN' {
    if (httpStatus === 200) {
      // Check if response indicates degraded service
      if (response.status === 'degraded') {
        return 'WARN'
      }
      return 'PASS'
    } else if (httpStatus === 503) {
      // Service unavailable but endpoint is responding
      return 'WARN'
    } else {
      return 'FAIL'
    }
  }

  private logResult(result: TestResult): void {
    const statusIcon = result.status === 'PASS' ? '✅' : 
                      result.status === 'WARN' ? '⚠️' : '❌'
    
    console.log(`${statusIcon} ${result.endpoint}`)
    console.log(`   Status: ${result.httpStatus} (${result.responseTime}ms)`)
    
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    } else if (result.response) {
      console.log(`   Response: ${result.response.status || 'ok'}`)
      if (result.response.checks) {
        const { database, redis } = result.response.checks
        console.log(`   Database: ${database?.status || 'unknown'}`)
        console.log(`   Redis: ${redis?.status || 'unknown'}`)
      }
    }
    console.log('')
  }

  private printResults(): void {
    console.log('📊 Test Summary')
    console.log('===============')
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const warned = this.results.filter(r => r.status === 'WARN').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    
    console.log(`✅ Passed: ${passed}`)
    console.log(`⚠️ Warnings: ${warned}`)
    console.log(`❌ Failed: ${failed}`)
    console.log('')

    // Recommendations
    if (failed > 0) {
      console.log('🔧 Recommendations:')
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`- Fix ${result.endpoint}: ${result.error || 'Unknown error'}`)
      })
      console.log('')
    }

    if (warned > 0) {
      console.log('⚠️ Warnings:')
      this.results.filter(r => r.status === 'WARN').forEach(result => {
        console.log(`- ${result.endpoint}: Service degraded or optional dependencies unavailable`)
      })
      console.log('')
    }

    // Azure recommendations
    console.log('🔗 Azure Health Check Configuration:')
    const workingEndpoints = this.results.filter(r => r.status !== 'FAIL')
    if (workingEndpoints.length > 0) {
      const fastest = workingEndpoints.reduce((prev, curr) => 
        prev.responseTime < curr.responseTime ? prev : curr
      )
      console.log(`Recommended endpoint: ${fastest.endpoint}`)
      console.log(`Average response time: ${fastest.responseTime}ms`)
    } else {
      console.log('❌ No working endpoints found!')
    }
  }
}

// Run tests
async function main() {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  const tester = new HealthEndpointTester(baseUrl)
  
  try {
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
