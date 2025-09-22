// src/components/ThemeSelector.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Palette } from 'lucide-react'
import {
    themes,
    applyTheme,
    getCurrentTheme,
    isOnChatPage
} from '@/lib/theme/theme-system'

export function ThemeSelector() {
    const [currentThemeId, setCurrentThemeId] = useState<string>('default')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Load current theme on mount
    useEffect(() => {
        if (isOnChatPage()) {
            const savedTheme = getCurrentTheme()
            setCurrentThemeId(savedTheme)
        }
    }, [])

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

    // Listen for theme changes
    useEffect(() => {
        function handleThemeChange(event: Event) {
            const customEvent = event as CustomEvent
            setCurrentThemeId(customEvent.detail.themeId)
        }

        const chatContainer = document.querySelector('[data-theme-scope="chat"]')
        if (chatContainer) {
            chatContainer.addEventListener('chatThemeChanged', handleThemeChange)
            return () => {
                chatContainer.removeEventListener('chatThemeChanged', handleThemeChange)
            }
        }
    }, [])

    const handleThemeChange = (themeId: string) => {
        setCurrentThemeId(themeId)
        applyTheme(themeId)
        setIsOpen(false)
    }

    const currentTheme = themes[currentThemeId] || themes.default
    const themeList = Object.values(themes)

    // Don't render if not on chat page
    if (typeof window !== 'undefined' && !isOnChatPage()) {
        return null
    }

    return (
        <div className="theme-selector-container" ref={dropdownRef}>
            <button
                className="theme-selector-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select theme"
            >
                <Palette className="w-4 h-4" />
                <span className="theme-selector-label">{currentTheme.name}</span>
                <svg
                    className={`theme-selector-chevron ${isOpen ? 'rotate' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                >
                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>

            {isOpen && (
                <div className="theme-selector-dropdown">
                    <div className="theme-selector-header">
                        <span>Chọn giao diện</span>
                    </div>

                    <div className="theme-options-list">
                        {themeList.map((theme) => (
                            <button
                                key={theme.id}
                                className={`theme-option ${currentThemeId === theme.id ? 'active' : ''}`}
                                onClick={() => handleThemeChange(theme.id)}
                            >
                                <div className="theme-preview">
                                    <span
                                        className="color-dot primary"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                    <span
                                        className="color-dot accent"
                                        style={{ backgroundColor: theme.colors.accent }}
                                    />
                                    <span
                                        className="color-dot background"
                                        style={{ backgroundColor: theme.colors.background }}
                                    />
                                </div>
                                <span className="theme-name">{theme.name}</span>
                                {currentThemeId === theme.id && (
                                    <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .theme-selector-container {
                    position: relative;
                    z-index: 40;
                }

                .theme-selector-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: var(--color-surface, #ffffff);
                    border: 1px solid var(--color-border, #e5e7eb);
                    color: var(--color-text, #1f2937);
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 140px;
                }

                .theme-selector-trigger:hover {
                    background: var(--color-background-secondary, #f9fafb);
                    border-color: var(--color-primary, #10b981);
                }

                .theme-selector-label {
                    flex: 1;
                    text-align: left;
                    font-weight: 500;
                }

                .theme-selector-chevron {
                    transition: transform 0.2s;
                    opacity: 0.6;
                }

                .theme-selector-chevron.rotate {
                    transform: rotate(180deg);
                }

                .theme-selector-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    width: 280px;
                    background: var(--color-surface, #ffffff);
                    border: 1px solid var(--color-border, #e5e7eb);
                    border-radius: 0.75rem;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                    z-index: 100;
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

                .theme-selector-header {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--color-border, #e5e7eb);
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--color-text, #1f2937);
                    background: var(--color-background-secondary, #f9fafb);
                }

                .theme-options-list {
                    padding: 0.5rem;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .theme-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 0.75rem;
                    background: transparent;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.15s;
                    color: var(--color-text, #1f2937);
                }

                .theme-option:hover {
                    background: var(--color-background-secondary, #f3f4f6);
                }

                .theme-option.active {
                    background: var(--color-primary, #10b981);
                    background-opacity: 0.1;
                    color: var(--color-primary, #10b981);
                }

                .theme-preview {
                    display: flex;
                    gap: 0.25rem;
                    align-items: center;
                }

                .color-dot {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }

                .color-dot.primary {
                    border-color: rgba(255,255,255,0.5);
                }

                .theme-option:hover .color-dot {
                    transform: scale(1.1);
                }

                .theme-name {
                    flex: 1;
                    text-align: left;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .check-icon {
                    width: 16px;
                    height: 16px;
                    color: var(--color-primary, #10b981);
                }

                /* Dark mode adjustments */
                @media (prefers-color-scheme: dark) {
                    .theme-selector-trigger {
                        background: var(--color-surface, #1f2937);
                        border-color: var(--color-border, #374151);
                        color: var(--color-text, #f3f4f6);
                    }

                    .theme-selector-trigger:hover {
                        background: var(--color-background-secondary, #374151);
                    }

                    .theme-selector-dropdown {
                        background: var(--color-surface, #1f2937);
                        border-color: var(--color-border, #374151);
                        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    }

                    .theme-selector-header {
                        background: var(--color-background-secondary, #111827);
                        border-color: var(--color-border, #374151);
                        color: var(--color-text, #f3f4f6);
                    }

                    .theme-option {
                        color: var(--color-text, #f3f4f6);
                    }

                    .theme-option:hover {
                        background: var(--color-background-secondary, #374151);
                    }
                }

                /* Scrollbar styling */
                .theme-options-list::-webkit-scrollbar {
                    width: 6px;
                }

                .theme-options-list::-webkit-scrollbar-track {
                    background: var(--color-background-secondary, #f3f4f6);
                }

                .theme-options-list::-webkit-scrollbar-thumb {
                    background: var(--color-border, #d1d5db);
                    border-radius: 3px;
                }

                .theme-options-list::-webkit-scrollbar-thumb:hover {
                    background: var(--color-accent, #9ca3af);
                }

                /* Mobile responsive */
                @media (max-width: 640px) {
                    .theme-selector-dropdown {
                        width: 240px;
                    }
                }
            `}</style>
        </div>
    )
}