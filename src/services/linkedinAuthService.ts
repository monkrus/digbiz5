/**
 * LinkedIn OAuth Service
 *
 * Handles LinkedIn OAuth authentication using WebView-based flow.
 * Implements LinkedIn OAuth 2.0 protocol for social login.
 */

import { SocialLoginData, AuthResponse } from '../types/auth';
import { authService } from './authService';

// LinkedIn OAuth configuration
interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

// LinkedIn OAuth URLs
const LINKEDIN_OAUTH_URLS = {
  AUTHORIZE: 'https://www.linkedin.com/oauth/v2/authorization',
  TOKEN: 'https://www.linkedin.com/oauth/v2/accessToken',
  PROFILE: 'https://api.linkedin.com/v2/people/~',
  EMAIL:
    'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
} as const;

// LinkedIn user profile structure
interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

interface LinkedInEmailResponse {
  elements: Array<{
    'handle~': {
      emailAddress: string;
    };
  }>;
}

/**
 * LinkedIn Authentication Service
 */
export class LinkedInAuthService {
  private config: LinkedInConfig | null = null;

  /**
   * Configure LinkedIn OAuth
   */
  configure(config: LinkedInConfig): void {
    this.config = config;
    console.log('LinkedIn OAuth configured successfully');
  }

  /**
   * Generate LinkedIn OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    if (!this.config) {
      throw new Error('LinkedIn OAuth not configured. Call configure() first.');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: this.generateRandomState(),
    });

    return `${LINKEDIN_OAUTH_URLS.AUTHORIZE}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, _state: string): Promise<string> {
    if (!this.config) {
      throw new Error('LinkedIn OAuth not configured');
    }

    try {
      const response = await fetch(LINKEDIN_OAUTH_URLS.TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokenData = (await response.json()) as { access_token: string };
      return tokenData.access_token;
    } catch (error) {
      console.error('LinkedIn token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * Get LinkedIn user profile
   */
  async getUserProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      const response = await fetch(LINKEDIN_OAUTH_URLS.PROFILE, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.statusText}`);
      }

      return (await response.json()) as LinkedInProfile;
    } catch (error) {
      console.error('LinkedIn profile fetch failed:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get LinkedIn user email
   */
  async getUserEmail(accessToken: string): Promise<string> {
    try {
      const response = await fetch(LINKEDIN_OAUTH_URLS.EMAIL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Email fetch failed: ${response.statusText}`);
      }

      const emailData = (await response.json()) as LinkedInEmailResponse;

      if (!emailData.elements || emailData.elements.length === 0) {
        throw new Error('No email found in LinkedIn profile');
      }

      return emailData.elements[0]['handle~'].emailAddress;
    } catch (error) {
      console.error('LinkedIn email fetch failed:', error);
      throw new Error('Failed to fetch user email');
    }
  }

  /**
   * Sign in with LinkedIn using authorization code
   */
  async signInWithCode(code: string, state: string): Promise<AuthResponse> {
    try {
      // Exchange code for access token
      const accessToken = await this.exchangeCodeForToken(code, state);

      // Get user profile and email
      const [profile, email] = await Promise.all([
        this.getUserProfile(accessToken),
        this.getUserEmail(accessToken),
      ]);

      // Extract profile picture URL
      let avatar: string | undefined;
      if (
        profile.profilePicture?.['displayImage~']?.elements?.[0]
          ?.identifiers?.[0]
      ) {
        avatar =
          profile.profilePicture['displayImage~'].elements[0].identifiers[0]
            .identifier;
      }

      // Prepare social login data
      const socialLoginData: SocialLoginData = {
        provider: 'linkedin',
        accessToken,
        profile: {
          id: profile.id,
          email,
          name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          avatar,
        },
      };

      // Authenticate with backend
      const authResponse = await authService.loginWithLinkedIn(socialLoginData);

      console.log('LinkedIn Sign-In successful');
      return authResponse;
    } catch (error) {
      console.error('LinkedIn Sign-In failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'LinkedIn Sign-In failed',
      );
    }
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  /**
   * Parse callback URL to extract code and state
   */
  parseCallbackUrl(url: string): {
    code?: string;
    state?: string;
    error?: string;
  } {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      return {
        code: params.get('code') || undefined,
        state: params.get('state') || undefined,
        error: params.get('error') || undefined,
      };
    } catch (error) {
      console.error('Failed to parse callback URL:', error);
      return { error: 'Invalid callback URL' };
    }
  }

  /**
   * Validate state parameter for CSRF protection
   */
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }
}

// Default instance
export const linkedInAuthService = new LinkedInAuthService();

// Configuration helper
export const configureLinkedInAuth = (config: LinkedInConfig): void => {
  linkedInAuthService.configure(config);
};

// LinkedIn OAuth scopes
export const LINKEDIN_SCOPES = {
  BASIC_PROFILE: 'r_liteprofile',
  EMAIL_ADDRESS: 'r_emailaddress',
  FULL_PROFILE: 'r_fullprofile',
} as const;

// Default scopes for authentication
export const DEFAULT_LINKEDIN_SCOPES = [
  LINKEDIN_SCOPES.BASIC_PROFILE,
  LINKEDIN_SCOPES.EMAIL_ADDRESS,
];
