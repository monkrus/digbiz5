/**
 * Authentication Integration Tests
 *
 * This test suite validates the integration between authentication components including:
 * - Full authentication flow from login to token refresh
 * - Integration between auth service, token storage, and Redux store
 * - Social login integration with token storage
 * - Automatic token refresh behavior
 * - Error handling across authentication layers
 */

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../../src/store/authSlice';
import { useAuth } from '../../src/hooks/useAuth';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  JWTTokens,
  User,
  SocialLoginData,
} from '../../src/types/auth';
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';

// Mock external dependencies
jest.mock('react-native-mmkv');
jest.mock('crypto-js');
jest.mock('@react-native-google-signin/google-signin');
jest.mock('../../src/utils/tokenUtils');
jest.mock('../../src/utils/config');

// Mock fetch globally
global.fetch = jest.fn();

describe('Authentication Integration', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockTokens: JWTTokens = {
    accessToken: 'integration-access-token',
    refreshToken: 'integration-refresh-token',
    expiresIn: 3600,
    refreshExpiresIn: 604800,
  };

  const mockUser: User = {
    id: 'integration-user-123',
    email: 'integration@test.com',
    name: 'Integration Test User',
    avatar: null,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAuthResponse: AuthResponse = {
    success: true,
    message: 'Authentication successful',
    tokens: mockTokens,
    user: mockUser,
  };

  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Redux store
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });

    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAuthResponse),
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  const createWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);

  describe('Complete Login Flow Integration', () => {
    it('should complete full login flow and update all layers', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock token storage methods
      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();
      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const hasValidTokensSpy = jest
        .spyOn(tokenStorage, 'hasValidTokens')
        .mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      // Perform login
      await act(async () => {
        await result.current.login(credentials);
      });

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      );

      // Verify token storage integration
      expect(setTokensSpy).toHaveBeenCalledWith(mockTokens);

      // Verify Redux store update
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      setTokensSpy.mockRestore();
      getTokensSpy.mockRestore();
      hasValidTokensSpy.mockRestore();
    });

    it('should handle login failure and update error state', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        try {
          await result.current.login(credentials);
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify Redux store error state
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('Registration Flow Integration', () => {
    it('should complete registration flow and initialize user session', async () => {
      const registerData: RegisterData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.register(registerData);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New User',
            email: 'newuser@example.com',
            password: 'password123',
          }),
        }),
      );

      expect(setTokensSpy).toHaveBeenCalledWith(mockTokens);

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);

      setTokensSpy.mockRestore();
    });
  });

  describe('Social Login Integration', () => {
    it('should integrate Google OAuth with authentication service', async () => {
      const googleLoginData: SocialLoginData = {
        accessToken: 'google-server-auth-code',
        idToken: 'google-id-token',
        profile: {
          id: 'google-123',
          email: 'user@gmail.com',
          name: 'Google User',
          avatar: 'https://google.com/photo.jpg',
        },
      };

      // Google auth service would be used in actual implementation
      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();

      // Mock Google SignIn response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.loginWithGoogle(googleLoginData);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/oauth/google'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(googleLoginData),
        }),
      );

      expect(setTokensSpy).toHaveBeenCalledWith(mockTokens);

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);

      setTokensSpy.mockRestore();
    });

    it('should integrate LinkedIn OAuth with authentication service', async () => {
      const linkedinLoginData: SocialLoginData = {
        accessToken: 'linkedin-access-token',
        profile: {
          id: 'linkedin-123',
          email: 'user@linkedin.com',
          name: 'LinkedIn User',
          avatar: 'https://linkedin.com/photo.jpg',
        },
      };

      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.loginWithLinkedIn(linkedinLoginData);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/oauth/linkedin'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(linkedinLoginData),
        }),
      );

      expect(setTokensSpy).toHaveBeenCalledWith(mockTokens);

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);

      setTokensSpy.mockRestore();
    });
  });

  describe('Token Refresh Integration', () => {
    it('should automatically refresh tokens when needed', async () => {
      const refreshedTokens: JWTTokens = {
        ...mockTokens,
        accessToken: 'new-access-token',
      };

      const refreshResponse = {
        success: true,
        tokens: refreshedTokens,
      };

      // Setup initial authenticated state
      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();

      // Mock refresh token API call
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(refreshResponse),
        } as Response)
        // Mock get current user API call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: mockUser }),
        } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      // Perform token refresh
      await act(async () => {
        await result.current.refreshTokens();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: mockTokens.refreshToken }),
        }),
      );

      expect(setTokensSpy).toHaveBeenCalledWith(refreshedTokens);

      getTokensSpy.mockRestore();
      setTokensSpy.mockRestore();
    });

    it('should handle token refresh failure and clear auth state', async () => {
      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const removeTokensSpy = jest
        .spyOn(tokenStorage, 'removeTokens')
        .mockResolvedValue();

      mockFetch.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        try {
          await result.current.refreshTokens();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(removeTokensSpy).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('Session expired. Please login again.');

      getTokensSpy.mockRestore();
      removeTokensSpy.mockRestore();
    });
  });

  describe('Logout Integration', () => {
    it('should complete logout flow and clear all auth data', async () => {
      // Setup initial authenticated state
      await act(async () => {
        store.dispatch(
          authSlice.actions.loginSuccess({
            tokens: mockTokens,
            user: mockUser,
          }),
        );
      });

      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const removeTokensSpy = jest
        .spyOn(tokenStorage, 'removeTokens')
        .mockResolvedValue();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.logout();
      });

      // Verify logout API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: mockTokens.refreshToken }),
        }),
      );

      // Verify token storage cleared
      expect(removeTokensSpy).toHaveBeenCalled();

      // Verify Redux store cleared
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();

      getTokensSpy.mockRestore();
      removeTokensSpy.mockRestore();
    });

    it('should clear local state even if server logout fails', async () => {
      // Setup initial authenticated state
      await act(async () => {
        store.dispatch(
          authSlice.actions.loginSuccess({
            tokens: mockTokens,
            user: mockUser,
          }),
        );
      });

      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const removeTokensSpy = jest
        .spyOn(tokenStorage, 'removeTokens')
        .mockResolvedValue();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.logout();
      });

      // Verify local state cleared despite server error
      expect(removeTokensSpy).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      getTokensSpy.mockRestore();
      removeTokensSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('Authentication State Persistence', () => {
    it('should restore authentication state from storage on app start', async () => {
      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const hasValidTokensSpy = jest
        .spyOn(tokenStorage, 'hasValidTokens')
        .mockResolvedValue(true);

      // Mock getCurrentUser API call
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(getTokensSpy).toHaveBeenCalled();
      expect(hasValidTokensSpy).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);

      getTokensSpy.mockRestore();
      hasValidTokensSpy.mockRestore();
    });

    it('should not restore auth state when tokens are invalid', async () => {
      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(null);
      const hasValidTokensSpy = jest
        .spyOn(tokenStorage, 'hasValidTokens')
        .mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.initializeAuth();
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      getTokensSpy.mockRestore();
      hasValidTokensSpy.mockRestore();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle authentication service errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock service throwing an error
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        try {
          await result.current.login(credentials);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Network failure');

      consoleSpy.mockRestore();
    });

    it('should handle token storage errors during authentication', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockRejectedValue(new Error('Storage failed'));

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        try {
          await result.current.login(credentials);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      // Should handle storage error gracefully
      expect(consoleSpy).toHaveBeenCalled();

      setTokensSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent login requests properly', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      // Make multiple concurrent login requests
      const loginPromises = [
        result.current.login(credentials),
        result.current.login(credentials),
        result.current.login(credentials),
      ];

      await act(async () => {
        await Promise.all(loginPromises);
      });

      // API should be called multiple times (no deduplication for login)
      expect(mockFetch).toHaveBeenCalledTimes(3);

      setTokensSpy.mockRestore();
    });

    it('should deduplicate concurrent token refresh requests', async () => {
      const getTokensSpy = jest
        .spyOn(tokenStorage, 'getTokens')
        .mockResolvedValue(mockTokens);
      const setTokensSpy = jest
        .spyOn(tokenStorage, 'setTokens')
        .mockResolvedValue();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, tokens: mockTokens }),
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper,
      });

      // Make multiple concurrent refresh requests
      const refreshPromises = [
        result.current.refreshTokens(),
        result.current.refreshTokens(),
        result.current.refreshTokens(),
      ];

      await act(async () => {
        await Promise.all(refreshPromises);
      });

      // API should only be called once due to deduplication
      expect(mockFetch).toHaveBeenCalledTimes(1);

      getTokensSpy.mockRestore();
      setTokensSpy.mockRestore();
    });
  });
});
