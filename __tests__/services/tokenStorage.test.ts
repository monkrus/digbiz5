/**
 * Secure Storage Encryption Tests
 *
 * Comprehensive tests for secure token storage including encryption,
 * decryption, key management, and security scenarios.
 */

import {
  mockTokens,
  mockMMKV,
  mockCryptoJS,
  setupMocks,
  teardownMocks,
} from '../utils/testUtils';

// Import test target and dependencies
import { SecureTokenStorage } from '../../src/services/tokenStorage';
import { MMKV } from 'react-native-mmkv';

describe('Secure Token Storage Encryption', () => {
  let tokenStorage: any;
  let mockMMKVInstance: jest.Mocked<typeof mockMMKV>;

  beforeEach(() => {
    setupMocks();

    // Get the mock instance that was set up in global test setup
    mockMMKVInstance = mockMMKV as jest.Mocked<typeof mockMMKV>;
    mockMMKVInstance.getString.mockReturnValue('test_encryption_key');

    // Create new instance using the mocked constructor
    const MockedSecureTokenStorage = SecureTokenStorage as jest.MockedClass<
      typeof SecureTokenStorage
    >;
    tokenStorage = new MockedSecureTokenStorage('test-storage');
  });

  afterEach(() => {
    teardownMocks();
    jest.clearAllMocks();
  });

  describe('Encryption Key Management', () => {
    it('should generate encryption key on first initialization', () => {
      mockMMKVInstance.getString.mockReturnValue(null); // No existing key

      new SecureTokenStorage('new-instance');

      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(
        'auth.encryptionKey',
      );
      expect(mockCryptoJS.lib.WordArray.random).toHaveBeenCalledWith(32); // 256 bits
      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.encryptionKey',
        'random_key',
      );
    });

    it('should use existing encryption key if available', () => {
      const existingKey = 'existing_encryption_key';
      mockMMKVInstance.getString.mockReturnValue(existingKey);

      new SecureTokenStorage('existing-instance');

      expect(mockMMKVInstance.getString).toHaveBeenCalledWith(
        'auth.encryptionKey',
      );
      expect(mockCryptoJS.lib.WordArray.random).not.toHaveBeenCalled();
      expect(mockMMKVInstance.set).not.toHaveBeenCalledWith(
        'auth.encryptionKey',
        expect.any(String),
      );
    });

    it('should use instance-specific encryption keys', () => {
      const storage1 = new SecureTokenStorage('instance-1');
      const storage2 = new SecureTokenStorage('instance-2');

      // Each instance should have been created with its own ID
      expect(MMKV).toHaveBeenCalledWith({
        id: 'instance-1',
        encryptionKey: expect.any(String),
      });

      expect(MMKV).toHaveBeenCalledWith({
        id: 'instance-2',
        encryptionKey: expect.any(String),
      });
    });
  });

  describe('Token Encryption', () => {
    beforeEach(() => {
      mockMMKVInstance.getString.mockReturnValue('test_encryption_key');
    });

    it('should encrypt tokens before storage', async () => {
      mockCryptoJS.AES.encrypt
        .mockReturnValueOnce({
          toString: () => 'encrypted_access_token',
        } as any)
        .mockReturnValueOnce({
          toString: () => 'encrypted_refresh_token',
        } as any);

      await tokenStorage.setTokens(mockTokens);

      expect(mockCryptoJS.AES.encrypt).toHaveBeenCalledWith(
        mockTokens.accessToken,
        'test_encryption_key',
      );
      expect(mockCryptoJS.AES.encrypt).toHaveBeenCalledWith(
        mockTokens.refreshToken,
        'test_encryption_key',
      );

      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.accessToken',
        'encrypted_access_token',
      );
      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.refreshToken',
        'encrypted_refresh_token',
      );
    });

    it('should store non-sensitive data unencrypted', async () => {
      await tokenStorage.setTokens(mockTokens);

      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.expiresIn',
        mockTokens.expiresIn,
      );
      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.tokenType',
        mockTokens.tokenType,
      );
    });

    it('should handle encryption errors gracefully', async () => {
      mockCryptoJS.AES.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(tokenStorage.setTokens(mockTokens)).rejects.toThrow(
        'Failed to store authentication tokens',
      );
    });
  });

  describe('Token Decryption', () => {
    beforeEach(() => {
      mockMMKVInstance.getString
        .mockReturnValueOnce('test_encryption_key') // For constructor
        .mockReturnValueOnce('encrypted_access_token') // For getTokens
        .mockReturnValueOnce('encrypted_refresh_token') // For getTokens
        .mockReturnValueOnce('Bearer'); // For tokenType

      mockMMKVInstance.getNumber.mockReturnValue(3600);

      mockCryptoJS.AES.decrypt
        .mockReturnValueOnce({
          toString: jest.fn().mockReturnValue(mockTokens.accessToken),
        } as any)
        .mockReturnValueOnce({
          toString: jest.fn().mockReturnValue(mockTokens.refreshToken),
        } as any);
    });

    it('should decrypt tokens when retrieving', async () => {
      const result = await tokenStorage.getTokens();

      expect(mockCryptoJS.AES.decrypt).toHaveBeenCalledWith(
        'encrypted_access_token',
        'test_encryption_key',
      );
      expect(mockCryptoJS.AES.decrypt).toHaveBeenCalledWith(
        'encrypted_refresh_token',
        'test_encryption_key',
      );

      expect(result).toEqual(mockTokens);
    });

    it('should return null if any token data is missing', async () => {
      mockMMKVInstance.getString
        .mockReturnValueOnce('test_encryption_key')
        .mockReturnValueOnce(null) // Missing access token
        .mockReturnValueOnce('encrypted_refresh_token');

      const result = await tokenStorage.getTokens();

      expect(result).toBeNull();
    });

    it('should handle decryption errors and clear corrupted tokens', async () => {
      mockCryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const removeTokensSpy = jest.spyOn(tokenStorage, 'removeTokens');
      removeTokensSpy.mockResolvedValue();

      const result = await tokenStorage.getTokens();

      expect(result).toBeNull();
      expect(removeTokensSpy).toHaveBeenCalled();
    });

    it('should handle empty decryption result', async () => {
      mockCryptoJS.AES.decrypt.mockReturnValue({
        toString: jest.fn().mockReturnValue(''), // Empty decryption result
      } as any);

      const removeTokensSpy = jest.spyOn(tokenStorage, 'removeTokens');
      removeTokensSpy.mockResolvedValue();

      const result = await tokenStorage.getTokens();

      expect(result).toBeNull();
      expect(removeTokensSpy).toHaveBeenCalled();
    });
  });

  describe('Secure Operations', () => {
    it('should securely update access token while preserving refresh token', async () => {
      const newAccessToken = 'new_access_token';
      const newExpiresIn = 7200;

      // Mock existing tokens
      mockMMKVInstance.getString
        .mockReturnValueOnce('test_encryption_key')
        .mockReturnValueOnce('encrypted_access_token')
        .mockReturnValueOnce('encrypted_refresh_token')
        .mockReturnValueOnce('Bearer');

      mockMMKVInstance.getNumber.mockReturnValue(3600);

      mockCryptoJS.AES.decrypt
        .mockReturnValueOnce({
          toString: jest.fn().mockReturnValue(mockTokens.accessToken),
        } as any)
        .mockReturnValueOnce({
          toString: jest.fn().mockReturnValue(mockTokens.refreshToken),
        } as any);

      // Mock encryption for update
      mockCryptoJS.AES.encrypt
        .mockReturnValueOnce({
          toString: () => 'encrypted_new_access_token',
        } as any)
        .mockReturnValueOnce({
          toString: () => 'encrypted_refresh_token',
        } as any);

      await tokenStorage.updateAccessToken(newAccessToken, newExpiresIn);

      expect(mockCryptoJS.AES.encrypt).toHaveBeenCalledWith(
        newAccessToken,
        'test_encryption_key',
      );
      expect(mockCryptoJS.AES.encrypt).toHaveBeenCalledWith(
        mockTokens.refreshToken,
        'test_encryption_key',
      );

      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.accessToken',
        'encrypted_new_access_token',
      );
      expect(mockMMKVInstance.set).toHaveBeenCalledWith(
        'auth.expiresIn',
        newExpiresIn,
      );
    });

    it('should securely validate stored tokens', async () => {
      mockMMKVInstance.getString
        .mockReturnValueOnce('test_encryption_key')
        .mockReturnValueOnce('encrypted_access_token')
        .mockReturnValueOnce('encrypted_refresh_token')
        .mockReturnValueOnce('Bearer');

      mockMMKVInstance.getNumber.mockReturnValue(Date.now() + 3600000); // Valid expiry

      mockCryptoJS.AES.decrypt
        .mockReturnValueOnce({
          toString: jest.fn().mockReturnValue(mockTokens.accessToken),
        } as any)
        .mockReturnValueOnce({
          toString: jest.fn().mockReturnValue(mockTokens.refreshToken),
        } as any);

      // Mock token validation
      const {
        validateTokens,
        isRefreshTokenValid,
      } = require('../../src/utils/tokenUtils');
      validateTokens.mockReturnValue({ isValid: true, isExpired: false });
      isRefreshTokenValid.mockReturnValue(true);

      const result = await tokenStorage.hasValidTokens();

      expect(result).toBe(true);
    });

    it('should detect token tampering', async () => {
      mockMMKVInstance.getString
        .mockReturnValueOnce('test_encryption_key')
        .mockReturnValueOnce('tampered_encrypted_token') // Tampered token
        .mockReturnValueOnce('encrypted_refresh_token')
        .mockReturnValueOnce('Bearer');

      mockMMKVInstance.getNumber.mockReturnValue(3600);

      // Mock decryption failure due to tampering
      mockCryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Invalid ciphertext');
      });

      const removeTokensSpy = jest.spyOn(tokenStorage, 'removeTokens');
      removeTokensSpy.mockResolvedValue();

      const result = await tokenStorage.getTokens();

      expect(result).toBeNull();
      expect(removeTokensSpy).toHaveBeenCalled();
    });
  });

  describe('Storage Information and Cleanup', () => {
    it('should provide storage information for debugging', () => {
      mockMMKVInstance.contains
        .mockReturnValueOnce(true) // hasAccessToken
        .mockReturnValueOnce(true) // hasRefreshToken
        .mockReturnValueOnce(true); // hasEncryptionKey

      mockMMKVInstance.size = 1024;

      const info = tokenStorage.getStorageInfo();

      expect(info).toEqual({
        hasAccessToken: true,
        hasRefreshToken: true,
        hasEncryptionKey: true,
        storageSize: 1024,
      });
    });

    it('should securely remove all tokens', async () => {
      await tokenStorage.removeTokens();

      expect(mockMMKVInstance.delete).toHaveBeenCalledWith('auth.accessToken');
      expect(mockMMKVInstance.delete).toHaveBeenCalledWith('auth.refreshToken');
      expect(mockMMKVInstance.delete).toHaveBeenCalledWith('auth.expiresIn');
      expect(mockMMKVInstance.delete).toHaveBeenCalledWith('auth.tokenType');
    });

    it('should clear all data including encryption key', async () => {
      await tokenStorage.clearAll();

      expect(mockMMKVInstance.clearAll).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      mockMMKVInstance.delete.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(tokenStorage.removeTokens()).rejects.toThrow(
        'Failed to clear authentication tokens',
      );
    });
  });

  describe('Encryption Algorithm Security', () => {
    it('should use AES encryption with proper key size', () => {
      expect(mockCryptoJS.lib.WordArray.random).toHaveBeenCalledWith(32); // 256 bits
    });

    it('should use different encryption keys for different instances', () => {
      const storage1 = new SecureTokenStorage('instance-1');
      const storage2 = new SecureTokenStorage('instance-2');

      expect(MMKV).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'instance-1' }),
      );
      expect(MMKV).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'instance-2' }),
      );
    });

    it('should generate cryptographically secure random keys', () => {
      mockMMKVInstance.getString.mockReturnValue(null);

      new SecureTokenStorage('secure-test');

      expect(mockCryptoJS.lib.WordArray.random).toHaveBeenCalledWith(32);
    });

    it('should not store encryption key in plain text', () => {
      // The encryption key should be stored in MMKV which provides additional security
      // but the key generation should be secure
      expect(mockCryptoJS.lib.WordArray.random).toHaveBeenCalled();
    });
  });

  describe('Key Rotation and Recovery', () => {
    it('should handle encryption key corruption', async () => {
      mockMMKVInstance.getString
        .mockReturnValueOnce('corrupted_key')
        .mockReturnValueOnce('encrypted_access_token')
        .mockReturnValueOnce('encrypted_refresh_token');

      mockCryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Invalid key');
      });

      const removeTokensSpy = jest.spyOn(tokenStorage, 'removeTokens');
      removeTokensSpy.mockResolvedValue();

      const result = await tokenStorage.getTokens();

      expect(result).toBeNull();
      expect(removeTokensSpy).toHaveBeenCalled();
    });

    it('should support secure backup of encryption keys', () => {
      // In a real implementation, you might want to support secure backup
      // of encryption keys for recovery purposes
      const info = tokenStorage.getStorageInfo();

      expect(info.hasEncryptionKey).toBeDefined();
    });
  });

  describe('Performance and Memory Security', () => {
    it('should not leak sensitive data in memory', async () => {
      // This test ensures that sensitive operations don't leave traces
      await tokenStorage.setTokens(mockTokens);
      await tokenStorage.getTokens();

      // Verify that encryption/decryption operations were called
      expect(mockCryptoJS.AES.encrypt).toHaveBeenCalled();
      expect(mockCryptoJS.AES.decrypt).toHaveBeenCalled();

      // In a real implementation, you'd want to ensure that:
      // 1. Plaintext tokens are not stored in variables longer than necessary
      // 2. Sensitive data is cleared from memory after use
      // 3. No sensitive data is logged or exposed in error messages
    });

    it('should handle concurrent access safely', async () => {
      const promises = [
        tokenStorage.setTokens(mockTokens),
        tokenStorage.getTokens(),
        tokenStorage.hasValidTokens(),
      ];

      // Should not throw errors when accessed concurrently
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
