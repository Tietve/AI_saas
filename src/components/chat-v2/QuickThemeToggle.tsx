import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeManager } from '@/lib/theme/theme-manager'

export function QuickThemeToggle() {
    const [isDark, setIsDark] = React.useState(false)

    React.useEffect(() => {
        try {
            const id = ThemeManager.getCurrentTheme()
            setIsDark(id === 'dark')
        } catch {}
    }, [])

    const toggleTheme = () => {
        if (isDark) {
            ThemeManager.setTheme('claude')
            setIsDark(false)
        } else {
            ThemeManager.setTheme('dark')
            setIsDark(true)
        }
    }

    return (
        <Button
            variant="ghost"
            icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
            onClick={toggleTheme}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
        />
    )
}
