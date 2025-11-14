export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface User {
  userId: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  ok: boolean;
  user?: User;
  redirectUrl?: string;
  needsVerification?: boolean;
  message?: string;
  error?: string;
}
