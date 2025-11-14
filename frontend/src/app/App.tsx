import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { AppRouter } from './routes';
import './styles/globals.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <OfflineBanner />
          <AppRouter />
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
