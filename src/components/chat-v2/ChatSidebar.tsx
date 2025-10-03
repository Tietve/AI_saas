import React, { useState } from 'react'
import { Plus, Search, ChevronLeft, MessageSquare, Trash2, User, LogOut, Pin, Edit2, MoreVertical, FolderPlus, Folder, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/sidebar.module.css'

interface Conversation {
    id: string
    title: string
    updatedAt: string
    pinned?: boolean
    projectId?: string
}

interface Project {
    id: string
    name: string
    color?: string
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
    onRenameConversation?: (id: string, newTitle: string) => void
    onTogglePin?: (id: string) => void
    onSignOut?: () => void
    projects?: Project[]
    onAddToProject?: (conversationId: string, projectId: string | null) => void
    onCreateProject?: () => void
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
                                onRenameConversation,
                                onTogglePin,
                                onSignOut,
                                projects = [],
                                onAddToProject,
                                onCreateProject
                            }: ChatSidebarProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
    const [showProjectSubmenu, setShowProjectSubmenu] = useState(false)
    const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
    const [projectsExpanded, setProjectsExpanded] = useState(true)

    const groupedConversations = groupConversationsByDate(conversations)

    const handleMenuOpen = (convId: string, event: React.MouseEvent) => {
        const button = event.currentTarget as HTMLElement
        const rect = button.getBoundingClientRect()
        setMenuPosition({
            top: rect.top,
            left: rect.left - 160 - 8 // menu width + gap
        })
        setMenuOpenId(convId)
    }

    return (
        <>
            {/* Overlay to close menu when clicking outside */}
            {menuOpenId && (
                <div
                    className={styles.menuOverlay}
                    onClick={() => {
                        setMenuOpenId(null)
                        setHoveredId(null)
                        setMenuPosition(null)
                        setShowProjectSubmenu(false)
                        setSubmenuPosition(null)
                    }}
                />
            )}

            {/* Context Menu - Fixed position outside sidebar */}
            {menuOpenId && menuPosition && (() => {
                const conv = conversations.find(c => c.id === menuOpenId)
                if (!conv) return null
                return (
                    <div
                        className={styles.contextMenuFixed}
                        style={{
                            top: menuPosition.top,
                            left: menuPosition.left
                        }}
                    >
                        {onTogglePin && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onTogglePin(conv.id)
                                    setMenuOpenId(null)
                                    setHoveredId(null)
                                    setMenuPosition(null)
                                    setShowProjectSubmenu(false)
                                    setSubmenuPosition(null)
                                }}
                                className={styles.menuItem}
                            >
                                <Pin size={14} />
                                {conv.pinned ? 'Unpin' : 'Pin'}
                            </button>
                        )}
                        {onRenameConversation && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingId(conv.id)
                                    setEditTitle(conv.title)
                                    setMenuOpenId(null)
                                    setHoveredId(null)
                                    setMenuPosition(null)
                                    setShowProjectSubmenu(false)
                                    setSubmenuPosition(null)
                                }}
                                className={styles.menuItem}
                            >
                                <Edit2 size={14} />
                                Rename
                            </button>
                        )}
                        {onAddToProject && projects.length > 0 && (
                            <div className={styles.submenuWrapper}>
                                <button
                                    ref={(el) => {
                                        if (el && showProjectSubmenu) {
                                            const rect = el.getBoundingClientRect()
                                            setSubmenuPosition({
                                                top: rect.top,
                                                left: rect.right + 8
                                            })
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowProjectSubmenu(!showProjectSubmenu)
                                    }}
                                    className={styles.menuItem}
                                >
                                    <FolderPlus size={14} />
                                    Add to project
                                </button>
                                {showProjectSubmenu && submenuPosition && (
                                    <div
                                        className={styles.submenu}
                                        style={{
                                            position: 'fixed',
                                            top: submenuPosition.top,
                                            left: submenuPosition.left
                                        }}
                                    >
                                        {conv.projectId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onAddToProject(conv.id, null)
                                                    setMenuOpenId(null)
                                                    setHoveredId(null)
                                                    setMenuPosition(null)
                                                    setShowProjectSubmenu(false)
                                                }}
                                                className={styles.menuItem}
                                            >
                                                Remove from project
                                            </button>
                                        )}
                                        {projects.map(project => (
                                            <button
                                                key={project.id}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onAddToProject(conv.id, project.id)
                                                    setMenuOpenId(null)
                                                    setHoveredId(null)
                                                    setMenuPosition(null)
                                                    setShowProjectSubmenu(false)
                                                }}
                                                className={`${styles.menuItem} ${conv.projectId === project.id ? styles.active : ''}`}
                                            >
                                                <div
                                                    className={styles.projectDot}
                                                    style={{ backgroundColor: project.color || '#3b82f6' }}
                                                />
                                                {project.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDeleteConversation(conv.id)
                                setMenuOpenId(null)
                                setHoveredId(null)
                                setMenuPosition(null)
                                setShowProjectSubmenu(false)
                                setSubmenuPosition(null)
                            }}
                            className={`${styles.menuItem} ${styles.danger}`}
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                )
            })()}

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

            {/* Projects Section */}
            {!isCollapsed && (
                <div className={styles.projectsSection}>
                    <div className={styles.projectsSectionHeader}>
                        <button
                            className={styles.projectsToggle}
                            onClick={() => setProjectsExpanded(!projectsExpanded)}
                        >
                            {projectsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <Folder size={16} />
                            <span>Projects</span>
                        </button>
                        {onCreateProject && (
                            <button
                                className={styles.newProjectButton}
                                onClick={onCreateProject}
                                title="New project"
                            >
                                <Plus size={14} />
                            </button>
                        )}
                    </div>

                    {projectsExpanded && (
                        <div className={styles.projectsList}>
                            {projects.length === 0 ? (
                                <div className={styles.emptyProjects}>
                                    <p>No projects yet</p>
                                    {onCreateProject && (
                                        <button onClick={onCreateProject} className={styles.createFirstProject}>
                                            Create your first project
                                        </button>
                                    )}
                                </div>
                            ) : (
                                projects.map(project => (
                                    <button
                                        key={project.id}
                                        className={styles.projectItem}
                                    >
                                        <div
                                            className={styles.projectDot}
                                            style={{ backgroundColor: project.color || '#3b82f6' }}
                                        />
                                        <span>{project.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
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
                                data-conv-id={conv.id}
                                className={styles.conversationWrapper}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => {
                                    // Don't clear hover if menu is open
                                    if (menuOpenId !== conv.id) {
                                        setHoveredId(null)
                                    }
                                }}
                            >
                                {editingId === conv.id ? (
                                    <div className={styles.editingWrapper}>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    onRenameConversation?.(conv.id, editTitle)
                                                    setEditingId(null)
                                                } else if (e.key === 'Escape') {
                                                    setEditingId(null)
                                                }
                                            }}
                                            onBlur={() => {
                                                if (editTitle.trim()) {
                                                    onRenameConversation?.(conv.id, editTitle)
                                                }
                                                setEditingId(null)
                                            }}
                                            autoFocus
                                            className={styles.editInput}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ''} ${conv.pinned ? styles.pinned : ''}`}
                                            onClick={() => onSelectConversation(conv.id)}
                                            title={conv.title}
                                        >
                                            {isCollapsed ? (
                                                <>
                                                    {conv.pinned && <Pin size={12} className={styles.pinnedIcon} />}
                                                    <MessageSquare size={18} />
                                                </>
                                            ) : (
                                                <>
                                                    {conv.pinned && <Pin size={14} className={styles.pinnedIcon} />}
                                                    <span className={styles.conversationTitle}>{conv.title}</span>
                                                    <span className={styles.conversationTime}>
                                                        {formatRelativeTime(conv.updatedAt)}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                        {!isCollapsed && (hoveredId === conv.id || menuOpenId === conv.id) && (
                                            <button
                                                className={styles.actionButton}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (menuOpenId === conv.id) {
                                                        setMenuOpenId(null)
                                                        setMenuPosition(null)
                                                    } else {
                                                        handleMenuOpen(conv.id, e)
                                                    }
                                                }}
                                                title="More actions"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        )}
                                    </>
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
        </>
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