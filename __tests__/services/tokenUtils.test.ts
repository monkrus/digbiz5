/**
 * Token Utils Tests
 *
 * Tests for JWT token utility functions including decoding, validation, and formatting
 */

import {
  decodeJWTPayload,
  isTokenExpired,
  getTokenInfo,
  formatAuthHeader,
} from '../../src/utils/tokenUtils';

describe('TokenUtils', () => {
  describe('formatAuthHeader', () => {
    it('should format authorization header correctly', () => {
      const token = 'test-token-123';
      const result = formatAuthHeader(token);

      expect(result).toBe('Bearer test-token-123');
    });

    it('should handle empty token', () => {
      const result = formatAuthHeader('');

      expect(result).toBe('Bearer ');
    });
  });

  describe('decodeJWTPayload', () => {
    it('should decode valid JWT token', () => {
      // Valid JWT token with payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const payload = decodeJWTPayload(validToken);

      expect(payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
      });
    });

    it('should handle invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => decodeJWTPayload(invalidToken)).toThrow();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // Token with expiration in the past (Jan 1, 2020)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTc3ODM2ODAwfQ.example';

      const result = isTokenExpired(expiredToken);

      expect(result).toBe(true);
    });

    it('should return false for valid token', () => {
      // Token with expiration far in the future (Jan 1, 2030)
      const futureExp = Math.floor(new Date('2030-01-01').getTime() / 1000);
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({
          sub: '1234567890',
          exp: futureExp,
        }),
      )}.example`;

      const result = isTokenExpired(validToken);

      expect(result).toBe(false);
    });

    it('should handle token without expiration', () => {
      const tokenWithoutExp =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.example';

      const result = isTokenExpired(tokenWithoutExp);

      expect(result).toBe(false); // No expiration means not expired
    });
  });

  describe('getTokenInfo', () => {
    it('should return comprehensive token information', () => {
      const futureExp = Math.floor(new Date('2025-01-01').getTime() / 1000);
      const mockPayload = {
        sub: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // Issued 1 hour ago
        exp: futureExp,
      };

      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify(mockPayload),
      )}.example`;

      const tokenInfo = getTokenInfo(token);

      expect(tokenInfo).toMatchObject({
        payload: mockPayload,
        isExpired: false,
        isValid: true,
        expiresAt: expect.any(Date),
        issuedAt: expect.any(Date),
      });
    });

    it('should handle invalid token', () => {
      const invalidToken = 'invalid-token';

      const tokenInfo = getTokenInfo(invalidToken);

      expect(tokenInfo).toMatchObject({
        payload: null,
        isExpired: true,
        isValid: false,
        expiresAt: null,
        issuedAt: null,
      });
    });
  });
});
