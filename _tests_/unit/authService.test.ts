/**
 * Authentication Service Unit Tests
 *
 * This test suite validates the core authentication service functionality including:
 * - Email/password authentication
 * - User registration
 * - Social login integration (Google, LinkedIn)
 * - Token refresh and validation
 * - Password reset functionality
 * - User profile management
 */

import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  SocialLoginData,
  PasswordResetData,
  PasswordUpdateData,
  JWTTokens,
  User,
} from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/services/tokenStorage');
jest.mock('../../src/utils/tokenUtils');
jest.mock('../../src/utils/config', () => ({
  AppConfig: {
    apiUrl: 'https://api.test.com',
    apiTimeout: 10000,
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

import { AuthenticationService } from '../../src/services/authService';
import { tokenStorage } from '../../src/services/tokenStorage';
import {
  validateTokens,
  isRefreshTokenValid,
} from '../../src/utils/tokenUtils';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
  const mockValidateTokens = validateTokens as jest.MockedFunction<
    typeof validateTokens
  >;
  const mockIsRefreshTokenValid = isRefreshTokenValid as jest.MockedFunction<
    typeof isRefreshTokenValid
  >;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockTokens: JWTTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    refreshExpiresIn: 604800,
  };

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    authService = new AuthenticationService();
    jest.clearAllMocks();

    // Mock successful API responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  describe('Initialization', () => {
    it('should initialize auth state on construction', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockTokenStorage.hasValidTokens.mockResolvedValue(true);

      new AuthenticationService();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockTokenStorage.getTokens).toHaveBeenCalled();
      expect(mockTokenStorage.hasValidTokens).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTokenStorage.getTokens.mockRejectedValue(new Error('Storage error'));

      new AuthenticationService();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize auth state:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Login', () => {
    const loginCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Login successful',
        tokens: mockTokens,
        user: mockUser,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.login(loginCredentials);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      );

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockTokens);
      expect(result).toEqual(mockResponse);
    });

    it('should trim and lowercase email before login', async () => {
      const credentialsWithSpaces: LoginCredentials = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await authService.login(credentialsWithSpaces);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      );
    });

    it('should throw error on login failure', async () => {
      const errorResponse = { message: 'Invalid credentials' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve(errorResponse),
      } as Response);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should handle network errors during login', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('Registration', () => {
    const registerData: RegisterData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should register successfully with valid data', async () => {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Registration successful',
        tokens: mockTokens,
        user: { ...mockUser, name: 'John Doe', email: 'john@example.com' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.register(registerData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'password123',
            name: 'John Doe',
          }),
        }),
      );

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockTokens);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when passwords do not match', async () => {
      const invalidData: RegisterData = {
        ...registerData,
        confirmPassword: 'different-password',
      };

      await expect(authService.register(invalidData)).rejects.toThrow(
        'Passwords do not match',
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should trim name and lowercase email before registration', async () => {
      const dataWithSpaces: RegisterData = {
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        password: 'password123',
        confirmPassword: 'password123',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await authService.register(dataWithSpaces);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'password123',
            name: 'John Doe',
          }),
        }),
      );
    });
  });

  describe('Logout', () => {
    it('should logout successfully and clear tokens', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/logout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: mockTokens.refreshToken }),
        }),
      );

      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();
    });

    it('should clear local tokens even if server logout fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockFetch.mockRejectedValue(new Error('Server error'));

      await authService.logout();

      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Logout API call failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should handle logout when no tokens exist', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(null);

      await authService.logout();

      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();
    });
  });

  describe('Social Login', () => {
    const googleLoginData: SocialLoginData = {
      accessToken: 'google-access-token',
      idToken: 'google-id-token',
      profile: {
        id: 'google-123',
        email: 'user@gmail.com',
        name: 'Google User',
      },
    };

    const linkedinLoginData: SocialLoginData = {
      accessToken: 'linkedin-access-token',
      profile: {
        id: 'linkedin-123',
        email: 'user@linkedin.com',
        name: 'LinkedIn User',
      },
    };

    it('should login with Google successfully', async () => {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Google login successful',
        tokens: mockTokens,
        user: mockUser,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.loginWithGoogle(googleLoginData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/oauth/google',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(googleLoginData),
        }),
      );

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockTokens);
      expect(result).toEqual(mockResponse);
    });

    it('should login with LinkedIn successfully', async () => {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'LinkedIn login successful',
        tokens: mockTokens,
        user: mockUser,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.loginWithLinkedIn(linkedinLoginData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/oauth/linkedin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(linkedinLoginData),
        }),
      );

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockTokens);
      expect(result).toEqual(mockResponse);
    });

    it('should handle Google login errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid Google token' }),
      } as Response);

      await expect(
        authService.loginWithGoogle(googleLoginData),
      ).rejects.toThrow('Invalid Google token');
    });

    it('should handle LinkedIn login errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid LinkedIn token' }),
      } as Response);

      await expect(
        authService.loginWithLinkedIn(linkedinLoginData),
      ).rejects.toThrow('Invalid LinkedIn token');
    });
  });

  describe('Password Reset', () => {
    const resetData: PasswordResetData = {
      email: 'user@example.com',
    };

    const updateData: PasswordUpdateData = {
      token: 'reset-token',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    };

    it('should request password reset successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset email sent',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.requestPasswordReset(resetData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/password/reset-request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should update password successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password updated successfully',
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.updatePassword(updateData);

      expect(mockFetch).toHaveBeenCalledWith(
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

    it('should throw error when new passwords do not match', async () => {
      const invalidUpdateData: PasswordUpdateData = {
        ...updateData,
        confirmPassword: 'different-password',
      };

      await expect(
        authService.updatePassword(invalidUpdateData),
      ).rejects.toThrow('Passwords do not match');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should refresh tokens successfully', async () => {
      const mockResponse = {
        success: true,
        tokens: mockTokens,
      };

      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockIsRefreshTokenValid.mockReturnValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.refreshTokens();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: mockTokens.refreshToken }),
        }),
      );

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockTokens);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when no valid refresh token available', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(null);

      await expect(authService.refreshTokens()).rejects.toThrow(
        'No valid refresh token available',
      );
    });

    it('should clear auth state when token refresh fails', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockIsRefreshTokenValid.mockReturnValue(true);
      mockFetch.mockRejectedValue(new Error('Refresh failed'));

      await expect(authService.refreshTokens()).rejects.toThrow(
        'Session expired. Please login again.',
      );
      expect(mockTokenStorage.removeTokens).toHaveBeenCalled();
    });

    it('should validate token with server', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true }),
      } as Response);

      const result = await authService.validateToken('test-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'test-token' }),
        }),
      );

      expect(result).toBe(true);
    });

    it('should return false when token validation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValue(new Error('Validation failed'));

      const result = await authService.validateToken('invalid-token');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Token validation failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('User Management', () => {
    it('should get current user successfully', async () => {
      const mockResponse = { user: mockUser };
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockValidateTokens.mockReturnValue({
        isExpired: false,
        shouldRefresh: false,
        isValid: true,
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/me',
        expect.objectContaining({ method: 'GET' }),
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null when no tokens exist', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(null);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should refresh tokens when needed before getting user', async () => {
      const refreshSpy = jest
        .spyOn(authService, 'refreshTokens')
        .mockResolvedValue({
          success: true,
          tokens: mockTokens,
        });

      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockValidateTokens.mockReturnValue({
        isExpired: false,
        shouldRefresh: true,
        isValid: true,
      });
      mockIsRefreshTokenValid.mockReturnValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      } as Response);

      const result = await authService.getCurrentUser();

      expect(refreshSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
      refreshSpy.mockRestore();
    });

    it('should update user profile successfully', async () => {
      const profileUpdate = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...profileUpdate };
      const mockResponse = { user: updatedUser };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await authService.updateProfile(profileUpdate);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileUpdate),
        }),
      );

      expect(result).toEqual(updatedUser);
    });
  });

  describe('Authentication State', () => {
    it('should check if user is authenticated', async () => {
      mockTokenStorage.hasValidTokens.mockResolvedValue(true);

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockTokenStorage.hasValidTokens).toHaveBeenCalled();
    });

    it('should get stored tokens', async () => {
      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);

      const result = await authService.getStoredTokens();

      expect(result).toEqual(mockTokens);
      expect(mockTokenStorage.getTokens).toHaveBeenCalled();
    });
  });

  describe('Concurrent Token Refresh', () => {
    it('should handle concurrent refresh requests', async () => {
      const mockResponse = {
        success: true,
        tokens: mockTokens,
      };

      mockTokenStorage.getTokens.mockResolvedValue(mockTokens);
      mockIsRefreshTokenValid.mockReturnValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Start multiple concurrent refresh requests
      const refreshPromises = [
        authService.refreshTokens(),
        authService.refreshTokens(),
        authService.refreshTokens(),
      ];

      const results = await Promise.all(refreshPromises);

      // All should return the same result
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockResponse);
      });

      // But API should only be called once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
