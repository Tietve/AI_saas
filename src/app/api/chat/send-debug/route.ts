import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    console.log('[Chat Send Debug] Starting request')
    
    // Test database connection
    console.log('[Chat Send Debug] Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('[Chat Send Debug] Database connection OK')
    
    // Test user session
    console.log('[Chat Send Debug] Testing user session...')
    const userId = await getUserIdFromSession()
    console.log('[Chat Send Debug] User ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test request parsing
    console.log('[Chat Send Debug] Parsing request body...')
    const body = await req.json()
    console.log('[Chat Send Debug] Request body parsed successfully')

    // Test user lookup
    console.log('[Chat Send Debug] Looking up user...')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, planTier: true }
    })
    console.log('[Chat Send Debug] User found:', user ? 'Yes' : 'No')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Simple response
    return NextResponse.json({ 
      success: true, 
      message: 'Chat send debug working',
      userId: user.id,
      userEmail: user.email,
      planTier: user.planTier,
      conversationId: body.conversationId 
    })

  } catch (error) {
    console.error('[Chat Send Debug] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    )
  }
}


