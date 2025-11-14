import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { Spinner } from '@/shared/ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage').then(m => ({ default: m.ChatPage })));
const PricingPage = lazy(() => import('@/pages/billing/PricingPage').then(m => ({ default: m.PricingPage })));
const SubscriptionPage = lazy(() => import('@/pages/billing/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));
const MarkdownTestPage = lazy(() => import('@/pages/test/MarkdownTest').then(m => ({ default: m.MarkdownTestPage })));
const ChatInputTestPage = lazy(() => import('@/pages/test/ChatInputTest').then(m => ({ default: m.ChatInputTestPage })));
const MultiTurnTestPage = lazy(() => import('@/pages/test/MultiTurnTest').then(m => ({ default: m.MultiTurnTestPage })));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Loading fallback component
const PageLoader = () => (
  <Spinner fullScreen message="Loading..." />
);

const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.SIGNUP,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <SignupPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.CHAT,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ChatPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: `${ROUTES.CHAT}/:conversationId`,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ChatPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.PLANS,
    element: (
      <Suspense fallback={<PageLoader />}>
        <PricingPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.SUBSCRIPTION,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <SubscriptionPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.DOCUMENTS,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <DocumentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/test',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MarkdownTestPage />
      </Suspense>
    ),
  },
  {
    path: '/test/chat-input',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ChatInputTestPage />
      </Suspense>
    ),
  },
  {
    path: '/test/multi-turn',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MultiTurnTestPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.CHAT} replace />,
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
