import React from 'react';
import type { ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs those errors, and displays a fallback UI
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  private readonly MAX_RETRIES = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentWillUnmount() {
    // Clear retry timeout on unmount
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Automatic retry for transient errors (network, timeout, etc.)
    if (this.shouldAutoRetry(error) && this.state.retryCount < this.MAX_RETRIES) {
      const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000); // Exponential backoff
      console.log(`Auto-retrying in ${retryDelay}ms (attempt ${this.state.retryCount + 1}/${this.MAX_RETRIES})`);

      this.retryTimeout = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          retryCount: prev.retryCount + 1,
        }));
      }, retryDelay);
    }

    // TODO: Log to error reporting service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network errors, timeouts, and chunk loading errors
    const transientErrorPatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /loading chunk/i,
      /dynamically imported module/i,
    ];

    return transientErrorPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error fallback
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
