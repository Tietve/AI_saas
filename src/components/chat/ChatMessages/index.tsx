import React from 'react'
import { Message } from './Message'
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
    messagesEndRef,
}) => {
    const hasMessages = messages.length > 0

    return (
        <div className="chat-messages-area">
            <div className="max-w-3xl mx-auto space-y-4">
                {!hasMessages && !currentConversationId ? (
                    <WelcomeScreen />
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Message
                                key={message.id || index}
                                message={message}
                                selectedBot={selectedBot}
                                showAvatar={index === 0 || messages[index - 1]?.role !== message.role}
                            />
                        ))}

                        {isTyping && (
                            <div className="message-wrapper animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="message-avatar message-avatar--bot">
                                    {selectedBot ? selectedBot.appearance.emoji : 'AI'}
                                </div>
                                <div className="typing-bubble">
                                    <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                                    <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                                    <span className="typing-dot" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div ref={messagesEndRef} className="h-4" />
        </div>
    )
}
