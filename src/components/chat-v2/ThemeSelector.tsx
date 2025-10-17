import React, { useState, useRef, useEffect } from 'react'
import { Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THEMES, ThemeManager } from '@/lib/theme/theme-manager'
import styles from '@/styles/components/chat/theme-selector.module.css'

interface ThemeSelectorProps {
    currentTheme?: string
    onThemeChange?: (themeId: string) => void
}

export function ThemeSelector({
                                  currentTheme = 'claude',
                                  onThemeChange
                              }: ThemeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState(currentTheme)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId)
        ThemeManager.setTheme(themeId)
        if (onThemeChange) {
            onThemeChange(themeId)
        }
        setIsOpen(false)
    }

    const currentThemeData = THEMES.find(t => t.id === selectedTheme)

    return (
        <div className={styles.themeSelector} ref={dropdownRef}>
            <Button
                variant="ghost"
                icon={<Palette size={18} />}
                onClick={() => setIsOpen(!isOpen)}
                className={isOpen ? styles.activeButton : ''}
                title="Change Theme"
            />

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <Palette size={16} />
                        <span>Choose Theme</span>
                    </div>

                    <div className={styles.themeGrid}>
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                className={`${styles.themeOption} ${selectedTheme === theme.id ? styles.selected : ''}`}
                                onClick={() => handleThemeSelect(theme.id)}
                                title={theme.description}
                            >
                                <div className={styles.themePreview}>
                                    <div
                                        className={styles.previewColors}
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.colors.background} 25%, ${theme.colors.primary} 25% 50%, ${theme.colors.surface} 50% 75%, ${theme.colors.secondary} 75%)`
                                        }}
                                    />
                                    {selectedTheme === theme.id && (
                                        <div className={styles.checkmark}>
                                            <Check size={12} />
                                        </div>
                                    )}
                                </div>
                                <span className={styles.themeName}>{theme.icon}</span>
                                <span className={styles.themeLabel}>{theme.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.currentTheme}>
                        <span className={styles.currentLabel}>Current:</span>
                        <span className={styles.currentName}>
              {currentThemeData?.icon} {currentThemeData?.name}
            </span>
                    </div>
                </div>
            )}
        </div>
    )
}
