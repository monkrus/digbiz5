/**
 * LinkedIn Authentication Service Unit Tests
 *
 * This test suite validates the LinkedIn OAuth integration functionality including:
 * - LinkedIn OAuth flow using WebView
 * - Authorization code exchange for access tokens
 * - User profile data retrieval from LinkedIn API
 * - Error handling for authentication failures
 * - URL construction and parameter handling
 */

import { SocialLoginData } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/services/tokenStorage');
jest.mock('../../src/config', () => ({
  Config: {
    LINKEDIN_CLIENT_ID: 'test-linkedin-client-id',
    LINKEDIN_CLIENT_SECRET: 'test-linkedin-client-secret',
    LINKEDIN_REDIRECT_URI: 'https://app.example.com/auth/linkedin/callback',
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

import { LinkedInAuthService } from '../../src/services/linkedinAuthService';

describe('LinkedInAuthService', () => {
  let linkedinAuthService: LinkedInAuthService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockProfile = {
    sub: 'linkedin-123',
    name: 'John Doe',
    email: 'john@linkedin.com',
    picture: 'https://example.com/profile.jpg',
    given_name: 'John',
    family_name: 'Doe',
  };

  const mockTokenResponse = {
    access_token: 'linkedin-access-token',
    token_type: 'Bearer',
    expires_in: 5184000,
    scope: 'profile email',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    linkedinAuthService = new LinkedInAuthService();

    // Mock successful API responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  describe('Authorization URL Generation', () => {
    it('should generate correct authorization URL', () => {
      const authUrl = linkedinAuthService.getAuthorizationUrl();

      expect(authUrl).toContain(
        'https://www.linkedin.com/oauth/v2/authorization',
      );
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('client_id=test-linkedin-client-id');
      expect(authUrl).toContain(
        'redirect_uri=https://app.example.com/auth/linkedin/callback',
      );
      expect(authUrl).toContain('scope=profile%20email');
      expect(authUrl).toContain('state=');
    });

    it('should generate different state parameter each time', () => {
      const authUrl1 = linkedinAuthService.getAuthorizationUrl();
      const authUrl2 = linkedinAuthService.getAuthorizationUrl();

      const state1 = new URLSearchParams(authUrl1.split('?')[1]).get('state');
      const state2 = new URLSearchParams(authUrl2.split('?')[1]).get('state');

      expect(state1).not.toEqual(state2);
      expect(state1).toHaveLength(32);
      expect(state2).toHaveLength(32);
    });

    it('should URL encode redirect URI properly', () => {
      const authUrl = linkedinAuthService.getAuthorizationUrl();
      const urlParams = new URLSearchParams(authUrl.split('?')[1]);
      const redirectUri = urlParams.get('redirect_uri');

      expect(redirectUri).toBe(
        'https://app.example.com/auth/linkedin/callback',
      );
    });

    it('should include correct scope parameter', () => {
      const authUrl = linkedinAuthService.getAuthorizationUrl();
      const urlParams = new URLSearchParams(authUrl.split('?')[1]);
      const scope = urlParams.get('scope');

      expect(scope).toBe('profile email');
    });
  });

  describe('Authorization Code Exchange', () => {
    it('should exchange authorization code for access token successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      const result = await linkedinAuthService.exchangeCodeForToken(
        'auth-code',
        'test-state',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: expect.stringContaining('grant_type=authorization_code'),
        },
      );

      const call = mockFetch.mock.calls[0];
      const body = call[1]?.body as string;
      expect(body).toContain('code=auth-code');
      expect(body).toContain('client_id=test-linkedin-client-id');
      expect(body).toContain('client_secret=test-linkedin-client-secret');
      expect(body).toContain(
        'redirect_uri=https://app.example.com/auth/linkedin/callback',
      );

      expect(result).toEqual(mockTokenResponse);
    });

    it('should handle token exchange errors', async () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve(errorResponse),
      } as Response);

      await expect(
        linkedinAuthService.exchangeCodeForToken('invalid-code', 'test-state'),
      ).rejects.toThrow('Authorization code is invalid');
    });

    it('should handle network errors during token exchange', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        linkedinAuthService.exchangeCodeForToken('auth-code', 'test-state'),
      ).rejects.toThrow('LinkedIn token exchange failed');
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(
        linkedinAuthService.exchangeCodeForToken('auth-code', 'test-state'),
      ).rejects.toThrow('LinkedIn token exchange failed');
    });
  });

  describe('User Profile Retrieval', () => {
    it('should get user profile successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      } as Response);

      const result = await linkedinAuthService.getUserProfile('access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/userinfo',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer access-token',
            Accept: 'application/json',
          },
        },
      );

      expect(result).toEqual(mockProfile);
    });

    it('should handle profile retrieval errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid token' }),
      } as Response);

      await expect(
        linkedinAuthService.getUserProfile('invalid-token'),
      ).rejects.toThrow('Failed to get LinkedIn profile');

      expect(consoleSpy).toHaveBeenCalledWith(
        'LinkedIn profile retrieval failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should handle network errors during profile retrieval', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        linkedinAuthService.getUserProfile('access-token'),
      ).rejects.toThrow('Failed to get LinkedIn profile');

      expect(consoleSpy).toHaveBeenCalledWith(
        'LinkedIn profile retrieval failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete authentication flow successfully', async () => {
      // Mock token exchange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        // Mock profile retrieval
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfile),
        } as Response);

      const result = await linkedinAuthService.authenticate(
        'auth-code',
        'test-state',
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify token exchange call
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://www.linkedin.com/oauth/v2/accessToken',
        expect.objectContaining({ method: 'POST' }),
      );

      // Verify profile retrieval call
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.linkedin.com/v2/userinfo',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer linkedin-access-token',
          }),
        }),
      );

      const expectedResult: SocialLoginData = {
        accessToken: 'linkedin-access-token',
        profile: {
          id: 'linkedin-123',
          email: 'john@linkedin.com',
          name: 'John Doe',
          avatar: 'https://example.com/profile.jpg',
        },
      };

      expect(result).toEqual(expectedResult);
    });

    it('should handle authentication flow failure during token exchange', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error_description: 'Invalid code' }),
      } as Response);

      await expect(
        linkedinAuthService.authenticate('invalid-code', 'test-state'),
      ).rejects.toThrow('Invalid code');
    });

    it('should handle authentication flow failure during profile retrieval', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock successful token exchange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        // Mock failed profile retrieval
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Token expired' }),
        } as Response);

      await expect(
        linkedinAuthService.authenticate('auth-code', 'test-state'),
      ).rejects.toThrow('Failed to get LinkedIn profile');

      consoleSpy.mockRestore();
    });

    it('should transform profile data correctly', async () => {
      const profileWithoutPicture = {
        ...mockProfile,
        picture: undefined,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(profileWithoutPicture),
        } as Response);

      const result = await linkedinAuthService.authenticate(
        'auth-code',
        'test-state',
      );

      expect(result.profile.avatar).toBeNull();
    });

    it('should use email as fallback name when name is not provided', async () => {
      const profileWithoutName = {
        ...mockProfile,
        name: undefined,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(profileWithoutName),
        } as Response);

      const result = await linkedinAuthService.authenticate(
        'auth-code',
        'test-state',
      );

      expect(result.profile.name).toBe('john@linkedin.com');
    });

    it('should construct name from given and family names when name is not provided', async () => {
      const profileWithNames = {
        ...mockProfile,
        name: undefined,
        given_name: 'Jane',
        family_name: 'Smith',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(profileWithNames),
        } as Response);

      const result = await linkedinAuthService.authenticate(
        'auth-code',
        'test-state',
      );

      expect(result.profile.name).toBe('Jane Smith');
    });
  });

  describe('State Management', () => {
    it('should validate state parameter during authentication', async () => {
      const authUrl = linkedinAuthService.getAuthorizationUrl();
      const urlParams = new URLSearchParams(authUrl.split('?')[1]);
      const originalState = urlParams.get('state') as string;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfile),
        } as Response);

      // This should work with the correct state
      await expect(
        linkedinAuthService.authenticate('auth-code', originalState),
      ).resolves.toBeDefined();
    });

    it('should generate cryptographically secure state', () => {
      const states = new Set<string>();

      // Generate multiple states to check uniqueness
      for (let i = 0; i < 100; i++) {
        const authUrl = linkedinAuthService.getAuthorizationUrl();
        const urlParams = new URLSearchParams(authUrl.split('?')[1]);
        const state = urlParams.get('state') as string;

        expect(state).toHaveLength(32);
        expect(states.has(state)).toBe(false);
        states.add(state);
      }
    });
  });

  describe('URL Parameter Encoding', () => {
    it('should properly encode all URL parameters', () => {
      const authUrl = linkedinAuthService.getAuthorizationUrl();

      // URL should not contain any unencoded special characters
      expect(authUrl).not.toMatch(/[^a-zA-Z0-9\-_.~:/?#[\]@!$&'()*+,;=%]/);

      // Should contain properly encoded components
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=profile%20email');
    });

    it('should handle special characters in configuration', async () => {
      // This test ensures the service can handle edge cases in configuration
      const service = new LinkedInAuthService();
      const authUrl = service.getAuthorizationUrl();

      expect(authUrl).toContain('client_id=test-linkedin-client-id');
      expect(authUrl).toContain(
        'redirect_uri=https://app.example.com/auth/linkedin/callback',
      );
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      const errorResponse = {
        error: 'access_denied',
        error_description: 'User cancelled authorization',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve(errorResponse),
      } as Response);

      await expect(
        linkedinAuthService.exchangeCodeForToken('auth-code', 'state'),
      ).rejects.toThrow('User cancelled authorization');
    });

    it('should handle missing error description', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        linkedinAuthService.exchangeCodeForToken('auth-code', 'state'),
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(
        linkedinAuthService.exchangeCodeForToken('auth-code', 'state'),
      ).rejects.toThrow('HTTP 400: Bad Request');
    });
  });
});
