/**
 * Authentication Service
 *
 * Main authentication service that handles email/password auth, social logins,
 * token management, and integrates with secure token storage.
 */

import {
  AuthService,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
  SocialLoginData,
  User,
  JWTTokens,
  PasswordResetData,
  PasswordUpdateData,
} from '../types/auth';
import { tokenStorage } from './tokenStorage';
import { validateTokens, isRefreshTokenValid } from '../utils/tokenUtils';
import { AppConfig } from '../utils/config';

/**
 * HTTP Client for API requests
 */
class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = AppConfig.apiUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      timeout: AppConfig.apiTimeout,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  setAuthToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders.Authorization;
  }
}

/**
 * Main Authentication Service Implementation
 */
export class AuthenticationService implements AuthService {
  private apiClient: APIClient;
  private refreshPromise: Promise<RefreshTokenResponse> | null = null;

  constructor() {
    this.apiClient = new APIClient();
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private async initializeAuthState(): Promise<void> {
    try {
      const tokens = await tokenStorage.getTokens();
      if (tokens && (await tokenStorage.hasValidTokens())) {
        this.apiClient.setAuthToken(tokens.accessToken);
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      if (response.success && response.tokens) {
        await this.handleSuccessfulAuth(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  /**
   * Register new user with email and password
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await this.apiClient.post<AuthResponse>(
        '/auth/register',
        {
          email: data.email.toLowerCase().trim(),
          password: data.password,
          name: data.name.trim(),
        },
      );

      if (response.success && response.tokens) {
        await this.handleSuccessfulAuth(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Registration failed',
      );
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate server-side session
      const tokens = await tokenStorage.getTokens();
      if (tokens) {
        await this.apiClient.post('/auth/logout', {
          refreshToken: tokens.refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if server call fails
    } finally {
      await this.clearAuthState();
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(data: SocialLoginData): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>(
        '/auth/oauth/google',
        {
          accessToken: data.accessToken,
          idToken: data.idToken,
          profile: data.profile,
        },
      );

      if (response.success && response.tokens) {
        await this.handleSuccessfulAuth(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Google login failed',
      );
    }
  }

  /**
   * Login with LinkedIn OAuth
   */
  async loginWithLinkedIn(data: SocialLoginData): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>(
        '/auth/oauth/linkedin',
        {
          accessToken: data.accessToken,
          profile: data.profile,
        },
      );

      if (response.success && response.tokens) {
        await this.handleSuccessfulAuth(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('LinkedIn login failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'LinkedIn login failed',
      );
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(
    data: PasswordResetData,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiClient.post('/auth/password/reset-request', {
        email: data.email.toLowerCase().trim(),
      });
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Password reset request failed',
      );
    }
  }

  /**
   * Update password with reset token
   */
  async updatePassword(
    data: PasswordUpdateData,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      return await this.apiClient.post('/auth/password/reset-confirm', {
        token: data.token,
        newPassword: data.newPassword,
      });
    } catch (error) {
      console.error('Password update failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Password update failed',
      );
    }
  }

  /**
   * Refresh JWT tokens
   */
  async refreshTokens(): Promise<RefreshTokenResponse> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(): Promise<RefreshTokenResponse> {
    try {
      const tokens = await tokenStorage.getTokens();

      if (!tokens || !isRefreshTokenValid(tokens)) {
        throw new Error('No valid refresh token available');
      }

      const response = await this.apiClient.post<RefreshTokenResponse>(
        '/auth/refresh',
        {
          refreshToken: tokens.refreshToken,
        },
      );

      if (response.success && response.tokens) {
        await this.handleSuccessfulAuth(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      await this.clearAuthState();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Validate token with server
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await this.apiClient.post<{ valid: boolean }>(
        '/auth/validate',
        { token },
      );
      return response.valid;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) {
        return null;
      }

      // Ensure token is valid and refresh if needed
      const validation = validateTokens(tokens);
      if (validation.shouldRefresh && isRefreshTokenValid(tokens)) {
        await this.refreshTokens();
      } else if (validation.isExpired) {
        return null;
      }

      const response = await this.apiClient.get<{ user: User }>('/auth/me');
      return response.user;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await this.apiClient.put<{ user: User }>(
        '/auth/profile',
        data,
      );
      return response.user;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Profile update failed',
      );
    }
  }

  /**
   * Handle successful authentication
   */
  private async handleSuccessfulAuth(tokens: JWTTokens): Promise<void> {
    await tokenStorage.setTokens(tokens);
    this.apiClient.setAuthToken(tokens.accessToken);
  }

  /**
   * Clear authentication state
   */
  private async clearAuthState(): Promise<void> {
    await tokenStorage.removeTokens();
    this.apiClient.removeAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await tokenStorage.hasValidTokens();
  }

  /**
   * Get stored tokens
   */
  async getStoredTokens(): Promise<JWTTokens | null> {
    return await tokenStorage.getTokens();
  }
}

// Default instance
export const authService = new AuthenticationService();
