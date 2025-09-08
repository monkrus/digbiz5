/**
 * Google Authentication Service Unit Tests
 *
 * This test suite validates the Google OAuth integration functionality including:
 * - Google Sign-In initialization and configuration
 * - OAuth flow handling and token management
 * - User profile data retrieval
 * - Error handling for authentication failures
 * - Sign-out functionality
 */

import { SocialLoginData } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/services/tokenStorage');
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signInSilently: jest.fn(),
    signOut: jest.fn(),
    revokeAccess: jest.fn(),
    isSignedIn: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('../../src/config', () => ({
  Config: {
    GOOGLE_WEB_CLIENT_ID: 'test-google-client-id',
  },
}));

import {
  GoogleSignin,
  statusCodes,
  User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthService } from '../../src/services/googleAuthService';

describe('GoogleAuthService', () => {
  let googleAuthService: GoogleAuthService;
  const mockGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;

  const mockGoogleUser: GoogleUser = {
    user: {
      id: 'google-123',
      name: 'John Doe',
      email: 'john@gmail.com',
      photo: 'https://example.com/photo.jpg',
      familyName: 'Doe',
      givenName: 'John',
    },
    idToken: 'mock-id-token',
    serverAuthCode: 'mock-server-auth-code',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    googleAuthService = new GoogleAuthService();
  });

  describe('Initialization', () => {
    it('should configure Google SignIn on construction', () => {
      expect(mockGoogleSignin.configure).toHaveBeenCalledWith({
        webClientId: 'test-google-client-id',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        accountName: '',
        iosClientId: undefined,
        googleServicePlistPath: '',
        openIdNonce: '',
        profileImageSize: 120,
      });
    });

    it('should initialize Google SignIn services', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);

      await googleAuthService.initialize();

      expect(mockGoogleSignin.hasPlayServices).toHaveBeenCalledWith({
        showPlayServicesUpdateDialog: true,
      });
    });

    it('should throw error when Play Services not available', async () => {
      mockGoogleSignin.hasPlayServices.mockRejectedValue(
        new Error('Play Services not available'),
      );

      await expect(googleAuthService.initialize()).rejects.toThrow(
        'Google Play Services not available',
      );
    });

    it('should handle Play Services initialization errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.hasPlayServices.mockRejectedValue(
        new Error('Unknown error'),
      );

      await expect(googleAuthService.initialize()).rejects.toThrow(
        'Failed to initialize Google Sign-In',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Google Sign-In initialization failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully with Google', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue(mockGoogleUser);

      const result = await googleAuthService.signIn();

      expect(mockGoogleSignin.hasPlayServices).toHaveBeenCalled();
      expect(mockGoogleSignin.signIn).toHaveBeenCalled();

      const expectedResult: SocialLoginData = {
        accessToken: 'mock-server-auth-code',
        idToken: 'mock-id-token',
        profile: {
          id: 'google-123',
          email: 'john@gmail.com',
          name: 'John Doe',
          avatar: 'https://example.com/photo.jpg',
        },
      };

      expect(result).toEqual(expectedResult);
    });

    it('should handle sign in cancellation', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      const error = new Error('Sign in cancelled');
      (error as any).code = statusCodes.SIGN_IN_CANCELLED;
      mockGoogleSignin.signIn.mockRejectedValue(error);

      await expect(googleAuthService.signIn()).rejects.toThrow(
        'Google Sign-In was cancelled',
      );
    });

    it('should handle sign in in progress error', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      const error = new Error('Sign in in progress');
      (error as any).code = statusCodes.IN_PROGRESS;
      mockGoogleSignin.signIn.mockRejectedValue(error);

      await expect(googleAuthService.signIn()).rejects.toThrow(
        'Google Sign-In is already in progress',
      );
    });

    it('should handle Play Services not available during sign in', async () => {
      const error = new Error('Play Services not available');
      (error as any).code = statusCodes.PLAY_SERVICES_NOT_AVAILABLE;
      mockGoogleSignin.hasPlayServices.mockRejectedValue(error);

      await expect(googleAuthService.signIn()).rejects.toThrow(
        'Google Play Services not available',
      );
    });

    it('should handle generic sign in errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockRejectedValue(new Error('Generic error'));

      await expect(googleAuthService.signIn()).rejects.toThrow(
        'Google Sign-In failed',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Google Sign-In error:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should handle missing user data in sign in response', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      const incompleteUser = {
        user: null,
        idToken: 'mock-id-token',
        serverAuthCode: 'mock-server-auth-code',
      } as any;
      mockGoogleSignin.signIn.mockResolvedValue(incompleteUser);

      await expect(googleAuthService.signIn()).rejects.toThrow(
        'Google Sign-In failed',
      );
    });

    it('should handle missing id token in sign in response', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      const userWithoutToken = {
        ...mockGoogleUser,
        idToken: null,
      };
      mockGoogleSignin.signIn.mockResolvedValue(userWithoutToken);

      await expect(googleAuthService.signIn()).rejects.toThrow(
        'Google Sign-In failed',
      );
    });
  });

  describe('Silent Sign In', () => {
    it('should sign in silently when user is already authenticated', async () => {
      mockGoogleSignin.signInSilently.mockResolvedValue(mockGoogleUser);

      const result = await googleAuthService.signInSilently();

      expect(mockGoogleSignin.signInSilently).toHaveBeenCalled();

      const expectedResult: SocialLoginData = {
        accessToken: 'mock-server-auth-code',
        idToken: 'mock-id-token',
        profile: {
          id: 'google-123',
          email: 'john@gmail.com',
          name: 'John Doe',
          avatar: 'https://example.com/photo.jpg',
        },
      };

      expect(result).toEqual(expectedResult);
    });

    it('should return null when silent sign in fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.signInSilently.mockRejectedValue(
        new Error('No cached sign in'),
      );

      const result = await googleAuthService.signInSilently();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Silent Google Sign-In failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should return null when silent sign in returns incomplete data', async () => {
      const incompleteUser = {
        user: null,
        idToken: 'mock-id-token',
        serverAuthCode: 'mock-server-auth-code',
      } as any;
      mockGoogleSignin.signInSilently.mockResolvedValue(incompleteUser);

      const result = await googleAuthService.signInSilently();

      expect(result).toBeNull();
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockGoogleSignin.signOut.mockResolvedValue();

      await googleAuthService.signOut();

      expect(mockGoogleSignin.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.signOut.mockRejectedValue(new Error('Sign out failed'));

      await expect(googleAuthService.signOut()).rejects.toThrow(
        'Google Sign-Out failed',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Google Sign-Out error:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Revoke Access', () => {
    it('should revoke access successfully', async () => {
      mockGoogleSignin.revokeAccess.mockResolvedValue();

      await googleAuthService.revokeAccess();

      expect(mockGoogleSignin.revokeAccess).toHaveBeenCalled();
    });

    it('should handle revoke access errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.revokeAccess.mockRejectedValue(
        new Error('Revoke failed'),
      );

      await expect(googleAuthService.revokeAccess()).rejects.toThrow(
        'Failed to revoke Google access',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Google revoke access error:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Authentication State', () => {
    it('should check if user is signed in', async () => {
      mockGoogleSignin.isSignedIn.mockResolvedValue(true);

      const result = await googleAuthService.isSignedIn();

      expect(result).toBe(true);
      expect(mockGoogleSignin.isSignedIn).toHaveBeenCalled();
    });

    it('should return false when user is not signed in', async () => {
      mockGoogleSignin.isSignedIn.mockResolvedValue(false);

      const result = await googleAuthService.isSignedIn();

      expect(result).toBe(false);
    });

    it('should handle isSignedIn errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.isSignedIn.mockRejectedValue(new Error('Check failed'));

      const result = await googleAuthService.isSignedIn();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Check Google sign-in status failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Current User', () => {
    it('should get current user successfully', async () => {
      mockGoogleSignin.getCurrentUser.mockResolvedValue(mockGoogleUser);

      const result = await googleAuthService.getCurrentUser();

      expect(mockGoogleSignin.getCurrentUser).toHaveBeenCalled();

      const expectedResult: SocialLoginData = {
        accessToken: 'mock-server-auth-code',
        idToken: 'mock-id-token',
        profile: {
          id: 'google-123',
          email: 'john@gmail.com',
          name: 'John Doe',
          avatar: 'https://example.com/photo.jpg',
        },
      };

      expect(result).toEqual(expectedResult);
    });

    it('should return null when no current user exists', async () => {
      mockGoogleSignin.getCurrentUser.mockResolvedValue(null);

      const result = await googleAuthService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle getCurrentUser errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGoogleSignin.getCurrentUser.mockRejectedValue(
        new Error('Get user failed'),
      );

      const result = await googleAuthService.getCurrentUser();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get current Google user failed:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should return null when current user data is incomplete', async () => {
      const incompleteUser = {
        user: null,
        idToken: 'mock-id-token',
        serverAuthCode: 'mock-server-auth-code',
      } as any;
      mockGoogleSignin.getCurrentUser.mockResolvedValue(incompleteUser);

      const result = await googleAuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('Data Transformation', () => {
    it('should transform Google user data correctly', async () => {
      const googleUserWithoutPhoto = {
        ...mockGoogleUser,
        user: {
          ...mockGoogleUser.user,
          photo: null,
        },
      };
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue(googleUserWithoutPhoto);

      const result = await googleAuthService.signIn();

      expect(result.profile.avatar).toBeNull();
    });

    it('should handle empty server auth code', async () => {
      const userWithoutAuthCode = {
        ...mockGoogleUser,
        serverAuthCode: null,
      };
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue(userWithoutAuthCode);

      const result = await googleAuthService.signIn();

      expect(result.accessToken).toBeNull();
    });
  });
});
