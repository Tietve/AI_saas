/**
 * Load Testing API
 * Manages load test execution and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { LoadTester, chatLoadTestConfig } from '@/lib/testing/load-testing'

// Store active load tests
const activeTests = new Map<string, LoadTester>()

/**
 * POST /api/monitoring/load-test
 * Start a new load test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, testId } = body

    // Use provided config or default chat load test
    const testConfig = config || chatLoadTestConfig
    const id = testId || `test_${Date.now()}`

    // Check if test already exists
    if (activeTests.has(id)) {
      return NextResponse.json(
        { error: 'Test with this ID already exists' },
        { status: 409 }
      )
    }

    // Create and start new load test
    const loadTester = new LoadTester(testConfig)
    activeTests.set(id, loadTester)

    // Start test asynchronously
    loadTester.start().catch(error => {
      console.error(`[LoadTest API] Test ${id} failed:`, error)
      activeTests.delete(id)
    })

    return NextResponse.json({
      testId: id,
      status: 'started',
      config: testConfig
    })

  } catch (error) {
    console.error('[LoadTest API] Error starting test:', error)
    return NextResponse.json(
      { error: 'Failed to start load test' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/monitoring/load-test/:testId
 * Get load test status and results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params
    const loadTester = activeTests.get(testId)

    if (!loadTester) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    const status = loadTester.getStatus()
    const results = loadTester.getResults()
    const realTimeMetrics = loadTester.getRealTimeMetrics()

    return NextResponse.json({
      testId,
      status,
      results,
      realTimeMetrics
    })

  } catch (error) {
    console.error('[LoadTest API] Error getting test status:', error)
    return NextResponse.json(
      { error: 'Failed to get test status' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/monitoring/load-test/:testId
 * Stop a running load test
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params
    const loadTester = activeTests.get(testId)

    if (!loadTester) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    await loadTester.stop()
    activeTests.delete(testId)

    return NextResponse.json({
      testId,
      status: 'stopped'
    })

  } catch (error) {
    console.error('[LoadTest API] Error stopping test:', error)
    return NextResponse.json(
      { error: 'Failed to stop load test' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/monitoring/load-test/:testId
 * Delete a load test and its results
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params
    const loadTester = activeTests.get(testId)

    if (loadTester) {
      await loadTester.stop()
      activeTests.delete(testId)
    }

    return NextResponse.json({
      testId,
      status: 'deleted'
    })

  } catch (error) {
    console.error('[LoadTest API] Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete load test' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/monitoring/load-test
 * List all active load tests
 */
export async function GET_LIST(request: NextRequest) {
  try {
    const tests = Array.from(activeTests.entries()).map(([id, tester]) => ({
      testId: id,
      status: tester.getStatus(),
      config: tester.getResults()?.config
    }))

    return NextResponse.json({ tests })

  } catch (error) {
    console.error('[LoadTest API] Error listing tests:', error)
    return NextResponse.json(
      { error: 'Failed to list load tests' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/monitoring/load-test/:testId/export
 * Export load test results
 */
export async function GET_EXPORT(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const testId = params.testId

    const loadTester = activeTests.get(testId)
    if (!loadTester) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    const results = loadTester.getResults()
    if (!results) {
      return NextResponse.json(
        { error: 'No results available' },
        { status: 404 }
      )
    }

    const exportedData = loadTester.exportResults(format as 'json' | 'csv' | 'html')

    const contentType = format === 'json' 
      ? 'application/json'
      : format === 'csv'
      ? 'text/csv'
      : 'text/html'

    return new NextResponse(exportedData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="load-test-${testId}.${format}"`
      }
    })

  } catch (error) {
    console.error('[LoadTest API] Error exporting results:', error)
    return NextResponse.json(
      { error: 'Failed to export results' },
      { status: 500 }
    )
  }
}



