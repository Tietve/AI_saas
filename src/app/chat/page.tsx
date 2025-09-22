// src/app/chat/page.tsx - VERSION MỚI RÚT GỌN VỚI THEME SUPPORT

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/chat/useChat'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { getBotById, getRandomGreeting } from '@/lib/bots/personality-templates'
import '@/styles/animations.css'

export default function ChatPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [showSystemPrompt, setShowSystemPrompt] = useState(false)

    const {
        // Conversations
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
    } = useChat()

    // Check authentication
    useEffect(() => {
        checkAuthentication()
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
            // You can add greeting to messages here
        }
    }

    if (loading) {
        return (
            <div className="loading-container min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
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
        <div className="chat-container flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <ChatSidebar
                isOpen={isSidebarOpen}
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

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="chat-mobile-overlay fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="chat-main-area flex-1 flex flex-col">
                <ChatHeader
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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

                {error && (
                    <div className="chat-error-message mx-6 mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20
                                  border border-red-200 dark:border-red-800 rounded-lg
                                  flex items-center justify-between">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="chat-error-close text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <ChatInput
                    value={inputMessage}
                    onChange={setInputMessage}
                    onSend={sendMessage}
                    onStop={stopStreaming}
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}