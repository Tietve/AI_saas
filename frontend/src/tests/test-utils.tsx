import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/shared/config/theme';

// Create a test query client with default options
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// All providers wrapper for testing
function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();
  const theme = createAppTheme('default', 'light');

  return (
    <QueryClientProvider client={queryClient}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </QueryClientProvider>
  );
}

// Custom render function with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render method
export { customRender as render, createTestQueryClient };
