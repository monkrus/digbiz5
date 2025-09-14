/**
 * Auth Service Unit Tests
 *
 * Comprehensive unit tests for authentication service methods
 * including login, registration, token management, and error handling.
 */

import { AuthenticationService } from '../../src/services/authService';
import { tokenStorage } from '../../src/services/tokenStorage';
import {
  mockFetchResponse,
  mockFetchError,
  mockUser,
  mockTokens,
  setupMocks,
  teardownMocks,
} from '../utils/testUtils';

// Mock dependencies
jest.mock('../../src/services/tokenStorage');
jest.mock('../../src/config/env', () => ({
  API_BASE_URL: 'https://api.test.com',
  API_TIMEOUT: 10000,
}));

describe('AuthService', () => {
  let authService: AuthenticationService;
  let mockTokenStorageInstance: jest.Mocked<typeof tokenStorage>;

  beforeEach(() => {
    setupMocks();
    authService = new AuthenticationService();
    mockTokenStorageInstance = tokenStorage as jest.Mocked<typeof tokenStorage>;
  });

  afterEach(() => {
    teardownMocks();
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
        message: 'Login successful',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));
      mockTokenStorageInstance.setTokens.mockResolvedValue();

      const result = await authService.login(loginCredentials);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginCredentials),
        }),
      );

      expect(mockTokenStorageInstance.setTokens).toHaveBeenCalledWith(
        mockTokens,
      );
      expect(result).toEqual({
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Login successful',
      });
    });

    it('should handle invalid credentials', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse, 401));

      const result = await authService.login(loginCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });

      expect(mockTokenStorageInstance.setTokens).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await authService.login(loginCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Network error occurred. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle account locked error', async () => {
      const mockResponse = {
        success: false,
        message: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: Date.now() + 900000, // 15 minutes
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse, 423));

      const result = await authService.login(loginCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: expect.any(Number),
      });
    });

    it('should validate email format', async () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = await authService.login(invalidCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Please enter a valid email address',
        code: 'VALIDATION_ERROR',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: '123', // Too short
      };

      const result = await authService.login(invalidCredentials);

      expect(result).toEqual({
        success: false,
        message: 'Password must be at least 6 characters long',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      agreeToTerms: true,
    };

    it('should register successfully with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
        message: 'Registration successful',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));
      mockTokenStorageInstance.setTokens.mockResolvedValue();

      const result = await authService.register(registerData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
        }),
      );

      expect(result).toEqual({
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Registration successful',
      });
    });

    it('should handle email already exists error', async () => {
      const mockResponse = {
        success: false,
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse, 409));

      const result = await authService.register(registerData);

      expect(result).toEqual({
        success: false,
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS',
      });
    });

    it('should validate terms agreement', async () => {
      const invalidData = {
        ...registerData,
        agreeToTerms: false,
      };

      const result = await authService.register(invalidData);

      expect(result).toEqual({
        success: false,
        message: 'You must agree to the terms and conditions',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...registerData,
        password: 'weak',
      };

      const result = await authService.register(weakPasswordData);

      expect(result).toEqual({
        success: false,
        message: 'Password must be at least 6 characters long',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResponse = { success: true };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);
      mockTokenStorageInstance.removeTokens.mockResolvedValue();

      const result = await authService.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockTokens.accessToken}`,
          },
        }),
      );

      expect(mockTokenStorageInstance.removeTokens).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle logout without tokens', async () => {
      mockTokenStorageInstance.getTokens.mockResolvedValue(null);
      mockTokenStorageInstance.removeTokens.mockResolvedValue();

      const result = await authService.logout();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockTokenStorageInstance.removeTokens).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle server logout failure gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse({}, 500));
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);
      mockTokenStorageInstance.removeTokens.mockResolvedValue();

      const result = await authService.logout();

      // Should still remove local tokens even if server logout fails
      expect(mockTokenStorageInstance.removeTokens).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens = {
        ...mockTokens,
        accessToken: 'new_access_token',
      };

      const mockResponse = {
        success: true,
        data: { tokens: newTokens },
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);
      mockTokenStorageInstance.setTokens.mockResolvedValue();

      const result = await authService.refreshTokens();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: mockTokens.refreshToken,
          }),
        }),
      );

      expect(mockTokenStorageInstance.setTokens).toHaveBeenCalledWith(
        newTokens,
      );
      expect(result).toEqual({
        success: true,
        tokens: newTokens,
      });
    });

    it('should handle invalid refresh token', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse, 401));
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);
      mockTokenStorageInstance.removeTokens.mockResolvedValue();

      const result = await authService.refreshTokens();

      expect(mockTokenStorageInstance.removeTokens).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    });

    it('should handle missing refresh token', async () => {
      mockTokenStorageInstance.getTokens.mockResolvedValue(null);

      const result = await authService.refreshTokens();

      expect(result).toEqual({
        success: false,
        message: 'No refresh token available',
        code: 'NO_REFRESH_TOKEN',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockResponse = {
        success: true,
        data: { user: mockUser },
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);

      const result = await authService.getCurrentUser();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockTokens.accessToken}`,
          },
        }),
      );

      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
    });

    it('should handle unauthorized access', async () => {
      const mockResponse = {
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse, 401));
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);

      const result = await authService.getCurrentUser();

      expect(result).toEqual({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const email = 'test@example.com';
      const mockResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));

      const result = await authService.requestPasswordReset({ email });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/password/reset-request',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }),
      );

      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent',
      });
    });

    it('should handle user not found', async () => {
      const email = 'nonexistent@example.com';
      const mockResponse = {
        success: false,
        message: 'No account found with this email address',
        code: 'USER_NOT_FOUND',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse, 404));

      const result = await authService.requestPasswordReset({ email });

      expect(result).toEqual({
        success: false,
        message: 'No account found with this email address',
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('loginWithGoogle', () => {
    it('should login with Google successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
        message: 'Google login successful',
      };

      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockResponse));
      mockTokenStorageInstance.setTokens.mockResolvedValue();

      const result = await authService.loginWithGoogle();

      expect(result).toEqual({
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Google login successful',
      });
    });

    it('should handle Google login cancellation', async () => {
      // Mock Google Sign-In being cancelled
      const mockGoogleSignIn = {
        signIn: jest.fn().mockRejectedValue({ code: 'SIGN_IN_CANCELLED' }),
      };

      // This would normally be mocked at the Google Sign-In library level
      const result = await authService.loginWithGoogle();

      expect(result).toEqual({
        success: false,
        message: 'Google sign-in was cancelled',
        code: 'SIGN_IN_CANCELLED',
      });
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      mockTokenStorageInstance.hasValidTokens.mockResolvedValue(true);
      mockTokenStorageInstance.getTokens.mockResolvedValue(mockTokens);

      const result = await authService.validateSession();

      expect(result).toEqual({
        isValid: true,
        tokens: mockTokens,
      });
    });

    it('should handle invalid session', async () => {
      mockTokenStorageInstance.hasValidTokens.mockResolvedValue(false);

      const result = await authService.validateSession();

      expect(result).toEqual({
        isValid: false,
        tokens: null,
      });
    });

    it('should attempt token refresh for expired tokens', async () => {
      // First call returns false (expired), second call returns true (after refresh)
      mockTokenStorageInstance.hasValidTokens
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const newTokens = { ...mockTokens, accessToken: 'new_token' };
      mockTokenStorageInstance.getTokens.mockResolvedValue(newTokens);

      // Mock successful refresh
      const mockRefreshResponse = {
        success: true,
        data: { tokens: newTokens },
      };
      global.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockRefreshResponse));

      const result = await authService.validateSession();

      expect(result).toEqual({
        isValid: true,
        tokens: newTokens,
      });
    });
  });
});
