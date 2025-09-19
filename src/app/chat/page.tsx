'use client'

import { BotSelector } from '@/components/chat/BotSelector'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeSelector } from '@/components/theme-selector'
import { getBotById, getRandomGreeting, BotPersonality } from '@/lib/bots/personality-templates'
import '@/styles/animations.css'

// Types
interface Message {
    id: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    createdAt: string
    isStreaming?: boolean
    error?: boolean
    model?: string
}

interface Conversation {
    id: string
    title: string
    updatedAt: string
    messageCount?: number
    model?: string
    botId?: string
}

interface ModelOption {
    id: string
    label: string
    provider: string
    speed: 'lightning' | 'fast' | 'balanced' | 'advanced'
    capabilities: string[]
    contextWindow: string
}

// Enhanced Models Configuration
const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: 'gpt_4o_mini',
        label: 'GPT-4o Mini',
        provider: 'openai',
        speed: 'lightning',
        capabilities: ['text', 'code'],
        contextWindow: '128K'
    },
    {
        id: 'gpt_4o',
        label: 'GPT-4o',
        provider: 'openai',
        speed: 'fast',
        capabilities: ['text', 'code', 'vision', 'function'],
        contextWindow: '128K'
    },
    {
        id: 'gpt_4_turbo',
        label: 'GPT-4 Turbo',
        provider: 'openai',
        speed: 'advanced',
        capabilities: ['text', 'code', 'vision', 'function', 'browsing'],
        contextWindow: '128K'
    },
    {
        id: 'claude_3_5_haiku',
        label: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        speed: 'lightning',
        capabilities: ['text', 'code'],
        contextWindow: '200K'
    },
    {
        id: 'claude_3_5_sonnet',
        label: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        speed: 'balanced',
        capabilities: ['text', 'code', 'vision', 'analysis'],
        contextWindow: '200K'
    },
    {
        id: 'gemini_1_5_flash',
        label: 'Gemini Flash',
        provider: 'google',
        speed: 'lightning',
        capabilities: ['text', 'code', 'vision'],
        contextWindow: '1M'
    },
    {
        id: 'gemini_1_5_pro',
        label: 'Gemini Pro',
        provider: 'google',
        speed: 'advanced',
        capabilities: ['text', 'code', 'vision', 'audio', 'video'],
        contextWindow: '2M'
    },
]

// Provider Colors & Gradients
const PROVIDER_STYLES = {
    openai: {
        gradient: 'linear-gradient(135deg, #10A37F 0%, #1BA784 100%)',
        color: '#10A37F',
        bgLight: 'rgba(16, 163, 127, 0.1)',
        bgDark: 'rgba(16, 163, 127, 0.05)'
    },
    anthropic: {
        gradient: 'linear-gradient(135deg, #D4A574 0%, #C19660 100%)',
        color: '#D4A574',
        bgLight: 'rgba(212, 165, 116, 0.1)',
        bgDark: 'rgba(212, 165, 116, 0.05)'
    },
    google: {
        gradient: 'linear-gradient(135deg, #4285F4 0%, #EA4335 50%, #FBBC04 100%)',
        color: '#4285F4',
        bgLight: 'rgba(66, 133, 244, 0.1)',
        bgDark: 'rgba(66, 133, 244, 0.05)'
    }
}

// Speed Badge Styles
const SPEED_STYLES = {
    lightning: {
        icon: '⚡',
        color: '#FBBF24',
        bg: 'rgba(251, 191, 36, 0.1)',
        label: 'Lightning'
    },
    fast: {
        icon: '🚀',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.1)',
        label: 'Fast'
    },
    balanced: {
        icon: '⚖️',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.1)',
        label: 'Balanced'
    },
    advanced: {
        icon: '🧠',
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.1)',
        label: 'Advanced'
    }
}

export default function ChatPage() {
    const router = useRouter()

    // States
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [selectedModel, setSelectedModel] = useState('gpt_4o_mini')
    const [selectedBot, setSelectedBot] = useState<BotPersonality | undefined>(undefined)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [showModelDetails, setShowModelDetails] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSystemPrompt, setShowSystemPrompt] = useState(false)
    const [isTyping, setIsTyping] = useState(false)

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const modelDropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setShowModelDetails(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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
            const currentConv = conversations.find(c => c.id === currentConversationId)
            if (currentConv?.botId) {
                const bot = getBotById(currentConv.botId)
                setSelectedBot(bot)
            } else {
                setSelectedBot(undefined)
            }
        } else {
            setMessages([])
        }
    }, [currentConversationId, authenticated, conversations])

    // Filter conversations
    const filteredConversations = conversations.filter(conv =>
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // API Functions
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
            if (!currentConversationId && data.items?.length > 0) {
                setCurrentConversationId(data.items[0].id)
            }
        } catch (error) {
            console.error('[Conversations] Load error:', error)
            setError('Không thể tải danh sách hội thoại')
        }
    }

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

    async function createNewConversation() {
        try {
            setSelectedBot(undefined)
            const res = await fetch('/api/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'New Chat',
                    systemPrompt: systemPrompt || undefined,
                    model: selectedModel,
                    botId: undefined
                })
            })
            if (!res.ok) throw new Error('Failed to create conversation')
            const data = await res.json()
            await loadConversations()
            setCurrentConversationId(data.item.id)
            setMessages([])
            setError(null)
            setTimeout(() => inputRef.current?.focus(), 100)
        } catch (error) {
            console.error('[Create] Error:', error)
            setError('Không thể tạo hội thoại mới')
        }
    }

    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim() || isLoading) return

        const messageText = inputMessage.trim()
        const conversationId = currentConversationId || 'new'
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`

        setInputMessage('')
        setIsLoading(true)
        setError(null)
        setIsTyping(true)

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

        setMessages(prev => [...prev, userMessage, assistantMessage])

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
                    if (data === '[DONE]') {
                        setIsTyping(false)
                        break
                    }

                    try {
                        const parsed = JSON.parse(data)

                        if (parsed.meta?.conversationId && !currentConversationId) {
                            newConversationId = parsed.meta.conversationId
                        }

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

                        if (parsed.done) {
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastMsg = newMessages[newMessages.length - 1]
                                if (lastMsg && lastMsg.role === 'ASSISTANT') {
                                    lastMsg.isStreaming = false
                                }
                                return newMessages
                            })
                            setIsTyping(false)
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
            setIsTyping(false)

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
            setIsTyping(false)
            abortControllerRef.current = null
        }
    }, [inputMessage, currentConversationId, selectedModel, selectedBot, systemPrompt, router])

    function stopStreaming() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsLoading(false)
            setIsTyping(false)
        }
    }

    function retryLastMessage() {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'USER')
        if (lastUserMessage) {
            setMessages(prev => {
                const lastAssistant = [...prev].reverse().find(m => m.role === 'ASSISTANT')
                if (lastAssistant?.error) {
                    return prev.filter(m => m.id !== lastAssistant.id)
                }
                return prev
            })
            setInputMessage(lastUserMessage.content)
            setTimeout(() => sendMessage(), 100)
        }
    }

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

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua'
        } else {
            return date.toLocaleDateString('vi-VN')
        }
    }

    // Group conversations by date
    function groupConversationsByDate(conversations: Conversation[]) {
        const groups: { [key: string]: Conversation[] } = {}

        conversations.forEach(conv => {
            const dateKey = formatDate(conv.updatedAt)
            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(conv)
        })

        return groups
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Đang tải...</p>
                </div>
            </div>
        )
    }

    const conversationGroups = groupConversationsByDate(filteredConversations)

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <style jsx global>{`
                /* Enhanced CSS Variables */
                :root {
                    --sidebar-width: 280px;
                    --header-height: 60px;
                    --input-height: 140px;
                    --transition-speed: 0.2s;
                    --border-radius: 12px;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                /* Modern Scrollbar */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.3);
                    border-radius: 3px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.5);
                }

                /* Glass Effect */
                .glass {
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                /* Smooth Transitions */
                * {
                    transition: background-color var(--transition-speed),
                                border-color var(--transition-speed),
                                color var(--transition-speed);
                }

                /* Message Animation */
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .message-enter {
                    animation: slideIn 0.3s ease-out;
                }

                /* Typing Indicator */
                @keyframes typing {
                    0%, 60%, 100% {
                        opacity: 0.3;
                    }
                    30% {
                        opacity: 1;
                    }
                }

                .typing-dot {
                    animation: typing 1.4s infinite;
                }

                .typing-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .typing-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }

                /* Hover Effects */
                .hover-scale {
                    transition: transform 0.2s;
                }
                
                .hover-scale:hover {
                    transform: scale(1.02);
                }

                /* Focus Styles */
                .focus-ring {
                    transition: box-shadow 0.2s;
                }
                
                .focus-ring:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    :root {
                        --sidebar-width: 100%;
                    }
                }
            `}</style>

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                fixed lg:relative w-[var(--sidebar-width)] h-full z-30
                transition-transform duration-300 ease-in-out
                bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
                flex flex-col`}>

                {/* Sidebar Header */}
                <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={createNewConversation}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700
                                 text-white rounded-lg hover:from-blue-700 hover:to-blue-800
                                 transition-all duration-200 flex items-center justify-center gap-2
                                 font-medium shadow-md hover:shadow-lg hover-scale">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Hội thoại mới</span>
                    </button>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm hội thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800
                                     border border-gray-200 dark:border-gray-700 rounded-lg
                                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                     placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {Object.entries(conversationGroups).map(([date, convs]) => (
                        <div key={date}>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {date}
                            </div>
                            {convs.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setCurrentConversationId(conv.id)}
                                    className={`w-full text-left px-3 py-2.5 mb-1 rounded-lg
                                              transition-all duration-200 group relative
                                              ${currentConversationId === conv.id
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'}`}>

                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {conv.title || 'Untitled'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {conv.model && (
                                                    <span className="text-xs px-2 py-0.5 rounded
                                                                   bg-gray-100 dark:bg-gray-700
                                                                   text-gray-600 dark:text-gray-400">
                                                        {AVAILABLE_MODELS.find(m => m.id === conv.model)?.label}
                                                    </span>
                                                )}
                                                {conv.messageCount && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {conv.messageCount} tin
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteConversation(conv.id)
                                            }}
                                            className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100
                                                     hover:bg-red-100 dark:hover:bg-red-900/30
                                                     text-gray-400 hover:text-red-600 dark:hover:text-red-400
                                                     transition-all duration-200">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))}

                    {filteredConversations.length === 0 && (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có hội thoại nào'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                        onClick={handleSignOut}
                        className="w-full py-2 px-4 text-gray-700 dark:text-gray-300
                                 bg-gray-100 dark:bg-gray-800 rounded-lg
                                 hover:bg-gray-200 dark:hover:bg-gray-700
                                 transition-colors duration-200 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="h-[var(--header-height)] px-4 lg:px-6
                            bg-white/80 dark:bg-gray-950/80 glass
                            border-b border-gray-200 dark:border-gray-800
                            flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                                     transition-colors lg:hidden">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600
                                     dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            AI Assistant Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Bot Selector */}
                        <BotSelector
                            selectedBot={selectedBot}
                            onBotChange={(bot) => {
                                if (currentConversationId) {
                                    setCurrentConversationId(null)
                                    setMessages([])
                                }
                                setSelectedBot(bot)
                                if (bot) {
                                    const greeting = getRandomGreeting(bot.id)
                                    setMessages([{
                                        id: `greeting_${Date.now()}`,
                                        role: 'ASSISTANT',
                                        content: greeting,
                                        createdAt: new Date().toISOString()
                                    }])
                                } else {
                                    setMessages([])
                                }
                            }}
                            disabled={isLoading}
                        />

                        {/* Model Selector */}
                        <div className="relative" ref={modelDropdownRef}>
                            <button
                                onClick={() => setShowModelDetails(!showModelDetails)}
                                className="flex items-center gap-2 px-3 py-2
                                         bg-gray-100 dark:bg-gray-800 rounded-lg
                                         hover:bg-gray-200 dark:hover:bg-gray-700
                                         transition-colors duration-200 focus-ring"
                                style={{
                                    background: showModelDetails
                                        ? PROVIDER_STYLES[AVAILABLE_MODELS.find(m => m.id === selectedModel)?.provider || 'openai'].bgLight
                                        : undefined
                                }}>
                                <span className="text-sm font-medium">
                                    {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label}
                                </span>
                                <span style={{
                                    background: SPEED_STYLES[AVAILABLE_MODELS.find(m => m.id === selectedModel)?.speed || 'balanced'].bg,
                                    color: SPEED_STYLES[AVAILABLE_MODELS.find(m => m.id === selectedModel)?.speed || 'balanced'].color,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                }}>
                                    {SPEED_STYLES[AVAILABLE_MODELS.find(m => m.id === selectedModel)?.speed || 'balanced'].icon}
                                    {SPEED_STYLES[AVAILABLE_MODELS.find(m => m.id === selectedModel)?.speed || 'balanced'].label}
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${showModelDetails ? 'rotate-180' : ''}`}
                                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showModelDetails && (
                                <div className="absolute top-full mt-2 right-0 w-96
                                              bg-white dark:bg-gray-900 rounded-xl shadow-xl
                                              border border-gray-200 dark:border-gray-700
                                              overflow-hidden z-[100]">
                                    <div className="p-2 max-h-96 overflow-y-auto">
                                        {Object.entries(
                                            AVAILABLE_MODELS.reduce((acc, model) => {
                                                if (!acc[model.provider]) acc[model.provider] = []
                                                acc[model.provider].push(model)
                                                return acc
                                            }, {} as Record<string, typeof AVAILABLE_MODELS>)
                                        ).map(([provider, models]) => (
                                            <div key={provider}>
                                                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider
                                                              text-gray-500 dark:text-gray-400">
                                                    {provider}
                                                </div>
                                                {models.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            setSelectedModel(model.id)
                                                            setShowModelDetails(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-3 rounded-lg mb-1
                                                                  transition-all duration-200 group
                                                                  ${selectedModel === model.id
                                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>

                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {model.label}
                                                            </span>
                                                            <span style={{
                                                                background: SPEED_STYLES[model.speed].bg,
                                                                color: SPEED_STYLES[model.speed].color,
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {SPEED_STYLES[model.speed].icon} {SPEED_STYLES[model.speed].label}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-xs">
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                Context: {model.contextWindow}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {model.capabilities.map((cap, idx) => (
                                                                    <span key={idx}
                                                                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700
                                                                                   text-gray-600 dark:text-gray-300 rounded">
                                                                        {cap}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* System Prompt Toggle */}
                        <button
                            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                            className={`p-2 rounded-lg transition-colors duration-200
                                      ${showSystemPrompt
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            title="System Prompt">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Theme Selector */}
                        <ThemeSelector />
                    </div>
                </div>

                {/* System Prompt Bar */}
                {showSystemPrompt && (
                    <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/10
                                  border-b border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                System Prompt:
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập system prompt tùy chỉnh (ví dụ: You are a helpful assistant...)"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800
                                         border border-blue-300 dark:border-blue-700 rounded-lg
                                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!!selectedBot}
                            />
                            {selectedBot && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                    (Đang dùng prompt của {selectedBot.name})
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6
                              bg-gradient-to-b from-gray-50 to-white
                              dark:from-gray-900 dark:to-gray-950">

                    {messages.length === 0 && !currentConversationId && (
                        <div className="max-w-3xl mx-auto text-center py-12">
                            <div className="mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20
                                              bg-gradient-to-br from-blue-500 to-purple-600
                                              rounded-full shadow-lg mb-4">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Chào mừng đến với AI Assistant Hub
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Trò chuyện với nhiều mô hình AI khác nhau
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl
                                              border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl mb-2">💡</div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Đa dạng Models
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Lựa chọn từ GPT-4, Claude, Gemini và nhiều hơn
                                    </p>
                                </div>

                                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl
                                              border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl mb-2">🎭</div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Bot Personalities
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Trò chuyện với các nhân vật AI độc đáo
                                    </p>
                                </div>

                                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl
                                              border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl mb-2">⚡</div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Tốc độ & Chất lượng
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Tối ưu cho hiệu suất và độ chính xác
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                                <p>💡 Mẹo: Nhấn <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> để gửi tin nhắn nhanh</p>
                            </div>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={message.id}
                            className={`mb-6 flex ${
                                message.role === 'USER' ? 'justify-end' : 'justify-start'
                            } message-enter`}
                        >
                            <div className={`flex items-start gap-3 max-w-3xl ${
                                message.role === 'USER' ? 'flex-row-reverse' : ''
                            }`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                              ${message.role === 'USER'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                                    {message.role === 'ASSISTANT' ? (
                                        <span className="text-white text-lg">
                                            {selectedBot ? selectedBot.appearance.emoji : '🤖'}
                                        </span>
                                    ) : (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={`group relative ${message.role === 'USER' ? 'items-end' : ''}`}>
                                    {message.role === 'ASSISTANT' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {selectedBot ? selectedBot.name : 'Assistant'}
                                            </span>
                                            {message.model && (
                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                      style={{
                                                          background: PROVIDER_STYLES[AVAILABLE_MODELS.find(m => m.id === message.model)?.provider || 'openai'].bgLight,
                                                          color: PROVIDER_STYLES[AVAILABLE_MODELS.find(m => m.id === message.model)?.provider || 'openai'].color
                                                      }}>
                                                    {AVAILABLE_MODELS.find(m => m.id === message.model)?.label}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className={`px-4 py-3 rounded-2xl ${
                                        message.role === 'USER'
                                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                            : message.error
                                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                                    }`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {message.content}
                                            {message.isStreaming && (
                                                <span className="inline-block ml-1 w-1 h-4 bg-current animate-pulse"></span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span>{formatTime(message.createdAt)}</span>
                                        {message.error && (
                                            <button
                                                onClick={retryLastMessage}
                                                className="hover:text-blue-600 dark:hover:text-blue-400 underline">
                                                Thử lại
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start mb-6 message-enter">
                            <div className="flex items-start gap-3 max-w-3xl">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700
                                              flex items-center justify-center">
                                    <span className="text-white text-lg">
                                        {selectedBot ? selectedBot.appearance.emoji : '🤖'}
                                    </span>
                                </div>
                                <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl
                                              border border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20
                                  border border-red-200 dark:border-red-800 rounded-lg
                                  flex items-center justify-between">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="px-4 lg:px-6 py-4 bg-white dark:bg-gray-950
                              border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            <textarea
                                ref={inputRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault()
                                        sendMessage()
                                    }
                                }}
                                placeholder={isLoading ? 'AI đang trả lời...' : 'Nhập tin nhắn của bạn...'}
                                disabled={isLoading}
                                className="w-full px-4 py-3 pr-24 bg-gray-100 dark:bg-gray-800
                                         border border-gray-200 dark:border-gray-700 rounded-xl
                                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                rows={3}
                            />

                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                {inputMessage.length > 0 && (
                                    <span className="text-xs text-gray-400">
                                        {inputMessage.length}
                                    </span>
                                )}

                                {isLoading ? (
                                    <button
                                        onClick={stopStreaming}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700
                                                 text-white rounded-lg transition-colors duration-200
                                                 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                        </svg>
                                        <span>Dừng</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim()}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700
                                                 hover:from-blue-700 hover:to-blue-800
                                                 text-white rounded-lg transition-all duration-200
                                                 disabled:opacity-50 disabled:cursor-not-allowed
                                                 flex items-center gap-2 hover-scale">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span>Gửi</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> +
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> để gửi
                            </span>
                            {isLoading && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                                    AI đang suy nghĩ...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}