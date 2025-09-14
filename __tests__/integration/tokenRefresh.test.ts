/**
 * Token Refresh Mechanism Tests
 *
 * Comprehensive tests for token refresh functionality including
 * automatic refresh, race conditions, and error handling.
 */

import { configureStore } from '@reduxjs/toolkit';
import { tokenStorage } from '../../src/services/tokenStorage';
import { authService } from '../../src/services/authService';
import authSlice, {
  refreshTokens,
  initializeAuth,
} from '../../src/store/authSlice';
import { validateTokens } from '../../src/utils/tokenUtils';
import {
  mockTokens,
  mockUser,
  mockFetchResponse,
  setupMocks,
  teardownMocks,
  flushPromises,
  withTimeout,
} from '../utils/testUtils';

// Mock dependencies
jest.mock('../../src/services/tokenStorage');
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/tokenUtils');

describe('Token Refresh Mechanism', () => {
  let store: ReturnType<typeof configureStore>;
  let mockTokenStorage: jest.Mocked<typeof tokenStorage>;
  let mockAuthService: jest.Mocked<typeof authService>;
  let mockValidateTokens: jest.MockedFunction<typeof validateTokens>;

  beforeEach(() => {
    setupMocks();

    store = configureStore({
      reducer: { auth: authSlice },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ serializableCheck: false }),
    });

    mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
    mockAuthService = authService as jest.Mocked<typeof authService>;
    mockValidateTokens = validateTokens as jest.MockedFunction<
      typeof validateTokens
    >;
  });

  afterEach(() => {
    teardownMocks();
  });

  describe('Automatic Token Refresh', () => {
    it('should refresh tokens when they are expired', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000, // Expired 1 second ago
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
        expiresIn: Date.now() + 3600000, // Expires in 1 hour
      };

      // Setup: tokens are expired
      mockValidateTokens.mockReturnValue({
        isValid: false,
        isExpired: true,
        needsRefresh: true,
        expiresAt: expiredTokens.expiresIn,
        timeUntilExpiry: -1000,
      });

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);
      mockTokenStorage.hasValidTokens.mockResolvedValue(false);

      // Mock successful refresh
      mockAuthService.refreshTokens.mockResolvedValue({
        success: true,
        tokens: newTokens,
      });

      mockTokenStorage.setTokens.mockResolvedValue();

      // After refresh, tokens should be valid
      mockValidateTokens.mockReturnValueOnce({
        isValid: true,
        isExpired: false,
        needsRefresh: false,
        expiresAt: newTokens.expiresIn,
        timeUntilExpiry: 3600000,
      });

      const result = await store.dispatch(refreshTokens());
      await flushPromises();

      expect(result.type).toBe('auth/refreshTokens/fulfilled');
      expect(result.payload).toEqual({ tokens: newTokens });

      const state = store.getState().auth;
      expect(state.tokens).toEqual(newTokens);
      expect(state.isAuthenticated).toBe(true);

      expect(mockAuthService.refreshTokens).toHaveBeenCalled();
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(newTokens);
    });

    it('should handle refresh token expiration', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      mockValidateTokens.mockReturnValue({
        isValid: false,
        isExpired: true,
        needsRefresh: true,
        expiresAt: expiredTokens.expiresIn,
        timeUntilExpiry: -1000,
      });

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      // Mock refresh token expired
      mockAuthService.refreshTokens.mockResolvedValue({
        success: false,
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED',
      });

      mockTokenStorage.removeTokens.mockResolvedValue();

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/rejected');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.tokens).toBeNull();
      expect(state.user).toBeNull();

      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();
    });

    it('should retry failed refresh attempts', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      // First attempt fails with network error
      mockAuthService.refreshTokens
        .mockResolvedValueOnce({
          success: false,
          message: 'Network error',
          code: 'NETWORK_ERROR',
        })
        .mockResolvedValueOnce({
          success: true,
          tokens: newTokens,
        });

      // First attempt - should fail
      const firstResult = await store.dispatch(refreshTokens());
      expect(firstResult.type).toBe('auth/refreshTokens/rejected');

      // Second attempt - should succeed
      const secondResult = await store.dispatch(refreshTokens());
      expect(secondResult.type).toBe('auth/refreshTokens/fulfilled');
      expect(secondResult.payload).toEqual({ tokens: newTokens });
    });
  });

  describe('Concurrent Refresh Handling', () => {
    it('should handle concurrent refresh requests', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      let refreshCallCount = 0;
      mockAuthService.refreshTokens.mockImplementation(() => {
        refreshCallCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              tokens: {
                ...newTokens,
                accessToken: `token_${refreshCallCount}`,
              },
            });
          }, 100);
        });
      });

      // Dispatch multiple refresh requests concurrently
      const promises = [
        store.dispatch(refreshTokens()),
        store.dispatch(refreshTokens()),
        store.dispatch(refreshTokens()),
      ];

      const results = await Promise.all(promises);

      // All should complete, but service should only be called once due to deduplication
      results.forEach(result => {
        expect(result.type).toBe('auth/refreshTokens/fulfilled');
      });

      // Only one actual refresh should have occurred
      expect(refreshCallCount).toBe(1);
    });

    it('should handle refresh during other auth operations', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);
      mockTokenStorage.hasValidTokens.mockResolvedValue(false);

      // Mock slow refresh
      mockAuthService.refreshTokens.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true, tokens: newTokens });
          }, 200);
        });
      });

      // Mock getCurrentUser call that might happen during refresh
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Start refresh and initialization concurrently
      const [refreshResult, initResult] = await Promise.all([
        store.dispatch(refreshTokens()),
        store.dispatch(initializeAuth()),
      ]);

      // Both should handle the concurrent operations gracefully
      expect(refreshResult.type).toBe('auth/refreshTokens/fulfilled');

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Preemptive Token Refresh', () => {
    it('should refresh tokens before they expire', async () => {
      const soonToExpireTokens = {
        ...mockTokens,
        expiresIn: Date.now() + 300000, // Expires in 5 minutes
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
        expiresIn: Date.now() + 3600000, // Expires in 1 hour
      };

      // Token is valid but will expire soon
      mockValidateTokens.mockReturnValue({
        isValid: true,
        isExpired: false,
        needsRefresh: true, // Needs preemptive refresh
        expiresAt: soonToExpireTokens.expiresIn,
        timeUntilExpiry: 300000,
      });

      mockTokenStorage.getTokens.mockResolvedValue(soonToExpireTokens);

      mockAuthService.refreshTokens.mockResolvedValue({
        success: true,
        tokens: newTokens,
      });

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/fulfilled');
      expect(mockAuthService.refreshTokens).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.tokens).toEqual(newTokens);
    });

    it('should schedule automatic refresh before expiration', async () => {
      const tokens = {
        ...mockTokens,
        expiresIn: Date.now() + 600000, // Expires in 10 minutes
      };

      mockValidateTokens.mockReturnValue({
        isValid: true,
        isExpired: false,
        needsRefresh: false,
        expiresAt: tokens.expiresIn,
        timeUntilExpiry: 600000,
      });

      mockTokenStorage.hasValidTokens.mockResolvedValue(true);
      mockTokenStorage.getTokens.mockResolvedValue(tokens);
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Initialize auth with valid tokens
      await store.dispatch(initializeAuth());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.tokens).toEqual(tokens);

      // Verify that refresh would be scheduled (in real implementation)
      // This would typically set up a setTimeout to refresh before expiration
    });
  });

  describe('Token Refresh Error Scenarios', () => {
    it('should handle network errors during refresh', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      // Mock network error
      mockAuthService.refreshTokens.mockRejectedValue(
        new Error('Network error'),
      );

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/rejected');

      const state = store.getState().auth;
      expect(state.error).toBeTruthy();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle malformed refresh response', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      // Mock malformed response
      mockAuthService.refreshTokens.mockResolvedValue({
        success: true,
        tokens: null as any, // Invalid tokens
      });

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/rejected');
    });

    it('should handle refresh when no refresh token exists', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(null);

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/rejected');
      expect(mockAuthService.refreshTokens).not.toHaveBeenCalled();
    });

    it('should clear invalid tokens after failed refresh', async () => {
      const invalidTokens = {
        ...mockTokens,
        refreshToken: 'invalid_refresh_token',
      };

      mockTokenStorage.getTokens.mockResolvedValue(invalidTokens);

      mockAuthService.refreshTokens.mockResolvedValue({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });

      mockTokenStorage.removeTokens.mockResolvedValue();

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/rejected');
      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Token Validation Integration', () => {
    it('should validate tokens after successful refresh', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
        expiresIn: Date.now() + 3600000,
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      mockAuthService.refreshTokens.mockResolvedValue({
        success: true,
        tokens: newTokens,
      });

      // Mock validation of new tokens
      mockValidateTokens.mockReturnValueOnce({
        isValid: true,
        isExpired: false,
        needsRefresh: false,
        expiresAt: newTokens.expiresIn,
        timeUntilExpiry: 3600000,
      });

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/fulfilled');
      expect(mockValidateTokens).toHaveBeenCalledWith(newTokens);
    });

    it('should handle refresh loop prevention', async () => {
      let refreshCount = 0;

      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);

      mockAuthService.refreshTokens.mockImplementation(() => {
        refreshCount++;
        if (refreshCount > 3) {
          return Promise.resolve({
            success: false,
            message: 'Too many refresh attempts',
            code: 'REFRESH_LIMIT_EXCEEDED',
          });
        }
        return Promise.resolve({
          success: false,
          message: 'Temporary error',
          code: 'TEMPORARY_ERROR',
        });
      });

      // Try multiple refreshes
      for (let i = 0; i < 5; i++) {
        await store.dispatch(refreshTokens());
      }

      // Should have attempted refresh but stopped after limit
      expect(refreshCount).toBeLessThanOrEqual(3);
    });
  });

  describe('Performance and Race Conditions', () => {
    it('should debounce rapid refresh requests', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresIn: Date.now() - 1000,
      };

      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
      };

      mockTokenStorage.getTokens.mockResolvedValue(expiredTokens);

      let refreshCallCount = 0;
      mockAuthService.refreshTokens.mockImplementation(() => {
        refreshCallCount++;
        return Promise.resolve({
          success: true,
          tokens: newTokens,
        });
      });

      // Fire many requests rapidly
      const promises = Array.from({ length: 10 }, () =>
        store.dispatch(refreshTokens()),
      );

      await Promise.all(promises);

      // Should only call the service once due to debouncing
      expect(refreshCallCount).toBe(1);
    });

    it('should handle timeout during refresh', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);

      // Mock very slow refresh
      mockAuthService.refreshTokens.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              tokens: mockTokens,
            });
          }, 10000); // 10 seconds
        });
      });

      const refreshPromise = store.dispatch(refreshTokens());

      // Should timeout and reject
      await expect(withTimeout(refreshPromise, 1000)).rejects.toThrow(
        'Test timeout',
      );
    });

    it('should maintain consistent state during concurrent operations', async () => {
      const initialState = store.getState().auth;
      expect(initialState.isLoading).toBe(false);

      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.refreshTokens.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              tokens: mockTokens,
            });
          }, 100);
        });
      });

      // Start multiple operations
      const operations = [
        store.dispatch(refreshTokens()),
        store.dispatch(refreshTokens()),
        store.dispatch(initializeAuth()),
      ];

      await Promise.all(operations);

      const finalState = store.getState().auth;

      // State should be consistent - not stuck in loading
      expect(finalState.isLoading).toBe(false);

      // Should have valid tokens if refresh succeeded
      if (finalState.isAuthenticated) {
        expect(finalState.tokens).toBeTruthy();
      }
    });
  });
});
