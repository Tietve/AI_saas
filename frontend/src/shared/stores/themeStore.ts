import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeName } from '@/shared/config/theme';
import { themeCssClassMap } from '@/shared/config/theme';

interface ThemeState {
  themeName: ThemeName;
  darkMode: boolean;
  setTheme: (themeName: ThemeName) => void;
  toggleDarkMode: () => void;
  setDarkMode: (darkMode: boolean) => void;
  applyThemeToBody: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeName: 'default',
      darkMode: false, // Always start in light mode
      setTheme: (themeName) => {
        // Pure White and Pure Black are special - they auto-set dark mode
        if (themeName === 'white') {
          // Pure White forces light mode
          set({ themeName, darkMode: false });
        } else if (themeName === 'black') {
          // Pure Black forces dark mode
          set({ themeName, darkMode: true });
        } else {
          // Other themes just change theme, keep current dark mode
          set({ themeName });
        }
        // Apply theme immediately after setting
        setTimeout(() => get().applyThemeToBody(), 0);
      },
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
        // Apply dark mode immediately after toggle
        setTimeout(() => get().applyThemeToBody(), 0);
      },
      setDarkMode: (darkMode) => {
        set({ darkMode });
        // Apply dark mode immediately after setting
        setTimeout(() => get().applyThemeToBody(), 0);
      },
      applyThemeToBody: () => {
        const { themeName, darkMode } = get();

        // Remove all theme classes
        document.body.classList.remove(
          'dark',
          'theme-ocean',
          'theme-purple',
          'theme-orange',
          'theme-rose',
          'theme-lavender',
          'theme-mint',
          'theme-coral',
          'theme-white',
          'theme-black'
        );

        // Add dark mode class
        if (darkMode) {
          document.body.classList.add('dark');
        }

        // Add theme class
        const themeClass = themeCssClassMap[themeName];
        if (themeClass) {
          document.body.classList.add(themeClass);
        }
      },
    }),
    {
      name: 'app-theme-storage',
    }
  )
);
