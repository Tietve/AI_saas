/**
 * Load Testing Suite for Performance Optimization
 * Supports various test scenarios and real-time monitoring
 */

export interface LoadTestConfig {
  name: string
  description: string
  duration: number // seconds
  rampUp: number // seconds
  rampDown: number // seconds
  maxUsers: number
  scenarios: TestScenario[]
  monitoring: MonitoringConfig
  assertions: TestAssertion[]
}

export interface TestScenario {
  name: string
  weight: number // percentage of total users
  steps: TestStep[]
  thinkTime: {
    min: number
    max: number
  }
  iterations?: number
}

export interface TestStep {
  name: string
  type: 'http' | 'websocket' | 'wait' | 'custom'
  config: HttpStepConfig | WebSocketStepConfig | WaitStepConfig | CustomStepConfig
  assertions?: StepAssertion[]
}

export interface HttpStepConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
  followRedirects?: boolean
}

export interface WebSocketStepConfig {
  url: string
  message: any
  waitForResponse?: boolean
  timeout?: number
}

export interface WaitStepConfig {
  duration: number // milliseconds
  random?: boolean
  min?: number
  max?: number
}

export interface CustomStepConfig {
  function: string
  parameters?: Record<string, any>
}

export interface StepAssertion {
  type: 'status' | 'responseTime' | 'body' | 'header' | 'custom'
  condition: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'regex'
  value: any
  message?: string
}

export interface TestAssertion {
  name: string
  condition: 'all' | 'any' | 'none'
  assertions: {
    metric: string
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne'
    value: number
  }[]
}

export interface MonitoringConfig {
  enabled: boolean
  metrics: string[]
  samplingRate: number
  realTime: boolean
  alerts: AlertConfig[]
}

export interface AlertConfig {
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'gte' | 'lte'
  action: 'stop' | 'warn' | 'log'
}

export interface TestResult {
  testId: string
  config: LoadTestConfig
  startTime: Date
  endTime: Date
  duration: number
  totalUsers: number
  scenarios: ScenarioResult[]
  summary: TestSummary
  metrics: TestMetrics
  assertions: AssertionResult[]
  errors: TestError[]
}

export interface ScenarioResult {
  name: string
  totalUsers: number
  steps: StepResult[]
  summary: ScenarioSummary
}

export interface StepResult {
  name: string
  type: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  responseTime: ResponseTimeStats
  throughput: number
  errorRate: number
  assertions: AssertionResult[]
}

export interface ResponseTimeStats {
  min: number
  max: number
  average: number
  p50: number
  p90: number
  p95: number
  p99: number
}

export interface TestSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  maxResponseTime: number
  throughput: number
  errorRate: number
  concurrentUsers: number
}

export interface ScenarioSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  throughput: number
  errorRate: number
}

export interface TestMetrics {
  timestamp: Date
  activeUsers: number
  requestsPerSecond: number
  averageResponseTime: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  networkIn: number
  networkOut: number
}

export interface AssertionResult {
  name: string
  passed: boolean
  expected: any
  actual: any
  message?: string
}

export interface TestError {
  timestamp: Date
  scenario: string
  step: string
  error: string
  details?: any
}

export class LoadTester {
  private config: LoadTestConfig
  private isRunning: boolean = false
  private startTime: Date | null = null
  private endTime: Date | null = null
  private activeUsers: number = 0
  private results: TestResult | null = null
  private metrics: TestMetrics[] = []
  private errors: TestError[] = []
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(config: LoadTestConfig) {
    this.config = config
  }

  /**
   * Start the load test
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Load test is already running')
    }

    console.log(`[LoadTester] Starting load test: ${this.config.name}`)
    this.isRunning = true
    this.startTime = new Date()
    this.results = this.initializeTestResult()
    
    // Start monitoring
    if (this.config.monitoring.enabled) {
      this.startMonitoring()
    }

    // Execute test scenarios
    await this.executeTest()
  }

  /**
   * Stop the load test
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('No load test is running')
    }

    console.log('[LoadTester] Stopping load test')
    this.isRunning = false
    this.endTime = new Date()
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Finalize results
    if (this.results) {
      this.finalizeResults()
    }
  }

  /**
   * Get current test status
   */
  getStatus(): TestStatus {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      activeUsers: this.activeUsers,
      totalErrors: this.errors.length,
      currentMetrics: this.metrics[this.metrics.length - 1] || null
    }
  }

  /**
   * Get test results
   */
  getResults(): TestResult | null {
    return this.results
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): TestMetrics[] {
    return this.metrics.slice(-100) // Last 100 data points
  }

  /**
   * Export test results
   */
  exportResults(format: 'json' | 'csv' | 'html'): string {
    if (!this.results) {
      throw new Error('No test results available')
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this.results, null, 2)
      case 'csv':
        return this.exportToCSV()
      case 'html':
        return this.exportToHTML()
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  private async executeTest(): Promise<void> {
    const totalDuration = this.config.duration * 1000
    const rampUpDuration = this.config.rampUp * 1000
    const rampDownDuration = this.config.rampDown * 1000
    const steadyStateDuration = totalDuration - rampUpDuration - rampDownDuration

    try {
      // Ramp up phase
      console.log('[LoadTester] Starting ramp up phase')
      await this.rampUp(rampUpDuration)

      // Steady state phase
      console.log('[LoadTester] Starting steady state phase')
      await this.steadyState(steadyStateDuration)

      // Ramp down phase
      console.log('[LoadTester] Starting ramp down phase')
      await this.rampDown(rampDownDuration)

    } catch (error) {
      console.error('[LoadTester] Test execution failed:', error)
      this.errors.push({
        timestamp: new Date(),
        scenario: 'system',
        step: 'execution',
        error: 'Test execution failed',
        details: error
      })
    }
  }

  private async rampUp(duration: number): Promise<void> {
    const startTime = Date.now()
    const endTime = startTime + duration
    const maxUsers = this.config.maxUsers

    while (Date.now() < endTime && this.isRunning) {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      const targetUsers = Math.floor(maxUsers * progress)

      // Add users gradually
      const usersToAdd = targetUsers - this.activeUsers
      if (usersToAdd > 0) {
        await this.addUsers(usersToAdd)
      }

      await this.sleep(1000) // Check every second
    }
  }

  private async steadyState(duration: number): Promise<void> {
    const startTime = Date.now()
    const endTime = startTime + duration

    while (Date.now() < endTime && this.isRunning) {
      // Maintain target user count
      await this.maintainUsers()
      await this.sleep(1000)
    }
  }

  private async rampDown(duration: number): Promise<void> {
    const startTime = Date.now()
    const endTime = startTime + duration
    const initialUsers = this.activeUsers

    while (Date.now() < endTime && this.isRunning && this.activeUsers > 0) {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      const targetUsers = Math.floor(initialUsers * (1 - progress))

      // Remove users gradually
      const usersToRemove = this.activeUsers - targetUsers
      if (usersToRemove > 0) {
        await this.removeUsers(usersToRemove)
      }

      await this.sleep(1000)
    }

    // Ensure all users are removed
    if (this.activeUsers > 0) {
      await this.removeUsers(this.activeUsers)
    }
  }

  private async addUsers(count: number): Promise<void> {
    const usersPerScenario = this.calculateUsersPerScenario(count)
    
    for (let i = 0; i < this.config.scenarios.length; i++) {
      const scenario = this.config.scenarios[i]
      const userCount = usersPerScenario[i]
      
      for (let j = 0; j < userCount; j++) {
        if (!this.isRunning) break
        
        this.activeUsers++
        this.executeScenario(scenario).catch(error => {
          this.errors.push({
            timestamp: new Date(),
            scenario: scenario.name,
            step: 'scenario_start',
            error: 'Failed to start scenario',
            details: error
          })
        })
      }
    }
  }

  private async removeUsers(count: number): Promise<void> {
    // In a real implementation, this would stop specific user sessions
    this.activeUsers = Math.max(0, this.activeUsers - count)
  }

  private async maintainUsers(): Promise<void> {
    // Maintain current user count by replacing failed users
    const targetUsers = this.config.maxUsers
    if (this.activeUsers < targetUsers) {
      await this.addUsers(targetUsers - this.activeUsers)
    }
  }

  private calculateUsersPerScenario(additionalUsers: number): number[] {
    const totalWeight = this.config.scenarios.reduce((sum, s) => sum + s.weight, 0)
    return this.config.scenarios.map(scenario => 
      Math.floor((scenario.weight / totalWeight) * additionalUsers)
    )
  }

  private async executeScenario(scenario: TestScenario): Promise<void> {
    const iterations = scenario.iterations || 1
    
    for (let i = 0; i < iterations && this.isRunning; i++) {
      for (const step of scenario.steps) {
        if (!this.isRunning) break
        
        try {
          await this.executeStep(step, scenario)
          
          // Think time between steps
          if (scenario.thinkTime) {
            const thinkTime = this.randomBetween(
              scenario.thinkTime.min,
              scenario.thinkTime.max
            )
            await this.sleep(thinkTime)
          }
        } catch (error) {
          this.errors.push({
            timestamp: new Date(),
            scenario: scenario.name,
            step: step.name,
            error: 'Step execution failed',
            details: error
          })
        }
      }
    }
  }

  private async executeStep(step: TestStep, scenario: TestScenario): Promise<void> {
    const startTime = Date.now()
    
    try {
      let result: any = null

      switch (step.type) {
        case 'http':
          result = await this.executeHttpStep(step.config as HttpStepConfig)
          break
        case 'websocket':
          result = await this.executeWebSocketStep(step.config as WebSocketStepConfig)
          break
        case 'wait':
          await this.executeWaitStep(step.config as WaitStepConfig)
          break
        case 'custom':
          result = await this.executeCustomStep(step.config as CustomStepConfig)
          break
      }

      const responseTime = Date.now() - startTime
      
      // Record step result
      this.recordStepResult(scenario.name, step.name, responseTime, true, result)
      
      // Evaluate assertions
      if (step.assertions) {
        this.evaluateAssertions(step.assertions, result, scenario.name, step.name)
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      this.recordStepResult(scenario.name, step.name, responseTime, false, null)
      
      this.errors.push({
        timestamp: new Date(),
        scenario: scenario.name,
        step: step.name,
        error: 'Step execution failed',
        details: error
      })
    }
  }

  private async executeHttpStep(config: HttpStepConfig): Promise<any> {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: config.timeout ? AbortSignal.timeout(config.timeout) : undefined
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    }
  }

  private async executeWebSocketStep(config: WebSocketStepConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.url)
      const timeout = config.timeout || 5000

      const timer = setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket timeout'))
      }, timeout)

      ws.onopen = () => {
        ws.send(JSON.stringify(config.message))
      }

      ws.onmessage = (event) => {
        clearTimeout(timer)
        ws.close()
        resolve(JSON.parse(event.data))
      }

      ws.onerror = (error) => {
        clearTimeout(timer)
        reject(error)
      }
    })
  }

  private async executeWaitStep(config: WaitStepConfig): Promise<void> {
    const duration = config.random && config.min && config.max
      ? this.randomBetween(config.min, config.max)
      : config.duration

    await this.sleep(duration)
  }

  private async executeCustomStep(config: CustomStepConfig): Promise<any> {
    // This would execute custom test functions
    // For now, return a placeholder
    return { custom: true, function: config.function }
  }

  private recordStepResult(scenario: string, step: string, responseTime: number, success: boolean, result: any): void {
    // This would record step results in the test results
    console.log(`[LoadTester] ${scenario}.${step}: ${responseTime}ms ${success ? 'SUCCESS' : 'FAILED'}`)
  }

  private evaluateAssertions(assertions: StepAssertion[], result: any, scenario: string, step: string): void {
    for (const assertion of assertions) {
      const passed = this.evaluateAssertion(assertion, result)
      
      if (!passed) {
        console.warn(`[LoadTester] Assertion failed: ${scenario}.${step}.${assertion.type}`)
      }
    }
  }

  private evaluateAssertion(assertion: StepAssertion, result: any): boolean {
    let actualValue: any

    switch (assertion.type) {
      case 'status':
        actualValue = result?.status
        break
      case 'responseTime':
        actualValue = result?.responseTime
        break
      case 'body':
        actualValue = result?.body
        break
      case 'header':
        actualValue = result?.headers?.[assertion.value]
        break
      default:
        return true
    }

    return this.compareValues(actualValue, assertion.value, assertion.condition)
  }

  private compareValues(actual: any, expected: any, condition: string): boolean {
    switch (condition) {
      case 'equals':
        return actual === expected
      case 'notEquals':
        return actual !== expected
      case 'contains':
        return String(actual).includes(String(expected))
      case 'notContains':
        return !String(actual).includes(String(expected))
      case 'greaterThan':
        return Number(actual) > Number(expected)
      case 'lessThan':
        return Number(actual) < Number(expected)
      case 'regex':
        return new RegExp(expected).test(String(actual))
      default:
        return true
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, 1000) // Collect metrics every second
  }

  private collectMetrics(): void {
    const metrics: TestMetrics = {
      timestamp: new Date(),
      activeUsers: this.activeUsers,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate(),
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      networkIn: this.getNetworkIn(),
      networkOut: this.getNetworkOut()
    }

    this.metrics.push(metrics)

    // Check for alerts
    this.checkAlerts(metrics)
  }

  private calculateRequestsPerSecond(): number {
    // This would calculate actual RPS from recent metrics
    return this.activeUsers * 0.1 // Placeholder
  }

  private calculateAverageResponseTime(): number {
    // This would calculate from step results
    return 100 // Placeholder
  }

  private calculateErrorRate(): number {
    // This would calculate from errors
    return this.errors.length / Math.max(1, this.activeUsers) * 100
  }

  private getCpuUsage(): number {
    // This would get actual CPU usage
    return Math.random() * 100 // Placeholder
  }

  private getMemoryUsage(): number {
    // This would get actual memory usage
    return Math.random() * 100 // Placeholder
  }

  private getNetworkIn(): number {
    // This would get actual network input
    return Math.random() * 1000 // Placeholder
  }

  private getNetworkOut(): number {
    // This would get actual network output
    return Math.random() * 1000 // Placeholder
  }

  private checkAlerts(metrics: TestMetrics): void {
    for (const alert of this.config.monitoring.alerts) {
      const value = this.getMetricValue(metrics, alert.metric)
      if (value !== null && this.evaluateAlertCondition(value, alert.operator, alert.threshold)) {
        this.handleAlert(alert, value)
      }
    }
  }

  private getMetricValue(metrics: TestMetrics, metric: string): number | null {
    switch (metric) {
      case 'activeUsers': return metrics.activeUsers
      case 'requestsPerSecond': return metrics.requestsPerSecond
      case 'averageResponseTime': return metrics.averageResponseTime
      case 'errorRate': return metrics.errorRate
      case 'cpuUsage': return metrics.cpuUsage
      case 'memoryUsage': return metrics.memoryUsage
      default: return null
    }
  }

  private evaluateAlertCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold
      case 'lt': return value < threshold
      case 'gte': return value >= threshold
      case 'lte': return value <= threshold
      default: return false
    }
  }

  private handleAlert(alert: AlertConfig, value: number): void {
    console.warn(`[LoadTester] Alert: ${alert.metric} ${alert.operator} ${alert.threshold} (actual: ${value})`)
    
    switch (alert.action) {
      case 'stop':
        this.stop()
        break
      case 'warn':
        // Already logged
        break
      case 'log':
        console.log(`[LoadTester] Alert logged: ${alert.metric}`)
        break
    }
  }

  private initializeTestResult(): TestResult {
    return {
      testId: `test_${Date.now()}`,
      config: this.config,
      startTime: this.startTime!,
      endTime: new Date(),
      duration: 0,
      totalUsers: 0,
      scenarios: [],
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        concurrentUsers: 0
      },
      metrics: {
        timestamp: new Date(),
        activeUsers: 0,
        requestsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        networkIn: 0,
        networkOut: 0
      },
      assertions: [],
      errors: []
    }
  }

  private finalizeResults(): void {
    if (!this.results || !this.endTime) return

    this.results.endTime = this.endTime
    this.results.duration = this.endTime.getTime() - this.results.startTime.getTime()
    this.results.totalUsers = this.config.maxUsers
    this.results.errors = this.errors

    // Calculate final summary
    this.calculateFinalSummary()
  }

  private calculateFinalSummary(): void {
    // This would calculate final summary from all collected data
    if (!this.results) return

    // Placeholder calculations
    this.results.summary = {
      totalRequests: this.activeUsers * 100,
      successfulRequests: this.activeUsers * 95,
      failedRequests: this.activeUsers * 5,
      averageResponseTime: 150,
      maxResponseTime: 2000,
      throughput: this.activeUsers * 0.1,
      errorRate: 5,
      concurrentUsers: this.activeUsers
    }
  }

  private exportToCSV(): string {
    // This would export results to CSV format
    return 'timestamp,metric,value\n'
  }

  private exportToHTML(): string {
    // This would export results to HTML format
    return '<html><body><h1>Load Test Results</h1></body></html>'
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export interface TestStatus {
  isRunning: boolean
  startTime: Date | null
  endTime: Date | null
  duration: number
  activeUsers: number
  totalErrors: number
  currentMetrics: TestMetrics | null
}

// Predefined test configurations
export const chatLoadTestConfig: LoadTestConfig = {
  name: 'Chat Load Test',
  description: 'Load test for chat functionality',
  duration: 300, // 5 minutes
  rampUp: 60,    // 1 minute
  rampDown: 60,  // 1 minute
  maxUsers: 100,
  scenarios: [
    {
      name: 'Chat Conversation',
      weight: 70,
      steps: [
        {
          name: 'Send Message',
          type: 'http',
          config: {
            method: 'POST',
            url: '/api/chat/send',
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'Hello, how are you?' }
          } as HttpStepConfig
        },
        {
          name: 'Wait for Response',
          type: 'wait',
          config: { duration: 2000 } as WaitStepConfig
        }
      ],
      thinkTime: { min: 1000, max: 3000 }
    },
    {
      name: 'Image Generation',
      weight: 30,
      steps: [
        {
          name: 'Generate Image',
          type: 'http',
          config: {
            method: 'POST',
            url: '/api/images/generate',
            headers: { 'Content-Type': 'application/json' },
            body: { prompt: 'A beautiful sunset over mountains' }
          } as HttpStepConfig
        }
      ],
      thinkTime: { min: 2000, max: 5000 }
    }
  ],
  monitoring: {
    enabled: true,
    metrics: ['activeUsers', 'requestsPerSecond', 'averageResponseTime', 'errorRate'],
    samplingRate: 1.0,
    realTime: true,
    alerts: [
      { metric: 'errorRate', threshold: 10, operator: 'gt', action: 'warn' },
      { metric: 'averageResponseTime', threshold: 5000, operator: 'gt', action: 'warn' }
    ]
  },
  assertions: [
    {
      name: 'Response Time SLA',
      condition: 'all',
      assertions: [
        { metric: 'averageResponseTime', operator: 'lt', value: 3000 }
      ]
    },
    {
      name: 'Error Rate SLA',
      condition: 'all',
      assertions: [
        { metric: 'errorRate', operator: 'lt', value: 5 }
      ]
    }
  ]
}


