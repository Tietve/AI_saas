

import { Conversation } from '../shared/types'
import { AVAILABLE_MODELS } from '../shared/constants'
import { formatDate } from '../shared/utils'

interface ConversationItemProps {
    conversation: Conversation
    isActive: boolean
    onClick: () => void
    onDelete: (id: string) => void
}

export function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
    return (
        <div
            className={`conversation-item group flex items-center justify-between px-3 py-2.5 rounded-lg 
                      cursor-pointer transition-all duration-200
                      ${isActive
                ? 'active bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={onClick}>

            <div className="conversation-item-content flex-1 min-w-0">
                <h4 className={`conversation-item-title text-sm font-medium truncate
                            ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {conversation.title}
                </h4>

                <div className="conversation-item-meta flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="conversation-item-date">{formatDate(conversation.updatedAt)}</span>
                    {conversation.messageCount && (
                        <>
                            <span className="conversation-item-separator">•</span>
                            <span className="conversation-item-count">{conversation.messageCount} messages</span>
                        </>
                    )}
                    {conversation.model && (
                        <>
                            <span className="conversation-item-separator">•</span>
                            <span className="conversation-item-model truncate">
                                {AVAILABLE_MODELS.find(m => m.id === conversation.model)?.name || conversation.model}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conversation.id)
                }}
                className="conversation-item-delete opacity-0 group-hover:opacity-100 transition-opacity p-1
                         hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    )
}