export function streamSSEFromGenerator<T extends { delta?: string; meta?: any; done?: boolean }>(
    gen: AsyncGenerator<T, any, unknown>,
    opts?: { onClose?: () => void }
): Response {
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of gen) {
                    // Handle metadata
                    if (chunk.meta) {
                        const payload = JSON.stringify({ meta: chunk.meta })
                        const frame = `data: ${payload}\n\n`
                        controller.enqueue(encoder.encode(frame))
                    }

                    // Handle delta content
                    if (chunk.delta) {
                        const payload = JSON.stringify({ delta: chunk.delta })
                        const frame = `data: ${payload}\n\n`
                        controller.enqueue(encoder.encode(frame))
                    }

                    // Handle done signal
                    if (chunk.done) {
                        const payload = JSON.stringify({ done: true })
                        const frame = `data: ${payload}\n\n`
                        controller.enqueue(encoder.encode(frame))
                    }
                }

            } catch (e: any) {
                // Send error to client
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