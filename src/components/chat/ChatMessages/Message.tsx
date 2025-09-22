// src/components/chat/ChatMessages/Message.tsx

import { Message as MessageType, BotPersonality } from '../shared/types'
import { AVAILABLE_MODELS, PROVIDER_STYLES } from '../shared/constants'
import { formatDate } from '../shared/utils'

interface MessageProps {
    message: MessageType
    selectedBot?: BotPersonality
}

export function Message({ message, selectedBot }: MessageProps) {
    const isUser = message.role === 'USER'

    return (
        <div className={`chat-message ${isUser ? 'user' : 'assistant'} 
                       flex gap-4 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 
                       transition-colors ${isUser ? 'bg-gray-50/30 dark:bg-gray-800/30' : ''}`}>
            {/* Avatar */}
            <div className="chat-message-avatar flex-shrink-0">
                {isUser ? (
                    <div className="user-avatar w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600
                                  flex items-center justify-center text-white font-semibold shadow-lg">
                        U
                    </div>
                ) : (
                    <div className="assistant-avatar relative">
                        {selectedBot ? (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl
                                          bg-gradient-to-br shadow-lg"
                                 style={{
                                     backgroundImage: `linear-gradient(135deg, ${selectedBot.appearance.primaryColor}, ${selectedBot.appearance.secondaryColor})`
                                 }}>
                                {selectedBot.appearance.emoji}
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center
                                          text-sm font-medium shadow-lg"
                                 style={{
                                     background: PROVIDER_STYLES[
                                     AVAILABLE_MODELS.find(m => m.id === message.model)?.provider || 'openai'
                                         ].bgLight,
                                     color: PROVIDER_STYLES[
                                     AVAILABLE_MODELS.find(m => m.id === message.model)?.provider || 'openai'
                                         ].color
                                 }}>
                                AI
                            </div>
                        )}

                        {message.isStreaming && (
                            <div className="streaming-indicator absolute -bottom-1 -right-1 w-3 h-3 bg-green-500
                                          rounded-full animate-pulse" />
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="chat-message-content flex-1 space-y-2">
                <div className="chat-message-header flex items-center gap-2">
                    <span className="chat-message-author font-medium text-gray-900 dark:text-gray-100">
                        {isUser ? 'You' : (selectedBot?.name || 'Assistant')}
                    </span>
                    <span className="chat-message-time text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                    </span>
                    {message.model && !isUser && (
                        <span className="chat-message-model text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                            {AVAILABLE_MODELS.find(m => m.id === message.model)?.name}
                        </span>
                    )}
                </div>

                <div className={`chat-message-text prose prose-sm max-w-none dark:prose-invert
                              ${message.error ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {message.content}
                    {message.isStreaming && <span className="typing-cursor inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />}
                </div>
            </div>
        </div>
    )
}