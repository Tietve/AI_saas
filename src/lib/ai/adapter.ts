// src/lib/ai/adapter.ts
type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

export type StreamResult = {
    promptTokens: number
    completionTokens: number
}

export async function* streamChat(args: {
    model: string
    system?: string
    messages: Msg[]
    signal?: AbortSignal
}): AsyncGenerator<{ delta?: string }, StreamResult, unknown> {
    if (process.env.USE_FAKE_AI === '1') {
        // FAKE: stream từng từ của prompt cuối
        const last = args.messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
        const words = (`[FAKE ${args.model}] ` + last).split(/\s+/)
        for (const w of words) {
            if (args.signal?.aborted) break
            await new Promise(r => setTimeout(r, 30))
            yield { delta: w + ' ' }
        }
        return { promptTokens: Math.ceil(last.length / 4), completionTokens: Math.ceil(last.length / 8) }
    }

    // TODO: TÍCH HỢP PROVIDER THẬT
    // Ví dụ pseudo OpenAI Responses/Chat Completions streaming bằng fetch:
    // - Sử dụng process.env.AI_API_KEY, process.env.AI_BASE_URL
    // - Parse SSE/NDJSON và yield {delta}
    throw new Error('AI provider not integrated. Set USE_FAKE_AI=1 để chạy demo.')
}
