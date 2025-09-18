'use client'

import React from 'react'
import { useTheme } from '@/components/theme-provider'
import { Palette } from 'lucide-react'

export function ThemeSelector() {
    const { currentTheme, setTheme, availableThemes } = useTheme()

    return (
        <div className="theme-selector">
            <button
                className="theme-trigger"
                onClick={() => {
                    const selector = document.querySelector('.theme-dropdown')
                    selector?.classList.toggle('active')
                }}
            >
                <Palette className="w-5 h-5" />
                <span>{currentTheme.name}</span>
            </button>

            <div className="theme-dropdown">
                {availableThemes.map((theme) => (
                    <button
                        key={theme.id}
                        className={`theme-option ${currentTheme.id === theme.id ? 'active' : ''}`}
                        onClick={() => {
                            setTheme(theme.id)
                            document.querySelector('.theme-dropdown')?.classList.remove('active')
                        }}
                    >
                        <div className="theme-preview">
              <span
                  className="color-dot"
                  style={{ backgroundColor: theme.colors.primary }}
              />
                            <span
                                className="color-dot"
                                style={{ backgroundColor: theme.colors.accent }}
                            />
                            <span
                                className="color-dot"
                                style={{ backgroundColor: theme.colors.background }}
                            />
                        </div>
                        <span className="theme-name">{theme.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}