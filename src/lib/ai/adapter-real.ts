// src/lib/ai/adapter-real.ts
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

export type StreamResult = {
    promptTokens: number
    completionTokens: number
}

// OpenAI Adapter
async function* streamOpenAI(args: {
    model: string
    messages: Msg[]
    signal?: AbortSignal
}): AsyncGenerator<{ delta?: string }, StreamResult> {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!
    })

    const stream = await client.chat.completions.create({
        model: args.model,
        messages: args.messages as any,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
    }, {
        signal: args.signal
    })

    let fullText = ''
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        if (delta) {
            fullText += delta
            yield { delta }
        }
    }

    // Estimate tokens
    return {
        promptTokens: Math.ceil(args.messages.reduce((sum, m) => sum + m.content.length, 0) / 4),
        completionTokens: Math.ceil(fullText.length / 4)
    }
}

// Anthropic Adapter
async function* streamAnthropic(args: {
    model: string
    messages: Msg[]
    signal?: AbortSignal
}): AsyncGenerator<{ delta?: string }, StreamResult> {
    const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!
    })

    // Convert messages format
    const systemMsg = args.messages.find(m => m.role === 'system')
    const userMessages = args.messages.filter(m => m.role !== 'system')

    const stream = await client.messages.create({
        model: args.model,
        messages: userMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        })) as any,
        system: systemMsg?.content,
        stream: true,
        max_tokens: 2000
    })

    let fullText = ''
    for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
            const delta = (chunk as any).delta?.text || ''
            if (delta) {
                fullText += delta
                yield { delta }
            }
        }
    }

    return {
        promptTokens: Math.ceil(args.messages.reduce((sum, m) => sum + m.content.length, 0) / 4),
        completionTokens: Math.ceil(fullText.length / 4)
    }
}

// Google Gemini Adapter (nếu cần)
async function* streamGemini(args: {
    model: string
    messages: Msg[]
    signal?: AbortSignal
}): AsyncGenerator<{ delta?: string }, StreamResult> {
    // TODO: Implement Gemini
    throw new Error('Gemini not implemented yet')
}

// Main export với routing
export async function* streamChat(args: {
    model: string
    system?: string
    messages: Msg[]
    signal?: AbortSignal
}): AsyncGenerator<{ delta?: string }, StreamResult> {
    // Use FAKE for testing
    if (process.env.USE_FAKE_AI === '1') {
        const last = args.messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
        const words = (`[FAKE ${args.model}] ` + last).split(/\s+/)
        for (const w of words) {
            if (args.signal?.aborted) break
            await new Promise(r => setTimeout(r, 30))
            yield { delta: w + ' ' }
        }
        return { promptTokens: Math.ceil(last.length / 4), completionTokens: Math.ceil(last.length / 8) }
    }

    // Route to correct provider based on model
    const modelLower = args.model.toLowerCase()

    // OpenAI models
    if (modelLower.includes('gpt') || modelLower.includes('o1')) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not configured')
        }
        return yield* streamOpenAI(args)
    }

    // Anthropic models
    if (modelLower.includes('claude')) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }
        return yield* streamAnthropic(args)
    }

    // Google models
    if (modelLower.includes('gemini')) {
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error('GOOGLE_API_KEY not configured')
        }
        return yield* streamGemini(args)
    }

    // Default to OpenAI
    if (process.env.OPENAI_API_KEY) {
        return yield* streamOpenAI(args)
    }

    throw new Error('No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or USE_FAKE_AI=1')
}