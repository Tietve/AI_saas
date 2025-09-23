


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


function normalizeHex(color: string): string | null {
    if (!color) return null
    const hex = color.trim().replace('#', '')
    if (hex.length === 3) {
        const expanded = hex.split('').map(char => char + char).join('')
        return `#${expanded}`.toLowerCase()
    }
    if (hex.length === 6) {
        return `#${hex.toLowerCase()}`
    }
    return null
}

function hexToRgb(color: string): [number, number, number] | null {
    const normalized = normalizeHex(color)
    if (!normalized) return null
    const bigint = Number.parseInt(normalized.slice(1), 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
    return `#${[clamp(r), clamp(g), clamp(b)]
        .map(value => value.toString(16).padStart(2, '0'))
        .join('')}`
}

function mixColors(colorA: string, colorB: string, weightA: number): string {
    const rgbA = hexToRgb(colorA)
    const rgbB = hexToRgb(colorB)
    if (!rgbA || !rgbB) return colorA
    const wA = Math.max(0, Math.min(1, weightA))
    const wB = 1 - wA
    const mixed = [
        rgbA[0] * wA + rgbB[0] * wB,
        rgbA[1] * wA + rgbB[1] * wB,
        rgbA[2] * wA + rgbB[2] * wB
    ] as const
    return rgbToHex(mixed[0], mixed[1], mixed[2])
}

function toRgba(color: string, alpha: number): string {
    const rgb = hexToRgb(color)
    if (!rgb) return color
    const normalizedAlpha = Math.max(0, Math.min(1, alpha))
    const [r, g, b] = rgb
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`
}

function getLuminance(color: string): number {
    const rgb = hexToRgb(color)
    if (!rgb) return 0
    const [r, g, b] = rgb.map(component => {
        const channel = component / 255
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastingText(color: string): string {
    const luminance = getLuminance(color)
    return luminance > 0.6 ? '#111827' : '#ffffff'
}

function setCssVariables(element: HTMLElement, variables: Record<string, string>) {
    Object.entries(variables).forEach(([name, value]) => {
        element.style.setProperty(name, value)
    })
}

const BASE_THEME_VARS = [
    '--color-primary',
    '--color-primary-hover',
    '--color-background',
    '--color-background-secondary',
    '--color-surface',
    '--color-text',
    '--color-text-secondary',
    '--color-accent',
    '--color-border',
    '--color-success',
    '--color-error',
    '--color-warning'
]

const CHAT_THEME_VARS = [
    '--chat-surface',
    '--chat-surface-soft',
    '--chat-surface-strong',
    '--chat-border',
    '--chat-border-strong',
    '--chat-muted',
    '--chat-primary',
    '--chat-primary-soft',
    '--chat-primary-accent',
    '--chat-accent',
    '--chat-ring',
    '--chat-ring-outer',
    '--chat-on-primary',
    '--chat-on-surface',
    '--chat-on-soft',
    '--chat-shadow-color',
    '--chat-shadow-soft',
    '--chat-scrollbar-color',
    '--chat-background-gradient',
    '--chat-glass-blur'
]

export function applyTheme(themeId: string): void {
    if (typeof document === 'undefined') return

    if (!isOnChatPage()) {
        console.log('Theme only applies to /chat page')
    }

    const theme = themes[themeId] || themes.default
    const chatContainer = document.querySelector('[data-theme-scope="chat"]') as HTMLElement | null
    const root = document.documentElement

    const surfaceSoft = mixColors(theme.colors.surface, theme.colors.background, 0.55)
    const surfaceStrong = mixColors(theme.colors.surface, theme.colors.background, 0.8)
    const borderSoft = mixColors(theme.colors.border, theme.colors.background, 0.65)
    const borderStrong = mixColors(theme.colors.border, theme.colors.background, 0.45)
    const muted = mixColors(theme.colors.textSecondary, theme.colors.background, 0.5)
    const primarySoft = mixColors(theme.colors.primary, theme.colors.background, 0.25)
    const primaryAccent = mixColors(theme.colors.primary, theme.colors.accent, 0.6)
    const accentSoft = mixColors(theme.colors.accent, theme.colors.background, 0.25)
    const ring = mixColors(theme.colors.primary, '#ffffff', 0.35)
    const ringOuter = toRgba(theme.colors.primary, 0.18)
    const gradientStart = mixColors(theme.colors.primary, theme.colors.background, 0.12)
    const gradientEnd = mixColors(theme.colors.accent, theme.colors.background, 0.08)
    const scrollThumb = mixColors(theme.colors.border, theme.colors.textSecondary, 0.4)

    const backgroundLuminance = getLuminance(theme.colors.background)
    const darkBackground = backgroundLuminance < 0.45
    const shadowColor = darkBackground ? 'rgba(0, 0, 0, 0.35)' : 'rgba(15, 23, 42, 0.12)'
    const shadowSoft = darkBackground ? 'rgba(0, 0, 0, 0.28)' : 'rgba(15, 23, 42, 0.08)'

    const baseVariables: Record<string, string> = {}
    Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        baseVariables[cssVarName] = value
    })

    const chatVariables: Record<string, string> = {
        '--chat-surface': theme.colors.surface,
        '--chat-surface-soft': surfaceSoft,
        '--chat-surface-strong': surfaceStrong,
        '--chat-border': borderSoft,
        '--chat-border-strong': borderStrong,
        '--chat-muted': muted,
        '--chat-primary': theme.colors.primary,
        '--chat-primary-soft': primarySoft,
        '--chat-primary-accent': primaryAccent,
        '--chat-accent': accentSoft,
        '--chat-ring': ring,
        '--chat-ring-outer': ringOuter,
        '--chat-on-primary': getContrastingText(theme.colors.primary),
        '--chat-on-surface': getContrastingText(surfaceStrong),
        '--chat-on-soft': getContrastingText(surfaceSoft),
        '--chat-shadow-color': shadowColor,
        '--chat-shadow-soft': shadowSoft,
        '--chat-scrollbar-color': scrollThumb,
        '--chat-background-gradient': `radial-gradient(circle at top left, ${gradientStart}, transparent 55%), radial-gradient(circle at bottom right, ${gradientEnd}, transparent 60%)`,
        '--chat-glass-blur': '18px'
    }

    setCssVariables(root, { ...baseVariables, ...chatVariables })
    if (chatContainer) {
        setCssVariables(chatContainer, { ...baseVariables, ...chatVariables })
    }

    const removeThemeClasses = Array.from(root.classList).filter(cls => cls.startsWith('theme-'))
    removeThemeClasses.forEach(cls => root.classList.remove(cls))
    root.classList.add(`theme-${theme.id}`)
    root.setAttribute('data-theme', theme.id)

    if (chatContainer) {
        chatContainer.setAttribute('data-theme', theme.id)
    }

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
    if (typeof document === 'undefined' || !isOnChatPage()) return

    const styleId = 'chat-theme-styles'
    let style = document.getElementById(styleId) as HTMLStyleElement | null

    if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
    }

    style.textContent = `
        [data-theme-scope="chat"] {
            transition: background-color 0.35s ease, color 0.35s ease;
        }

        [data-theme-scope="chat"] ::-webkit-scrollbar-track {
            background: transparent;
        }

        [data-theme-scope="chat"] ::-webkit-scrollbar-thumb {
            background: var(--chat-scrollbar-color, rgba(148, 163, 184, 0.45));
            border-radius: 999px;
        }
    `
}


export function resetTheme(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const chatContainer = document.querySelector('[data-theme-scope="chat"]') as HTMLElement | null

    const themeClasses = Array.from(root.classList).filter(cls => cls.startsWith('theme-'))
    themeClasses.forEach(cls => root.classList.remove(cls))
    rootClassesCleanup(root)
    root.removeAttribute('data-theme')

    const allVars = [...BASE_THEME_VARS, ...CHAT_THEME_VARS]
    allVars.forEach(varName => {
        root.style.removeProperty(varName)
        if (chatContainer) {
            chatContainer.style.removeProperty(varName)
        }
    })

    if (chatContainer) {
        chatContainer.removeAttribute('data-theme')
    }
}

function rootClassesCleanup(root: HTMLElement) {
    root.className = root.className.trim()
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