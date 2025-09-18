// src/app/chat/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeSelector } from '@/components/theme-selector'

// Types định nghĩa cấu trúc dữ liệu
interface Message {
    id: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    createdAt: string
    isStreaming?: boolean
    error?: boolean
}

interface Conversation {
    id: string
    title: string
    updatedAt: string
    messageCount?: number
    model?: string
}

interface ModelOption {
    id: string
    label: string
    provider: string
    speed: 'fast' | 'balanced' | 'advanced'
}

// Danh sách models với metadata
const AVAILABLE_MODELS: ModelOption[] = [
    { id: 'gpt_4o_mini', label: 'GPT-4o Mini', provider: 'openai', speed: 'fast' },
    { id: 'gpt_4o', label: 'GPT-4o', provider: 'openai', speed: 'balanced' },
    { id: 'gpt_4_turbo', label: 'GPT-4 Turbo', provider: 'openai', speed: 'advanced' },
    { id: 'claude_3_5_haiku', label: 'Claude 3.5 Haiku', provider: 'anthropic', speed: 'fast' },
    { id: 'claude_3_5_sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic', speed: 'balanced' },
    { id: 'gemini_1_5_flash', label: 'Gemini Flash', provider: 'google', speed: 'fast' },
    { id: 'gemini_1_5_pro', label: 'Gemini Pro', provider: 'google', speed: 'advanced' },
]

// Speed badges colors
const SPEED_COLORS = {
    fast: 'bg-green-100 text-green-800',
    balanced: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800'
}

export default function ChatPage() {
    const router = useRouter()

    // Authentication states
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)

    // Chat states
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [selectedModel, setSelectedModel] = useState('gpt_4o_mini')
    const [systemPrompt, setSystemPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [showModelDetails, setShowModelDetails] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [retryCount, setRetryCount] = useState(0)

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Check authentication
    useEffect(() => {
        checkAuthentication()
    }, [])

    // Load conversations after auth
    useEffect(() => {
        if (authenticated) {
            loadConversations()
        }
    }, [authenticated])

    // Auto scroll on new messages
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load messages when conversation changes
    useEffect(() => {
        if (currentConversationId && authenticated) {
            loadMessages(currentConversationId)
        } else {
            setMessages([])
        }
    }, [currentConversationId, authenticated])

    // Filter conversations based on search
    const filteredConversations = conversations.filter(conv =>
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Check authentication
    async function checkAuthentication() {
        try {
            const res = await fetch('/api/me', {
                credentials: 'include',
                cache: 'no-store'
            })

            const data = await res.json()

            if (data.authenticated) {
                setAuthenticated(true)
            } else {
                router.push('/auth/signin')
            }
        } catch (error) {
            console.error('[Auth] Error:', error)
            router.push('/auth/signin')
        } finally {
            setLoading(false)
        }
    }

    // Load conversations
    async function loadConversations() {
        try {
            const res = await fetch('/api/conversations?pageSize=50', {
                credentials: 'include',
                cache: 'no-store'
            })

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/auth/signin')
                    return
                }
                throw new Error('Failed to load conversations')
            }

            const data = await res.json()
            setConversations(data.items || [])

            // Auto-select first conversation if none selected
            if (!currentConversationId && data.items?.length > 0) {
                setCurrentConversationId(data.items[0].id)
            }
        } catch (error) {
            console.error('[Conversations] Load error:', error)
            setError('Không thể tải danh sách hội thoại')
        }
    }

    // Load messages
    async function loadMessages(conversationId: string) {
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages?limit=100`, {
                credentials: 'include',
                cache: 'no-store'
            })

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/auth/signin')
                    return
                }
                throw new Error('Failed to load messages')
            }

            const data = await res.json()
            setMessages(data.items || [])
        } catch (error) {
            console.error('[Messages] Load error:', error)
            setError('Không thể tải tin nhắn')
        }
    }

    // Create new conversation
    async function createNewConversation() {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'New Chat',
                    systemPrompt: systemPrompt || undefined,
                    model: selectedModel
                })
            })

            if (!res.ok) throw new Error('Failed to create conversation')

            const data = await res.json()
            await loadConversations()
            setCurrentConversationId(data.item.id)
            setMessages([])
            setError(null)

            // Focus input after creating
            setTimeout(() => inputRef.current?.focus(), 100)
        } catch (error) {
            console.error('[Create] Error:', error)
            setError('Không thể tạo hội thoại mới')
        }
    }

    // Send message with proper streaming
    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim() || isLoading) return

        const messageText = inputMessage.trim()
        const conversationId = currentConversationId || 'new'
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`

        // Clear input immediately
        setInputMessage('')
        setIsLoading(true)
        setError(null)
        setRetryCount(0)

        // Add user message
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            role: 'USER',
            content: messageText,
            createdAt: new Date().toISOString()
        }

        // Add assistant placeholder
        const assistantMessage: Message = {
            id: `assistant_${Date.now()}`,
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date().toISOString(),
            isStreaming: true
        }

        setMessages(prev => [...prev, userMessage, assistantMessage])

        try {
            abortControllerRef.current = new AbortController()

            // Use /api/chat/send for streaming
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: messageText,
                    model: selectedModel,
                    requestId
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

            // Process SSE stream
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

                        // Handle conversation ID
                        if (parsed.meta?.conversationId && !currentConversationId) {
                            newConversationId = parsed.meta.conversationId
                        }

                        // Handle content
                        if (parsed.delta || parsed.contentDelta) {
                            const delta = parsed.delta || parsed.contentDelta
                            accumulatedContent += delta

                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastMsg = newMessages[newMessages.length - 1]
                                if (lastMsg && lastMsg.role === 'ASSISTANT') {
                                    lastMsg.content = accumulatedContent
                                    lastMsg.isStreaming = true
                                }
                                return newMessages
                            })
                        }

                        // Handle completion
                        if (parsed.done) {
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastMsg = newMessages[newMessages.length - 1]
                                if (lastMsg && lastMsg.role === 'ASSISTANT') {
                                    lastMsg.isStreaming = false
                                }
                                return newMessages
                            })
                        }

                        // Handle error
                        if (parsed.error) {
                            throw new Error(parsed.error)
                        }
                    } catch (e) {
                        console.warn('[Stream] Parse error:', e)
                    }
                }
            }

            // Update conversation ID if new
            if (newConversationId && !currentConversationId) {
                setCurrentConversationId(newConversationId)
            }

            // Reload conversations
            await loadConversations()

        } catch (error: any) {
            console.error('[Send] Error:', error)

            // Update last message to show error
            setMessages(prev => {
                const newMessages = [...prev]
                const lastMsg = newMessages[newMessages.length - 1]
                if (lastMsg && lastMsg.role === 'ASSISTANT') {
                    if (error.name === 'AbortError') {
                        lastMsg.content = lastMsg.content || '(Đã hủy)'
                    } else {
                        lastMsg.content = lastMsg.content || 'Lỗi: Không thể nhận phản hồi từ AI'
                        lastMsg.error = true
                    }
                    lastMsg.isStreaming = false
                }
                return newMessages
            })

            if (error.name !== 'AbortError') {
                setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
            }
        } finally {
            setIsLoading(false)
            abortControllerRef.current = null
        }
    }, [inputMessage, currentConversationId, selectedModel, router])

    // Stop streaming
    function stopStreaming() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsLoading(false)
        }
    }

    // Retry last message
    function retryLastMessage() {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'USER')
        if (lastUserMessage) {
            // Remove the last assistant message if it's an error
            setMessages(prev => {
                const lastAssistant = [...prev].reverse().find(m => m.role === 'ASSISTANT')
                if (lastAssistant?.error) {
                    return prev.filter(m => m.id !== lastAssistant.id)
                }
                return prev
            })

            // Resend the message
            setInputMessage(lastUserMessage.content)
            setTimeout(() => sendMessage(), 100)
        }
    }

    // Delete conversation
    async function deleteConversation(id: string) {
        if (!confirm('Xóa hội thoại này?')) return

        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (!res.ok) throw new Error('Failed to delete')

            await loadConversations()

            if (currentConversationId === id) {
                setCurrentConversationId(null)
                setMessages([])
            }
        } catch (error) {
            console.error('[Delete] Error:', error)
            setError('Không thể xóa hội thoại')
        }
    }

    // Update conversation settings
    async function updateConversationSettings() {
        if (!currentConversationId) return

        try {
            await fetch(`/api/conversations/${currentConversationId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt,
                    model: selectedModel
                })
            })
        } catch (error) {
            console.error('[Update] Error:', error)
        }
    }

    // Sign out
    async function handleSignOut() {
        try {
            await fetch('/api/auth/signout', {
                method: 'POST',
                credentials: 'include'
            })
            router.push('/auth/signin')
        } catch (error) {
            console.error('[SignOut] Error:', error)
        }
    }

    // Utilities
    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        )
    }

    // Main UI
    return (
        <div className="flex h-screen chat-container">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 sidebar flex flex-col overflow-hidden`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 space-y-2">
                    <button
                        onClick={createNewConversation}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        <span>+</span>
                        <span>Hội thoại mới</span>
                    </button>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conversation-item p-3 cursor-pointer transition group ${
                                currentConversationId === conv.id ? 'active' : ''
                            }`}
                            onClick={() => setCurrentConversationId(conv.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {conv.title || 'Untitled'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs opacity-70">
                                            {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                        {conv.model && (
                                            <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                                {conv.model}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteConversation(conv.id)
                                    }}
                                    className="ml-2 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredConversations.length === 0 && (
                        <p className="text-center text-gray-500 mt-8 px-4">
                            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có hội thoại nào'}
                        </p>
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t">
                    <button
                        onClick={handleSignOut}
                        className="w-full py-2 px-4 rounded-lg hover:opacity-80 transition"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text)'
                        }}
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="chat-header px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                {isSidebarOpen ? '◀' : '▶'}
                            </button>
                            <h1 className="text-lg font-semibold">AI Multi-Model Chat</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Theme Selector */}
                            <ThemeSelector />

                            {/* Model Selector with Details */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowModelDetails(!showModelDetails)}
                                    className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80 transition"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                        backgroundColor: 'var(--color-surface)'
                                    }}
                                >
                                    <span>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                        SPEED_COLORS[AVAILABLE_MODELS.find(m => m.id === selectedModel)?.speed || 'balanced']
                                    }`}>
                                        {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.speed}
                                    </span>
                                    <span>▼</span>
                                </button>

                                {showModelDetails && (
                                    <div className="absolute top-full mt-2 right-0 w-80 rounded-lg shadow-lg z-10"
                                         style={{
                                             backgroundColor: 'var(--color-surface)',
                                             border: '1px solid var(--color-border)'
                                         }}>
                                        <div className="p-2 max-h-60 overflow-y-auto">
                                            {AVAILABLE_MODELS.map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model.id)
                                                        setShowModelDetails(false)
                                                        updateConversationSettings()
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded hover:opacity-80 transition ${
                                                        selectedModel === model.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{model.label}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                            SPEED_COLORS[model.speed]
                                                        }`}>
                                                            {model.speed}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs opacity-60">{model.provider}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* System Prompt */}
                            <input
                                type="text"
                                placeholder="System prompt (optional)"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                onBlur={updateConversationSettings}
                                className="px-3 py-1.5 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{
                                    borderColor: 'var(--color-border)',
                                    backgroundColor: 'var(--color-surface)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 messages-area">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`mb-4 flex ${
                                message.role === 'USER' ? 'justify-end' : 'justify-start'
                            } animate-in`}
                        >
                            <div
                                className={`max-w-2xl px-4 py-2 rounded-lg message ${
                                    message.role === 'USER'
                                        ? 'user'
                                        : message.error
                                            ? 'error'
                                            : 'assistant'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">
                                    {message.content}
                                    {message.isStreaming && (
                                        <span className="inline-block ml-1 animate-pulse">▊</span>
                                    )}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs opacity-60">
                                        {formatTime(message.createdAt)}
                                    </p>
                                    {message.error && (
                                        <button
                                            onClick={retryLastMessage}
                                            className="text-xs hover:opacity-80 underline"
                                        >
                                            Thử lại
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {messages.length === 0 && !currentConversationId && (
                        <div className="text-center mt-20">
                            <p className="text-2xl mb-2">🤖 AI Chat Assistant</p>
                            <p className="text-lg mb-4">Chào mừng bạn!</p>
                            <div className="text-sm opacity-60 max-w-md mx-auto">
                                <p>💡 Mẹo sử dụng:</p>
                                <ul className="mt-2 space-y-1 text-left">
                                    <li>• Chọn model phù hợp với nhu cầu</li>
                                    <li>• Sử dụng System Prompt để tùy chỉnh phong cách trả lời</li>
                                    <li>• Nhấn Ctrl+Enter để gửi tin nhắn nhanh</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="px-6 py-3 flex items-center justify-between"
                         style={{
                             backgroundColor: 'var(--color-error)',
                             opacity: 0.1
                         }}>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="hover:opacity-80"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="input-area px-6 py-4">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (e.ctrlKey || e.metaKey || !e.shiftKey) {
                                            e.preventDefault()
                                            sendMessage()
                                        }
                                    }
                                }}
                                placeholder={isLoading ? 'Đang xử lý...' : 'Nhập tin nhắn của bạn...'}
                                disabled={isLoading}
                                className="w-full px-4 py-2 pr-10 rounded-lg input-container focus:outline-none focus:ring-2 disabled:opacity-50"
                            />
                            {inputMessage.length > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-40">
                                    {inputMessage.length}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <button
                                onClick={stopStreaming}
                                className="px-6 py-2 rounded-lg transition flex items-center gap-2"
                                style={{
                                    backgroundColor: 'var(--color-error)',
                                    color: 'white'
                                }}
                            >
                                <span>⏸</span>
                                <span>Dừng</span>
                            </button>
                        ) : (
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim()}
                                className="px-6 py-2 rounded-lg send-button transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>📤</span>
                                <span>Gửi</span>
                            </button>
                        )}
                    </div>

                    {/* Character count and tips */}
                    <div className="flex justify-between mt-2 text-xs opacity-40">
                        <span>Nhấn Enter để gửi • Shift+Enter để xuống dòng</span>
                        {isLoading && (
                            <span className="animate-pulse" style={{ color: 'var(--color-primary)' }}>
                                AI đang suy nghĩ...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}