import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ROUTES } from '@/shared/constants/routes';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    retry: false,
    retryDelay: 0,
    staleTime: Infinity,
    gcTime: Infinity, // Keep cached forever to prevent re-fetching
    // Prevent refetch on window focus or reconnect to avoid continuous 401s
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false, // CRITICAL: Disable polling/interval refetch
    refetchIntervalInBackground: false,
    // IMPORTANT: notifyOnChangeProps to prevent unnecessary re-renders
    notifyOnChangeProps: ['data', 'error'],
    // Suppress React Query errors in console for 401 (expected when not logged in)
    meta: {
      errorMessage: 'Auth check failed',
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate(ROUTES.CHAT);
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate(ROUTES.CHAT);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      console.log('✅ Logout API success, clearing cache and redirecting...');
      queryClient.clear();
      localStorage.clear(); // Clear any localStorage data
      sessionStorage.clear(); // Clear any sessionStorage data
      console.log('🗑️ Cache and storage cleared');
      console.log('🔀 Navigating to login page...');
      navigate(ROUTES.LOGIN);
    },
    onError: (error) => {
      console.error('❌ Logout API error:', error);
      // Even on error, clear cache and redirect
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      navigate(ROUTES.LOGIN);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    isSignupLoading: signupMutation.isPending,
    signupError: signupMutation.error,
  };
};
