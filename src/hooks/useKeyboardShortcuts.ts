import { useEffect } from 'react'
import { ThemeManager } from '@/lib/theme/theme-manager'

export function useKeyboardShortcuts() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + T: Open theme selector
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault()
                // Trigger theme selector open
                const themeButton = document.querySelector('[title="Change Theme"]')
                if (themeButton instanceof HTMLElement) {
                    themeButton.click()
                }
            }

            // Ctrl/Cmd + Shift + D: Toggle dark mode
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault()
                const current = ThemeManager.getCurrentTheme()
                if (current === 'dark' || current === 'midnight' || current === 'cyber') {
                    ThemeManager.setTheme('claude')
                } else {
                    ThemeManager.setTheme('dark')
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])
}
