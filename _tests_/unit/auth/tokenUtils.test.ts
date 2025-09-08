/**
 * Token Utilities Test Suite
 *
 * Tests JWT token validation, parsing, and management utilities.
 * Validates token expiration, payload extraction, and timing calculations.
 */

import {
  decodeJWTPayload,
  isTokenExpired,
  getTokenExpirationTime,
  getTokenTimeRemaining,
  validateTokens,
  getUserIdFromToken,
  getEmailFromToken,
  getRolesFromToken,
  formatAuthHeader,
  getOptimalRefreshTime,
  isRefreshTokenValid,
  getTokenInfo,
} from '../../../src/utils/tokenUtils';
import { JWTTokens } from '../../../src/types/auth';

// Mock JWT tokens for testing
const createMockToken = (payload: any): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64',
  );
  const signature = 'mock-signature';
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
const nearFutureTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now

describe('Token Utilities', () => {
  describe('decodeJWTPayload', () => {
    it('should decode valid JWT payload', () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        exp: futureTime,
      };
      const token = createMockToken(payload);

      const decoded = decodeJWTPayload(token);

      expect(decoded).toEqual(payload);
    });

    it('should return null for invalid token format', () => {
      const invalidToken = 'invalid.token';
      const decoded = decodeJWTPayload(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'header.invalid-base64.signature';
      const decoded = decodeJWTPayload(malformedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const payload = { exp: futureTime };
      const token = createMockToken(payload);

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const payload = { exp: pastTime };
      const token = createMockToken(payload);

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for token without expiration', () => {
      const payload = { sub: '123' };
      const token = createMockToken(payload);

      expect(isTokenExpired(token)).toBe(true);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should return expiration time for valid token', () => {
      const payload = { exp: futureTime };
      const token = createMockToken(payload);

      expect(getTokenExpirationTime(token)).toBe(futureTime);
    });

    it('should return null for token without expiration', () => {
      const payload = { sub: '123' };
      const token = createMockToken(payload);

      expect(getTokenExpirationTime(token)).toBeNull();
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('should return remaining time for valid token', () => {
      const payload = { exp: futureTime };
      const token = createMockToken(payload);

      const remaining = getTokenTimeRemaining(token);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const payload = { exp: pastTime };
      const token = createMockToken(payload);

      expect(getTokenTimeRemaining(token)).toBe(0);
    });
  });

  describe('validateTokens', () => {
    const mockTokens: JWTTokens = {
      accessToken: '',
      refreshToken: '',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    it('should validate tokens correctly for valid token', () => {
      const payload = { exp: futureTime };
      const token = createMockToken(payload);
      const tokens = { ...mockTokens, accessToken: token };

      const validation = validateTokens(tokens);

      expect(validation.isValid).toBe(true);
      expect(validation.isExpired).toBe(false);
      expect(validation.shouldRefresh).toBe(false);
    });

    it('should suggest refresh for token expiring soon', () => {
      const payload = { exp: nearFutureTime };
      const token = createMockToken(payload);
      const tokens = { ...mockTokens, accessToken: token };

      const validation = validateTokens(tokens);

      expect(validation.isValid).toBe(true);
      expect(validation.shouldRefresh).toBe(true);
    });

    it('should handle expired tokens', () => {
      const payload = { exp: pastTime };
      const token = createMockToken(payload);
      const tokens = { ...mockTokens, accessToken: token };

      const validation = validateTokens(tokens);

      expect(validation.isValid).toBe(false);
      expect(validation.isExpired).toBe(true);
    });
  });

  describe('getUserIdFromToken', () => {
    it('should extract user ID from sub field', () => {
      const payload = { sub: 'user123' };
      const token = createMockToken(payload);

      expect(getUserIdFromToken(token)).toBe('user123');
    });

    it('should extract user ID from userId field', () => {
      const payload = { userId: 'user456' };
      const token = createMockToken(payload);

      expect(getUserIdFromToken(token)).toBe('user456');
    });

    it('should return null if no user ID found', () => {
      const payload = { email: 'test@example.com' };
      const token = createMockToken(payload);

      expect(getUserIdFromToken(token)).toBeNull();
    });
  });

  describe('getEmailFromToken', () => {
    it('should extract email from token', () => {
      const payload = { email: 'test@example.com' };
      const token = createMockToken(payload);

      expect(getEmailFromToken(token)).toBe('test@example.com');
    });

    it('should return null if no email found', () => {
      const payload = { sub: 'user123' };
      const token = createMockToken(payload);

      expect(getEmailFromToken(token)).toBeNull();
    });
  });

  describe('getRolesFromToken', () => {
    it('should extract roles from token', () => {
      const payload = { roles: ['admin', 'user'] };
      const token = createMockToken(payload);

      expect(getRolesFromToken(token)).toEqual(['admin', 'user']);
    });

    it('should return empty array if no roles found', () => {
      const payload = { sub: 'user123' };
      const token = createMockToken(payload);

      expect(getRolesFromToken(token)).toEqual([]);
    });
  });

  describe('formatAuthHeader', () => {
    it('should format Bearer token header', () => {
      const token = 'abc123';

      expect(formatAuthHeader(token)).toBe('Bearer abc123');
    });

    it('should format custom token type', () => {
      const token = 'abc123';

      expect(formatAuthHeader(token, 'Basic')).toBe('Basic abc123');
    });
  });

  describe('getOptimalRefreshTime', () => {
    it('should calculate optimal refresh time', () => {
      const payload = { exp: futureTime };
      const token = createMockToken(payload);
      const tokens: JWTTokens = {
        accessToken: token,
        refreshToken: '',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const refreshTime = getOptimalRefreshTime(tokens);

      expect(refreshTime).toBeGreaterThan(60); // At least 60 seconds
      expect(refreshTime).toBeLessThan(3600); // Less than full token lifetime
    });
  });

  describe('isRefreshTokenValid', () => {
    it('should validate refresh token without expiration', () => {
      const payload = { type: 'refresh' };
      const token = createMockToken(payload);
      const tokens: JWTTokens = {
        accessToken: '',
        refreshToken: token,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      expect(isRefreshTokenValid(tokens)).toBe(true);
    });

    it('should validate refresh token with future expiration', () => {
      const payload = { exp: futureTime };
      const token = createMockToken(payload);
      const tokens: JWTTokens = {
        accessToken: '',
        refreshToken: token,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      expect(isRefreshTokenValid(tokens)).toBe(true);
    });

    it('should reject expired refresh token', () => {
      const payload = { exp: pastTime };
      const token = createMockToken(payload);
      const tokens: JWTTokens = {
        accessToken: '',
        refreshToken: token,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      expect(isRefreshTokenValid(tokens)).toBe(false);
    });
  });

  describe('getTokenInfo', () => {
    it('should extract comprehensive token information', () => {
      const issuedAt = Math.floor(Date.now() / 1000) - 1800; // 30 minutes ago
      const payload = {
        sub: 'user123',
        email: 'test@example.com',
        roles: ['user'],
        iat: issuedAt,
        exp: futureTime,
      };
      const token = createMockToken(payload);

      const info = getTokenInfo(token);

      expect(info).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        roles: ['user'],
        issuedAt: new Date(issuedAt * 1000),
        expiresAt: new Date(futureTime * 1000),
        timeRemaining: expect.any(Number),
        isExpired: false,
      });
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';

      expect(getTokenInfo(invalidToken)).toBeNull();
    });
  });
});
