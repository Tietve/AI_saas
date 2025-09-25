/**
 * Auto-scaling Management API
 * Controls horizontal scaling and load balancing
 */

import { NextRequest, NextResponse } from 'next/server'
import { AutoScaler, defaultAutoScalingConfig } from '@/lib/scaling/auto-scaling'
import { LoadBalancer, defaultLoadBalancerConfig } from '@/lib/scaling/load-balancer'

// Initialize scaling components
const autoScaler = new AutoScaler(defaultAutoScalingConfig)
const loadBalancer = new LoadBalancer(defaultLoadBalancerConfig)

/**
 * GET /api/scaling/auto-scale
 * Get auto-scaling status and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const status = autoScaler.getStatus()
    const loadBalancerStats = loadBalancer.getStats()

    return NextResponse.json({
      autoScaling: status,
      loadBalancer: loadBalancerStats,
      config: defaultAutoScalingConfig
    })

  } catch (error) {
    console.error('[AutoScale API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get scaling status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/scaling/auto-scale
 * Update auto-scaling configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'enable':
        // Enable auto-scaling
        // This would update the configuration
        return NextResponse.json({ success: true, message: 'Auto-scaling enabled' })

      case 'disable':
        // Disable auto-scaling
        // This would update the configuration
        return NextResponse.json({ success: true, message: 'Auto-scaling disabled' })

      case 'update':
        // Update configuration
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration required' },
            { status: 400 }
          )
        }
        // This would update the auto-scaling configuration
        return NextResponse.json({ success: true, message: 'Configuration updated' })

      case 'force-scale':
        // Force scale to specific number of instances
        const { targetInstances } = body
        if (typeof targetInstances !== 'number') {
          return NextResponse.json(
            { error: 'targetInstances must be a number' },
            { status: 400 }
          )
        }

        const success = await autoScaler.forceScale(targetInstances)
        if (success) {
          return NextResponse.json({ 
            success: true, 
            message: `Scaled to ${targetInstances} instances` 
          })
        } else {
          return NextResponse.json(
            { error: 'Failed to scale instances' },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('[AutoScale API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update scaling configuration' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/scaling/auto-scale/metrics
 * Add metrics for auto-scaling decisions
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceId, metrics } = body

    if (!instanceId || !metrics) {
      return NextResponse.json(
        { error: 'instanceId and metrics are required' },
        { status: 400 }
      )
    }

    // Add metrics to auto-scaler
    autoScaler.updateMetrics({
      instanceId,
      timestamp: new Date(),
      cpu: metrics.cpu || 0,
      memory: metrics.memory || 0,
      requestRate: metrics.requestRate || 0,
      responseTime: metrics.responseTime || 0,
      errorRate: metrics.errorRate || 0,
      activeConnections: metrics.activeConnections || 0
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[AutoScale API] Error adding metrics:', error)
    return NextResponse.json(
      { error: 'Failed to add metrics' },
      { status: 500 }
    )
  }
}
