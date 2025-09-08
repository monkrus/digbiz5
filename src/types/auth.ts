/**
 * Authentication Types and Interfaces
 *
 * Defines all authentication-related types, interfaces, and enums
 * for email/password, social login, and JWT token management.
 */

// Authentication provider types
export type AuthProvider = 'email' | 'google' | 'linkedin';

// User authentication data
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: AuthProvider;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// JWT token structure
export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  refreshExpiresIn?: number; // seconds for refresh token expiry
  tokenType: 'Bearer';
}

// Authentication state
export interface AuthState {
  user: User | null;
  tokens: JWTTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

// Social login data
export interface SocialLoginData {
  provider: 'google' | 'linkedin';
  accessToken: string;
  idToken?: string; // For Google
  profile: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

// Password reset
export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// API response types
export interface AuthResponse {
  success: boolean;
  user: User;
  tokens: JWTTokens;
  message?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  tokens: JWTTokens;
}

// Auth service errors
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Token storage interface
export interface TokenStorage {
  getTokens(): Promise<JWTTokens | null>;
  setTokens(tokens: JWTTokens): Promise<void>;
  removeTokens(): Promise<void>;
  hasValidTokens(): Promise<boolean>;
}

// Auth service interface
export interface AuthService {
  // Email/password authentication
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;

  // Social authentication
  loginWithGoogle(data: SocialLoginData): Promise<AuthResponse>;
  loginWithLinkedIn(data: SocialLoginData): Promise<AuthResponse>;

  // Password management
  requestPasswordReset(
    data: PasswordResetData,
  ): Promise<{ success: boolean; message: string }>;
  updatePassword(
    data: PasswordUpdateData,
  ): Promise<{ success: boolean; message: string }>;

  // Token management
  refreshTokens(): Promise<RefreshTokenResponse>;
  validateToken(token: string): Promise<boolean>;

  // User management
  getCurrentUser(): Promise<User | null>;
  updateProfile(data: Partial<User>): Promise<User>;
}

// Redux action types
export enum AuthActionTypes {
  LOGIN_REQUEST = 'auth/loginRequest',
  LOGIN_SUCCESS = 'auth/loginSuccess',
  LOGIN_FAILURE = 'auth/loginFailure',

  REGISTER_REQUEST = 'auth/registerRequest',
  REGISTER_SUCCESS = 'auth/registerSuccess',
  REGISTER_FAILURE = 'auth/registerFailure',

  LOGOUT_REQUEST = 'auth/logoutRequest',
  LOGOUT_SUCCESS = 'auth/logoutSuccess',
  LOGOUT_FAILURE = 'auth/logoutFailure',

  REFRESH_TOKEN_REQUEST = 'auth/refreshTokenRequest',
  REFRESH_TOKEN_SUCCESS = 'auth/refreshTokenSuccess',
  REFRESH_TOKEN_FAILURE = 'auth/refreshTokenFailure',

  SOCIAL_LOGIN_REQUEST = 'auth/socialLoginRequest',
  SOCIAL_LOGIN_SUCCESS = 'auth/socialLoginSuccess',
  SOCIAL_LOGIN_FAILURE = 'auth/socialLoginFailure',

  SET_USER = 'auth/setUser',
  CLEAR_ERROR = 'auth/clearError',
  SET_LOADING = 'auth/setLoading',
}

// OAuth configuration
export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scopes: string[];
  };
  linkedin: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scopes: string[];
  };
}

// Token validation result
export interface TokenValidation {
  isValid: boolean;
  isExpired: boolean;
  expiresIn?: number;
  shouldRefresh: boolean;
}
