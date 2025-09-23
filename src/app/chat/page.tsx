

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


import { initializeTheme, injectChatThemeStyles, resetTheme } from '@/lib/theme/theme-system'
import '@/styles/animations.css'
import '@/styles/chat-theme.css'

export default function ChatPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)

    
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
    } = useChat()

    
    useEffect(() => {
        
        document.body.setAttribute('data-page', 'chat')

        
        initializeTheme()
        injectChatThemeStyles()

        
        return () => {
            document.body.removeAttribute('data-page')
            resetTheme() 
        }
    }, [])

    
    useEffect(() => {
        checkAuthentication()
    }, [])

    
    useEffect(() => {
        if (authenticated) {
            checkUsageQuota()
            const interval = setInterval(checkUsageQuota, 60000)
            return () => clearInterval(interval)
        }
    }, [authenticated])

    
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
        <div data-theme-scope="chat" className="chat-page-container">
            <div className="chat-container flex overflow-hidden">
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

                {isSidebarOpen && !isSidebarCollapsed && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <div className="flex-1 flex flex-col min-w-0">
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

                    <ChatMessages
                        messages={messages}
                        currentConversationId={currentConversationId}
                        selectedBot={selectedBot}
                        isTyping={isLoading}
                        messagesEndRef={messagesEndRef}
                    />

                    {userPlanTier === 'FREE' && userUsage.dailyMessages > 10 && (
                        <div className="usage-banner">
                            <div className="max-w-3xl mx-auto usage-banner__content">
                                <div className="usage-progress">
                                    <div className="usage-progress__bar">
                                        <div
                                            className="usage-progress__fill"
                                            style={{ width: `${Math.min(100, (userUsage.dailyMessages / userUsage.dailyLimit) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="usage-progress__label">
                                        {userUsage.dailyMessages}/{userUsage.dailyLimit} tin nhắn
                                    </span>
                                </div>
                                {userUsage.dailyMessages >= userUsage.dailyLimit - 3 && (
                                    <button
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="upgrade-badge"
                                    >
                                        Nâng cấp Plus ✨
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mx-auto max-w-3xl px-4 pb-4">
                            <div className="error-banner">
                                <p className="text-sm font-medium">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="icon-button"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <ChatInput
                        value={inputMessage}
                        onChange={setInputMessage}
                        onSend={sendMessage}
                        onStop={stopStreaming}
                        isLoading={isLoading}
                        disabled={userPlanTier === 'FREE' && userUsage.dailyMessages >= userUsage.dailyLimit}
                        attachments={pendingAttachments}
                        onUpload={uploadAttachments}
                        onRemoveAttachment={removeAttachment}
                        isUploading={isUploading}
                    />
                </div>

                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentUsage={userUsage}
                    userId={userId}
                />
            </div>
        </div>
    )
}