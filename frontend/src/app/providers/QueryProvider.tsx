import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1, // Reduce retry attempts
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )}
  </QueryClientProvider>
);
