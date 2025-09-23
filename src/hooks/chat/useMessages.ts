import { useState, useEffect, useRef } from 'react'
import { Message } from '@/components/chat/shared/types'

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    async function loadMessages(id: string) {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/conversations/${id}/messages?limit=100`, {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!res.ok) throw new Error('Failed to load messages')
            const data = await res.json()
            const normalized = (data.items || []).map((item: any) => ({
                ...item,
                attachments: Array.isArray(item.attachments)
                    ? item.attachments.map((att: any) => ({
                          ...att,
                          meta: att?.meta ?? undefined
                      }))
                    : []
            }))
            setMessages(normalized)
        } catch (error) {
            console.error('[Messages] Load error:', error)
            setError('Không thể tải tin nhắn')
        } finally {
            setLoading(false)
        }
    }

    function addMessage(message: Message) {
        setMessages(prev => [...prev, message])
    }

    function updateLastMessage(update: Partial<Message>) {
        setMessages(prev => {
            const newMessages = [...prev]
            const lastMsg = newMessages[newMessages.length - 1]
            if (lastMsg && lastMsg.role === 'ASSISTANT') {
                newMessages[newMessages.length - 1] = { ...lastMsg, ...update }
            }
            return newMessages
        })
    }

    function clearMessages() {
        setMessages([])
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (conversationId) {
            loadMessages(conversationId)
        } else {
            clearMessages()
        }
    }, [conversationId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return {
        messages,
        loading,
        error,
        addMessage,
        updateLastMessage,
        clearMessages,
        messagesEndRef
    }
}
