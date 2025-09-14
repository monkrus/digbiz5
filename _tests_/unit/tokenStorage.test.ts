/**
 * Token Storage Service Unit Tests
 *
 * This test suite validates the secure token storage functionality including:
 * - Secure storage and retrieval of JWT tokens using MMKV
 * - Token validation and expiration checking
 * - Token encryption/decryption
 * - Error handling for storage operations
 */

import { JWTTokens } from '../../src/types/auth';

// Clear the mock from setupTests to test actual implementation
jest.unmock('../../src/services/tokenStorage');
jest.unmock('../../src/utils/tokenUtils');

jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  enc: {
    Utf8: {
      stringify: jest.fn(),
    },
  },
}));

jest.mock('../../src/utils/tokenUtils');

import { MMKV } from 'react-native-mmkv';
import CryptoJS from 'crypto-js';
import {
  tokenStorage,
  SecureTokenStorage,
} from '../../src/services/tokenStorage';
import {
  validateTokens,
  isRefreshTokenValid,
} from '../../src/utils/tokenUtils';

describe('TokenStorageService', () => {
  let storage: SecureTokenStorage;
  let mockMMKV: jest.Mocked<MMKV>;
  const mockValidateTokens = validateTokens as jest.MockedFunction<
    typeof validateTokens
  >;
  const mockIsRefreshTokenValid = isRefreshTokenValid as jest.MockedFunction<
    typeof isRefreshTokenValid
  >;

  const mockTokens: JWTTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    refreshExpiresIn: 604800,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockMMKV = {
      set: jest.fn(),
      getString: jest.fn(),
      delete: jest.fn(),
      getAllKeys: jest.fn().mockReturnValue([]),
      clearAll: jest.fn(),
    } as any;

    (MMKV as jest.Mock).mockReturnValue(mockMMKV);
    storage = new SecureTokenStorage();
  });

  describe('Initialization', () => {
    it('should initialize MMKV with correct configuration', () => {
      expect(MMKV).toHaveBeenCalledWith({
        id: 'auth-tokens',
        encryptionKey: expect.any(String),
      });
    });

    it('should generate consistent encryption key', () => {
      new TokenStorageService();
      new TokenStorageService();

      expect(MMKV).toHaveBeenCalledTimes(3); // Original + 2 new instances

      // Both should use the same encryption key
      const calls = (MMKV as jest.Mock).mock.calls;
      expect(calls[1][0].encryptionKey).toEqual(calls[2][0].encryptionKey);
    });
  });

  describe('Token Storage', () => {
    it('should store tokens successfully', async () => {
      const encryptedData = { toString: () => 'encrypted-data' };
      (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue(encryptedData);

      await storage.setTokens(mockTokens);

      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(
        JSON.stringify(mockTokens),
        expect.any(String),
      );
      expect(mockMMKV.set).toHaveBeenCalledWith('tokens', 'encrypted-data');
    });

    it('should handle storage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMMKV.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(storage.setTokens(mockTokens)).rejects.toThrow(
        'Failed to store tokens',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store tokens:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should handle encryption errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (CryptoJS.AES.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption error');
      });

      await expect(storage.setTokens(mockTokens)).rejects.toThrow(
        'Failed to store tokens',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store tokens:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Token Retrieval', () => {
    it('should retrieve and decrypt tokens successfully', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );

      const result = await storage.getTokens();

      expect(mockMMKV.getString).toHaveBeenCalledWith('tokens');
      expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith(
        encryptedData,
        expect.any(String),
      );
      expect(result).toEqual(mockTokens);
    });

    it('should return null when no tokens are stored', async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await storage.getTokens();

      expect(result).toBeNull();
    });

    it('should handle decryption errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMMKV.getString.mockReturnValue('invalid-encrypted-data');
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption error');
      });

      const result = await storage.getTokens();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to retrieve tokens:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON data', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const encryptedData = 'encrypted-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue('invalid-json'),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        'invalid-json',
      );

      const result = await storage.getTokens();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to retrieve tokens:',
        expect.any(SyntaxError),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Token Removal', () => {
    it('should remove tokens successfully', async () => {
      await storage.removeTokens();

      expect(mockMMKV.delete).toHaveBeenCalledWith('tokens');
    });

    it('should handle removal errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMMKV.delete.mockImplementation(() => {
        throw new Error('Delete error');
      });

      await expect(storage.removeTokens()).rejects.toThrow(
        'Failed to remove tokens',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to remove tokens:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Token Validation', () => {
    it('should return true for valid tokens', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );
      mockValidateTokens.mockReturnValue({
        isValid: true,
        isExpired: false,
        shouldRefresh: false,
      });

      const result = await storage.hasValidTokens();

      expect(result).toBe(true);
      expect(mockValidateTokens).toHaveBeenCalledWith(mockTokens);
    });

    it('should return false for invalid tokens', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );
      mockValidateTokens.mockReturnValue({
        isValid: false,
        isExpired: true,
        shouldRefresh: false,
      });

      const result = await storage.hasValidTokens();

      expect(result).toBe(false);
    });

    it('should return false when no tokens exist', async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await storage.hasValidTokens();

      expect(result).toBe(false);
      expect(mockValidateTokens).not.toHaveBeenCalled();
    });

    it('should return false when token retrieval fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMMKV.getString.mockReturnValue('invalid-encrypted-data');
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption error');
      });

      const result = await storage.hasValidTokens();

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('Storage Cleanup', () => {
    it('should clear all storage data', async () => {
      await storage.clearAllData();

      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMMKV.clearAll.mockImplementation(() => {
        throw new Error('Clear error');
      });

      await expect(storage.clearAllData()).rejects.toThrow(
        'Failed to clear storage',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear all storage data:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Access Token Management', () => {
    it('should get access token from stored tokens', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );

      const result = await storage.getAccessToken();

      expect(result).toBe(mockTokens.accessToken);
    });

    it('should return null when no access token exists', async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await storage.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('Refresh Token Management', () => {
    it('should get refresh token from stored tokens', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );

      const result = await storage.getRefreshToken();

      expect(result).toBe(mockTokens.refreshToken);
    });

    it('should return null when no refresh token exists', async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await storage.getRefreshToken();

      expect(result).toBeNull();
    });

    it('should validate refresh token', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );
      mockIsRefreshTokenValid.mockReturnValue(true);

      const result = await storage.isRefreshTokenValid();

      expect(result).toBe(true);
      expect(mockIsRefreshTokenValid).toHaveBeenCalledWith(mockTokens);
    });

    it('should return false for invalid refresh token', async () => {
      const encryptedData = 'encrypted-token-data';
      const decryptedMock = {
        toString: jest.fn().mockReturnValue(JSON.stringify(mockTokens)),
      };

      mockMMKV.getString.mockReturnValue(encryptedData);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(decryptedMock);
      (CryptoJS.enc.Utf8.stringify as jest.Mock).mockReturnValue(
        JSON.stringify(mockTokens),
      );
      mockIsRefreshTokenValid.mockReturnValue(false);

      const result = await storage.isRefreshTokenValid();

      expect(result).toBe(false);
    });

    it('should return false when no tokens exist for refresh validation', async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await storage.isRefreshTokenValid();

      expect(result).toBe(false);
      expect(mockIsRefreshTokenValid).not.toHaveBeenCalled();
    });
  });

  describe('Default Export', () => {
    it('should export default tokenStorage instance', () => {
      expect(tokenStorage).toBeInstanceOf(TokenStorageService);
    });
  });
});
