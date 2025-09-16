'use client'
import React, { useEffect, useRef, useState } from 'react'

type Msg = {
    id?: string
    role: 'user' | 'assistant'
    content: string
    createdAt?: string
}

type ApiMessage = {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
}

type MessagesResponse = {
    items: ApiMessage[]
    nextCursor?: string | null
}

type ChatRequest = {
    conversationId: string
    message: string
    idempotencyKey: string
}

type ChatJsonResponse = {
    conversationId?: string
    reply?: string
    error?: string
}

type StreamMeta = {
    conversationId?: string
    [k: string]: unknown
}

type StreamPayload = {
    meta?: StreamMeta
    contentDelta?: string
    error?: string
    done?: boolean
}

const STORAGE_KEY = 'chat.conversationId'
const USE_STREAM = true

export default function ChatClient() {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    // load conversation id + history on mount
    useEffect(() => {
        const cid = localStorage.getItem(STORAGE_KEY)
        if (cid !== null) {
            setConversationId(cid)
            void loadHistory(cid)
        }
    }, [])

    const loadHistory = async (cid: string) => {
        setError(null)
        const res = await fetch(`/api/conversations/${cid}/messages?limit=200`, { cache: 'no-store' })
        if (!res.ok) {
            setError('Không tải được lịch sử.')
            return
        }
        const data = (await res.json()) as MessagesResponse
        const items: Msg[] = (data.items ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
        }))
        setMessages(items)
    }

    // auto scroll
    const endRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, pending])

    const send = async () => {
        setError(null)
        const text = input.trim()
        if (!text || pending) return

        setMessages((m) => [...m, { role: 'user', content: text }])
        setInput('')
        setPending(true)

        const cid = conversationId ?? 'new'
        const requestId = 'r-' + Date.now()
        const body: ChatRequest = { conversationId: cid, message: text, idempotencyKey: requestId }

        if (USE_STREAM) await sendStream(body)
        else await sendJson(body)
    }

    const sendJson = async (body: ChatRequest) => {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.status === 401) throw new Error('UNAUTHENTICATED — hãy đăng nhập.')
            if (!res.ok) {
                const maybe = (await tryJson(res)) as { error?: string } | null
                throw new Error(maybe?.error || `HTTP ${res.status}`)
            }
            const data = (await res.json()) as ChatJsonResponse
            if (!conversationId && data?.conversationId) {
                localStorage.setItem(STORAGE_KEY, data.conversationId)
                setConversationId(data.conversationId)
            }
            setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? '' }])
        } catch (e: unknown) {
            if (e instanceof Error) setError(e.message)
            else setError('Lỗi gửi tin.')
        } finally {
            setPending(false)
        }
    }

    const sendStream = async (body: ChatRequest) => {
        const controller = new AbortController()
        abortRef.current = controller
        let buf = ''

        try {
            const res = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            })
            if (res.status === 401) throw new Error('UNAUTHENTICATED — hãy đăng nhập.')
            if (!res.ok) {
                const maybe = (await tryJson(res)) as { error?: string } | null
                throw new Error(maybe?.error || `HTTP ${res.status}`)
            }

            // prepare assistant placeholder
            setMessages((m) => [...m, { role: 'assistant', content: '' }])

            const reader = res.body?.getReader()
            const decoder = new TextDecoder('utf-8')
            if (!reader) throw new Error('Không đọc được stream.')

            let done = false
            let pendingCid: string | null = null

            while (!done) {
                const { value, done: d } = await reader.read()
                if (d) break
                const chunk = decoder.decode(value, { stream: true })
                // parse SSE: split by double newline, filter blanks
                const lines = chunk.split('\n\n').filter(Boolean)
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue
                    const payload = line.slice(5).trim()
                    if (!payload) continue

                    let obj: StreamPayload | null = null
                    try {
                        obj = JSON.parse(payload) as StreamPayload
                    } catch {
                        // ignore malformed line
                        continue
                    }

                    if (obj.meta?.conversationId && conversationId === null && pendingCid === null) {
                        pendingCid = obj.meta.conversationId ?? null
                        if (pendingCid) {
                            localStorage.setItem(STORAGE_KEY, pendingCid)
                            setConversationId(pendingCid)
                        }
                    }
                    if (typeof obj.contentDelta === 'string') {
                        buf += obj.contentDelta
                        setMessages((m) => {
                            const last = m[m.length - 1]
                            if (!last || last.role !== 'assistant') return m
                            const clone = m.slice()
                            clone[clone.length - 1] = { ...last, content: buf }
                            return clone
                        })
                    }
                    if (typeof obj.error === 'string' && obj.error.length > 0) {
                        setError(obj.error)
                    }
                    if (obj.done) {
                        done = true
                    }
                }
            }
        } catch (e: unknown) {
            if (e instanceof Error) setError(e.message)
            else setError('Lỗi stream.')
        } finally {
            setPending(false)
            abortRef.current = null
        }
    }

    const stop = () => abortRef.current?.abort()

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {messages.map((m, i) => (
                    <div key={m.id ?? i} className={m.role === 'user' ? 'text-right' : ''}>
                        <div
                            className={`inline-block rounded px-3 py-2 ${
                                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                            }`}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    void send()
                }}
                className="flex gap-2"
            >
                <input
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={pending}
                />
                <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={pending || !input.trim()}>
                    Gửi
                </button>
                {pending && (
                    <button type="button" onClick={stop} className="px-3 py-2 rounded border">
                        Dừng
                    </button>
                )}
            </form>

            <div className="mt-2 text-xs text-gray-500">
                {conversationId ? `Convo: ${conversationId}` : 'Sẽ tạo hội thoại mới khi gửi'} · Mode: {USE_STREAM ? 'SSE' : 'JSON'}
            </div>

            {error && <div className="mt-2 text-sm text-red-600">Lỗi: {error}</div>}
        </div>
    )
}

async function tryJson(res: Response): Promise<unknown | null> {
    try {
        return await res.json()
    } catch {
        return null
    }
}
