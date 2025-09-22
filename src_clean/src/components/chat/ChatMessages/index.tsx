

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
                                                              messagesEndRef
                                                          }) => {
    const hasMessages = messages.length > 0

    return (
        <div className="chat-messages-area flex-1 overflow-y-auto">
            {}
            <div className="min-h-full bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-950">
                {}
                <div className="px-4 lg:px-6 py-6">
                    <div className="max-w-3xl mx-auto">
                        {!hasMessages && !currentConversationId ? (
                            <WelcomeScreen />
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <Message
                                        key={message.id || index}
                                        message={message}
                                        selectedBot={selectedBot}
                                        showAvatar={index === 0 || messages[index - 1]?.role !== message.role}
                                    />
                                ))}

                                {}
                                {isTyping && (
                                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex-shrink-0 w-8 h-8">
                                            {selectedBot ? (
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xl
                                                              bg-gradient-to-br shadow-sm animate-pulse"
                                                     style={{
                                                         backgroundImage: `linear-gradient(135deg, ${selectedBot.appearance.primaryColor}, ${selectedBot.appearance.secondaryColor})`
                                                     }}>
                                                    {selectedBot.appearance.emoji}
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600
                                                              flex items-center justify-center text-white text-xs font-medium shadow-sm animate-pulse">
                                                    AI
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-end">
                                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm">
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                                                          style={{ animationDelay: '0ms' }} />
                                                    <span className="inline-block w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                                                          style={{ animationDelay: '150ms' }} />
                                                    <span className="inline-block w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                                                          style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div ref={messagesEndRef} className="h-1" />
            </div>
        </div>
    )
}