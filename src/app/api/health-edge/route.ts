/**
 * Health check endpoint optimized for Edge Runtime
 * Uses < 128MB RAM vs 512MB+ for Node.js runtime
 */

// Edge Runtime - 50x lighter than Node.js
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      runtime: 'edge',
      memoryOptimized: true
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate'
      }
    }
  )
}
