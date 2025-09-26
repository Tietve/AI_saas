export interface Theme {
    id: string
    name: string
    icon: string
    description: string
    colors: {
        primary: string
        secondary: string
        background: string
        surface: string
        text: string
        border: string
        accent?: string
    }
    isDark: boolean
}

export const THEMES: Theme[] = [
    {
        id: 'claude',
        name: 'Claude Classic',
        icon: '☁️',
        description: 'Clean and professional like Claude',
        colors: {
            primary: '#D4A574',
            secondary: '#8B7355',
            background: '#FAF9F7',
            surface: '#FFFFFF',
            text: '#2D2B26',
            border: '#E5E1DB',
            accent: '#F5F3F0'
        },
        isDark: false
    },
    {
        id: 'minimal',
        name: 'Minimal Light',
        icon: '⚪',
        description: 'Clean black and white interface',
        colors: {
            primary: '#000000',
            secondary: '#666666',
            background: '#FFFFFF',
            surface: '#F8F8F8',
            text: '#000000',
            border: '#E0E0E0'
        },
        isDark: false
    },
    {
        id: 'dark',
        name: 'Dark Mode',
        icon: '🌙',
        description: 'Easy on the eyes',
        colors: {
            primary: '#E5C8A8',
            secondary: '#C4A47C',
            background: '#0F0F0F',
            surface: '#1A1A1A',
            text: '#F5F5F5',
            border: '#262626'
        },
        isDark: true
    },
    {
        id: 'ocean',
        name: 'Ocean Blue',
        icon: '🌊',
        description: 'Calm and focused',
        colors: {
            primary: '#0066CC',
            secondary: '#0052A3',
            background: '#E6F3FF',
            surface: '#FFFFFF',
            text: '#003366',
            border: '#B3D9FF'
        },
        isDark: false
    },
    {
        id: 'forest',
        name: 'Forest Green',
        icon: '🌲',
        description: 'Natural and peaceful',
        colors: {
            primary: '#2D5A2D',
            secondary: '#1F3F1F',
            background: '#F0F4F0',
            surface: '#FFFFFF',
            text: '#1A3319',
            border: '#C4D6C4'
        },
        isDark: false
    },
    {
        id: 'sunset',
        name: 'Sunset Warm',
        icon: '🌅',
        description: 'Warm and energetic',
        colors: {
            primary: '#FF6B35',
            secondary: '#E55100',
            background: '#FFF9F5',
            surface: '#FFFFFF',
            text: '#4A2C2A',
            border: '#FFD4C1'
        },
        isDark: false
    },
    {
        id: 'noble',
        name: 'Noble Purple',
        icon: '👑',
        description: 'Royal and elegant',
        colors: {
            primary: '#6B35FF',
            secondary: '#5425CC',
            background: '#F3E6FF',
            surface: '#FFFFFF',
            text: '#2D1B69',
            border: '#D4B3FF'
        },
        isDark: false
    },
    {
        id: 'cyber',
        name: 'Cyberpunk',
        icon: '🤖',
        description: 'Futuristic neon style',
        colors: {
            primary: '#00FFFF',
            secondary: '#FF00FF',
            background: '#0A0A0F',
            surface: '#1A0033',
            text: '#E0E0FF',
            border: '#6600CC',
            accent: '#00FF00'
        },
        isDark: true
    },
    {
        id: 'sakura',
        name: 'Sakura Pink',
        icon: '🌸',
        description: 'Soft and delicate',
        colors: {
            primary: '#FF69B4',
            secondary: '#FF1493',
            background: '#FFF0F5',
            surface: '#FFFFFF',
            text: '#8B008B',
            border: '#FFB6C1'
        },
        isDark: false
    },
    {
        id: 'midnight',
        name: 'Midnight Blue',
        icon: '🌌',
        description: 'Deep and mysterious',
        colors: {
            primary: '#4169E1',
            secondary: '#1E3A8A',
            background: '#0F172A',
            surface: '#1E293B',
            text: '#E2E8F0',
            border: '#334155'
        },
        isDark: true
    },
    {
        id: 'terminal',
        name: 'Terminal Green',
        icon: '💻',
        description: 'Classic hacker style',
        colors: {
            primary: '#00FF00',
            secondary: '#008F11',
            background: '#0C0C0C',
            surface: '#1A1A1A',
            text: '#00FF00',
            border: '#003300'
        },
        isDark: true
    },
    {
        id: 'coffee',
        name: 'Coffee Brown',
        icon: '☕',
        description: 'Warm and cozy',
        colors: {
            primary: '#8B4513',
            secondary: '#654321',
            background: '#FFF8DC',
            surface: '#FFFEF7',
            text: '#3E2723',
            border: '#D2B48C'
        },
        isDark: false
    }
]

export class ThemeManager {
    private static currentTheme: string = 'claude'

    static setTheme(themeId: string) {
        const theme = THEMES.find(t => t.id === themeId)
        if (!theme) return

        this.currentTheme = themeId
        this.applyTheme(theme)

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedTheme', themeId)
        }
    }

    static applyTheme(theme: Theme) {
        const root = document.documentElement

        // Apply colors
        root.style.setProperty('--color-brand-primary', theme.colors.primary)
        root.style.setProperty('--color-brand-secondary', theme.colors.secondary)
        root.style.setProperty('--color-bg-primary', theme.colors.background)
        root.style.setProperty('--color-surface', theme.colors.surface)
        root.style.setProperty('--color-text-primary', theme.colors.text)
        root.style.setProperty('--color-border-light', theme.colors.border)

        // Set dark mode attribute
        if (theme.isDark) {
            document.body.setAttribute('data-theme', 'dark')
        } else {
            document.body.removeAttribute('data-theme')
        }

        // Adjust other colors based on theme
        if (theme.isDark) {
            root.style.setProperty('--color-bg-secondary', this.lighten(theme.colors.surface, 10))
            root.style.setProperty('--color-bg-tertiary', this.lighten(theme.colors.surface, 20))
            root.style.setProperty('--color-text-secondary', this.lighten(theme.colors.text, -30))
            root.style.setProperty('--color-text-tertiary', this.lighten(theme.colors.text, -50))
        } else {
            root.style.setProperty('--color-bg-secondary', this.darken(theme.colors.background, 5))
            root.style.setProperty('--color-bg-tertiary', this.darken(theme.colors.background, 10))
            root.style.setProperty('--color-text-secondary', this.lighten(theme.colors.text, 30))
            root.style.setProperty('--color-text-tertiary', this.lighten(theme.colors.text, 50))
        }
    }

    static getCurrentTheme(): string {
        return this.currentTheme
    }

    static getTheme(id: string): Theme | undefined {
        return THEMES.find(t => t.id === id)
    }

    static loadSavedTheme() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedTheme')
            if (saved) {
                this.setTheme(saved)
            }
        }
    }

    private static lighten(color: string, amount: number): string {
        // Simple color lightening function
        const num = parseInt(color.replace('#', ''), 16)
        const amt = Math.round(2.55 * Math.abs(amount))
        const R = (num >> 16) + amt
        const G = (num >> 8 & 0x00FF) + amt
        const B = (num & 0x0000FF) + amt
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16)
            .slice(1)
    }

    private static darken(color: string, amount: number): string {
        return this.lighten(color, -amount)
    }
}