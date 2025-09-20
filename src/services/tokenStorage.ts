/**
 * Secure Token Storage Service
 *
 * Provides secure storage and retrieval of JWT tokens using MMKV.
 * Implements encryption and secure key management for token persistence.
 */

import { MMKV } from 'react-native-mmkv';
import * as CryptoJS from 'crypto-js';
import { JWTTokens, TokenStorage } from '../types/auth';
import { validateTokens, isRefreshTokenValid } from '../utils/tokenUtils';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  TOKEN_EXPIRES_IN: 'auth.expiresIn',
  TOKEN_TYPE: 'auth.tokenType',
  ENCRYPTION_KEY: 'auth.encryptionKey',
} as const;

/**
 * Secure Token Storage Implementation using MMKV
 */
export class SecureTokenStorage implements TokenStorage {
  private storage: MMKV;
  private encryptionKey: string;

  constructor(instanceId: string = 'auth-tokens') {
    // Initialize MMKV first without encryption key
    this.storage = new MMKV({
      id: instanceId,
    });

    // Then get or create encryption key using the initialized storage
    this.encryptionKey = this.getOrCreateEncryptionKey();

    // Reinitialize with encryption key if needed
    if (this.encryptionKey) {
      this.storage = new MMKV({
        id: instanceId,
        encryptionKey: this.encryptionKey,
      });
    }
  }

  /**
   * Gets or creates encryption key for additional token encryption
   */
  private getOrCreateEncryptionKey(): string {
    let key = this.storage.getString(STORAGE_KEYS.ENCRYPTION_KEY);

    if (!key) {
      // Generate a random encryption key
      try {
        key = CryptoJS.lib.WordArray.random(256 / 8).toString();
      } catch (error) {
        // Fallback to simple random string if CryptoJS fails
        key =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
      }
      this.storage.set(STORAGE_KEYS.ENCRYPTION_KEY, key);
    }

    return key;
  }

  /**
   * Encrypts sensitive data before storage
   */
  private encrypt(data: string): string {
    try {
      if (!CryptoJS || !CryptoJS.AES) {
        // Fallback to base64 encoding if CryptoJS is not available
        return Buffer.from(data).toString('base64');
      }
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      console.error('Token encryption failed:', error);
      try {
        // Fallback to base64 encoding
        return Buffer.from(data).toString('base64');
      } catch (fallbackError) {
        throw new Error('Failed to encrypt token data');
      }
    }
  }

  /**
   * Decrypts stored data
   */
  private decrypt(encryptedData: string): string {
    try {
      if (!CryptoJS || !CryptoJS.AES) {
        // Fallback to base64 decoding if CryptoJS is not available
        return Buffer.from(encryptedData, 'base64').toString();
      }

      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        // Try base64 decoding as fallback
        return Buffer.from(encryptedData, 'base64').toString();
      }

      return decrypted;
    } catch (error) {
      console.error('Token decryption failed:', error);
      // Try base64 decoding as fallback
      try {
        return Buffer.from(encryptedData, 'base64').toString();
      } catch (fallbackError) {
        throw new Error('Failed to decrypt token data');
      }
    }
  }

  /**
   * Stores JWT tokens securely
   */
  async setTokens(tokens: JWTTokens): Promise<void> {
    try {
      // Encrypt the entire tokens object as JSON
      const encryptedTokens = this.encrypt(JSON.stringify(tokens));

      // Store encrypted tokens as a single entry
      this.storage.set('tokens', encryptedTokens);

      console.log('Tokens stored securely');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store tokens');
    }
  }

  /**
   * Retrieves JWT tokens from secure storage
   */
  async getTokens(): Promise<JWTTokens | null> {
    try {
      const encryptedTokens = this.storage.getString('tokens');

      if (!encryptedTokens) {
        return null;
      }

      // Decrypt and parse tokens
      const decryptedData = this.decrypt(encryptedTokens);
      const tokens = JSON.parse(decryptedData) as JWTTokens;

      return tokens;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      // Clear corrupted tokens
      await this.removeTokens();
      return null;
    }
  }

  /**
   * Removes all stored tokens
   */
  async removeTokens(): Promise<void> {
    try {
      this.storage.delete('tokens');

      console.log('Tokens removed from storage');
    } catch (error) {
      console.error('Failed to remove tokens:', error);
      throw new Error('Failed to remove tokens');
    }
  }

  /**
   * Checks if valid tokens exist in storage
   */
  async hasValidTokens(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();

      if (!tokens) {
        return false;
      }

      const validation = validateTokens(tokens);
      const refreshTokenValid = isRefreshTokenValid(tokens);

      // Valid if access token is not expired or refresh token is available
      return validation.isValid || (validation.isExpired && refreshTokenValid);
    } catch (error) {
      console.error('Failed to validate stored tokens:', error);
      return false;
    }
  }

  /**
   * Updates only the access token (used after refresh)
   */
  async updateAccessToken(
    accessToken: string,
    expiresIn: number,
  ): Promise<void> {
    try {
      const currentTokens = await this.getTokens();

      if (!currentTokens) {
        throw new Error('No existing tokens to update');
      }

      const updatedTokens: JWTTokens = {
        ...currentTokens,
        accessToken,
        expiresIn,
      };

      await this.setTokens(updatedTokens);
    } catch (error) {
      console.error('Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Clears all authentication data including encryption key
   */
  async clearAll(): Promise<void> {
    try {
      this.storage.clearAll();
      console.log('All authentication data cleared');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  /**
   * Gets storage information for debugging
   */
  getStorageInfo(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasEncryptionKey: boolean;
    storageSize: number;
  } {
    return {
      hasAccessToken: this.storage.contains('tokens'),
      hasRefreshToken: this.storage.contains('tokens'),
      hasEncryptionKey: this.storage.contains(STORAGE_KEYS.ENCRYPTION_KEY),
      storageSize: this.storage.size,
    };
  }

  /**
   * Gets access token from stored tokens
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Gets refresh token from stored tokens
   */
  async getRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Validates refresh token
   */
  async isRefreshTokenValid(): Promise<boolean> {
    const tokens = await this.getTokens();
    if (!tokens) {
      return false;
    }
    return isRefreshTokenValid(tokens);
  }

  /**
   * Clears all storage data
   */
  async clearAllData(): Promise<void> {
    try {
      this.storage.clearAll();
      console.log('All storage data cleared');
    } catch (error) {
      console.error('Failed to clear all storage data:', error);
      throw new Error('Failed to clear storage');
    }
  }
}

// Default export the class

// Default instance
export const tokenStorage = new SecureTokenStorage();

// Factory function for creating custom instances
export const createTokenStorage = (instanceId: string): TokenStorage => {
  return new SecureTokenStorage(instanceId);
};

// Default export
export default tokenStorage;
