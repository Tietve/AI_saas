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
                    '--bot-color': selectedBot?.appearance.primaryColor || '#10b981'
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
                                    '--bot-primary': bot.appearance.primaryColor || '#10b981',
                                    '--bot-secondary': bot.appearance.secondaryColor || '#86efac',
                                    '--bot-accent': bot.appearance.accentColor || '#22c55e'
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
                    /* FIX: Explicit colors with fallbacks */
                    background: var(--color-surface, #ffffff);
                    border: 1px solid var(--color-border, #e5e7eb);
                    color: var(--color-text, #1f2937);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .bot-selector-trigger {
                        background: var(--color-surface, #1f2937);
                        border-color: var(--color-border, #374151);
                        color: var(--color-text, #f3f4f6);
                    }
                }

                .bot-selector-trigger:hover:not(.disabled) {
                    background: var(--color-background-secondary, #f9fafb);
                    border-color: var(--bot-color);
                }

                @media (prefers-color-scheme: dark) {
                    .bot-selector-trigger:hover:not(.disabled) {
                        background: var(--color-background-secondary, #374151);
                    }
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
                    color: inherit;
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
                    /* FIX: Explicit colors */
                    background: var(--color-surface, #ffffff);
                    border: 1px solid var(--color-border, #e5e7eb);
                    color: var(--color-text, #1f2937);
                    border-radius: 0.75rem;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    z-index: 50;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }

                @media (prefers-color-scheme: dark) {
                    .bot-selector-dropdown {
                        background: var(--color-surface, #1f2937);
                        border-color: var(--color-border, #374151);
                        color: var(--color-text, #f3f4f6);
                        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    }
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
                    background: var(--color-border, #e5e7eb);
                    margin: 0.5rem 0;
                }

                @media (prefers-color-scheme: dark) {
                    .divider {
                        background: var(--color-border, #374151);
                    }
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
                    /* FIX: Ensure text color */
                    color: inherit;
                }

                .bot-option:hover {
                    background: var(--color-background-secondary, #f9fafb);
                }

                @media (prefers-color-scheme: dark) {
                    .bot-option:hover {
                        background: var(--color-background-secondary, #374151);
                    }
                }

                .bot-option.selected {
                    background: linear-gradient(135deg,
                    rgba(var(--bot-primary-rgb, 16, 185, 129), 0.1),
                    rgba(var(--bot-primary-rgb, 16, 185, 129), 0.05)
                    );
                    border: 1px solid rgba(var(--bot-primary-rgb, 16, 185, 129), 0.3);
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
                    /* FIX: Explicit color */
                    color: var(--color-text, #1f2937);
                    margin-bottom: 0.125rem;
                }

                @media (prefers-color-scheme: dark) {
                    .bot-option-name {
                        color: var(--color-text, #f3f4f6);
                    }
                }

                .bot-option-tagline {
                    font-size: 0.75rem;
                    /* FIX: Secondary text color */
                    color: var(--color-text-secondary, #6b7280);
                    margin-bottom: 0.375rem;
                }

                @media (prefers-color-scheme: dark) {
                    .bot-option-tagline {
                        color: var(--color-text-secondary, #9ca3af);
                    }
                }

                .bot-option-traits {
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }

                .trait {
                    font-size: 0.625rem;
                    padding: 0.125rem 0.375rem;
                    /* FIX: Better trait styling */
                    background: var(--bot-primary, #10b981);
                    background-opacity: 0.2;
                    color: var(--bot-primary, #10b981);
                    border-radius: 0.25rem;
                    font-weight: 500;
                }

                @media (prefers-color-scheme: dark) {
                    .trait {
                        filter: brightness(1.2);
                    }
                }

                .bot-preview {
                    position: absolute;
                    left: calc(100% + 0.5rem);
                    top: 0;
                    width: 280px;
                    padding: 1rem;
                    /* FIX: Preview colors */
                    background: var(--color-surface, #ffffff);
                    border: 1px solid var(--color-border, #e5e7eb);
                    color: var(--color-text, #1f2937);
                    border-radius: 0.5rem;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    z-index: 51;
                    animation: fadeIn 0.2s ease-out;
                }

                @media (prefers-color-scheme: dark) {
                    .bot-preview {
                        background: var(--color-surface, #1f2937);
                        border-color: var(--color-border, #374151);
                        color: var(--color-text, #f3f4f6);
                        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
                    }
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
                    color: inherit;
                }

                .preview-description {
                    font-size: 0.75rem;
                    color: var(--color-text-secondary, #6b7280);
                    margin-bottom: 0.75rem;
                    line-height: 1.5;
                }

                @media (prefers-color-scheme: dark) {
                    .preview-description {
                        color: var(--color-text-secondary, #9ca3af);
                    }
                }

                .preview-capabilities {
                    font-size: 0.75rem;
                }

                .capability-section strong {
                    display: block;
                    margin-bottom: 0.25rem;
                    color: var(--color-text, #1f2937);
                }

                @media (prefers-color-scheme: dark) {
                    .capability-section strong {
                        color: var(--color-text, #f3f4f6);
                    }
                }

                .capability-section ul {
                    margin: 0;
                    padding-left: 1.25rem;
                    color: var(--color-text-secondary, #6b7280);
                }

                @media (prefers-color-scheme: dark) {
                    .capability-section ul {
                        color: var(--color-text-secondary, #9ca3af);
                    }
                }

                .capability-section li {
                    margin-bottom: 0.125rem;
                }

                /* Scrollbar styling */
                .bot-personalities-list::-webkit-scrollbar {
                    width: 6px;
                }

                .bot-personalities-list::-webkit-scrollbar-track {
                    background: var(--color-background-secondary, #f9fafb);
                }

                @media (prefers-color-scheme: dark) {
                    .bot-personalities-list::-webkit-scrollbar-track {
                        background: var(--color-background-secondary, #374151);
                    }
                }

                .bot-personalities-list::-webkit-scrollbar-thumb {
                    background: var(--color-border, #d1d5db);
                    border-radius: 3px;
                }

                @media (prefers-color-scheme: dark) {
                    .bot-personalities-list::-webkit-scrollbar-thumb {
                        background: var(--color-border, #4b5563);
                    }
                }

                .bot-personalities-list::-webkit-scrollbar-thumb:hover {
                    background: var(--color-accent, #10b981);
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