

import { ModelOption, BotPersonality } from '../shared/types'
import { AVAILABLE_MODELS } from '../shared/constants'
import { ModelSelector } from './ModelSelector'
import { SystemPromptBar } from './SystemPromptBar'
import { BotSelector } from '../BotSelector'
import { ThemeSelector } from '@/components/theme-selector'
import { Menu, Settings } from 'lucide-react'

interface ChatHeaderProps {
    selectedModel: string
    onModelChange: (modelId: string) => void
    systemPrompt: string
    onSystemPromptChange: (prompt: string) => void
    onToggleSidebar: () => void
    selectedBot?: BotPersonality
    onBotChange: (bot: BotPersonality | undefined) => void
    showSystemPrompt?: boolean
    onToggleSystemPrompt?: () => void
    disabled?: boolean
}

export function ChatHeader({
                               selectedModel,
                               onModelChange,
                               systemPrompt,
                               onSystemPromptChange,
                               onToggleSidebar,
                               selectedBot,
                               onBotChange,
                               showSystemPrompt = false,
                               onToggleSystemPrompt,
                               disabled = false
                           }: ChatHeaderProps) {
    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)

    return (
        <>
            {}
            <header className="chat-header h-14 bg-transparent border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="h-full px-3 lg:px-4 flex items-center justify-between gap-3">
                    {}
                    <div className="flex items-center gap-2 min-w-0">
                        {}
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                                     text-gray-600 dark:text-gray-400 transition-colors flex-shrink-0 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                            aria-label="Toggle sidebar">
                            <Menu className="w-5 h-5" />
                        </button>

                        {}
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="text-[15px] lg:text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100 hidden sm:block">
                                Trợ lý AI
                            </h1>
                            {selectedBot && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800
                                              text-gray-600 dark:text-gray-400 truncate max-w-[140px] border border-gray-200 dark:border-gray-700">
                                    {selectedBot.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                        {}
                        {onToggleSystemPrompt && (
                            <button
                                onClick={onToggleSystemPrompt}
                                disabled={disabled}
                                className={`p-2 rounded-lg transition-colors flex-shrink-0 border
                                         ${showSystemPrompt
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent'}
                                         ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="System Prompt">
                                <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>
                        )}

                        {}
                        <div className="bot-selector-wrapper">
                            <BotSelector
                                selectedBot={selectedBot}
                                onBotChange={onBotChange}
                                compact={true}
                                disabled={disabled}
                            />
                        </div>

                        {}
                        <div className="model-selector-wrapper hidden sm:block">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                                disabled={disabled}
                            />
                        </div>

                        {}
                        <div className="theme-selector-wrapper">
                            <ThemeSelector />
                        </div>
                    </div>
                </div>
            </header>

            {}
            {showSystemPrompt && (
                <SystemPromptBar
                    show={true}
                    systemPrompt={systemPrompt}
                    onSystemPromptChange={onSystemPromptChange}
                    disabled={disabled}
                    botName={selectedBot?.name}
                />
            )}

            {}
            <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2">
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    disabled={disabled}
                />
            </div>
        </>
    )
}