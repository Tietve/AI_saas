import React, { useState, useRef, useEffect } from 'react'
import { Menu, Settings, Share, MoreVertical, Bot, Sparkles, ChevronDown, Code, X, Paintbrush } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBotsList } from '@/lib/bots/personality-templates'
import { THEMES, ThemeManager } from '@/lib/theme/theme-manager'
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
}

const AI_MODELS = [
    {
        value: 'gpt_4o_mini',
        name: 'GPT-4o Mini',
        badge: 'Fast',
        color: '#10B981',
        description: 'Fastest responses, good for simple tasks'
    },
    {
        value: 'gpt_4o',
        name: 'GPT-4o',
        badge: 'Smart',
        color: '#3B82F6',
        description: 'Most capable, best for complex reasoning'
    },
    {
        value: 'claude_3_5_sonnet',
        name: 'Claude 3.5',
        badge: 'Creative',
        color: '#8B5CF6',
        description: 'Great for writing and creativity'
    },
    {
        value: 'gemini_1_5_pro',
        name: 'Gemini 1.5 Pro',
        badge: 'Long Context',
        color: '#F59E0B',
        description: 'Handles very long conversations'
    },
    {
        value: 'llama_3_1_8b',
        name: 'Llama 3.1',
        badge: 'Open Source',
        color: '#EC4899',
        description: 'Free and open-source model'
    }
]

export function ChatHeader(props: ChatHeaderProps) {
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
                                                <div className={styles.itemContent}>
                                                    <div className={styles.itemHeader}>
                                                        <span className={styles.itemName}>{model.name}</span>
                                                        <span
                                                            className={styles.badge}
                                                            style={{ backgroundColor: model.color }}
                                                        >
                              {model.badge}
                            </span>
                                                    </div>
                                                    <span className={styles.itemDescription}>{model.description}</span>
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
                    
                    {props.onToggleSystemPrompt && (
                        <Button
                            variant="ghost"
                            icon={<Code size={18} />}
                            onClick={props.onToggleSystemPrompt}
                            className={props.showSystemPrompt ? styles.activeButton : ''}
                            title="System Prompt"
                        />
                    )}

                    <Button
                        variant="ghost"
                        icon={<Settings size={18} />}
                        title="Settings"
                    />
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