import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Hook for auth actions only (login, signup, logout)
 * Does NOT query current user status - use this in login/signup forms
 */
export const useAuthActions = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    isSignupLoading: signupMutation.isPending,
    signupError: signupMutation.error,
  };
};
