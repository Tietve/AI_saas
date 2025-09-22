import React from 'react'
import { Conversation } from '../shared/types'
import { ConversationItem } from './ConversationItem'
import { groupConversationsByDate } from '../shared/utils'

interface ConversationListProps {
    conversations: Conversation[]
    currentConversationId: string | null
    onSelect: (id: string) => void
    onDelete: (id: string) => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
                                                                      conversations,
                                                                      currentConversationId,
                                                                      onSelect,
                                                                      onDelete
                                                                  }) => {
    const conversationGroups = groupConversationsByDate(conversations)

    if (conversations.length === 0) {
        return (
            <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Chưa có hội thoại nào
                </p>
            </div>
        )
    }

    return (
        <div className="px-2 py-2">
            {Object.entries(conversationGroups).map(([date, convs]) => (
                <div key={date}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {date}
                    </div>
                    {convs.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={currentConversationId === conv.id}
                            onClick={() => onSelect(conv.id)}
                            onDelete={() => onDelete(conv.id)}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
