import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import { Spinner } from '@/shared/ui';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected Route Component
 *
 * Checks if user is authenticated before rendering children.
 * If not authenticated, redirects to login page.
 * Preserves the attempted URL for redirect after login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <Spinner fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  // Save the current location to redirect back after login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
