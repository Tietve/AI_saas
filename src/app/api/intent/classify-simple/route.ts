import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('[Intent Classify] Starting request')
    
    const body = await req.json()
    const message = body.message || ''
    
    console.log('[Intent Classify] Message:', message.substring(0, 100) + '...')

    // Simple heuristic-based classification
    const text = message.toLowerCase()
    let intent: 'image' | 'text' = 'text'

    // Check for image generation patterns
    if (/(tạo|vẽ|thiết kế|làm)[^\n]{0,30}(logo|poster|icon|banner|ảnh|hình|background|wallpaper|minh hoạ|minh họa)/i.test(text)) {
      intent = 'image'
    }

    console.log('[Intent Classify] Result:', intent)

    return NextResponse.json({ intent })

  } catch (error) {
    console.error('[Intent Classify] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}


