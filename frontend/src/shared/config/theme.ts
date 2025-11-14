import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Theme color palettes from your HTML
// Theme IDs matching themeVariables.css
export const themeColors = {
  default: {
    50: '#f0fdf4',
    100: '#ecfdf5',
    200: '#d1fae5',
    300: '#a7f3d0',
    400: '#6ee7b7',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  ocean: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  lavender: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  mint: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  coral: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  white: {
    50: '#ffffff',
    100: '#fafafa',
    200: '#f5f5f5',
    300: '#e5e5e5',
    400: '#d4d4d4',
    500: '#a3a3a3',
    600: '#737373',
    700: '#525252',
    800: '#404040',
    900: '#262626',
  },
  black: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
};

export type ThemeName = keyof typeof themeColors;

export const themeNames: ThemeName[] = [
  'default',
  'ocean',
  'purple',
  'orange',
  'rose',
  'lavender',
  'mint',
  'coral',
  'white',
  'black',
];

export const themeDisplayNames: Record<ThemeName, string> = {
  default: 'Fir Green',
  ocean: 'Ocean Blue',
  purple: 'Purple Dream',
  orange: 'Sunset Orange',
  rose: 'Rose Pink',
  lavender: 'Lavender',
  mint: 'Mint Fresh',
  coral: 'Coral Red',
  white: 'Pure White',
  black: 'Pure Black',
};

// Map theme IDs to CSS class names for body element
export const themeCssClassMap: Record<ThemeName, string> = {
  default: '', // No class needed for default theme
  ocean: 'theme-ocean',
  purple: 'theme-purple',
  orange: 'theme-orange',
  rose: 'theme-rose',
  lavender: 'theme-lavender',
  mint: 'theme-mint',
  coral: 'theme-coral',
  white: 'theme-white',
  black: 'theme-black',
};

// Create MUI theme for each color palette
export const createAppTheme = (themeName: ThemeName, mode: 'light' | 'dark') => {
  const colors = themeColors[themeName];

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: colors[500],
        light: colors[300],
        dark: colors[700],
        contrastText: '#ffffff',
      },
      secondary: {
        main: colors[400],
        light: colors[200],
        dark: colors[600],
        contrastText: mode === 'dark' ? '#ffffff' : '#000000',
      },
      background: {
        default: mode === 'dark' ? colors[900] : colors[50],
        paper: mode === 'dark' ? colors[800] : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? colors[50] : colors[900],
        secondary: mode === 'dark' ? colors[200] : colors[600],
      },
      divider: mode === 'dark' ? colors[700] : colors[200],
    },
    typography: {
      fontFamily: '"Inter", "system-ui", "sans-serif"',
      h1: {
        fontFamily: '"Playfair Display", "serif"',
        fontWeight: 700,
      },
      h2: {
        fontFamily: '"Playfair Display", "serif"',
        fontWeight: 700,
      },
      h3: {
        fontFamily: '"Playfair Display", "serif"',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Playfair Display", "serif"',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'dark'
              ? '0 4px 6px rgba(0, 0, 0, 0.3)'
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
