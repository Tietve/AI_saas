/**
 * React Error Boundary
 *
 * Catches errors in React component tree and displays fallback UI
 * Also sends errors to Sentry for tracking
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    // Log to Pino
    logger.error(
      {
        err: error,
        componentStack: errorInfo.componentStack,
      },
      'React error boundary caught error'
    )

    // Send to Sentry
    Sentry.withScope((scope) => {
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      })
      Sentry.captureException(error)
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-800">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-red-600">
              {process.env.NODE_ENV === 'development'
                ? this.state.error?.message
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Page-level Error Boundary
 *
 * Use this for wrapping entire pages
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold">Page Error</h1>
            <p className="text-gray-600">
              This page encountered an error and couldn't be displayed.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.history.back()}
                className="rounded bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-level Error Boundary
 *
 * Use this for wrapping specific components that might fail
 */
export function ComponentErrorBoundary({
  children,
  componentName,
}: {
  children: ReactNode
  componentName?: string
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            {componentName
              ? `Failed to load ${componentName}`
              : 'Failed to load component'}
          </p>
        </div>
      }
      onError={(error) => {
        logger.warn(
          { err: error, componentName },
          `Component ${componentName || 'unknown'} failed to render`
        )
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Async Error Boundary
 *
 * For components that load data asynchronously
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-2 text-4xl">⚠️</div>
            <p className="text-sm text-gray-600">Failed to load content</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Global Error Handler Hook
 *
 * Use in layout.tsx to catch unhandled errors globally
 */
export function useGlobalErrorHandler() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.error(
        { err: event.error, message: event.message },
        'Unhandled error'
      )
      Sentry.captureException(event.error)
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.error(
        { reason: event.reason },
        'Unhandled promise rejection'
      )
      Sentry.captureException(event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])
}
