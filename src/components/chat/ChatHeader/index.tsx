import { BotPersonality } from '../shared/types'
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
    disabled = false,
}: ChatHeaderProps) {
    return (
        <>
            <header className="chat-header">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onToggleSidebar}
                            className="chat-icon-button"
                            aria-label="Toggle sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 min-w-0">
                            <h1 className="chat-header__title truncate">AI Chat</h1>
                            {selectedBot && (
                                <span className="chat-header__badge truncate" title={`Đang trò chuyện với ${selectedBot.name}`}>
                                    {selectedBot.appearance.emoji} {selectedBot.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="chat-toolbar">
                        {onToggleSystemPrompt && (
                            <button
                                onClick={onToggleSystemPrompt}
                                disabled={disabled}
                                className={`chat-icon-button ${showSystemPrompt ? 'is-active' : ''}`}
                                title="System Prompt"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        )}

                        <div className="bot-selector-wrapper">
                            <BotSelector
                                selectedBot={selectedBot}
                                onBotChange={onBotChange}
                                compact
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

            {showSystemPrompt && (
                <SystemPromptBar
                    show
                    systemPrompt={systemPrompt}
                    onSystemPromptChange={onSystemPromptChange}
                    disabled={disabled}
                    botName={selectedBot?.name}
                />
            )}

            <div className="sm:hidden px-4 py-3 border-b border-transparent/40">
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    disabled={disabled}
                />
            </div>
        </>
    )
}
