import axios from 'axios';

// Unified API client via API Gateway (port 4000)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true, // CRITICAL: Include httpOnly cookies
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Aliases for backward compatibility
export const chatClient = apiClient;
export const billingClient = apiClient;

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
    }

    // Suppress 401 errors in console for auth/me endpoint (expected when not logged in)
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
      // Silently reject without logging
      return Promise.reject({ ...error, silent: true });
    }

    // For 401 errors, let React Query handle them properly
    // The ProtectedRoute component will redirect to login based on auth state
    return Promise.reject(error);
  }
);
