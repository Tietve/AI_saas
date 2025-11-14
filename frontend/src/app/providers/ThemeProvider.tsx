import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useMemo, useEffect } from 'react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { createAppTheme } from '@/shared/config/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeName, darkMode, applyThemeToBody } = useThemeStore();

  const theme = useMemo(
    () => createAppTheme(themeName, darkMode ? 'dark' : 'light'),
    [themeName, darkMode]
  );

  // Apply theme classes to body element on mount and theme changes
  useEffect(() => {
    applyThemeToBody();
  }, [applyThemeToBody, themeName, darkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
