/**
 * Performance Monitoring Dashboard API
 * Provides real-time metrics and dashboard data
 */

import { NextRequest, NextResponse } from 'next/server'
import { PerformanceDashboard, defaultDashboardConfig } from '@/lib/monitoring/dashboard'
import { distributedCache } from '@/lib/cache/distributed-cache'
import { LoadBalancer, defaultLoadBalancerConfig } from '@/lib/scaling/load-balancer'
import { AutoScaler, defaultAutoScalingConfig } from '@/lib/scaling/auto-scaling'

// Initialize dashboard components
const dashboard = new PerformanceDashboard(defaultDashboardConfig)
const loadBalancer = new LoadBalancer(defaultLoadBalancerConfig)
const autoScaler = new AutoScaler(defaultAutoScalingConfig)

/**
 * GET /api/monitoring/dashboard
 * Get dashboard data and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '1h'
    const widgetId = searchParams.get('widgetId')

    // Check if requesting specific widget data
    if (widgetId) {
      const widgetData = dashboard.getWidgetData(widgetId, timeRange)
      if (!widgetData) {
        return NextResponse.json(
          { error: 'Widget not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(widgetData)
    }

    // Get full dashboard data
    const dashboardData = dashboard.getDashboardData(timeRange)
    
    // Add load balancer and auto-scaling status
    const loadBalancerStats = loadBalancer.getStats()
    const autoScalingStatus = autoScaler.getStatus()
    const cacheHealth = distributedCache.getHealthStatus()

    return NextResponse.json({
      ...dashboardData,
      loadBalancer: loadBalancerStats,
      autoScaling: autoScalingStatus,
      cache: cacheHealth
    })

  } catch (error) {
    console.error('[Dashboard API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/monitoring/dashboard
 * Add metrics data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'system':
        dashboard.addSystemMetrics(data)
        break
      case 'application':
        dashboard.addApplicationMetrics(data)
        break
      case 'instance':
        // Add instance metrics to load balancer
        loadBalancer.recordMetrics(data.instanceId, data.responseTime, data.success)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Dashboard API] Error adding metrics:', error)
    return NextResponse.json(
      { error: 'Failed to add metrics' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/monitoring/dashboard/alerts/:alertId
 * Acknowledge alert
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params
    const success = dashboard.acknowledgeAlert(alertId)

    if (!success) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Dashboard API] Error acknowledging alert:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/monitoring/dashboard
 * Clear dashboard data
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'metrics') {
      // Clear metrics data
      // This would clear the metrics history
      return NextResponse.json({ success: true })
    } else if (type === 'alerts') {
      // Clear alerts
      // This would clear the alerts history
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid clear type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Dashboard API] Error clearing data:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
}
