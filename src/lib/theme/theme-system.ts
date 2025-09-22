// src/lib/theme/theme-system.ts
// Hệ thống theme sang trọng tối giản với override Tailwind CSS

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

// Luxury Themes Collection
export const themes: Record<string, ThemeConfig> = {
    // 1. Noble Dark - Quý tộc tối
    noble: {
        name: 'Noble Dark',
        id: 'noble',
        colors: {
            primary: '#D4AF37',
            primaryHover: '#F4CF57',
            background: '#0A0E1A',
            backgroundSecondary: '#151B2C',
            surface: '#2A3655',
            text: '#F8F9FA',
            textSecondary: '#B8C1D1',
            accent: '#8B7355',
            border: '#2A3655',
            success: '#4ADE80',
            error: '#F87171',
            warning: '#FBBF24'
        }
    },

    // 2. Zen Garden - Thiền vườn
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

    // 3. Cyber Neon - Tương lai neon
    cyber: {
        name: 'Cyber Neon',
        id: 'cyber',
        colors: {
            primary: '#00D9FF',
            primaryHover: '#00F0FF',
            background: '#0A0A0F',
            backgroundSecondary: '#13131A',
            surface: '#252530',
            text: '#FFFFFF',
            textSecondary: '#B0B0C0',
            accent: '#FF00FF',
            border: '#2A2A3A',
            success: '#00FF88',
            error: '#FF0044',
            warning: '#FFD700'
        }
    },

    // 4. Rose Gold - Vàng hồng sang trọng
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

    // 5. Ocean Depth - Đại dương sâu
    ocean: {
        name: 'Ocean Depth',
        id: 'ocean',
        colors: {
            primary: '#006994',
            primaryHover: '#0084B4',
            background: '#001A33',
            backgroundSecondary: '#002244',
            surface: '#003366',
            text: '#E0F2FE',
            textSecondary: '#87CEEB',
            accent: '#00CED1',
            border: '#004080',
            success: '#20B2AA',
            error: '#FF6B6B',
            warning: '#FFD700'
        }
    },

    // 6. Warm Sunset - Hoàng hôn ấm
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

    // 7. Minimal Light - Tối giản sáng
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

    // 8. Forest Green - Rừng xanh
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
    }
}

// Helper function để apply theme với override mạnh
export function applyTheme(themeId: string): void {
    const theme = themes[themeId]
    if (!theme) return

    const root = document.documentElement

    // 1. Apply colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        root.style.setProperty(cssVarName, value)
    })

    // 2. Remove all theme classes first
    document.documentElement.classList.remove(
        'theme-override',
        'theme-noble',
        'theme-zen',
        'theme-cyber',
        'theme-rosegold',
        'theme-ocean',
        'theme-sunset',
        'theme-minimal',
        'theme-forest'
    )

    // 3. Add specific theme class và override class
    document.documentElement.classList.add('theme-override')
    document.documentElement.classList.add(`theme-${themeId}`)

    // 4. Force remove Tailwind dark mode nếu có
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.setAttribute('data-tailwind-dark', 'true')
        document.documentElement.classList.remove('dark')
    }

    // 5. Apply inline styles cho một số elements quan trọng để đảm bảo override
    requestAnimationFrame(() => {
        // Override body background
        document.body.style.backgroundColor = theme.colors.background
        document.body.style.color = theme.colors.text

        // Override tất cả elements có Tailwind bg-white
        const whiteBackgrounds = document.querySelectorAll(
            '.bg-white, .bg-gray-50, .bg-gray-100, .dark\\:bg-gray-900, .dark\\:bg-gray-800'
        )
        whiteBackgrounds.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('background-color', theme.colors.surface, 'important')
            }
        })

        // Override text colors
        const textElements = document.querySelectorAll(
            '.text-gray-900, .text-black, .dark\\:text-gray-100, .dark\\:text-white'
        )
        textElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('color', theme.colors.text, 'important')
            }
        })

        // Override secondary text
        const secondaryTextElements = document.querySelectorAll(
            '.text-gray-600, .text-gray-500, .dark\\:text-gray-400'
        )
        secondaryTextElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('color', theme.colors.textSecondary, 'important')
            }
        })

        // Override borders
        const borderElements = document.querySelectorAll(
            '.border-gray-200, .border-gray-300, .dark\\:border-gray-700'
        )
        borderElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.setProperty('border-color', theme.colors.border, 'important')
            }
        })
    })

    // 6. Save to localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('selectedTheme', themeId)
        localStorage.setItem('themeColors', JSON.stringify(theme.colors))
    }

    // 7. Dispatch custom event để các components khác có thể listen
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { themeId, colors: theme.colors }
    }))
}

// Get current theme from localStorage
export function getCurrentTheme(): string {
    if (typeof window === 'undefined') return 'noble'
    return localStorage.getItem('selectedTheme') || 'noble'
}

// Get current theme colors
export function getCurrentThemeColors(): ThemeColors | null {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('themeColors')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch {
            return null
        }
    }
    return null
}

// Initialize theme on load với override mạnh
export function initializeTheme(): void {
    const currentTheme = getCurrentTheme()

    // Delay một chút để đảm bảo DOM đã load
    if (typeof window !== 'undefined') {
        // Apply ngay lập tức
        applyTheme(currentTheme)

        // Apply lại sau khi DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                applyTheme(currentTheme)
            })
        }

        // Apply lại sau 100ms để đảm bảo override Tailwind
        setTimeout(() => {
            applyTheme(currentTheme)
        }, 100)
    }
}

// Utility function để get CSS variable value
export function getCSSVariable(name: string): string {
    if (typeof window === 'undefined') return ''
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim()
}

// Export all theme IDs for easy access
export const themeIds = Object.keys(themes)

// Export default theme
export const defaultTheme = 'noble'