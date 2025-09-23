

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
            <header className="chat-header h-16">
                <div className="h-full px-3 lg:px-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={onToggleSidebar}
                            className="icon-button flex-shrink-0"
                            aria-label="Toggle sidebar">
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="chat-title text-base lg:text-lg font-semibold hidden sm:block">
                                AI Chat
                            </h1>
                            {selectedBot && (
                                <span className="text-xs px-2 py-0.5 rounded-full truncate max-w-[120px]"
                                      style={{
                                          background: 'var(--chat-surface-soft)',
                                          color: 'var(--chat-muted)'
                                      }}>
                                    với {selectedBot.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                        {onToggleSystemPrompt && (
                            <button
                                onClick={onToggleSystemPrompt}
                                disabled={disabled}
                                className={`icon-button flex-shrink-0 ${showSystemPrompt ? 'is-active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="System Prompt">
                                <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>
                        )}

                        <div className="bot-selector-wrapper hidden sm:block">
                            <BotSelector
                                selectedBot={selectedBot}
                                onBotChange={onBotChange}
                                compact={true}
                                disabled={disabled}
                            />
                        </div>

                        <div className="model-selector-wrapper hidden sm:block">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                                disabled={disabled}
                            />
                        </div>

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