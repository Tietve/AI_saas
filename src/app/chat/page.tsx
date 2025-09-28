'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/chat/useChat'

// Import components mới
import { ChatSidebar } from '@/components/chat-v2/ChatSidebar'
import { ChatHeader } from '@/components/chat-v2/ChatHeader'
import { ChatMessages } from '@/components/chat-v2/ChatMessages'
import { ChatInput } from '@/components/chat-v2/ChatInput'
import { WelcomeScreen } from '@/components/chat-v2/WelcomeScreen'

// Giữ lại các imports cần thiết từ code cũ
import UpgradeModal from '@/components/UpgradeModal'
import { getBotById, getRandomGreeting } from '@/lib/bots/personality-templates'
import { initializeTheme, injectChatThemeStyles, resetTheme } from '@/lib/theme/theme-system'
import { ThemeManager } from '@/lib/theme/theme-manager'

// Import styles mới
import styles from '@/styles/pages/chat.module.css'

export default function ChatPage() {
    const router = useRouter()

    // States từ code cũ - GIỮ NGUYÊN
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showSystemPrompt, setShowSystemPrompt] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [userUsage, setUserUsage] = useState({
        dailyMessages: 0,
        dailyLimit: 20
    })
    const [userId, setUserId] = useState<string | undefined>()
    const [userPlanTier, setUserPlanTier] = useState<string>('FREE')
    const [currentTheme, setCurrentTheme] = useState('claude')

    // Hook useChat - GIỮ NGUYÊN
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
    } = useChat({
        userPlanTier,
        dailyUsage: {
            messages: userUsage.dailyMessages,
            limit: userUsage.dailyLimit
        },
        onUpgrade: () => setShowUpgradeModal(true)
    })

    // Theme initialization - GIỮ NGUYÊN
    useEffect(() => {
        document.body.setAttribute('data-page', 'chat')
        initializeTheme()
        injectChatThemeStyles()

        return () => {
            document.body.removeAttribute('data-page')
            resetTheme()
        }
    }, [])

    // Load saved theme
    useEffect(() => {
        ThemeManager.loadSavedTheme()
        setCurrentTheme(ThemeManager.getCurrentTheme())
    }, [])

    // Authentication - GIỮ NGUYÊN
    useEffect(() => {
        checkAuthentication()
    }, [])

    // Usage quota check - GIỮ NGUYÊN
    useEffect(() => {
        if (authenticated) {
            checkUsageQuota()
            const interval = setInterval(checkUsageQuota, 60000)
            return () => clearInterval(interval)
        }
    }, [authenticated])

    // Responsive sidebar - GIỮ NGUYÊN
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarCollapsed(true)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Functions từ code cũ - GIỮ NGUYÊN
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
        // Chỉ hiển thị modal khi đạt chính xác giới hạn (20 tin nhắn)
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

    // Loading screen - STYLE MỚI
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Đang tải...</p>
            </div>
        )
    }

    // GIAO DIỆN MỚI - Giống Claude
    return (
        <div className={styles.chatContainer}>
            {/* Sidebar */}
            <ChatSidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                conversations={filteredConversations}
                currentConversationId={currentConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectConversation={setCurrentConversationId}
                onCreateNew={async () => {
                    setSelectedBot(undefined)
                    const newId = await createNewConversation()
                    if (newId) {
                        setCurrentConversationId(newId)
                    }
                }}
                onDeleteConversation={deleteConversation}
                onSignOut={handleSignOut}
            />

            {/* Mobile Overlay */}
            {sidebarOpen && !sidebarCollapsed && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <main className={styles.chatMain}>
                {/* Header */}
                <ChatHeader
                    onToggleSidebar={() => {
                        if (window.innerWidth < 1024) {
                            setSidebarOpen(!sidebarOpen)
                        } else {
                            setSidebarCollapsed(!sidebarCollapsed)
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
                    currentTheme={currentTheme}
                    onThemeChange={(themeId) => {
                        setCurrentTheme(themeId)
                    }}
                    // Upgrade props
                    userPlanTier={userPlanTier}
                    dailyUsage={{
                        messages: userUsage.dailyMessages,
                        limit: userUsage.dailyLimit
                    }}
                    // Không cần onUpgrade vì nút Crown link trực tiếp đến /pricing
                />

                {/* Messages or Welcome Screen */}
                <div className={styles.chatContent}>
                    {messages.length === 0 && !currentConversationId ? (
                        <WelcomeScreen
                            onSuggestionClick={(text) => {
                                setInputMessage(text)
                            }}
                        />
                    ) : (
                        <ChatMessages
                            messages={messages}
                            isLoading={isLoading}
                            messagesEndRef={messagesEndRef}
                            selectedBot={selectedBot}
                        />
                    )}
                </div>

                {/* Usage Indicator for Free Users */}
                {userPlanTier === 'FREE' && userUsage.dailyMessages > 10 && (
                    <div className={styles.usageIndicator}>
                        <div className={styles.usageBar}>
                            <div
                                className={styles.usageBarFill}
                                style={{
                                    width: `${Math.min(100, (userUsage.dailyMessages / userUsage.dailyLimit) * 100)}%`
                                }}
                            />
                        </div>
                        <span className={styles.usageText}>
                            {userUsage.dailyMessages}/{userUsage.dailyLimit} tin nhắn
                        </span>
                        {userUsage.dailyMessages >= userUsage.dailyLimit - 3 && (
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className={styles.upgradeButton}
                            >
                                Nâng cấp Plus ✨
                            </button>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className={styles.errorContainer}>
                        <div className={styles.errorMessage}>
                            <p>{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className={styles.errorClose}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Input */}
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
                    placeholder={messages.length === 0 ? "Message Claude..." : "Reply..."}
                />
            </main>

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentUsage={userUsage}
                userId={userId}
            />
        </div>
    )
}