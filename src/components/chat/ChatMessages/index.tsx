// src/components/chat/ChatMessages/index.tsx

import React from 'react'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeScreen } from './WelcomeScreen'
import { Message as MessageType, BotPersonality } from '../shared/types'

interface ChatMessagesProps {
    messages: MessageType[]
    currentConversationId: string | null
    selectedBot?: BotPersonality
    isTyping: boolean
    messagesEndRef: React.RefObject<HTMLDivElement>
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
                                                              messages,
                                                              currentConversationId,
                                                              selectedBot,
                                                              isTyping,
                                                              messagesEndRef
                                                          }) => {
    const hasMessages = messages.length > 0

    return (
        <div className="chat-messages-area flex-1 overflow-y-auto px-4 lg:px-6 py-6
                      bg-gradient-to-b from-gray-50 to-white
                      dark:from-gray-900 dark:to-gray-950">

            {!hasMessages && !currentConversationId && (
                <WelcomeScreen />
            )}

            <div className="chat-messages-container max-w-4xl mx-auto space-y-4">
                {messages.map((message, index) => (
                    <Message
                        key={message.id || index}
                        message={message}
                        selectedBot={selectedBot}
                    />
                ))}

                {isTyping && (
                    <TypingIndicator selectedBot={selectedBot} />
                )}
            </div>

            <div ref={messagesEndRef} className="h-4" />
        </div>
    )
}