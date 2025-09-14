/**
 * Authentication Integration Tests
 *
 * Integration tests for complete authentication flows including
 * login, logout, token refresh, and session management.
 */

import { configureStore } from '@reduxjs/toolkit';
import { authService } from '../../src/services/authService';
import { tokenStorage } from '../../src/services/tokenStorage';
import authSlice, {
  loginWithEmail,
  registerUser,
  logoutUser,
  refreshTokens,
  initializeAuth,
} from '../../src/store/authSlice';
import {
  mockUser,
  mockTokens,
  mockFetchResponse,
  mockFetchError,
  setupMocks,
  teardownMocks,
  flushPromises,
} from '../utils/testUtils';

// Mock dependencies
jest.mock('../../src/services/authService');
jest.mock('../../src/services/tokenStorage');

describe('Authentication Integration Flow', () => {
  let store: ReturnType<typeof configureStore>;
  let mockAuthService: jest.Mocked<typeof authService>;
  let mockTokenStorage: jest.Mocked<typeof tokenStorage>;

  beforeEach(() => {
    setupMocks();

    // Create store
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ serializableCheck: false }),
    });

    mockAuthService = authService as jest.Mocked<typeof authService>;
    mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
  });

  afterEach(() => {
    teardownMocks();
  });

  describe('Complete Login Flow', () => {
    it('should handle successful login flow', async () => {
      // Setup mocks
      mockAuthService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Login successful',
      });

      mockTokenStorage.setTokens.mockResolvedValue();
      mockTokenStorage.hasValidTokens.mockResolvedValue(true);

      // Initial state
      expect(store.getState().auth.isAuthenticated).toBe(false);
      expect(store.getState().auth.user).toBeNull();

      // Dispatch login action
      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await store.dispatch(loginWithEmail(loginCredentials));
      await flushPromises();

      // Verify the action was fulfilled
      expect(result.type).toBe('auth/loginWithEmail/fulfilled');
      expect(result.payload).toEqual({
        user: mockUser,
        tokens: mockTokens,
        message: 'Login successful',
      });

      // Verify state updates
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastLoginAt).toBeTruthy();

      // Verify service calls
      expect(mockAuthService.login).toHaveBeenCalledWith(loginCredentials);
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockTokens);
    });

    it('should handle failed login with invalid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });

      const loginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const result = await store.dispatch(loginWithEmail(loginCredentials));
      await flushPromises();

      // Verify the action was rejected
      expect(result.type).toBe('auth/loginWithEmail/rejected');

      // Verify state
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.error).toBe('Invalid email or password');
      expect(state.isLoading).toBe(false);
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      const lockUntil = Date.now() + 900000; // 15 minutes

      // First few failed attempts
      mockAuthService.login
        .mockResolvedValueOnce({
          success: false,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
        .mockResolvedValueOnce({
          success: false,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
        .mockResolvedValueOnce({
          success: false,
          message: 'Account temporarily locked',
          code: 'ACCOUNT_LOCKED',
          lockUntil,
        });

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // First attempt
      await store.dispatch(loginWithEmail(credentials));
      let state = store.getState().auth;
      expect(state.loginAttempts).toBe(1);
      expect(state.isLocked).toBe(false);

      // Second attempt
      await store.dispatch(loginWithEmail(credentials));
      state = store.getState().auth;
      expect(state.loginAttempts).toBe(2);
      expect(state.isLocked).toBe(false);

      // Third attempt - account locked
      await store.dispatch(loginWithEmail(credentials));
      state = store.getState().auth;
      expect(state.loginAttempts).toBe(3);
      expect(state.isLocked).toBe(true);
      expect(state.lockUntil).toBe(lockUntil);
      expect(state.error).toBe('Account temporarily locked');
    });

    it('should reset login attempts after successful login', async () => {
      // Setup initial failed attempt
      mockAuthService.login
        .mockResolvedValueOnce({
          success: false,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
        .mockResolvedValueOnce({
          success: true,
          user: mockUser,
          tokens: mockTokens,
          message: 'Login successful',
        });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Failed attempt
      await store.dispatch(
        loginWithEmail({ ...credentials, password: 'wrong' }),
      );
      let state = store.getState().auth;
      expect(state.loginAttempts).toBe(1);

      // Successful attempt
      await store.dispatch(loginWithEmail(credentials));
      state = store.getState().auth;
      expect(state.loginAttempts).toBe(0);
      expect(state.isLocked).toBe(false);
      expect(state.lockUntil).toBeNull();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Registration Flow', () => {
    it('should handle successful registration', async () => {
      mockAuthService.register.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Registration successful',
      });

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        agreeToTerms: true,
      };

      const result = await store.dispatch(registerUser(registerData));
      await flushPromises();

      expect(result.type).toBe('auth/registerUser/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
    });

    it('should handle registration with existing email', async () => {
      mockAuthService.register.mockResolvedValue({
        success: false,
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS',
      });

      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        agreeToTerms: true,
      };

      const result = await store.dispatch(registerUser(registerData));

      expect(result.type).toBe('auth/registerUser/rejected');
      expect(store.getState().auth.error).toBe(
        'An account with this email already exists',
      );
    });
  });

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      // Setup authenticated state
      store = configureStore({
        reducer: { auth: authSlice },
        preloadedState: {
          auth: {
            user: mockUser,
            tokens: mockTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLoginAt: new Date().toISOString(),
            loginAttempts: 0,
            isLocked: false,
            lockUntil: null,
          },
        },
      });

      mockAuthService.logout.mockResolvedValue({ success: true });
      mockTokenStorage.removeTokens.mockResolvedValue();

      const result = await store.dispatch(logoutUser());
      await flushPromises();

      expect(result.type).toBe('auth/logoutUser/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.error).toBeNull();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();
    });

    it('should handle logout failure gracefully', async () => {
      // Setup authenticated state
      store = configureStore({
        reducer: { auth: authSlice },
        preloadedState: {
          auth: {
            user: mockUser,
            tokens: mockTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLoginAt: new Date().toISOString(),
            loginAttempts: 0,
            isLocked: false,
            lockUntil: null,
          },
        },
      });

      mockAuthService.logout.mockResolvedValue({
        success: false,
        message: 'Logout failed',
      });

      const result = await store.dispatch(logoutUser());

      // Should still clear local state even if server logout fails
      expect(result.type).toBe('auth/logoutUser/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
      };

      // Setup authenticated state with old tokens
      store = configureStore({
        reducer: { auth: authSlice },
        preloadedState: {
          auth: {
            user: mockUser,
            tokens: mockTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLoginAt: new Date().toISOString(),
            loginAttempts: 0,
            isLocked: false,
            lockUntil: null,
          },
        },
      });

      mockAuthService.refreshTokens.mockResolvedValue({
        success: true,
        tokens: newTokens,
      });

      const result = await store.dispatch(refreshTokens());
      await flushPromises();

      expect(result.type).toBe('auth/refreshTokens/fulfilled');

      const state = store.getState().auth;
      expect(state.tokens).toEqual(newTokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle invalid refresh token', async () => {
      store = configureStore({
        reducer: { auth: authSlice },
        preloadedState: {
          auth: {
            user: mockUser,
            tokens: mockTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLoginAt: new Date().toISOString(),
            loginAttempts: 0,
            isLocked: false,
            lockUntil: null,
          },
        },
      });

      mockAuthService.refreshTokens.mockResolvedValue({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });

      const result = await store.dispatch(refreshTokens());

      expect(result.type).toBe('auth/refreshTokens/rejected');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.error).toBe('Invalid refresh token');
    });
  });

  describe('Session Initialization', () => {
    it('should initialize with valid stored session', async () => {
      mockTokenStorage.hasValidTokens.mockResolvedValue(true);
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const result = await store.dispatch(initializeAuth());
      await flushPromises();

      expect(result.type).toBe('auth/initializeAuth/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
    });

    it('should initialize with no stored session', async () => {
      mockTokenStorage.hasValidTokens.mockResolvedValue(false);

      const result = await store.dispatch(initializeAuth());

      expect(result.type).toBe('auth/initializeAuth/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
    });

    it('should handle corrupted stored session', async () => {
      mockTokenStorage.hasValidTokens.mockResolvedValue(true);
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });

      // Should attempt token refresh
      mockAuthService.refreshTokens.mockResolvedValue({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });

      const result = await store.dispatch(initializeAuth());

      expect(result.type).toBe('auth/initializeAuth/rejected');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
    });
  });

  describe('Concurrent Authentication Actions', () => {
    it('should handle concurrent login attempts gracefully', async () => {
      let callCount = 0;
      mockAuthService.login.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              user: mockUser,
              tokens: { ...mockTokens, accessToken: `token_${callCount}` },
              message: 'Login successful',
            });
          }, 100);
        });
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Dispatch multiple login actions concurrently
      const [result1, result2, result3] = await Promise.all([
        store.dispatch(loginWithEmail(credentials)),
        store.dispatch(loginWithEmail(credentials)),
        store.dispatch(loginWithEmail(credentials)),
      ]);

      // Only one should succeed, others should be handled gracefully
      expect([result1.type, result2.type, result3.type]).toContain(
        'auth/loginWithEmail/fulfilled',
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('should handle login during logout', async () => {
      // Setup authenticated state
      store = configureStore({
        reducer: { auth: authSlice },
        preloadedState: {
          auth: {
            user: mockUser,
            tokens: mockTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLoginAt: new Date().toISOString(),
            loginAttempts: 0,
            isLocked: false,
            lockUntil: null,
          },
        },
      });

      mockAuthService.logout.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ success: true }), 100);
        });
      });

      mockAuthService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Login successful',
      });

      // Start logout and login concurrently
      const [logoutResult, loginResult] = await Promise.all([
        store.dispatch(logoutUser()),
        store.dispatch(
          loginWithEmail({
            email: 'test@example.com',
            password: 'password123',
          }),
        ),
      ]);

      // Verify final state is consistent
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);

      // Should either be logged in or logged out, but not in an inconsistent state
      if (state.isAuthenticated) {
        expect(state.user).toBeTruthy();
        expect(state.tokens).toBeTruthy();
      } else {
        expect(state.user).toBeNull();
        expect(state.tokens).toBeNull();
      }
    });
  });
});
