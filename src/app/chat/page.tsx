// src/app/chat/page.tsx - WITH SCOPED THEME SYSTEM

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/chat/useChat'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { getBotById, getRandomGreeting } from '@/lib/bots/personality-templates'
import UpgradeModal from '@/components/UpgradeModal'

// THEME IMPORTS
import { initializeTheme, injectChatThemeStyles, resetTheme } from '@/lib/theme/theme-system'
import '@/styles/animations.css'

export default function ChatPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)

    // SIDEBAR STATE - Default collapsed on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    const [showSystemPrompt, setShowSystemPrompt] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [userUsage, setUserUsage] = useState({
        dailyMessages: 0,
        dailyLimit: 20
    })
    const [userId, setUserId] = useState<string | undefined>()
    const [userPlanTier, setUserPlanTier] = useState<string>('FREE')

    const {
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
        sendMessage: originalSendMessage,
        stopStreaming,
        selectedModel,
        setSelectedModel,
        selectedBot,
        setSelectedBot,
        systemPrompt,
        setSystemPrompt,
        isLoading,
        error,
        setError
    } = useChat()

    // THEME INITIALIZATION - Only for chat page
    useEffect(() => {
        // Mark body as chat page
        document.body.setAttribute('data-page', 'chat')

        // Initialize theme system for chat
        initializeTheme()
        injectChatThemeStyles()

        // Cleanup on unmount
        return () => {
            document.body.removeAttribute('data-page')
            resetTheme() // Reset theme when leaving chat
        }
    }, [])

    // Check authentication
    useEffect(() => {
        checkAuthentication()
    }, [])

    // Check usage quota định kỳ
    useEffect(() => {
        if (authenticated) {
            checkUsageQuota()
            const interval = setInterval(checkUsageQuota, 60000)
            return () => clearInterval(interval)
        }
    }, [authenticated])

    // Auto collapse sidebar on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarCollapsed(true)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    async function checkAuthentication() {
        try {
            const res = await fetch('/api/me', {
                credentials: 'include',
                cache: 'no-store'
            })
            const data = await res.json()
            if (data.authenticated) {
                setAuthenticated(true)
                setUserId(data.user?.id)
                setUserPlanTier(data.user?.planTier || 'FREE')
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

    async function checkUsageQuota() {
        try {
            const res = await fetch('/api/usage/check', {
                credentials: 'include'
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setUserUsage({
                        dailyMessages: data.data.usage.daily,
                        dailyLimit: data.data.usage.dailyLimit
                    })
                    setUserPlanTier(data.data.user.planTier)
                }
            }
        } catch (error) {
            console.error('[Usage Check] Error:', error)
        }
    }

    async function sendMessage() {
        if (userPlanTier === 'FREE' && userUsage.dailyMessages >= userUsage.dailyLimit) {
            setShowUpgradeModal(true)
            return
        }

        const result = await originalSendMessage()

        if (result) {
            setUserUsage(prev => ({
                ...prev,
                dailyMessages: prev.dailyMessages + 1
            }))
            checkUsageQuota()
        }

        return result
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

    function handleBotChange(bot: any) {
        if (currentConversationId) {
            setCurrentConversationId(null)
        }
        setSelectedBot(bot)
        if (bot) {
            const greeting = getRandomGreeting(bot.id)
        }
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

    return (
        <div data-theme-scope="chat" className="chat-page-container min-h-screen">
            <div className="chat-container flex h-screen overflow-hidden">
                {/* Sidebar với collapse state */}
                <ChatSidebar
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    conversations={filteredConversations}
                    currentConversationId={currentConversationId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onCreateNew={async () => {
                        setSelectedBot(undefined)
                        const newId = await createNewConversation()
                        if (newId) {
                            setCurrentConversationId(newId)
                        }
                    }}
                    onSelectConversation={setCurrentConversationId}
                    onDeleteConversation={deleteConversation}
                    onSignOut={handleSignOut}
                />

                {/* Mobile overlay */}
                {isSidebarOpen && !isSidebarCollapsed && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <ChatHeader
                        onToggleSidebar={() => {
                            if (window.innerWidth < 1024) {
                                setIsSidebarOpen(!isSidebarOpen)
                            } else {
                                setIsSidebarCollapsed(!isSidebarCollapsed)
                            }
                        }}
                        selectedBot={selectedBot}
                        onBotChange={handleBotChange}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        showSystemPrompt={showSystemPrompt}
                        onToggleSystemPrompt={() => setShowSystemPrompt(!showSystemPrompt)}
                        systemPrompt={systemPrompt}
                        onSystemPromptChange={setSystemPrompt}
                        disabled={isLoading}
                    />

                    {/* Messages Area */}
                    <ChatMessages
                        messages={messages}
                        currentConversationId={currentConversationId}
                        selectedBot={selectedBot}
                        isTyping={isLoading}
                        messagesEndRef={messagesEndRef}
                    />

                    {/* Usage Indicator */}
                    {userPlanTier === 'FREE' && userUsage.dailyMessages > 10 && (
                        <div className="px-4 py-2 border-t usage-indicator">
                            <div className="max-w-3xl mx-auto flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-32 h-1.5 rounded-full overflow-hidden usage-bar">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 usage-bar-fill"
                                            style={{ width: `${Math.min(100, (userUsage.dailyMessages / userUsage.dailyLimit) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs usage-text">
                                        {userUsage.dailyMessages}/{userUsage.dailyLimit} tin nhắn
                                    </span>
                                </div>
                                {userUsage.dailyMessages >= userUsage.dailyLimit - 3 && (
                                    <button
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="text-xs px-3 py-1 rounded-full transition-all upgrade-button"
                                    >
                                        Nâng cấp Plus ✨
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mx-auto max-w-3xl px-4 pb-4">
                            <div className="rounded-lg px-4 py-3 flex items-center justify-between error-message">
                                <p className="text-sm">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="hover:opacity-70">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <ChatInput
                        value={inputMessage}
                        onChange={setInputMessage}
                        onSend={sendMessage}
                        onStop={stopStreaming}
                        isLoading={isLoading}
                        disabled={userPlanTier === 'FREE' && userUsage.dailyMessages >= userUsage.dailyLimit}
                    />
                </div>

                {/* Upgrade Modal */}
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentUsage={userUsage}
                    userId={userId}
                />
            </div>

            <style jsx>{`
                .chat-page-container {
                    background: var(--color-background, #ffffff);
                    color: var(--color-text, #111827);
                }
                
                .usage-indicator {
                    background: linear-gradient(to right, 
                        rgba(147, 51, 234, 0.05), 
                        rgba(59, 130, 246, 0.05));
                    border-color: var(--color-border, #e5e7eb);
                }
                
                .usage-bar {
                    background: var(--color-background-secondary, #f3f4f6);
                }
                
                .usage-bar-fill {
                    background: linear-gradient(to right, #8b5cf6, #3b82f6);
                }
                
                .usage-text {
                    color: var(--color-text-secondary, #6b7280);
                }
                
                .upgrade-button {
                    background: linear-gradient(to right, #9333ea, #3b82f6);
                    color: white;
                }
                
                .upgrade-button:hover {
                    background: linear-gradient(to right, #7c3aed, #2563eb);
                }
                
                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: var(--color-error, #ef4444);
                }
                
                /* Dark theme adjustments */
                [data-theme*="dark"] .usage-indicator,
                [data-theme*="noble"] .usage-indicator,
                [data-theme*="cyber"] .usage-indicator,
                [data-theme*="ocean"] .usage-indicator {
                    background: linear-gradient(to right,
                        rgba(147, 51, 234, 0.1),
                        rgba(59, 130, 246, 0.1));
                }
                
                [data-theme*="dark"] .error-message,
                [data-theme*="noble"] .error-message,
                [data-theme*="cyber"] .error-message,
                [data-theme*="ocean"] .error-message {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.5);
                }
            `}</style>
        </div>
    )
}