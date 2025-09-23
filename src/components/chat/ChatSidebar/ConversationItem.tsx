import { Conversation } from '../shared/types'
import { AVAILABLE_MODELS } from '../shared/constants'
import { formatDate } from '../shared/utils'

interface ConversationItemProps {
    conversation: Conversation
    isActive: boolean
    onClick: () => void
    onDelete: () => void
}

export function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
    const modelName = conversation.model
        ? AVAILABLE_MODELS.find(m => m.id === conversation.model)?.name || conversation.model
        : undefined

    return (
        <div className={`conversation-item ${isActive ? 'active' : ''}`} onClick={onClick}>
            <div className="flex-1 min-w-0">
                <h4 className="conversation-item-title truncate" title={conversation.title}>
                    {conversation.title}
                </h4>
                <div className="conversation-item-meta">
                    <span>{formatDate(conversation.updatedAt)}</span>
                    {conversation.messageCount ? <span>{conversation.messageCount} tin nhắn</span> : null}
                    {modelName ? <span className="truncate">{modelName}</span> : null}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="conversation-item-delete"
                aria-label="Xoá hội thoại"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
            </button>
        </div>
    )
}
