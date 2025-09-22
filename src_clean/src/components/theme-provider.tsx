

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
        
        if (isOnChatPage()) {
            const savedTheme = getCurrentTheme()
            setCurrentThemeId(savedTheme)
            
            applyThemeFromSystem(savedTheme)
        }
    }, [])

    const setTheme = (themeId: string) => {
        if (!themes[themeId]) return

        setCurrentThemeId(themeId)

        
        applyThemeFromSystem(themeId)

        
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