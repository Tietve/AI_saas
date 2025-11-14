import { apiClient } from '@/shared/api/client';
import type { LoginCredentials, SignupCredentials, AuthResponse, User } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/signin', credentials);
    return data;
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const { data} = await apiClient.post<AuthResponse>('/auth/signup', credentials);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<{ ok: boolean; user: User }>('/auth/me');
    return data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/signout');
  },

  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/verify-email', { token });
    return data;
  },

  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/reset-password', { token, password });
    return data;
  },
};
