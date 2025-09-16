// src/app/chat/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Types định nghĩa cấu trúc dữ liệu
interface Message {
    id: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    createdAt: string
}

interface Conversation {
    id: string
    title: string
    updatedAt: string
    messageCount?: number
}

interface ModelOption {
    id: string
    label: string
    provider: string
}

// Danh sách models - phải sync với database enum
const AVAILABLE_MODELS: ModelOption[] = [
    { id: 'gpt_4o_mini', label: 'GPT-4o Mini (Fast)', provider: 'openai' },
    { id: 'gpt_4o', label: 'GPT-4o (Balanced)', provider: 'openai' },
    { id: 'gpt_4_turbo', label: 'GPT-4 Turbo (Advanced)', provider: 'openai' },
    { id: 'claude_3_5_haiku', label: 'Claude 3.5 Haiku', provider: 'anthropic' },
    { id: 'claude_3_5_sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'gemini_1_5_flash', label: 'Gemini Flash', provider: 'google' },
    { id: 'gemini_1_5_pro', label: 'Gemini Pro', provider: 'google' },
]

export default function ChatPage() {
    const router = useRouter()

    // State management
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [selectedModel, setSelectedModel] = useState('gpt_4o_mini')
    const [systemPrompt, setSystemPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Load conversations khi component mount
    useEffect(() => {
        loadConversations()
        checkAuthentication()
    }, [])

    // Auto scroll khi có tin nhắn mới
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load messages khi đổi conversation
    useEffect(() => {
        if (currentConversationId) {
            loadMessages(currentConversationId)
        }
    }, [currentConversationId])

    // Kiểm tra authentication
    async function checkAuthentication() {
        try {
            const res = await fetch('/api/me')
            const data = await res.json()

            if (!data.authenticated) {
                router.push('/auth/signin')
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            router.push('/auth/signin')
        }
    }

    // Load danh sách conversations
    async function loadConversations() {
        try {
            const res = await fetch('/api/conversations?pageSize=50', {
                cache: 'no-store'
            })

            if (!res.ok) throw new Error('Failed to load conversations')

            const data = await res.json()
            setConversations(data.items || [])

            // Nếu chưa có conversation được chọn và có conversations, chọn cái đầu tiên
            if (!currentConversationId && data.items?.length > 0) {
                setCurrentConversationId(data.items[0].id)
            }
        } catch (error) {
            console.error('Load conversations error:', error)
            setError('Không thể tải danh sách hội thoại')
        }
    }

    // Load messages của một conversation
    async function loadMessages(conversationId: string) {
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages?limit=100`, {
                cache: 'no-store'
            })

            if (!res.ok) throw new Error('Failed to load messages')

            const data = await res.json()
            setMessages(data.items || [])
        } catch (error) {
            console.error('Load messages error:', error)
            setError('Không thể tải tin nhắn')
        }
    }

    // Tạo conversation mới
    async function createNewConversation() {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'New Chat',
                    systemPrompt: systemPrompt || undefined
                })
            })

            if (!res.ok) throw new Error('Failed to create conversation')

            const data = await res.json()
            await loadConversations()
            setCurrentConversationId(data.item.id)
            setMessages([])
        } catch (error) {
            console.error('Create conversation error:', error)
            setError('Không thể tạo hội thoại mới')
        }
    }

    // Gửi tin nhắn
    async function sendMessage() {
        if (!inputMessage.trim() || isLoading) return

        const messageText = inputMessage.trim()
        setInputMessage('')
        setIsLoading(true)
        setError(null)

        // Thêm tin nhắn user vào UI ngay lập tức
        const tempUserMessage: Message = {
            id: 'temp-user-' + Date.now(),
            role: 'USER',
            content: messageText,
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempUserMessage])

        // Chuẩn bị cho streaming response
        const tempAssistantMessage: Message = {
            id: 'temp-assistant-' + Date.now(),
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempAssistantMessage])

        try {
            // Tạo abort controller cho streaming
            abortControllerRef.current = new AbortController()

            const res = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: currentConversationId || 'new',
                    message: messageText,
                    systemPrompt: systemPrompt,
                    model: selectedModel
                }),
                signal: abortControllerRef.current.signal
            })

            if (!res.ok) throw new Error('Failed to send message')

            // Process streaming response
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                let accumulatedContent = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6)
                            if (data === '[DONE]') continue

                            try {
                                const parsed = JSON.parse(data)

                                if (parsed.meta?.conversationId && !currentConversationId) {
                                    setCurrentConversationId(parsed.meta.conversationId)
                                }

                                if (parsed.contentDelta) {
                                    accumulatedContent += parsed.contentDelta
                                    setMessages(prev => {
                                        const newMessages = [...prev]
                                        const lastMessage = newMessages[newMessages.length - 1]
                                        if (lastMessage && lastMessage.role === 'ASSISTANT') {
                                            lastMessage.content = accumulatedContent
                                        }
                                        return newMessages
                                    })
                                }

                                if (parsed.error) {
                                    throw new Error(parsed.error)
                                }
                            } catch (e) {
                                // Ignore parse errors for malformed chunks
                                console.warn('Parse error:', e)
                            }
                        }
                    }
                }
            }

            // Reload conversations để update list
            await loadConversations()

        } catch (error: any) {
            console.error('Send message error:', error)

            if (error.name === 'AbortError') {
                setError('Tin nhắn đã bị hủy')
            } else {
                setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
            }

            // Xóa tin nhắn assistant rỗng nếu có lỗi
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setIsLoading(false)
            abortControllerRef.current = null
        }
    }

    // Dừng streaming
    function stopStreaming() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
    }

    // Xóa conversation
    async function deleteConversation(id: string) {
        if (!confirm('Bạn có chắc muốn xóa hội thoại này?')) return

        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')

            await loadConversations()

            if (currentConversationId === id) {
                setCurrentConversationId(null)
                setMessages([])
            }
        } catch (error) {
            console.error('Delete error:', error)
            setError('Không thể xóa hội thoại')
        }
    }

    // Cập nhật settings của conversation
    async function updateConversationSettings() {
        if (!currentConversationId) return

        try {
            const res = await fetch(`/api/conversations/${currentConversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: systemPrompt,
                    model: selectedModel
                })
            })

            if (!res.ok) throw new Error('Failed to update')

        } catch (error) {
            console.error('Update settings error:', error)
        }
    }

    // Utility functions
    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200">
                    <button
                        onClick={createNewConversation}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        + Hội thoại mới
                    </button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                currentConversationId === conv.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => setCurrentConversationId(conv.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {conv.title || 'Untitled'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteConversation(conv.id)
                                    }}
                                    className="ml-2 text-gray-400 hover:text-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}

                    {conversations.length === 0 && (
                        <p className="text-center text-gray-500 mt-8">
                            Chưa có hội thoại nào
                        </p>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            ☰
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Model Selector */}
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                            >
                                {AVAILABLE_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>

                            {/* System Prompt */}
                            <input
                                type="text"
                                placeholder="System prompt (optional)"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                onBlur={updateConversationSettings}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`mb-4 flex ${
                                message.role === 'USER' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-2xl px-4 py-2 rounded-lg ${
                                    message.role === 'USER'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                    message.role === 'USER' ? 'text-blue-200' : 'text-gray-500'
                                }`}>
                                    {formatTime(message.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}

                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <p className="text-lg mb-2">Chào mừng bạn đến với AI Chat!</p>
                            <p className="text-sm">Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn bên dưới.</p>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="px-6 py-2 bg-red-50 border-t border-red-200">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Nhập tin nhắn của bạn..."
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />

                        {isLoading ? (
                            <button
                                onClick={stopStreaming}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Dừng
                            </button>
                        ) : (
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                Gửi
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}