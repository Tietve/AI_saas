// src/lib/theme/theme-system.ts
// Hệ thống theme sang trọng tối giản

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

// Helper function để apply theme
export function applyTheme(themeId: string): void {
    const theme = themes[themeId]
    if (!theme) return

    const root = document.documentElement

    // Apply colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        root.style.setProperty(cssVarName, value)
    })

    // Add theme-active class to body to override Tailwind
    document.body.classList.add('theme-active')
    document.body.classList.add('theme-transition')

    // Save to localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('selectedTheme', themeId)
    }
}

// Get current theme from localStorage
export function getCurrentTheme(): string {
    if (typeof window === 'undefined') return 'noble'
    return localStorage.getItem('selectedTheme') || 'noble'
}

// Initialize theme on load
export function initializeTheme(): void {
    const currentTheme = getCurrentTheme()
    applyTheme(currentTheme)
}