import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useConversations } from './useConversations'
import { useMessages } from './useMessages'
import { BotPersonality, Message } from '@/components/chat/shared/types'

export function useChat() {
    const router = useRouter()
    const [inputMessage, setInputMessage] = useState('')
    const [selectedModel, setSelectedModel] = useState('gpt_4o_mini')
    const [selectedBot, setSelectedBot] = useState<BotPersonality | undefined>(undefined)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const {
        conversations,
        filteredConversations,
        currentConversationId,
        setCurrentConversationId,
        searchQuery,
        setSearchQuery,
        createNewConversation,
        deleteConversation,
        loadConversations
    } = useConversations()

    const {
        messages,
        addMessage,
        updateLastMessage,
        clearMessages,
        messagesEndRef
    } = useMessages(currentConversationId)

    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim() || isLoading) return

        const messageText = inputMessage.trim()
        const conversationId = currentConversationId || 'new'
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`

        setInputMessage('')
        setIsLoading(true)
        setError(null)

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            role: 'USER',
            content: messageText,
            createdAt: new Date().toISOString()
        }

        const assistantMessage: Message = {
            id: `assistant_${Date.now()}`,
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date().toISOString(),
            isStreaming: true,
            model: selectedModel
        }

        addMessage(userMessage)
        addMessage(assistantMessage)

        try {
            abortControllerRef.current = new AbortController()
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: messageText,
                    model: selectedModel,
                    requestId,
                    systemPrompt: selectedBot ? selectedBot.systemPrompt : systemPrompt || undefined,
                    botId: selectedBot?.id
                }),
                signal: abortControllerRef.current.signal
            })

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/auth/signin')
                    return
                }
                throw new Error(`HTTP ${res.status}`)
            }

            const reader = res.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''
            let accumulatedContent = ''
            let newConversationId: string | null = null

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed || !trimmed.startsWith('data: ')) continue

                    const data = trimmed.slice(6)
                    if (data === '[DONE]') break

                    try {
                        const parsed = JSON.parse(data)

                        if (parsed.meta?.conversationId && !currentConversationId) {
                            newConversationId = parsed.meta.conversationId
                        }

                        if (parsed.delta || parsed.contentDelta) {
                            const delta = parsed.delta || parsed.contentDelta
                            accumulatedContent += delta
                            updateLastMessage({ content: accumulatedContent })
                        }

                        if (parsed.done) {
                            updateLastMessage({ isStreaming: false })
                        }

                        if (parsed.error) {
                            throw new Error(parsed.error)
                        }
                    } catch (e) {
                        console.warn('[Stream] Parse error:', e)
                    }
                }
            }

            if (newConversationId && !currentConversationId) {
                setCurrentConversationId(newConversationId)
            }

            await loadConversations()

        } catch (error: any) {
            console.error('[Send] Error:', error)

            updateLastMessage({
                content: error.name === 'AbortError'
                    ? 'Đã hủy'
                    : 'Lỗi: Không thể nhận phản hồi từ AI',
                error: error.name !== 'AbortError',
                isStreaming: false
            })

            if (error.name !== 'AbortError') {
                setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
            }
        } finally {
            setIsLoading(false)
            abortControllerRef.current = null
        }
    }, [inputMessage, currentConversationId, selectedModel, selectedBot, systemPrompt, router])

    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsLoading(false)
        }
    }

    return {
        // Conversations
        conversations,
        filteredConversations,
        currentConversationId,
        setCurrentConversationId,
        searchQuery,
        setSearchQuery,
        createNewConversation,
        deleteConversation,

        // Messages
        messages,
        messagesEndRef,

        // Input
        inputMessage,
        setInputMessage,
        sendMessage,
        stopStreaming,

        // Settings
        selectedModel,
        setSelectedModel,
        selectedBot,
        setSelectedBot,
        systemPrompt,
        setSystemPrompt,

        // State
        isLoading,
        error,
        setError
    }
}