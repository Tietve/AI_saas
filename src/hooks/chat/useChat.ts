import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useConversations } from './useConversations'
import { useMessages } from './useMessages'
import { BotPersonality, Message, Attachment } from '../../components/chat/shared/types'

// Helper function to generate title from message content
async function updateConversationTitle(conversationId: string, messageText: string, updateStateFn?: (id: string, title: string) => void) {
    try {
        // Generate a short title from the first message (max 50 characters)
        const title = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText
        
        // Update local state immediately for real-time UI update
        if (updateStateFn) {
            updateStateFn(conversationId, title)
        }
        
        // Update server in background
        const res = await fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        })
        
        if (res.ok) {
            console.log('[Update Title] Success:', title)
        } else {
            console.warn('[Update Title] Failed:', await res.text())
            // If server update failed, reload conversations to sync
            if (updateStateFn) {
                // Could implement a retry mechanism here
            }
        }
    } catch (error) {
        console.warn('[Update Title] Error:', error)
    }
}

export function useChat(props?: {
    userPlanTier?: string
    dailyUsage?: { messages: number; limit: number }
    onUpgrade?: () => void
}) {
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
        loadConversations,
        updateConversationTitle: updateConversationTitleInState
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

        // Check daily limit for FREE users - chỉ hiển thị modal khi đạt chính xác giới hạn
        if (props?.userPlanTier === 'FREE' && props?.dailyUsage && props?.onUpgrade) {
            if (props.dailyUsage.messages >= props.dailyUsage.limit) {
                props.onUpgrade()
                return false
            }
        }

        const messageText = text
        const isImageCommand = /^\s*(?:\/imagine|\/image)\b/i.test(messageText)
        const isVietnameseImageIntent = (() => {
            const t = messageText.toLowerCase()
            // Examples: "tạo ảnh ...", "tạo tôi ảnh ...", "vẽ một bức ảnh ...", "hãy tạo hình ..."
            return /(tạo|vẽ)[^\n]{0,30}(ảnh|hình)/i.test(t)
        })()
        const extractImagePrompt = () => {
            // Try to strip common Vietnamese prefixes; otherwise return original
            const prefixes = [
                /^\s*(?:hãy\s+)?(?:tạo|vẽ)(?:\s+(?:cho\s+tôi|tôi))?\s*(?:một|1)?\s*(?:bức\s+)?(?:ảnh|hình)\s*(?:của|về)?\s*/i,
            ]
            for (const rx of prefixes) {
                if (rx.test(messageText)) return messageText.replace(rx, '').trim()
            }
            // Slash command: remove the command keyword to get prompt
            if (isImageCommand) return messageText.replace(/^\s*(?:\/imagine|\/image)\b/i, '').trim()
            return messageText
        }
        const attachmentsToSend = pendingAttachments.map(att => ({ ...att }))

        // Debug: Log attachments being sent
        if (attachmentsToSend.length > 0) {
            console.log('[useChat] Sending attachments:', attachmentsToSend.map(a => ({
                id: a.id,
                name: a.meta?.name,
                hasExtractedText: 'extractedText' in (a.meta || {})
            })))
        }

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
            // If image generation command, call image API first
            if ((isImageCommand || isVietnameseImageIntent) && extractImagePrompt().length > 0) {
                const prompt = extractImagePrompt()
                try {
                    const genRes = await fetch('/api/images/generate', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt, size: '1024x1024', n: 1 })
                    })
                    if (genRes.ok) {
                        const data = await genRes.json()
                        const genAtt = Array.isArray(data.attachments) ? data.attachments : []
                        console.log('[Image Generate] Success:', { prompt, attachments: genAtt })
                        // Update assistant message to show generated image and stop streaming
                        updateLastMessage({ content: `Đã tạo ảnh cho: "${prompt}"`, isStreaming: false })
                        // Immediately insert a new assistant message with the image attachment
                        const imageMessage = {
                            id: `assistant_img_${Date.now()}`,
                            role: 'ASSISTANT' as const,
                            content: '',
                            createdAt: new Date().toISOString(),
                            attachments: genAtt,
                            model: selectedModel
                        }
                        console.log('[Image Generate] Adding image message:', imageMessage)
                        addMessage(imageMessage)
                        
                        // Auto-update conversation title for image generation
                        if (conversationId && messages.length <= 1) {
                            await updateConversationTitle(conversationId, `Tạo ảnh: ${prompt}`, updateConversationTitleInState)
                        }
                        
                        setIsLoading(false)
                        if (abortControllerRef.current) {
                            abortControllerRef.current = null
                        }
                        return true
                    } else {
                        const errorData = await genRes.json()
                        console.error('[Image Generate] API Error:', errorData)
                        updateLastMessage({ 
                            content: `Lỗi tạo ảnh: ${errorData.message || errorData.error || 'Unknown error'}`, 
                            isStreaming: false 
                        })
                        setIsLoading(false)
                        return false
                    }
                } catch (e) {
                    console.error('[Image Generate] Error:', e)
                    // fall-through to normal chat as a fallback
                }
            }

            // If not matched by heuristics, call lightweight intent classifier
            if (!isImageCommand && !isVietnameseImageIntent) {
                try {
                    const clsRes = await fetch('/api/intent/classify', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: messageText })
                    })
                    if (clsRes.ok) {
                        const cls = await clsRes.json()
                        if (cls.intent === 'image') {
                            const prompt = messageText
                            const genRes = await fetch('/api/images/generate', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ prompt, size: '1024x1024', n: 1 })
                            })
                            if (genRes.ok) {
                                const data = await genRes.json()
                                const genAtt = Array.isArray(data.attachments) ? data.attachments : []
                                console.log('[Intent Image Generate] Success:', { prompt, attachments: genAtt })
                                updateLastMessage({ content: `Đã tạo ảnh cho: "${prompt}"`, isStreaming: false })
                                const imageMessage = {
                                    id: `assistant_img_${Date.now()}`,
                                    role: 'ASSISTANT' as const,
                                    content: '',
                                    createdAt: new Date().toISOString(),
                                    attachments: genAtt,
                                    model: selectedModel
                                }
                                console.log('[Intent Image Generate] Adding image message:', imageMessage)
                                addMessage(imageMessage)
                                
                                // Auto-update conversation title for image generation
                                if (conversationId && messages.length <= 1) {
                                    await updateConversationTitle(conversationId, `Tạo ảnh: ${messageText}`, updateConversationTitleInState)
                                }
                                
                                setIsLoading(false)
                                if (abortControllerRef.current) {
                                    abortControllerRef.current = null
                                }
                                return true
                            } else {
                                const errorData = await genRes.json()
                                console.error('[Intent Image Generate] API Error:', errorData)
                                updateLastMessage({ 
                                    content: `Lỗi tạo ảnh: ${errorData.message || errorData.error || 'Unknown error'}`, 
                                    isStreaming: false 
                                })
                                setIsLoading(false)
                                return false
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[Intent Classify] Error:', e)
                }
            }

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
                signal: abortControllerRef.current?.signal
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
                // Save new conversation to localStorage for persistence on reload
                localStorage.setItem('lastConversationId', newConversationId)
            }

            await loadConversations()

            // Auto-update conversation title if this is the first message
            const conversationIdToUpdate = newConversationId || currentConversationId
            if (conversationIdToUpdate && messageText && messages.length <= 1) {
                // This is likely the first message, generate a title
                await updateConversationTitle(conversationIdToUpdate, messageText, updateConversationTitleInState)
            }

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
            if (abortControllerRef.current) {
                abortControllerRef.current = null
            }
        }

        return sent
    }, [inputMessage, pendingAttachments, isLoading, isUploading, currentConversationId, selectedModel, selectedBot, systemPrompt, router, updateConversationTitleInState, messages.length, props?.userPlanTier, props?.dailyUsage, props?.onUpgrade])

    const uploadAttachments = useCallback(
        async (files: FileList | File[]) => {
            const list = Array.from(files || []).filter((file): file is File => file instanceof File)
            if (!list.length) return

            const MAX_FILES = 5

            if (pendingAttachments.length + list.length > MAX_FILES) {
                setError(`Bạn chỉ có thể đính kèm tối đa ${MAX_FILES} tệp mỗi tin nhắn.`)
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

                const data = await res.json()

                if (!res.ok) {
                    // Handle validation errors from API
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map((e: any) => `${e.filename}: ${e.error}`).join('\n')
                        setError(errorMessages)
                    } else {
                        setError(data.message || 'Không thể tải tệp lên. Vui lòng thử lại.')
                    }
                    return
                }

                const uploaded: Attachment[] = Array.isArray(data.attachments)
                    ? data.attachments.map((att: Attachment) => ({
                          ...att,
                          meta: att.meta ?? undefined
                      }))
                    : []

                // Debug: Check if uploaded files have extractedText
                uploaded.forEach(att => {
                    console.log('[Upload] File received:', {
                        name: att.meta?.name,
                        hasExtractedText: 'extractedText' in (att.meta || {}),
                        extractedTextLength: (att.meta as any)?.extractedText?.length || 0
                    })
                })

                setPendingAttachments(prev => [...prev, ...uploaded])

                // Show warning if some files failed
                if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                    const warnings = data.errors.map((e: any) => `${e.filename}: ${e.error}`).join('\n')
                    console.warn('[Upload] Some files failed:', warnings)
                    setError(`Một số file không upload được:\n${warnings}`)
                }
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

    const regenerateLastMessage = useCallback(async () => {
        if (isLoading || messages.length < 2) return false

        // Find the last user message and assistant message
        const lastAssistantIndex = messages.length - 1
        const lastAssistant = messages[lastAssistantIndex]
        
        if (lastAssistant.role !== 'ASSISTANT') return false

        // Find the user message before the assistant message
        let lastUserMessage = null
        for (let i = lastAssistantIndex - 1; i >= 0; i--) {
            if (messages[i].role === 'USER') {
                lastUserMessage = messages[i]
                break
            }
        }

        if (!lastUserMessage) return false

        // Remove the last assistant message
        const messagesWithoutLast = messages.slice(0, -1)
        clearMessages()
        messagesWithoutLast.forEach(msg => addMessage(msg))

        // Resend using the user message content
        const userMessageText = lastUserMessage.content
        const userAttachments = lastUserMessage.attachments || []

        setInputMessage(userMessageText)
        setPendingAttachments(userAttachments)

        // Trigger sendMessage after a brief delay
        setTimeout(() => {
            sendMessage()
        }, 100)

        return true
    }, [messages, isLoading, clearMessages, addMessage, sendMessage])

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
        regenerateLastMessage,
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