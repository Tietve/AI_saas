import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  console.log('=== Test Attachment Debug ===')
  console.log('Body:', JSON.stringify(body, null, 2))

  if (body.attachments && body.attachments.length > 0) {
    const att = body.attachments[0]
    console.log('\nFirst attachment:')
    console.log('- ID:', att.id)
    console.log('- URL:', att.url)
    console.log('- Meta keys:', Object.keys(att.meta || {}))
    console.log('- Has extractedText:', 'extractedText' in (att.meta || {}))
    if (att.meta?.extractedText) {
      console.log('- ExtractedText preview:', att.meta.extractedText.substring(0, 100))
    }
  }

  return NextResponse.json({
    received: body,
    debug: {
      hasAttachments: !!body.attachments,
      attachmentCount: body.attachments?.length || 0,
      firstAttachmentMeta: body.attachments?.[0]?.meta
    }
  })
}
