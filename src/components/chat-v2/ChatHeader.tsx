import React, { useState, useRef, useEffect } from 'react'
import { Menu, Settings, Share, MoreVertical, Bot, Sparkles, ChevronDown, Code, X, Paintbrush, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getBotsList } from '@/lib/bots/personality-templates'
import { THEMES, ThemeManager } from '@/lib/theme/theme-manager'
import { ExportMenu } from './ExportMenu'
import { ActionsMenu } from './ActionsMenu'
import type { Message } from '@/components/chat/shared/types'
import styles from '@/styles/components/chat/header.module.css'

interface ChatHeaderProps {
    onToggleSidebar: () => void
    selectedBot?: any
    onBotChange?: (bot: any) => void
    selectedModel: string
    onModelChange: (model: string) => void
    showSystemPrompt?: boolean
    onToggleSystemPrompt?: () => void
    systemPrompt?: string
    onSystemPromptChange?: (prompt: string) => void
    disabled?: boolean
    currentConversation?: {
        id: string
        title: string
    }
    // Upgrade related props
    userPlanTier?: string
    dailyUsage?: {
        messages: number
        limit: number
    }
    // Export related props
    messages?: Message[]
}

const AI_MODELS = [
    {
        value: 'gpt_4o_mini',
        name: 'GPT-4o Mini',
        badge: 'Fast',
        color: '#10B981',
        description: 'Fastest responses, good for simple tasks',
        pricing: '$0.15/1M',
        speed: 5,
        quality: 3,
        icon: '⚡',
        bestFor: 'Quick questions, simple tasks, rapid prototyping'
    },
    {
        value: 'gpt_4o',
        name: 'GPT-4o',
        badge: 'Smart',
        color: '#3B82F6',
        description: 'Most capable, best for complex reasoning',
        pricing: '$5.00/1M',
        speed: 3,
        quality: 5,
        icon: '🧠',
        bestFor: 'Complex reasoning, coding, data analysis'
    },
    {
        value: 'claude_3_5_sonnet',
        name: 'Claude 3.5',
        badge: 'Creative',
        color: '#8B5CF6',
        description: 'Great for writing and creativity',
        pricing: '$3.00/1M',
        speed: 4,
        quality: 5,
        icon: '✨',
        bestFor: 'Writing, creativity, long-form content'
    },
    {
        value: 'gemini_1_5_pro',
        name: 'Gemini 1.5 Pro',
        badge: 'Long Context',
        color: '#F59E0B',
        description: 'Handles very long conversations',
        pricing: '$1.25/1M',
        speed: 4,
        quality: 4,
        icon: '📚',
        bestFor: 'Long documents, extensive context, research'
    },
    {
        value: 'llama_3_1_8b',
        name: 'Llama 3.1',
        badge: 'Open Source',
        color: '#EC4899',
        description: 'Free and open-source model',
        pricing: 'Free',
        speed: 4,
        quality: 3,
        icon: '🦙',
        bestFor: 'Cost-effective usage, experimentation'
    }
]

export function ChatHeader(props: ChatHeaderProps) {
    const router = useRouter()
    const [showBotMenu, setShowBotMenu] = useState(false)
    const [showModelMenu, setShowModelMenu] = useState(false)
    const [showThemeMenu, setShowThemeMenu] = useState(false)
    const [currentTheme, setCurrentTheme] = useState('claude')
    const botMenuRef = useRef<HTMLDivElement>(null)
    const modelMenuRef = useRef<HTMLDivElement>(null)
    const themeMenuRef = useRef<HTMLDivElement>(null)

    const bots = getBotsList()
    const selectedBotData = props.selectedBot
    const selectedModelData = AI_MODELS.find(m => m.value === props.selectedModel)

    // Load saved theme on component mount
    useEffect(() => {
        ThemeManager.loadSavedTheme()
        setCurrentTheme(ThemeManager.getCurrentTheme())
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (botMenuRef.current && !botMenuRef.current.contains(event.target as Node)) {
                setShowBotMenu(false)
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
                setShowModelMenu(false)
            }
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setShowThemeMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleThemeChange = (themeId: string) => {
        ThemeManager.setTheme(themeId)
        setCurrentTheme(themeId)
        setShowThemeMenu(false)
    }

    return (
        <>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Button
                        variant="ghost"
                        icon={<Menu size={20} />}
                        onClick={props.onToggleSidebar}
                        className={styles.menuButton}
                    />

                    <div className={styles.headerCenter}>
                        {/* Bot Selector */}
                        {props.onBotChange && (
                            <div className={styles.selectorGroup} ref={botMenuRef}>
                                <button
                                    className={`${styles.selector} ${styles.botSelector}`}
                                    onClick={() => {
                                        setShowBotMenu(!showBotMenu)
                                        setShowModelMenu(false)
                                    }}
                                    disabled={props.disabled}
                                >
                                    <Bot size={16} className={styles.selectorIcon} />
                                    <span className={styles.selectorLabel}>
                    {selectedBotData ? selectedBotData.name : 'Assistant'}
                  </span>
                                    <ChevronDown size={14} className={`${styles.chevron} ${showBotMenu ? styles.rotate : ''}`} />
                                </button>

                                {showBotMenu && (
                                    <div className={styles.dropdownMenu}>
                                        <div className={styles.dropdownHeader}>
                                            Choose Assistant Personality
                                        </div>
                                        <div className={styles.dropdownContent}>
                                            {bots.map(bot => (
                                                <button
                                                    key={bot.id}
                                                    className={`${styles.dropdownItem} ${selectedBotData?.id === bot.id ? styles.active : ''}`}
                                                    onClick={() => {
                                                        props.onBotChange!(bot)
                                                        setShowBotMenu(false)
                                                    }}
                                                >
                                                    <div className={styles.itemContent}>
                                                        <div className={styles.itemHeader}>
                                                            <span className={styles.itemName}>{bot.name}</span>
                                                            {selectedBotData?.id === bot.id && (
                                                                <span className={styles.checkmark}>✓</span>
                                                            )}
                                                        </div>
                                                        <span className={styles.itemDescription}>{bot.description}</span>
                                                        <div className={styles.itemTags}>
                                                            {bot.tags.map(tag => (
                                                                <span key={tag} className={styles.tag}>{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Model Selector */}
                        <div className={styles.selectorGroup} ref={modelMenuRef}>
                            <button
                                className={`${styles.selector} ${styles.modelSelector}`}
                                onClick={() => {
                                    setShowModelMenu(!showModelMenu)
                                    setShowBotMenu(false)
                                }}
                                disabled={props.disabled}
                            >
                                <Sparkles size={16} className={styles.selectorIcon} />
                                <span className={styles.selectorLabel}>
                  {selectedModelData ? selectedModelData.name : 'Select Model'}
                </span>
                                {selectedModelData && (
                                    <span
                                        className={styles.modelBadge}
                                        style={{ backgroundColor: selectedModelData.color }}
                                    >
                    {selectedModelData.badge}
                  </span>
                                )}
                                <ChevronDown size={14} className={`${styles.chevron} ${showModelMenu ? styles.rotate : ''}`} />
                            </button>

                            {showModelMenu && (
                                <div className={styles.dropdownMenu}>
                                    <div className={styles.dropdownHeader}>
                                        Choose AI Model
                                    </div>
                                    <div className={styles.dropdownContent}>
                                        {AI_MODELS.map(model => (
                                            <button
                                                key={model.value}
                                                className={`${styles.dropdownItem} ${props.selectedModel === model.value ? styles.active : ''}`}
                                                onClick={() => {
                                                    props.onModelChange(model.value)
                                                    setShowModelMenu(false)
                                                }}
                                            >
                                                <div className={styles.modelItemContent}>
                                                    <div className={styles.modelHeader}>
                                                        <span className={styles.modelIcon}>{model.icon}</span>
                                                        <div className={styles.modelInfo}>
                                                            <div className={styles.modelNameRow}>
                                                                <span className={styles.itemName}>{model.name}</span>
                                                                <span
                                                                    className={styles.badge}
                                                                    style={{ backgroundColor: model.color }}
                                                                >
                                                                    {model.badge}
                                                                </span>
                                                            </div>
                                                            <span className={styles.modelPricing}>{model.pricing}</span>
                                                        </div>
                                                    </div>

                                                    <div className={styles.modelMetrics}>
                                                        <div className={styles.metricRow}>
                                                            <span className={styles.metricLabel}>Speed</span>
                                                            <div className={styles.metricBar}>
                                                                <div
                                                                    className={styles.metricFill}
                                                                    style={{ width: `${model.speed * 20}%`, backgroundColor: model.color }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className={styles.metricRow}>
                                                            <span className={styles.metricLabel}>Quality</span>
                                                            <div className={styles.metricBar}>
                                                                <div
                                                                    className={styles.metricFill}
                                                                    style={{ width: `${model.quality * 20}%`, backgroundColor: model.color }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className={styles.itemDescription}>
                                                        💡 {model.bestFor}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    {/* Upgrade Button for FREE users */}
                    {props.userPlanTier === 'FREE' && (
                        <Button
                            variant="ghost"
                            icon={<Crown size={18} />}
                            onClick={() => router.push('/pricing')}
                            className={styles.upgradeButton}
                            title="Nâng cấp lên Plus"
                        />
                    )}

                    {/* Theme Selector Button */}
                    <div className={styles.themeSelector} ref={themeMenuRef}>
                        <Button
                            variant="ghost"
                            icon={<Paintbrush size={18} />}
                            onClick={() => setShowThemeMenu(!showThemeMenu)}
                            className={showThemeMenu ? styles.activeButton : ''}
                            title="Change Theme"
                        />

                        {showThemeMenu && (
                            <div className={styles.dropdownMenu} style={{ right: 0, width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                                <div className={styles.dropdownHeader}>
                                    <Paintbrush size={16} />
                                    <span>Choose Theme</span>
                                </div>
                                <div className={styles.dropdownContent}>
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            className={`${styles.dropdownItem} ${currentTheme === theme.id ? styles.active : ''}`}
                                            onClick={() => handleThemeChange(theme.id)}
                                            title={theme.description}
                                        >
                                            <div className={styles.itemContent}>
                                                <div className={styles.themePreview}>
                                                    <div
                                                        className={styles.previewColors}
                                                        style={{
                                                            background: `linear-gradient(135deg, ${theme.colors.background} 25%, ${theme.colors.primary} 25% 50%, ${theme.colors.surface} 50% 75%, ${theme.colors.secondary} 75%)`
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.themeInfo}>
                                                    <span className={styles.themeName}>{theme.icon} {theme.name}</span>
                                                    <span className={styles.themeDescription}>{theme.description}</span>
                                                </div>
                                                {currentTheme === theme.id && (
                                                    <span className={styles.checkmark}>✓</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Consolidated Actions Menu */}
                    <ActionsMenu
                        hasMessages={props.messages && props.messages.length > 0}
                        showSystemPrompt={props.showSystemPrompt}
                        onExportClick={() => {
                            // Trigger export - we'll need to extract this from ExportMenu
                            const exportMenu = document.querySelector('[data-export-menu]') as HTMLElement
                            if (exportMenu) exportMenu.click()
                        }}
                        onSystemPromptClick={props.onToggleSystemPrompt}
                        onSettingsClick={() => {
                            // Settings functionality to be implemented
                            console.log('Settings clicked')
                        }}
                    />

                    {/* Hidden ExportMenu for functionality */}
                    {props.messages && props.messages.length > 0 && (
                        <div style={{ display: 'none' }}>
                            <ExportMenu
                                messages={props.messages}
                                conversationTitle={props.currentConversation?.title || 'Conversation'}
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* System Prompt Panel */}
            {props.showSystemPrompt && props.onSystemPromptChange && (
                <div className={styles.systemPromptPanel}>
                    <div className={styles.promptHeader}>
                        <h3 className={styles.promptTitle}>System Prompt</h3>
                        <button
                            onClick={props.onToggleSystemPrompt}
                            className={styles.closeButton}
                            title="Close System Prompt"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <textarea
                        value={props.systemPrompt || ''}
                        onChange={(e) => props.onSystemPromptChange!(e.target.value)}
                        placeholder="Enter custom instructions for the AI..."
                        className={styles.systemPromptInput}
                        disabled={props.disabled}
                    />
                    <div className={styles.promptHint}>
                        This will be included in every message to guide the AI's behavior
                    </div>
                </div>
            )}
        </>
    )
}