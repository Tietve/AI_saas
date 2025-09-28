import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    console.log('[Chat Send] Starting request')
    
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[Chat Send] Request body:', { 
      conversationId: body.conversationId,
      content: body.content?.substring(0, 100) + '...',
      model: body.model
    })

    // Simple response for testing
    return NextResponse.json({ 
      success: true, 
      message: 'Chat send working',
      userId,
      conversationId: body.conversationId 
    })

  } catch (error) {
    console.error('[Chat Send] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}



