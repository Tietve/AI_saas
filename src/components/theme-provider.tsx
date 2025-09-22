// src/components/theme-provider.tsx - UNIFIED VERSION

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
    themes,
    ThemeConfig,
    applyTheme as applyThemeFromSystem,
    getCurrentTheme,
    isOnChatPage
} from '@/lib/theme/theme-system'

interface ThemeContextType {
    currentTheme: ThemeConfig
    setTheme: (themeId: string) => void
    availableThemes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentThemeId, setCurrentThemeId] = useState<string>('default')

    useEffect(() => {
        // Only initialize theme on chat page
        if (isOnChatPage()) {
            const savedTheme = getCurrentTheme()
            setCurrentThemeId(savedTheme)
            // Use the centralized applyTheme function
            applyThemeFromSystem(savedTheme)
        }
    }, [])

    const setTheme = (themeId: string) => {
        if (!themes[themeId]) return

        setCurrentThemeId(themeId)

        // Use the centralized applyTheme function from theme-system.ts
        applyThemeFromSystem(themeId)

        // The theme-system.ts already handles localStorage
    }

    const value = {
        currentTheme: themes[currentThemeId] || themes.default,
        setTheme,
        availableThemes: Object.values(themes)
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}