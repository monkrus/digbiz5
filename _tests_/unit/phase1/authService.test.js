/**
 * Phase 1 Tests: Authentication Service
 *
 * Unit tests for auth service methods including email/password auth,
 * social logins, token management, and user profile operations.
 */

import {
  authService,
  AuthenticationService,
} from '../../../src/services/authService';
import { tokenStorage } from '../../../src/services/tokenStorage';
import {
  validateTokens,
  isRefreshTokenValid,
} from '../../../src/utils/tokenUtils';

// Mock dependencies
jest.mock('../../../src/services/tokenStorage');
jest.mock('../../../src/utils/tokenUtils');
jest.mock('../../../src/utils/config', () => ({
  AppConfig: {
    apiUrl: 'https://api.test.com',
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Phase 1: Authentication Service Tests', () => {
  let authServiceInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create fresh instance
    authServiceInstance = new AuthenticationService();

    // Mock successful API responses by default
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      status: 200,
      statusText: 'OK',
    });

    // Mock token storage
    tokenStorage.getTokens.mockResolvedValue(null);
    tokenStorage.setTokens.mockResolvedValue();
    tokenStorage.removeTokens.mockResolvedValue();
    tokenStorage.hasValidTokens.mockResolvedValue(false);

    // Mock token validation
    validateTokens.mockReturnValue({
      isValid: true,
      isExpired: false,
      shouldRefresh: false,
    });
    isRefreshTokenValid.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should create AuthenticationService instance', () => {
      expect(authServiceInstance).toBeInstanceOf(AuthenticationService);
    });

    test('should initialize with correct default state', () => {
      expect(authService).toBeDefined();
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.register).toBe('function');
      expect(typeof authService.logout).toBe('function');
    });

    test('should initialize auth state from stored tokens', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      tokenStorage.getTokens.mockResolvedValueOnce(mockTokens);
      tokenStorage.hasValidTokens.mockResolvedValueOnce(true);

      const service = new AuthenticationService();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(tokenStorage.getTokens).toHaveBeenCalled();
      expect(tokenStorage.hasValidTokens).toHaveBeenCalled();
    });
  });

  describe('Email/Password Authentication', () => {
    test('should login with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          provider: 'email',
          verified: true,
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authServiceInstance.login(credentials);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
      expect(tokenStorage.setTokens).toHaveBeenCalledWith(mockResponse.tokens);
    });

    test('should handle login failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authServiceInstance.login(credentials)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(tokenStorage.setTokens).not.toHaveBeenCalled();
    });

    test('should register new user successfully', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '456',
          email: 'newuser@example.com',
          name: 'New User',
          provider: 'email',
          verified: false,
        },
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        confirmPassword: 'password123',
      };

      const result = await authServiceInstance.register(registerData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
            name: 'New User',
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
      expect(tokenStorage.setTokens).toHaveBeenCalledWith(mockResponse.tokens);
    });

    test('should validate password confirmation during registration', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        confirmPassword: 'different-password',
      };

      await expect(authServiceInstance.register(registerData)).rejects.toThrow(
        'Passwords do not match',
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    test('should trim and lowercase email inputs', async () => {
      const mockResponse = { success: true, tokens: {} };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await authServiceInstance.login({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      );
    });
  });

  describe('Social Authentication', () => {
    test('should login with Google successfully', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '789',
          email: 'google@example.com',
          name: 'Google User',
          provider: 'google',
          verified: true,
        },
        tokens: {
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const googleData = {
        provider: 'google',
        accessToken: 'google-token',
        idToken: 'google-id-token',
        profile: {
          id: 'google-user-id',
          email: 'google@example.com',
          name: 'Google User',
          avatar: 'https://example.com/avatar.jpg',
        },
      };

      const result = await authServiceInstance.loginWithGoogle(googleData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/oauth/google',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            accessToken: 'google-token',
            idToken: 'google-id-token',
            profile: googleData.profile,
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
      expect(tokenStorage.setTokens).toHaveBeenCalledWith(mockResponse.tokens);
    });

    test('should login with LinkedIn successfully', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '101',
          email: 'linkedin@example.com',
          name: 'LinkedIn User',
          provider: 'linkedin',
          verified: true,
        },
        tokens: {
          accessToken: 'linkedin-access-token',
          refreshToken: 'linkedin-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const linkedinData = {
        provider: 'linkedin',
        accessToken: 'linkedin-token',
        profile: {
          id: 'linkedin-user-id',
          email: 'linkedin@example.com',
          name: 'LinkedIn User',
        },
      };

      const result = await authServiceInstance.loginWithLinkedIn(linkedinData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/oauth/linkedin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            accessToken: 'linkedin-token',
            profile: linkedinData.profile,
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    test('should handle social login failures', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid social token' }),
      });

      const googleData = {
        provider: 'google',
        accessToken: 'invalid-token',
        profile: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      await expect(
        authServiceInstance.loginWithGoogle(googleData),
      ).rejects.toThrow('Invalid social token');
    });
  });

  describe('Token Management', () => {
    test('should refresh tokens successfully', async () => {
      const existingTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'valid-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const mockResponse = {
        success: true,
        tokens: newTokens,
      };

      tokenStorage.getTokens.mockResolvedValueOnce(existingTokens);
      isRefreshTokenValid.mockReturnValueOnce(true);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authServiceInstance.refreshTokens();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            refreshToken: 'valid-refresh-token',
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
      expect(tokenStorage.setTokens).toHaveBeenCalledWith(newTokens);
    });

    test('should handle invalid refresh token', async () => {
      tokenStorage.getTokens.mockResolvedValueOnce(null);

      await expect(authServiceInstance.refreshTokens()).rejects.toThrow(
        'Session expired. Please login again.',
      );

      expect(tokenStorage.removeTokens).toHaveBeenCalled();
    });

    test('should prevent concurrent refresh attempts', async () => {
      const mockTokens = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      tokenStorage.getTokens.mockResolvedValue(mockTokens);
      isRefreshTokenValid.mockReturnValue(true);

      global.fetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({ success: true, tokens: mockTokens }),
                }),
              100,
            ),
          ),
      );

      // Start two refresh attempts simultaneously
      const promise1 = authServiceInstance.refreshTokens();
      const promise2 = authServiceInstance.refreshTokens();

      await Promise.all([promise1, promise2]);

      // Should only make one API call
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should validate token with server', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: true }),
      });

      const result = await authServiceInstance.validateToken('test-token');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'test-token' }),
        }),
      );

      expect(result).toBe(true);
    });

    test('should return false for invalid token validation', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authServiceInstance.validateToken('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('User Management', () => {
    test('should get current user successfully', async () => {
      const mockTokens = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const mockUser = {
        id: '123',
        email: 'user@example.com',
        name: 'Current User',
        provider: 'email',
        verified: true,
      };

      tokenStorage.getTokens.mockResolvedValueOnce(mockTokens);
      validateTokens.mockReturnValueOnce({
        isValid: true,
        isExpired: false,
        shouldRefresh: false,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      const result = await authServiceInstance.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/me',
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result).toEqual(mockUser);
    });

    test('should return null when no tokens exist', async () => {
      tokenStorage.getTokens.mockResolvedValueOnce(null);

      const result = await authServiceInstance.getCurrentUser();

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should refresh tokens when needed for getCurrentUser', async () => {
      const mockTokens = {
        accessToken: 'expiring-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      tokenStorage.getTokens.mockResolvedValue(mockTokens);
      validateTokens.mockReturnValueOnce({
        isValid: true,
        isExpired: false,
        shouldRefresh: true,
      });
      isRefreshTokenValid.mockReturnValue(true);

      // Mock refresh response
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, tokens: mockTokens }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { id: '123' } }),
        });

      await authServiceInstance.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        expect.anything(),
      );
    });

    test('should update user profile successfully', async () => {
      const updatedUser = {
        id: '123',
        email: 'user@example.com',
        name: 'Updated Name',
        provider: 'email',
        verified: true,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: updatedUser }),
      });

      const updateData = { name: 'Updated Name' };
      const result = await authServiceInstance.updateProfile(updateData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        }),
      );

      expect(result).toEqual(updatedUser);
    });
  });

  describe('Logout Functionality', () => {
    test('should logout successfully', async () => {
      const mockTokens = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      tokenStorage.getTokens.mockResolvedValueOnce(mockTokens);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await authServiceInstance.logout();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/logout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            refreshToken: 'refresh-token',
          }),
        }),
      );

      expect(tokenStorage.removeTokens).toHaveBeenCalled();
    });

    test('should clear local state even if logout API fails', async () => {
      const mockTokens = {
        refreshToken: 'refresh-token',
      };

      tokenStorage.getTokens.mockResolvedValueOnce(mockTokens);
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await authServiceInstance.logout();

      expect(tokenStorage.removeTokens).toHaveBeenCalled();
    });

    test('should handle logout without tokens', async () => {
      tokenStorage.getTokens.mockResolvedValueOnce(null);

      await authServiceInstance.logout();

      expect(tokenStorage.removeTokens).toHaveBeenCalled();
    });
  });

  describe('Password Management', () => {
    test('should request password reset successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authServiceInstance.requestPasswordReset({
        email: 'user@example.com',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/password/reset-request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    test('should update password with reset token', async () => {
      const mockResponse = {
        success: true,
        message: 'Password updated successfully',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const passwordData = {
        token: 'reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const result = await authServiceInstance.updatePassword(passwordData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/password/reset-confirm',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            token: 'reset-token',
            newPassword: 'newpassword123',
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    test('should validate password confirmation for reset', async () => {
      const passwordData = {
        token: 'reset-token',
        newPassword: 'password123',
        confirmPassword: 'different-password',
      };

      await expect(
        authServiceInstance.updatePassword(passwordData),
      ).rejects.toThrow('Passwords do not match');

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Authentication State', () => {
    test('should check if user is authenticated', async () => {
      tokenStorage.hasValidTokens.mockResolvedValueOnce(true);

      const result = await authServiceInstance.isAuthenticated();

      expect(result).toBe(true);
      expect(tokenStorage.hasValidTokens).toHaveBeenCalled();
    });

    test('should get stored tokens', async () => {
      const mockTokens = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      tokenStorage.getTokens.mockResolvedValueOnce(mockTokens);

      const result = await authServiceInstance.getStoredTokens();

      expect(result).toEqual(mockTokens);
      expect(tokenStorage.getTokens).toHaveBeenCalled();
    });
  });
});
