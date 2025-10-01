import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return NextResponse.json({ message: 'Test upload works!' })
}

export async function GET() {
  return NextResponse.json({ message: 'GET works!' })
}
