import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function GET() {
    try {
        // Check if user is authenticated (basic security)
        const userId = await getUserIdFromSession()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only allow in development or for admin users
        if (process.env.NODE_ENV === 'production') {
            // In production, you might want to check if user is admin
            // For now, we'll just disable it
            return NextResponse.json({ error: 'Performance monitoring disabled in production' }, { status: 403 })
        }

        const stats = performanceMonitor.getStats()
        
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            stats,
            environment: process.env.NODE_ENV
        })
    } catch (error) {
        console.error('[Performance API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to get performance stats' }, 
            { status: 500 }
        )
    }
}

export async function DELETE() {
    try {
        // Check if user is authenticated
        const userId = await getUserIdFromSession()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Performance monitoring disabled in production' }, { status: 403 })
        }

        performanceMonitor.clear()
        
        return NextResponse.json({ message: 'Performance metrics cleared' })
    } catch (error) {
        console.error('[Performance API] Clear error:', error)
        return NextResponse.json(
            { error: 'Failed to clear performance stats' }, 
            { status: 500 }
        )
    }
}


