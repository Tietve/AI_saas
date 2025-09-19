// src/components/chat/BotSelector.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { botPersonalities, BotPersonality, getRandomGreeting } from '@/lib/bots/personality-templates'

interface BotSelectorProps {
    selectedBot?: BotPersonality
    onBotChange: (bot: BotPersonality | undefined) => void
    compact?: boolean
    showGreeting?: boolean
    disabled?: boolean
}

export function BotSelector({
                                selectedBot,
                                onBotChange,
                                compact = false,
                                showGreeting = true,
                                disabled = false
                            }: BotSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [hoveredBot, setHoveredBot] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleBotSelect = (bot: BotPersonality | undefined) => {
        onBotChange(bot)
        setIsOpen(false)

        // Show greeting if enabled
        if (showGreeting && bot) {
            const greeting = getRandomGreeting(bot.id)
            // You can dispatch this greeting to your message system
            console.log('Bot greeting:', greeting)
        }
    }

    const currentBot = selectedBot || {
        id: 'default',
        name: 'Assistant',
        appearance: { emoji: '🤖' },
        tagline: 'Default AI Assistant'
    }

    return (
        <div className="bot-selector-container" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`bot-selector-trigger ${compact ? 'compact' : ''} ${disabled ? 'disabled' : ''}`}
                style={{
                    '--bot-color': selectedBot?.appearance.primaryColor || 'var(--color-primary)'
                } as React.CSSProperties}
            >
                <span className="bot-emoji">{currentBot.appearance.emoji}</span>
                {!compact && (
                    <>
                        <span className="bot-name">{currentBot.name}</span>
                        <svg
                            className={`chevron ${isOpen ? 'rotate' : ''}`}
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                        >
                            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="bot-selector-dropdown">
                    {/* Default Assistant Option */}
                    <button
                        onClick={() => handleBotSelect(undefined)}
                        onMouseEnter={() => setHoveredBot('default')}
                        onMouseLeave={() => setHoveredBot(null)}
                        className={`bot-option ${!selectedBot ? 'selected' : ''} ${hoveredBot === 'default' ? 'hovered' : ''}`}
                    >
                        <div className="bot-option-content">
                            <span className="bot-option-emoji">🤖</span>
                            <div className="bot-option-info">
                                <div className="bot-option-name">Assistant</div>
                                <div className="bot-option-tagline">Default AI Assistant</div>
                                <div className="bot-option-traits">
                                    <span className="trait">balanced</span>
                                    <span className="trait">helpful</span>
                                    <span className="trait">professional</span>
                                </div>
                            </div>
                        </div>
                    </button>

                    <div className="divider"></div>

                    {/* Bot Personalities */}
                    <div className="bot-personalities-list">
                        {botPersonalities.map(bot => (
                            <button
                                key={bot.id}
                                onClick={() => handleBotSelect(bot)}
                                onMouseEnter={() => setHoveredBot(bot.id)}
                                onMouseLeave={() => setHoveredBot(null)}
                                className={`bot-option ${selectedBot?.id === bot.id ? 'selected' : ''} ${hoveredBot === bot.id ? 'hovered' : ''}`}
                                style={{
                                    '--bot-primary': bot.appearance.primaryColor,
                                    '--bot-secondary': bot.appearance.secondaryColor,
                                    '--bot-accent': bot.appearance.accentColor
                                } as React.CSSProperties}
                            >
                                <div className="bot-option-content">
                                    <span className="bot-option-emoji">{bot.appearance.emoji}</span>
                                    <div className="bot-option-info">
                                        <div className="bot-option-name">{bot.name}</div>
                                        <div className="bot-option-tagline">{bot.tagline}</div>
                                        <div className="bot-option-traits">
                                            {bot.personality.traits.slice(0, 3).map(trait => (
                                                <span key={trait} className="trait">{trait}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Preview */}
                                {hoveredBot === bot.id && (
                                    <div className="bot-preview">
                                        <div className="preview-header">
                                            <span>{bot.appearance.emoji}</span>
                                            <strong>{bot.name}</strong>
                                        </div>
                                        <p className="preview-description">{bot.description}</p>
                                        <div className="preview-capabilities">
                                            <div className="capability-section">
                                                <strong>Strengths:</strong>
                                                <ul>
                                                    {bot.capabilities.strengths.slice(0, 3).map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .bot-selector-container {
                    position: relative;
                    user-select: none;
                }

                .bot-selector-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }

                .bot-selector-trigger:hover:not(.disabled) {
                    background: var(--color-background-secondary);
                    border-color: var(--bot-color);
                }

                .bot-selector-trigger.compact {
                    padding: 0.375rem;
                    border-radius: 50%;
                }

                .bot-selector-trigger.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .bot-emoji {
                    font-size: 1.25rem;
                    line-height: 1;
                }

                .bot-name {
                    font-weight: 500;
                }

                .chevron {
                    transition: transform 0.2s;
                    opacity: 0.6;
                }

                .chevron.rotate {
                    transform: rotate(180deg);
                }

                .bot-selector-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    width: 320px;
                    max-height: 480px;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 0.75rem;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    z-index: 50 !important; /* FIX: Above messages (1) but below header (100) */
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .divider {
                    height: 1px;
                    background: var(--color-border);
                    margin: 0.5rem 0;
                }

                .bot-personalities-list {
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 0.5rem;
                }

                .bot-option {
                    width: 100%;
                    padding: 0.75rem;
                    background: transparent;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    position: relative;
                }

                .bot-option:hover {
                    background: var(--color-background-secondary);
                }

                .bot-option.selected {
                    background: linear-gradient(135deg,
                    var(--bot-primary, var(--color-primary))10,
                    var(--bot-primary, var(--color-primary))05
                    );
                    border: 1px solid var(--bot-primary, var(--color-primary))30;
                }

                .bot-option-content {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                }

                .bot-option-emoji {
                    font-size: 1.75rem;
                    line-height: 1;
                }

                .bot-option-info {
                    flex: 1;
                }

                .bot-option-name {
                    font-weight: 600;
                    color: var(--color-text);
                    margin-bottom: 0.125rem;
                }

                .bot-option-tagline {
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 0.375rem;
                }

                .bot-option-traits {
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }

                .trait {
                    font-size: 0.625rem;
                    padding: 0.125rem 0.375rem;
                    background: var(--bot-primary, var(--color-primary))20;
                    color: var(--bot-primary, var(--color-text));
                    border-radius: 0.25rem;
                    opacity: 0.8;
                }

                .bot-preview {
                    position: absolute;
                    left: calc(100% + 0.5rem);
                    top: 0;
                    width: 280px;
                    padding: 1rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 0.5rem;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    z-index: 51 !important; /* FIX: Preview slightly above dropdown */
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .preview-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    font-size: 1.125rem;
                }

                .preview-description {
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 0.75rem;
                    line-height: 1.5;
                }

                .preview-capabilities {
                    font-size: 0.75rem;
                }

                .capability-section strong {
                    display: block;
                    margin-bottom: 0.25rem;
                    color: var(--color-text);
                }

                .capability-section ul {
                    margin: 0;
                    padding-left: 1.25rem;
                    color: var(--color-text-secondary);
                }

                .capability-section li {
                    margin-bottom: 0.125rem;
                }

                /* Scrollbar styling */
                .bot-personalities-list::-webkit-scrollbar {
                    width: 6px;
                }

                .bot-personalities-list::-webkit-scrollbar-track {
                    background: var(--color-background-secondary);
                }

                .bot-personalities-list::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 3px;
                }

                .bot-personalities-list::-webkit-scrollbar-thumb:hover {
                    background: var(--color-accent);
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .bot-selector-dropdown {
                        width: 280px;
                    }

                    .bot-preview {
                        display: none;
                    }
                }
            `}</style>
        </div>
    )
}