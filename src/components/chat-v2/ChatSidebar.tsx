import React, { useState } from 'react'
import { Plus, Search, ChevronLeft, MessageSquare, Trash2, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/sidebar.module.css'

interface Conversation {
    id: string
    title: string
    updatedAt: string
}

interface ChatSidebarProps {
    isOpen: boolean
    isCollapsed: boolean
    onToggleCollapse: () => void
    conversations: Conversation[]
    currentConversationId: string | null
    searchQuery?: string
    onSearchChange?: (query: string) => void
    onSelectConversation: (id: string) => void
    onCreateNew: () => void
    onDeleteConversation: (id: string) => void
    onSignOut?: () => void
}

export function ChatSidebar({
                                isOpen,
                                isCollapsed,
                                onToggleCollapse,
                                conversations,
                                currentConversationId,
                                searchQuery = '',
                                onSearchChange,
                                onSelectConversation,
                                onCreateNew,
                                onDeleteConversation,
                                onSignOut
                            }: ChatSidebarProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    const groupedConversations = groupConversationsByDate(conversations)

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isOpen ? styles.open : ''}`}>
            {/* Header */}
            <div className={styles.sidebarHeader}>
                <Button
                    variant="secondary"
                    fullWidth={!isCollapsed}
                    icon={<Plus size={18} />}
                    onClick={onCreateNew}
                >
                    {!isCollapsed && 'New chat'}
                </Button>

                {!isCollapsed && (
                    <button
                        className={styles.collapseButton}
                        onClick={onToggleCollapse}
                        title="Collapse sidebar"
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}
            </div>

            {/* Search */}
            {!isCollapsed && onSearchChange && (
                <div className={styles.searchContainer}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            )}

            {/* Conversations List */}
            <div className={styles.conversationsList}>
                {Object.entries(groupedConversations).map(([date, convs]) => (
                    <div key={date} className={styles.conversationGroup}>
                        {!isCollapsed && (
                            <div className={styles.groupHeader}>{date}</div>
                        )}
                        {convs.map(conv => (
                            <div
                                key={conv.id}
                                className={styles.conversationWrapper}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <button
                                    className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ''}`}
                                    onClick={() => onSelectConversation(conv.id)}
                                    title={conv.title}
                                >
                                    {isCollapsed ? (
                                        <MessageSquare size={18} />
                                    ) : (
                                        <>
                                            <span className={styles.conversationTitle}>{conv.title}</span>
                                            <span className={styles.conversationTime}>
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                                        </>
                                    )}
                                </button>
                                {!isCollapsed && hoveredId === conv.id && (
                                    <button
                                        className={styles.deleteButton}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteConversation(conv.id)
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            {!isCollapsed && (
                <div className={styles.sidebarFooter}>
                    <button className={styles.footerButton}>
                        <User size={18} />
                        <span>Profile</span>
                    </button>
                    {onSignOut && (
                        <button className={styles.footerButton} onClick={onSignOut}>
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    )}
                </div>
            )}
        </aside>
    )
}

// Helper functions
function groupConversationsByDate(conversations: Conversation[]) {
    const groups: Record<string, Conversation[]> = {}
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    conversations.forEach(conv => {
        const convDate = new Date(conv.updatedAt)
        let groupKey: string

        if (convDate >= today) {
            groupKey = 'Today'
        } else if (convDate >= yesterday) {
            groupKey = 'Yesterday'
        } else if (convDate >= lastWeek) {
            groupKey = 'Previous 7 days'
        } else {
            groupKey = convDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }

        if (!groups[groupKey]) {
            groups[groupKey] = []
        }
        groups[groupKey].push(conv)
    })

    return groups
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return 'now'
}