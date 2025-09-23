import React from 'react'
import Link from 'next/link'
import { SearchBar } from './SearchBar'
import { ConversationList } from './ConversationList'
import { Conversation } from '../shared/types'
import { Menu, Plus, LogOut, MessageSquare, ChevronLeft, Sparkles } from 'lucide-react'

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
    onSignOut,
}) => {
    const sidebarClassName = [
        'chat-sidebar',
        isCollapsed ? 'chat-sidebar--collapsed' : '',
        isOpen ? 'open' : '',
    ]
        .filter(Boolean)
        .join(' ')

    const collapsedConversations = conversations.slice(0, 12)

    return (
        <aside className={sidebarClassName}>
            <div className="chat-sidebar__header space-y-3">
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className={`chat-icon-button ${isCollapsed ? '' : 'self-end'}`}
                        title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                    >
                        {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                )}

                <button
                    onClick={onCreateNew}
                    className={`chat-sidebar__button chat-sidebar__button--primary ${isCollapsed ? 'px-0 py-3' : ''}`}
                    title={isCollapsed ? 'Hội thoại mới' : ''}
                >
                    <Plus className="w-4 h-4" />
                    {!isCollapsed && <span>Hội thoại mới</span>}
                </button>

                {!isCollapsed && <SearchBar value={searchQuery} onChange={onSearchChange} />}
            </div>

            <div className="chat-sidebar__body">
                {isCollapsed ? (
                    <div className="conversation-collapsed-list">
                        {collapsedConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`conversation-collapsed-button ${
                                    currentConversationId === conv.id ? 'active' : ''
                                }`}
                                title={conv.title}
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>
                        ))}
                        {conversations.length > collapsedConversations.length && (
                            <div className="chat-sidebar__collapsed-hint">
                                +{conversations.length - collapsedConversations.length}
                            </div>
                        )}
                    </div>
                ) : (
                    <ConversationList
                        conversations={conversations}
                        currentConversationId={currentConversationId}
                        onSelect={onSelectConversation}
                        onDelete={onDeleteConversation}
                    />
                )}
            </div>

            <div className="chat-sidebar__footer space-y-2">
                <Link
                    href="/pricing"
                    className={`chat-sidebar__button chat-sidebar__pricing ${isCollapsed ? 'px-0 py-3' : ''}`}
                    title={isCollapsed ? 'Nâng cấp gói' : ''}
                >
                    <Sparkles className="w-4 h-4" />
                    {!isCollapsed && <span>Nâng cấp Plus</span>}
                </Link>

                <button
                    onClick={onSignOut}
                    className={`chat-sidebar__button chat-sidebar__button--ghost chat-sidebar__signout ${
                        isCollapsed ? 'px-0 py-3' : ''
                    }`}
                    title={isCollapsed ? 'Đăng xuất' : ''}
                >
                    <LogOut className="w-4 h-4" />
                    {!isCollapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    )
}
