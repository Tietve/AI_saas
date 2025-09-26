import React from 'react'
import { X, Palette, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/theme-modal.module.css'

interface ThemeModalProps {
    isOpen: boolean
    onClose: () => void
    currentTheme: string
    onThemeChange: (theme: string) => void
}

const themes = [
    { id: 'claude', name: 'Claude', icon: '☁️', colors: ['#FAF9F7', '#D4A574'] },
    { id: 'minimal', name: 'Minimal', icon: '⚪', colors: ['#FFFFFF', '#000000'] },
    { id: 'ocean', name: 'Ocean', icon: '🌊', colors: ['#E6F3FF', '#0066CC'] },
    { id: 'forest', name: 'Forest', icon: '🌲', colors: ['#F0F4F0', '#2D5A2D'] },
    { id: 'sunset', name: 'Sunset', icon: '🌅', colors: ['#FFF0E6', '#FF6B35'] },
    { id: 'noble', name: 'Noble Purple', icon: '👑', colors: ['#F3E6FF', '#6B35FF'] },
    { id: 'cyber', name: 'Cyberpunk', icon: '🤖', colors: ['#1A0033', '#00FFFF'] },
    { id: 'sakura', name: 'Sakura', icon: '🌸', colors: ['#FFF0F5', '#FF69B4'] },
    { id: 'dark', name: 'Dark Mode', icon: '🌙', colors: ['#1A1A1A', '#FFFFFF'] }
]

export function ThemeModal({ isOpen, onClose, currentTheme, onThemeChange }: ThemeModalProps) {
    if (!isOpen) return null

    return (
        <div className={styles.modal}>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.content}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <Palette size={20} />
                        Choose Theme
                    </h2>
                    <Button variant="ghost" icon={<X size={20} />} onClick={onClose} />
                </div>

                <div className={styles.themeGrid}>
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            className={`${styles.themeCard} ${currentTheme === theme.id ? styles.active : ''}`}
                            onClick={() => {
                                onThemeChange(theme.id)
                                onClose()
                            }}
                        >
                            <div
                                className={styles.themePreview}
                                style={{
                                    background: `linear-gradient(135deg, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%)`
                                }}
                            >
                                <span className={styles.themeIcon}>{theme.icon}</span>
                            </div>
                            <span className={styles.themeName}>{theme.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}