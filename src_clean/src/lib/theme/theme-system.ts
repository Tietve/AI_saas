


export interface ThemeColors {
    primary: string
    primaryHover: string
    background: string
    backgroundSecondary: string
    surface: string
    text: string
    textSecondary: string
    accent: string
    border: string
    success: string
    error: string
    warning: string
}

export interface ThemeConfig {
    name: string
    id: string
    colors: ThemeColors
}


export const themes: Record<string, ThemeConfig> = {
    
    noble: {
        name: 'Noble Dark',
        id: 'noble',
        colors: {
            primary: '#D4AF37',
            primaryHover: '#F4CF57',
            background: '#0A0E1A',
            backgroundSecondary: '#151B2C',
            surface: '#1F2937',  
            text: '#F8F9FA',
            textSecondary: '#B8C1D1',
            accent: '#8B7355',
            border: '#374151',  
            success: '#4ADE80',
            error: '#F87171',
            warning: '#FBBF24'
        }
    },

    
    zen: {
        name: 'Zen Garden',
        id: 'zen',
        colors: {
            primary: '#16A085',
            primaryHover: '#1ABC9C',
            background: '#FEFEF9',
            backgroundSecondary: '#F7F6F0',
            surface: '#FFFFFF',
            text: '#2C3E50',
            textSecondary: '#5D6D7E',
            accent: '#D35400',
            border: '#E8E6DE',
            success: '#27AE60',
            error: '#E74C3C',
            warning: '#F39C12'
        }
    },

    
    cyber: {
        name: 'Cyber Neon',
        id: 'cyber',
        colors: {
            primary: '#00D9FF',
            primaryHover: '#00F0FF',
            background: '#0A0A0F',
            backgroundSecondary: '#13131A',
            surface: '#1A1A24',  
            text: '#FFFFFF',
            textSecondary: '#B0B0C0',
            accent: '#FF00FF',
            border: '#3A3A4A',  
            success: '#00FF88',
            error: '#FF0044',
            warning: '#FFD700'
        }
    },

    
    rosegold: {
        name: 'Rose Gold',
        id: 'rosegold',
        colors: {
            primary: '#B76E79',
            primaryHover: '#C7889C',
            background: '#FFF8F3',
            backgroundSecondary: '#FFEFE5',
            surface: '#FFFFFF',
            text: '#3A2027',
            textSecondary: '#6A4050',
            accent: '#E8B4B8',
            border: '#F0D0D0',
            success: '#95C99C',
            error: '#E88B8B',
            warning: '#F4B860'
        }
    },

    
    ocean: {
        name: 'Ocean Depth',
        id: 'ocean',
        colors: {
            primary: '#006994',
            primaryHover: '#0084B4',
            background: '#001A33',
            backgroundSecondary: '#002244',
            surface: '#002A55',  
            text: '#E0F2FE',
            textSecondary: '#87CEEB',
            accent: '#00CED1',
            border: '#004080',
            success: '#20B2AA',
            error: '#FF6B6B',
            warning: '#FFD700'
        }
    },

    
    sunset: {
        name: 'Warm Sunset',
        id: 'sunset',
        colors: {
            primary: '#FF6B35',
            primaryHover: '#FF8555',
            background: '#FFFBF5',
            backgroundSecondary: '#FFF5E6',
            surface: '#FFFFFF',
            text: '#2D3436',
            textSecondary: '#636E72',
            accent: '#F77F00',
            border: '#FFE0CC',
            success: '#00B894',
            error: '#FF3838',
            warning: '#FDCB6E'
        }
    },

    
    minimal: {
        name: 'Minimal Light',
        id: 'minimal',
        colors: {
            primary: '#000000',
            primaryHover: '#333333',
            background: '#FFFFFF',
            backgroundSecondary: '#FAFAFA',
            surface: '#F5F5F5',
            text: '#000000',
            textSecondary: '#666666',
            accent: '#000000',
            border: '#E0E0E0',
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800'
        }
    },

    
    forest: {
        name: 'Forest Green',
        id: 'forest',
        colors: {
            primary: '#2D5016',
            primaryHover: '#3D6526',
            background: '#F5F7F0',
            backgroundSecondary: '#EBEEE5',
            surface: '#FFFFFF',
            text: '#1A2410',
            textSecondary: '#4A5840',
            accent: '#6B8E23',
            border: '#C5D0B0',
            success: '#8FBC8F',
            error: '#CD5C5C',
            warning: '#DAA520'
        }
    },

    
    default: {
        name: 'Default',
        id: 'default',
        colors: {
            primary: '#10b981',
            primaryHover: '#059669',
            background: '#ffffff',
            backgroundSecondary: '#f9fafb',
            surface: '#ffffff',
            text: '#111827',
            textSecondary: '#6b7280',
            accent: '#10b981',
            border: '#e5e7eb',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b'
        }
    }
}


export function applyTheme(themeId: string): void {
    
    if (!isOnChatPage()) {
        console.log('Theme only applies to /chat page')
        return
    }

    const theme = themes[themeId] || themes.default

    
    const chatContainer = document.querySelector('[data-theme-scope="chat"]') ||
        document.querySelector('.chat-page-container') ||
        document.querySelector('main')

    if (!chatContainer) {
        console.warn('Chat container not found, applying to root as fallback')
    }

    const targetElement = chatContainer || document.documentElement

    
    Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        if (targetElement instanceof HTMLElement) {
            targetElement.style.setProperty(cssVarName, value)
        }
    })

    
    if (targetElement instanceof HTMLElement) {
        
        targetElement.className = targetElement.className.replace(/theme-\w+/g, '')
        // Add new theme class
        targetElement.classList.add(`theme-${themeId}`)
        targetElement.setAttribute('data-theme', themeId)
    }

    
    requestAnimationFrame(() => {
        if (!chatContainer) return

        
        const bgElements = chatContainer.querySelectorAll(`
            .bg-white, .bg-gray-50, .bg-gray-100, 
            .dark\\:bg-gray-900, .dark\\:bg-gray-950, .dark\\:bg-gray-800,
            .chat-header, .chat-sidebar, .chat-messages, .chat-input-container
        `)
        bgElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                
                if (el.classList.contains('chat-sidebar') ||
                    el.classList.contains('bg-gray-100') ||
                    el.classList.contains('dark:bg-gray-800')) {
                    el.style.setProperty('background-color', theme.colors.backgroundSecondary, 'important')
                } else {
                    el.style.setProperty('background-color', theme.colors.background, 'important')
                }
            }
        })

        
        const textElements = chatContainer.querySelectorAll(`
            .text-gray-900, .text-gray-800, .text-black,
            .dark\\:text-gray-100, .dark\\:text-gray-200, .dark\\:text-white
        `)
        textElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('color', theme.colors.text, 'important')
            }
        })

        
        const secondaryTextElements = chatContainer.querySelectorAll(`
            .text-gray-600, .text-gray-500, .text-gray-400,
            .dark\\:text-gray-400, .dark\\:text-gray-500
        `)
        secondaryTextElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('color', theme.colors.textSecondary, 'important')
            }
        })

        
        const borderElements = chatContainer.querySelectorAll(`
            .border-gray-200, .border-gray-300,
            .dark\\:border-gray-700, .dark\\:border-gray-800
        `)
        borderElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('border-color', theme.colors.border, 'important')
            }
        })

        
        const hoverElements = chatContainer.querySelectorAll(`
            .hover\\:bg-gray-100, .hover\\:bg-gray-200,
            .dark\\:hover\\:bg-gray-800, .dark\\:hover\\:bg-gray-700
        `)
        hoverElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.addEventListener('mouseenter', () => {
                    el.style.setProperty('background-color', theme.colors.surface, 'important')
                })
                el.addEventListener('mouseleave', () => {
                    el.style.setProperty('background-color', 'transparent', 'important')
                })
            }
        })
    })

    
    if (typeof window !== 'undefined') {
        localStorage.setItem('chat-theme', themeId)
        localStorage.setItem('chat-theme-colors', JSON.stringify(theme.colors))
    }

    
    if (chatContainer) {
        chatContainer.dispatchEvent(new CustomEvent('chatThemeChanged', {
            detail: { themeId, colors: theme.colors },
            bubbles: true
        }))
    }
}


export function isOnChatPage(): boolean {
    if (typeof window === 'undefined') return false
    return window.location.pathname.startsWith('/chat')
}


export function getCurrentTheme(): string {
    if (typeof window === 'undefined') return 'default'

    
    if (!isOnChatPage()) return 'default'

    return localStorage.getItem('chat-theme') || 'default'
}


export function getCurrentThemeColors(): ThemeColors | null {
    if (typeof window === 'undefined') return null
    if (!isOnChatPage()) return themes.default.colors

    const saved = localStorage.getItem('chat-theme-colors')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch {
            return themes.default.colors
        }
    }
    return themes.default.colors
}


export function initializeTheme(): void {
    
    if (!isOnChatPage()) {
        console.log('Not on chat page, skipping theme initialization')
        return
    }

    const currentTheme = getCurrentTheme()

    if (typeof window !== 'undefined') {
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (isOnChatPage()) {
                    applyTheme(currentTheme)
                }
            })
        } else {
            applyTheme(currentTheme)
        }
    }
}


export function injectChatThemeStyles(): void {
    if (!isOnChatPage()) return

    const styleId = 'chat-theme-styles'

    
    const existing = document.getElementById(styleId)
    if (existing) existing.remove()

    
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
        /* ULTIMATE OVERRIDE - Maximum specificity with !important */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) * {
            /* Remove all Tailwind color classes effect */
            transition: background-color 0.2s, color 0.2s, border-color 0.2s;
        }
        
        /* ULTRA HIGH SPECIFICITY - Ensure theme override everything */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]),
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) .chat-container,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) .flex.h-screen {
            background-color: var(--color-background) !important;
            color: var(--color-text) !important;
        }
        
        /* Override ALL possible backgrounds with max specificity */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) div[class*="bg-white"],
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) div[class*="bg-gray"],
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) header,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) aside,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) main,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) section,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) .chat-header {
            background-color: var(--color-background) !important;
        }
        
        /* Sidebar with different background */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) aside[class*="border-r"],
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) .w-60,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="lg:w-60"] {
            background-color: var(--color-background-secondary) !important;
        }
        
        /* Messages area specific */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) .chat-messages,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) div[class*="overflow-y-auto"] {
            background-color: var(--color-background) !important;
        }
        
        /* Input area specific */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) .chat-input-container,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) div[class*="border-t"] {
            background-color: var(--color-background) !important;
            border-color: var(--color-border) !important;
        }
        
        /* Override ALL text colors */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) *:not(button):not(a) {
            color: inherit !important;
        }
        
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) h1,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) h2,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) h3,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) p,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) span:not(.color-dot),
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) div {
            color: var(--color-text) !important;
        }
        
        /* Secondary text elements */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="text-gray-600"],
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="text-gray-500"],
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="text-gray-400"] {
            color: var(--color-text-secondary) !important;
        }
        
        /* All borders */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="border"] {
            border-color: var(--color-border) !important;
        }
        
        /* Buttons and interactive elements */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) button:not([class*="bg-gradient"]):not(.upgrade-button) {
            color: var(--color-text) !important;
            background-color: transparent !important;
        }
        
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) button:hover:not([class*="bg-gradient"]):not(.upgrade-button) {
            background-color: var(--color-surface) !important;
        }
        
        /* Surface elements like cards, modals */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="bg-gray-100"],
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) [class*="hover:bg-gray-100"]:hover {
            background-color: var(--color-surface) !important;
        }
        
        /* Inputs and textareas */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) input,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) textarea,
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) select {
            background-color: var(--color-surface) !important;
            color: var(--color-text) !important;
            border-color: var(--color-border) !important;
        }
        
        /* Dropdown menus */
        html body .theme-selector-dropdown,
        html body .bot-selector-dropdown,
        html body .model-selector-dropdown {
            background-color: var(--color-surface) !important;
            border-color: var(--color-border) !important;
            z-index: 99999 !important;
        }
        
        /* Force dark theme colors for specific themes */
        html body [data-theme-scope="chat"][data-theme="noble"],
        html body [data-theme-scope="chat"][data-theme="cyber"],
        html body [data-theme-scope="chat"][data-theme="ocean"] {
            background-color: var(--color-background) !important;
            color: var(--color-text) !important;
        }
        
        /* Scrollbars */
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) ::-webkit-scrollbar-track {
            background: var(--color-background-secondary) !important;
        }
        
        html body [data-theme-scope="chat"][data-theme]:not([data-theme="default"]) ::-webkit-scrollbar-thumb {
            background: var(--color-border) !important;
        }
    `

    document.head.appendChild(style)
}


export function resetTheme(): void {
    const root = document.documentElement

    
    root.className = root.className.replace(/theme-\w+/g, '')
    root.removeAttribute('data-theme')

    
    const themeVars = [
        '--color-primary', '--color-primary-hover', '--color-background',
        '--color-background-secondary', '--color-surface', '--color-text',
        '--color-text-secondary', '--color-accent', '--color-border',
        '--color-success', '--color-error', '--color-warning'
    ]

    themeVars.forEach(varName => {
        root.style.removeProperty(varName)
    })
}


export function getCSSVariable(name: string): string {
    if (typeof window === 'undefined') return ''

    const chatContainer = document.querySelector('[data-theme-scope="chat"]')
    const element = chatContainer || document.documentElement

    return getComputedStyle(element)
        .getPropertyValue(name)
        .trim()
}

// Export all theme IDs for easy access
export const themeIds = Object.keys(themes)

// Export default theme
export const defaultTheme = 'default'