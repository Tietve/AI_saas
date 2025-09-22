
export function streamSSEFromGenerator<T extends { delta?: string }>(
    gen: AsyncGenerator<T, any, unknown>,
    opts?: { onClose?: () => void }
): Response {
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
        async start(controller) {
            try {
                
                for await (const chunk of gen) {
                    if (chunk.delta) {
                        const payload = JSON.stringify({ delta: chunk.delta })
                        const frame = `data: ${payload}\n\n`
                        controller.enqueue(encoder.encode(frame))
                    }
                }

                
                controller.enqueue(encoder.encode('data: {"done":true}\n\n'))

            } catch (e: any) {
                
                const errorPayload = JSON.stringify({
                    error: e?.message || 'Stream error'
                })
                controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`))
            } finally {
                controller.close()
                opts?.onClose?.()
            }
        }
    })

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' 
        }
    })
}