// src/components/chat/ChatSidebar/index.tsx

import React from 'react'
import { SearchBar } from './SearchBar'
import { ConversationList } from './ConversationList'
import { Conversation } from '../shared/types'

interface ChatSidebarProps {
    isOpen: boolean
    conversations: Conversation[]
    currentConversationId: string | null
    searchQuery: string
    onSearchChange: (query: string) => void
    onCreateNew: () => void
    onSelectConversation: (id: string) => void
    onDeleteConversation: (id: string) => void
    onSignOut: () => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
                                                            isOpen,
                                                            conversations,
                                                            currentConversationId,
                                                            searchQuery,
                                                            onSearchChange,
                                                            onCreateNew,
                                                            onSelectConversation,
                                                            onDeleteConversation,
                                                            onSignOut
                                                        }) => {
    return (
        <div className={`chat-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
            fixed lg:relative w-[var(--sidebar-width)] h-full z-30
            transition-transform duration-300 ease-in-out
            bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
            flex flex-col`}>

            {/* Header */}
            <div className="chat-sidebar-header p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={onCreateNew}
                    className="chat-new-button w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700
                             text-white rounded-lg hover:from-blue-700 hover:to-blue-800
                             transition-all duration-200 flex items-center justify-center gap-2
                             font-medium shadow-md hover:shadow-lg hover-scale">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Hội thoại mới</span>
                </button>

                <SearchBar value={searchQuery} onChange={onSearchChange} />
            </div>

            {/* Conversations List */}
            <div className="chat-sidebar-conversations flex-1 overflow-y-auto">
                <ConversationList
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                />
            </div>

            {/* Footer */}
            <div className="chat-sidebar-footer p-4 border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={onSignOut}
                    className="chat-signout-button w-full py-2 px-4 text-gray-700 dark:text-gray-300
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
    )
}