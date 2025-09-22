// src/components/chat/ChatMessages/TypingIndicator.tsx

import { BotPersonality } from '../shared/types'

interface TypingIndicatorProps {
    selectedBot?: BotPersonality
    isVisible?: boolean
}

export function TypingIndicator({ selectedBot, isVisible = true }: TypingIndicatorProps) {
    if (!isVisible) return null

    return (
        <div className="flex items-center gap-2 px-6 py-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl
                          bg-gradient-to-br shadow-lg animate-pulse"
                 style={{
                     backgroundImage: selectedBot
                         ? `linear-gradient(135deg, ${selectedBot.appearance.primaryColor}, ${selectedBot.appearance.secondaryColor})`
                         : 'linear-gradient(135deg, #6B7280, #9CA3AF)'
                 }}>
                {selectedBot?.appearance.emoji || '🤖'}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {selectedBot?.typingIndicator?.text || 'AI is typing...'}
                </span>
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    )
}
