import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useConversations } from './useConversations'
import { useMessages } from './useMessages'
import { BotPersonality, Message, Attachment } from '@/components/chat/shared/types'

export function useChat() {
    const router = useRouter()
    const [inputMessage, setInputMessage] = useState('')
    const [selectedModel, setSelectedModel] = useState('gpt_4o_mini')
    const [selectedBot, setSelectedBot] = useState<BotPersonality | undefined>(undefined)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
    const [isUploading, setIsUploading] = useState(false)
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
        const text = inputMessage.trim()
        if ((text.length === 0 && pendingAttachments.length === 0) || isLoading || isUploading) return false

        const messageText = text
        const attachmentsToSend = pendingAttachments.map(att => ({ ...att }))
        const conversationId = currentConversationId || 'new'
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`

        setInputMessage('')
        setPendingAttachments([])
        setIsLoading(true)
        setError(null)

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            role: 'USER',
            content: messageText,
            createdAt: new Date().toISOString(),
            attachments: attachmentsToSend
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

        let sent = false

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
                    botId: selectedBot?.id,
                    attachments: attachmentsToSend
                }),
                signal: abortControllerRef.current.signal
            })

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/auth/signin')
                    return false
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

            sent = true

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

        return sent
    }, [inputMessage, pendingAttachments, isLoading, isUploading, currentConversationId, selectedModel, selectedBot, systemPrompt, router])

    const uploadAttachments = useCallback(
        async (files: FileList | File[]) => {
            const list = Array.from(files || []).filter((file): file is File => file instanceof File)
            if (!list.length) return

            const MAX_FILES = 5
            const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

            if (pendingAttachments.length + list.length > MAX_FILES) {
                setError(`Bạn chỉ có thể đính kèm tối đa ${MAX_FILES} tệp mỗi tin nhắn.`)
                return
            }

            const oversize = list.find(file => file.size > MAX_SIZE_BYTES)
            if (oversize) {
                setError('Mỗi tệp chỉ được tối đa 10MB.')
                return
            }

            const formData = new FormData()
            for (const file of list) {
                formData.append('files', file)
            }

            setIsUploading(true)
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                })

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }

                const data = await res.json()
                const uploaded: Attachment[] = Array.isArray(data.attachments)
                    ? data.attachments.map((att: Attachment) => ({
                          ...att,
                          meta: att.meta ?? undefined
                      }))
                    : []

                setPendingAttachments(prev => [...prev, ...uploaded])
            } catch (err) {
                console.error('[Upload] Error:', err)
                setError('Không thể tải tệp lên. Vui lòng thử lại.')
            } finally {
                setIsUploading(false)
            }
        },
        [pendingAttachments, setError]
    )

    const removeAttachment = useCallback((id: string) => {
        setPendingAttachments(prev => prev.filter(att => att.id !== id))
    }, [])

    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsLoading(false)
        }
    }

    return {
        
        conversations,
        filteredConversations,
        currentConversationId,
        setCurrentConversationId,
        searchQuery,
        setSearchQuery,
        createNewConversation,
        deleteConversation,

        
        messages,
        messagesEndRef,


        inputMessage,
        setInputMessage,
        sendMessage,
        stopStreaming,
        pendingAttachments,
        uploadAttachments,
        removeAttachment,
        isUploading,


        selectedModel,
        setSelectedModel,
        selectedBot,
        setSelectedBot,
        systemPrompt,
        setSystemPrompt,

        
        isLoading,
        error,
        setError
    }
}