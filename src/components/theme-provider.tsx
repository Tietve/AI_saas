'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { themes, applyTheme, getCurrentTheme, ThemeConfig } from '@/lib/theme/theme-system'

interface ThemeContextType {
    currentTheme: ThemeConfig
    setTheme: (themeId: string) => void
    availableThemes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentThemeId, setCurrentThemeId] = useState<string>('noble')

    useEffect(() => {
        // Load saved theme on mount
        const savedTheme = getCurrentTheme()
        setCurrentThemeId(savedTheme)
        applyTheme(savedTheme)
    }, [])

    const setTheme = (themeId: string) => {
        if (!themes[themeId]) return

        setCurrentThemeId(themeId)
        applyTheme(themeId)
    }

    const value = {
        currentTheme: themes[currentThemeId] || themes.noble,
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