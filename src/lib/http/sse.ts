// src/lib/http/sse.ts
export function streamSSEFromGenerator<T extends { delta?: string }>(
    gen: AsyncGenerator<T, any, unknown>,
    opts?: { onClose?: () => void }
): Response {
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of gen) {
                    const data = chunk.delta ?? ''
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: data })}\n\n`))
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            } catch (e: any) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e?.message || 'stream error' })}\n\n`))
            } finally {
                controller.close()
                opts?.onClose?.()
            }
        }
    })
    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // nginx
        }
    })
}
