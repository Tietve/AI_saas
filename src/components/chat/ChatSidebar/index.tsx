

import React from 'react'
import Link from 'next/link'
import { SearchBar } from './SearchBar'
import { ConversationList } from './ConversationList'
import { Conversation } from '../shared/types'
import { Menu, Plus, LogOut, MessageSquare, ChevronLeft, CreditCard, Sparkles } from 'lucide-react'

interface ChatSidebarProps {
    isOpen: boolean
    isCollapsed?: boolean
    onToggleCollapse?: () => void
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
                                                            isCollapsed = false,
                                                            onToggleCollapse,
                                                            conversations,
                                                            currentConversationId,
                                                            searchQuery,
                                                            onSearchChange,
                                                            onCreateNew,
                                                            onSelectConversation,
                                                            onDeleteConversation,
                                                            onSignOut
                                                        }) => {
    
    const sidebarWidth = isCollapsed ? 'w-[64px]' : 'w-[260px]'

    return (
        <>
            {}
            <aside className={`
                ${sidebarWidth}
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed lg:relative h-full z-30
                transition-all duration-300 ease-in-out
                chat-sidebar bg-transparent
                border-r border-gray-200/60 dark:border-gray-800/60
                flex flex-col
            `}>
                {}
                <div className="chat-sidebar-header flex-shrink-0 p-3 border-b border-gray-200/60 dark:border-gray-800/60">
                    {}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="hidden lg:flex items-center justify-center w-full mb-3 p-2 rounded-lg
                                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        >
                            {isCollapsed ? (
                                <Menu className="w-5 h-5" />
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <Menu className="w-5 h-5" />
                                    <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </button>
                    )}

                    {}
                    <button
                        onClick={onCreateNew}
                        className={`
                            w-full inline-flex items-center justify-center
                            rounded-lg transition-colors border
                            bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800
                            border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100
                            ${isCollapsed ? 'p-2.5' : 'py-2.5 px-3 gap-2'}
                        `}
                        title={isCollapsed ? 'Hội thoại mới' : ''}
                    >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">Hội thoại mới</span>}
                    </button>

                    {/* Search Bar - Hide when collapsed */}
                    {!isCollapsed && (
                        <div className="mt-3">
                            <SearchBar value={searchQuery} onChange={onSearchChange} />
                        </div>
                    )}
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto py-2">
                    {isCollapsed ? (
                        // Collapsed view - Show dots for conversations
                        <div className="px-3 space-y-2">
                            {conversations.slice(0, 10).map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv.id)}
                                    className={`
                                        w-full p-2 rounded-lg transition-colors
                                        flex items-center justify-center group relative
                                        ${currentConversationId === conv.id
                                        ? 'bg-blue-50/70 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                                    `}
                                    title={conv.title}
                                >
                                    <div className="relative">
                                        <MessageSquare className={`w-4 h-4 ${
                                            currentConversationId === conv.id
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                        }`} />
                                        {currentConversationId === conv.id && (
                                            <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500/80 rounded" />
                                        )}
                                    </div>
                                </button>
                            ))}

                            {conversations.length > 10 && (
                                <div className="text-center py-1">
                                    <span className="text-xs text-gray-400">+{conversations.length - 10}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Full view
                        <ConversationList
                            conversations={conversations}
                            currentConversationId={currentConversationId}
                            onSelect={onSelectConversation}
                            onDelete={onDeleteConversation}
                        />
                    )}
                </div>

                {/* Footer with Pricing and Sign Out */}
                <div className="chat-sidebar-footer flex-shrink-0 p-3 border-t border-gray-200/60 dark:border-gray-800/60 space-y-2">
                    {/* Pricing Button */}
                    <Link
                        href="/pricing"
                        className={`
                            w-full inline-flex items-center justify-center
                            rounded-lg transition-colors border
                            bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800
                            border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100
                            ${isCollapsed ? 'p-2.5' : 'py-2.5 px-3 gap-2'}
                        `}
                        title={isCollapsed ? 'Nâng cấp' : ''}
                    >
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">Nâng cấp</span>}
                    </Link>

                    {/* Sign Out Button */}
                    <button
                        onClick={onSignOut}
                        className={`
                            w-full inline-flex items-center justify-center
                            text-gray-700 dark:text-gray-300
                            hover:bg-gray-100 dark:hover:bg-gray-800
                            rounded-lg transition-colors
                            ${isCollapsed ? 'p-2.5' : 'py-2.5 px-3 gap-2'}
                        `}
                        title={isCollapsed ? 'Đăng xuất' : ''}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Spacer only when sidebar is fixed (mobile). On desktop it's relative so no spacer. */}
            <div className={`block lg:hidden flex-shrink-0 transition-all duration-300 ${sidebarWidth}`} aria-hidden="true" />
        </>
    )
}