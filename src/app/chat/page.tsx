'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useChat } from '@/hooks/chat/useChat'
import { useProjects } from '@/hooks/chat/useProjects'
import { useToast } from '@/components/ui/toast'

export const dynamic = 'force-dynamic'

// Import components mới
import { ChatSidebar } from '@/components/chat-v2/ChatSidebar'
import { ChatHeader } from '@/components/chat-v2/ChatHeader'
import { ChatMessages } from '@/components/chat-v2/ChatMessages'
import { ChatInput } from '@/components/chat-v2/ChatInput'
import { WelcomeScreen } from '@/components/chat-v2/WelcomeScreen'
import { CreateProjectModal } from '@/components/chat-v2/CreateProjectModal'

// Giữ lại các imports cần thiết từ code cũ
import UpgradeModal from '@/components/UpgradeModal'
import { getBotById, getRandomGreeting } from '@/lib/bots/personality-templates'
import { initializeTheme, injectChatThemeStyles, resetTheme } from '@/lib/theme/theme-system'
import { ThemeManager } from '@/lib/theme/theme-manager'

// Import styles mới
import styles from '@/styles/pages/chat.module.css'

export default function ChatPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { showToast } = useToast()

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
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

    // Hook useChat - GIỮ NGUYÊN
    const {
        filteredConversations,
        currentConversationId,
        setCurrentConversationId,
        searchQuery,
        setSearchQuery,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        togglePin,
        messages,
        messagesEndRef,
        inputMessage,
        setInputMessage,
        sendMessage: originalSendMessage,
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
    } = useChat({
        userPlanTier,
        dailyUsage: {
            messages: userUsage.dailyMessages,
            limit: userUsage.dailyLimit
        },
        onUpgrade: () => setShowUpgradeModal(true)
    })

    // Projects hook
    const { projects, createProject, updateProject, deleteProject } = useProjects()

    // Filter conversations by selected project
    const conversationsFilteredByProject = selectedProjectId
        ? filteredConversations.filter(c => c.projectId === selectedProjectId)
        : filteredConversations

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

    // Load conversation from URL params
    useEffect(() => {
        const conversationId = searchParams.get('conversationId')
        
        console.log('[ChatPage] URL conversationId:', conversationId)
        
        if (conversationId && conversationId !== 'new') {
            // Has conversationId in URL -> load that conversation
            console.log('[ChatPage] Loading conversation:', conversationId)
            setCurrentConversationId(conversationId)
            // Save to localStorage for persistence
            localStorage.setItem('lastConversationId', conversationId)
        } else if (conversationId === 'new') {
            // Explicitly new chat
            console.log('[ChatPage] New chat requested')
            setCurrentConversationId(null)
            localStorage.removeItem('lastConversationId')
        } else if (conversationId === null) {
            // No conversationId in URL at all - check localStorage as fallback
            const savedId = localStorage.getItem('lastConversationId')
            console.log('[ChatPage] No URL conversationId, saved ID:', savedId)
            if (savedId) {
                // Restore from localStorage
                console.log('[ChatPage] Restoring conversation from localStorage:', savedId)
                router.replace(`/chat?conversationId=${savedId}`)
            } else {
                // New chat
                console.log('[ChatPage] No saved conversation, starting new chat')
                setCurrentConversationId(null)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

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

    async function handleRenameConversation(id: string, newTitle: string) {
        try {
            const res = await fetch(`/api/conversations/${id}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: newTitle })
            })
            if (!res.ok) throw new Error('Failed to rename')
            updateConversationTitle(id, newTitle)
        } catch (error) {
            console.error('[Rename] Error:', error)
            setError('Không thể đổi tên hội thoại')
        }
    }

    async function handleAddToProject(conversationId: string, projectId: string | null) {
        try {
            const res = await fetch(`/api/conversations/${conversationId}/project`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })
            if (!res.ok) throw new Error('Failed to add to project')
            showToast('success', projectId ? 'Added to project' : 'Removed from project')
            // Reload conversations để cập nhật projectId
            setTimeout(() => window.location.reload(), 500)
        } catch (error) {
            console.error('[Add to Project] Error:', error)
            showToast('error', 'Failed to update project')
        }
    }

    async function getConversationMessages(conversationId: string) {
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`, {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!res.ok) throw new Error('Failed to load messages')
            const data = await res.json()
            return data.messages || []
        } catch (error) {
            console.error('[Get Messages] Error:', error)
            return []
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
                conversations={conversationsFilteredByProject}
                currentConversationId={currentConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectConversation={(conversationId) => {
                    if (conversationId) {
                        router.push(`/chat?conversationId=${conversationId}`)
                    } else {
                        router.push('/chat')
                    }
                }}
                onCreateNew={async () => {
                    setSelectedBot(undefined)
                    setCurrentConversationId(null)
                    localStorage.removeItem('lastConversationId')
                    // Navigate to new chat (no conversationId)
                    router.push('/chat?conversationId=new')
                }}
                onDeleteConversation={deleteConversation}
                onRenameConversation={handleRenameConversation}
                onTogglePin={togglePin}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onAddToProject={handleAddToProject}
                onCreateProject={() => setShowCreateProjectModal(true)}
                onDeleteProject={deleteProject}
                onSignOut={handleSignOut}
                getConversationMessages={getConversationMessages}
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
                    // Upgrade props
                    userPlanTier={userPlanTier}
                    dailyUsage={{
                        messages: userUsage.dailyMessages,
                        limit: userUsage.dailyLimit
                    }}
                    // Export props
                    messages={messages}
                    currentConversation={currentConversationId ? {
                        id: currentConversationId,
                        title: filteredConversations.find(c => c.id === currentConversationId)?.title || 'Conversation'
                    } : undefined}
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
                            onRegenerate={regenerateLastMessage}
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
                                title="Nâng cấp Plus"
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

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                onCreate={async (name, description, color) => {
                    await createProject(name, description, color)
                    setShowCreateProjectModal(false)
                }}
            />
        </div>
    )
}