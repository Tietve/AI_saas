import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'default' | 'ocean' | 'purple' | 'orange' | 'rose' | 'lavender' | 'mint' | 'coral' | 'white' | 'black';

interface ThemeStore {
  theme: ThemeName;
  darkMode: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'default',
      darkMode: false,

      setTheme: (theme) => {
        // Remove all theme classes
        document.body.classList.remove(
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

        // Add new theme class if not default
        if (theme !== 'default') {
          document.body.classList.add(`theme-${theme}`);
        }

        set({ theme });
      },

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;

          if (newDarkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }

          return { darkMode: newDarkMode };
        });
      },
    }),
    {
      name: 'firbox-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply saved theme on load
          if (state.theme !== 'default') {
            document.body.classList.add(`theme-${state.theme}`);
          }
          if (state.darkMode) {
            document.body.classList.add('dark-mode');
          }
        }
      },
    }
  )
);

export const themeNames: Record<ThemeName, string> = {
  default: '🌲 Fir Green',
  ocean: '🌊 Ocean Blue',
  purple: '💜 Purple Dream',
  orange: '🌅 Sunset Orange',
  rose: '🌹 Rose Pink',
  lavender: '💐 Lavender',
  mint: '🍃 Mint Fresh',
  coral: '🪸 Coral Red',
  white: 'Pure White',
  black: 'Pure Black',
};

export const themeColors: Record<ThemeName, { primary: string; secondary: string; tertiary: string }> = {
  default: { primary: '#10b981', secondary: '#059669', tertiary: '#047857' },
  ocean: { primary: '#0ea5e9', secondary: '#0284c7', tertiary: '#0369a1' },
  purple: { primary: '#a855f7', secondary: '#9333ea', tertiary: '#7e22ce' },
  orange: { primary: '#f97316', secondary: '#ea580c', tertiary: '#c2410c' },
  rose: { primary: '#f43f5e', secondary: '#e11d48', tertiary: '#be123c' },
  lavender: { primary: '#a855f7', secondary: '#9333ea', tertiary: '#7e22ce' },
  mint: { primary: '#14b8a6', secondary: '#0d9488', tertiary: '#0f766e' },
  coral: { primary: '#e53e3e', secondary: '#c53030', tertiary: '#9b2c2c' },
  white: { primary: '#a3a3a3', secondary: '#737373', tertiary: '#525252' },
  black: { primary: '#71717a', secondary: '#52525b', tertiary: '#3f3f46' },
};
