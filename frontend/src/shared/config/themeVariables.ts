/**
 * Theme Variables Configuration
 * 8 color themes for the application
 * Based on design from chat_code.html
 */

export interface ThemeColors {
  name: string;
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  gradient: {
    main: string;
    sidebar: string;
    button: string;
  };
}

export const themeColors: Record<string, ThemeColors> = {
  default: {
    name: 'Fir Green',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      sidebar: 'linear-gradient(180deg, #065f46 0%, #047857 100%)',
      button: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  },

  ocean: {
    name: 'Ocean Blue',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      sidebar: 'linear-gradient(180deg, #075985 0%, #0369a1 100%)',
      button: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    },
  },

  purple: {
    name: 'Purple Dream',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      sidebar: 'linear-gradient(180deg, #6b21a8 0%, #7e22ce 100%)',
      button: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    },
  },

  orange: {
    name: 'Sunset Orange',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      sidebar: 'linear-gradient(180deg, #9a3412 0%, #c2410c 100%)',
      button: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    },
  },

  rose: {
    name: 'Rose Pink',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      sidebar: 'linear-gradient(180deg, #9f1239 0%, #be123c 100%)',
      button: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    },
  },

  lavender: {
    name: 'Lavender',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      sidebar: 'linear-gradient(180deg, #5b21b6 0%, #6d28d9 100%)',
      button: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
  },

  mint: {
    name: 'Mint Fresh',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
      sidebar: 'linear-gradient(180deg, #115e59 0%, #0f766e 100%)',
      button: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    },
  },

  coral: {
    name: 'Coral Red',
    primary: {
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
    gradient: {
      main: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      sidebar: 'linear-gradient(180deg, #991b1b 0%, #b91c1c 100%)',
      button: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
  },
};

/**
 * Get theme by ID
 */
export function getTheme(themeId: string): ThemeColors {
  return themeColors[themeId] || themeColors.default;
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Object.keys(themeColors);
}

/**
 * Get all themes for display
 */
export function getAllThemes(): Array<{ id: string; name: string; colors: ThemeColors }> {
  return Object.entries(themeColors).map(([id, colors]) => ({
    id,
    name: colors.name,
    colors,
  }));
}
