

import { Conversation } from './types'

export function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMins = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function groupConversationsByDate(conversations: Conversation[]) {
    const groups: { [key: string]: Conversation[] } = {}

    conversations.forEach(conv => {
        const date = new Date(conv.updatedAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let key = ''
        if (date.toDateString() === today.toDateString()) {
            key = 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday'
        } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            key = 'This Week'
        } else if (date > new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) {
            key = 'This Month'
        } else {
            key = 'Older'
        }

        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(conv)
    })

    return groups
}