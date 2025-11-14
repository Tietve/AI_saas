import type { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * Public Route Component
 *
 * For pages that should only be accessible when NOT authenticated (login, signup).
 * No auth check needed - user will be redirected after successful login.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  // Simply render the public page without auth check
  // After successful login, the login mutation will redirect to chat
  return <>{children}</>;
}
