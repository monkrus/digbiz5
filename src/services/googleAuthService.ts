/**
 * Google OAuth Service
 *
 * Handles Google Sign-In integration using @react-native-google-signin/google-signin
 * Provides methods for Google OAuth authentication flow.
 */

import {
  GoogleSignin,
  statusCodes,
  GoogleSigninConfiguration,
  User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import { SocialLoginData, AuthResponse } from '../types/auth';
import { authService } from './authService';

/**
 * Google OAuth configuration
 */
const GOOGLE_CONFIG: GoogleSigninConfiguration = {
  webClientId: '', // Will be set from environment config
  offlineAccess: true, // For refresh tokens
  hostedDomain: '', // Optional: restrict to specific domain
  forceCodeForRefreshToken: true, // Ensures refresh token is always returned
  accountName: '', // Optional: specify account name
  iosClientId: '', // Optional: iOS client ID if different from webClientId
  googleServicePlistPath: '', // Optional: path to GoogleService-Info.plist
};

/**
 * Google Authentication Service
 */
export class GoogleAuthService {
  private isConfigured = false;

  /**
   * Configure Google Sign-In
   */
  async configure(webClientId: string, iosClientId?: string): Promise<void> {
    try {
      const config: GoogleSigninConfiguration = {
        ...GOOGLE_CONFIG,
        webClientId,
        ...(iosClientId && { iosClientId }),
      };

      GoogleSignin.configure(config);
      this.isConfigured = true;

      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Google Sign-In configuration failed:', error);
      throw new Error('Failed to configure Google Sign-In');
    }
  }

  /**
   * Check if Google Play Services are available
   */
  async hasPlayServices(): Promise<boolean> {
    try {
      await GoogleSignin.hasPlayServices();
      return true;
    } catch (error) {
      console.error('Google Play Services not available:', error);
      return false;
    }
  }

  /**
   * Check if user is already signed in
   */
  async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Failed to check Google sign-in status:', error);
      return false;
    }
  }

  /**
   * Get current signed-in user
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      if (await this.isSignedIn()) {
        return await GoogleSignin.getCurrentUser();
      }
      return null;
    } catch (error) {
      console.error('Failed to get current Google user:', error);
      return null;
    }
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<AuthResponse> {
    if (!this.isConfigured) {
      throw new Error('Google Sign-In not configured. Call configure() first.');
    }

    try {
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.user) {
        throw new Error('Google Sign-In did not return user information');
      }

      // Get access tokens
      const tokens = await GoogleSignin.getTokens();

      // Prepare social login data
      const socialLoginData: SocialLoginData = {
        provider: 'google',
        accessToken: tokens.accessToken,
        idToken: tokens.idToken || undefined,
        profile: {
          id: userInfo.user.id,
          email: userInfo.user.email,
          name: userInfo.user.name || '',
          avatar: userInfo.user.photo || undefined,
        },
      };

      // Authenticate with backend
      const authResponse = await authService.loginWithGoogle(socialLoginData);

      console.log('Google Sign-In successful');
      return authResponse;
    } catch (error) {
      console.error('Google Sign-In failed:', error);

      // Handle specific error codes
      if (error instanceof Error) {
        switch ((error as any).code) {
          case statusCodes.SIGN_IN_CANCELLED:
            throw new Error('Google Sign-In was cancelled');
          case statusCodes.IN_PROGRESS:
            throw new Error('Google Sign-In is already in progress');
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            throw new Error('Google Play Services not available');
          default:
            throw new Error(error.message || 'Google Sign-In failed');
        }
      }

      throw new Error('Google Sign-In failed');
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out failed:', error);
      throw new Error('Failed to sign out from Google');
    }
  }

  /**
   * Revoke access and sign out
   */
  async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
      console.log('Google access revoked successfully');
    } catch (error) {
      console.error('Google access revocation failed:', error);
      throw new Error('Failed to revoke Google access');
    }
  }

  /**
   * Get fresh access token
   */
  async getTokens(): Promise<{ accessToken: string; idToken: string | null }> {
    try {
      const tokens = await GoogleSignin.getTokens();
      return {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken || null,
      };
    } catch (error) {
      console.error('Failed to get Google tokens:', error);
      throw new Error('Failed to get Google tokens');
    }
  }

  /**
   * Silent sign-in (for existing users)
   */
  async signInSilently(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      console.log('Google silent sign-in successful');
      return userInfo;
    } catch (error) {
      console.error('Google silent sign-in failed:', error);
      return null;
    }
  }

  /**
   * Clear cached user data
   */
  async clearCachedAccessToken(): Promise<void> {
    try {
      await GoogleSignin.clearCachedAccessToken();
      console.log('Google cached access token cleared');
    } catch (error) {
      console.error('Failed to clear Google cached access token:', error);
      throw new Error('Failed to clear cached access token');
    }
  }
}

// Default instance
export const googleAuthService = new GoogleAuthService();

// Configuration helper
export const configureGoogleAuth = async (
  webClientId: string,
  iosClientId?: string,
): Promise<void> => {
  await googleAuthService.configure(webClientId, iosClientId);
};

// Export status codes for error handling
export { statusCodes as GoogleSignInStatusCodes };
