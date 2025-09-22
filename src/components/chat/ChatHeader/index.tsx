// src/components/chat/ChatHeader/index.tsx

import { ModelOption, BotPersonality } from '../shared/types'
import { AVAILABLE_MODELS } from '../shared/constants'
import { ModelSelector } from './ModelSelector'
import { SystemPromptBar } from './SystemPromptBar'
import { BotSelector } from '../BotSelector'
import { ThemeSelector } from '@/components/theme-selector'

interface ChatHeaderProps {
    selectedModel: string
    onModelChange: (modelId: string) => void
    systemPrompt: string
    onSystemPromptChange: (prompt: string) => void
    isSidebarOpen: boolean
    onToggleSidebar: () => void
    selectedBot?: BotPersonality
    onBotChange: (bot: BotPersonality | undefined) => void
}

export function ChatHeader({
                               selectedModel,
                               onModelChange,
                               systemPrompt,
                               onSystemPromptChange,
                               isSidebarOpen,
                               onToggleSidebar,
                               selectedBot,
                               onBotChange
                           }: ChatHeaderProps) {
    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)

    return (
        <>
            {/* Main Header - thêm class "chat-header" */}
            <div className="chat-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                        {/* Sidebar Toggle Button */}
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                                     text-gray-600 dark:text-gray-400 transition-colors"
                            aria-label="Toggle sidebar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isSidebarOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* Title with Bot name */}
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                AI Chat
                            </h1>
                            {selectedBot && (
                                <span className="text-sm px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800
                                              text-gray-600 dark:text-gray-400">
                                    with {selectedBot.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Theme Selector */}
                        <ThemeSelector />

                        {/* Bot Selector */}
                        <BotSelector
                            selectedBot={selectedBot}
                            onBotChange={onBotChange}
                        />

                        {/* Model Selector */}
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={onModelChange}
                        />
                    </div>
                </div>
            </div>

            {/* System Prompt Bar */}
            <SystemPromptBar
                systemPrompt={systemPrompt}
                onSystemPromptChange={onSystemPromptChange}
                selectedBot={selectedBot}
            />
        </>
    )
}