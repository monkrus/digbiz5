/**
 * JWT Token Utilities
 *
 * Provides utilities for JWT token validation, parsing, and management.
 * Handles token expiration checks and refresh logic.
 */

import { JWTTokens, TokenValidation } from '../types/auth';

/**
 * Decodes JWT token payload without verification
 */
export const decodeJWTPayload = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);

    // Use atob for base64 decoding in browser/React Native environment
    if (typeof atob !== 'undefined') {
      const decoded = atob(paddedPayload);
      return JSON.parse(decoded);
    }

    // Fallback to Buffer for Node.js environment (testing)
    if (typeof Buffer !== 'undefined') {
      const decoded = Buffer.from(paddedPayload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Gets token expiration time in seconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
  const payload = decodeJWTPayload(token);
  return payload?.exp || null;
};

/**
 * Gets remaining time until token expires (in seconds)
 */
export const getTokenTimeRemaining = (token: string): number => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = expirationTime - currentTime;
  return Math.max(0, remaining);
};

/**
 * Validates JWT tokens and determines if refresh is needed
 */
export const validateTokens = (tokens: JWTTokens): TokenValidation => {
  if (!tokens || !tokens.accessToken) {
    return {
      isValid: false,
      isExpired: true,
      shouldRefresh: false,
    };
  }

  const isExpired = isTokenExpired(tokens.accessToken);
  const timeRemaining = getTokenTimeRemaining(tokens.accessToken);

  // Refresh if token expires within 5 minutes (300 seconds)
  const shouldRefresh = timeRemaining < 300;

  return {
    isValid: !isExpired,
    isExpired,
    expiresIn: timeRemaining,
    shouldRefresh,
  };
};

/**
 * Extracts user ID from JWT token
 */
export const getUserIdFromToken = (token: string): string | null => {
  const payload = decodeJWTPayload(token);
  return payload?.sub || payload?.userId || payload?.id || null;
};

/**
 * Extracts user email from JWT token
 */
export const getEmailFromToken = (token: string): string | null => {
  const payload = decodeJWTPayload(token);
  return payload?.email || null;
};

/**
 * Extracts user roles/permissions from JWT token
 */
export const getRolesFromToken = (token: string): string[] => {
  const payload = decodeJWTPayload(token);
  return payload?.roles || payload?.permissions || [];
};

/**
 * Formats authorization header for API requests
 */
export const formatAuthHeader = (
  token: string,
  tokenType: string = 'Bearer',
): string => {
  return `${tokenType} ${token}`;
};

/**
 * Calculates optimal refresh time (80% of token lifetime)
 */
export const getOptimalRefreshTime = (tokens: JWTTokens): number => {
  const timeRemaining = getTokenTimeRemaining(tokens.accessToken);
  // Refresh at 80% of remaining time, minimum 60 seconds
  return Math.max(60, Math.floor(timeRemaining * 0.8));
};

/**
 * Checks if refresh token is still valid
 */
export const isRefreshTokenValid = (tokens: JWTTokens): boolean => {
  if (!tokens.refreshToken) {
    return false;
  }

  // If refresh token doesn't expire, assume it's valid
  const payload = decodeJWTPayload(tokens.refreshToken);
  if (!payload || !payload.exp) {
    return true;
  }

  return !isTokenExpired(tokens.refreshToken);
};

/**
 * Token utilities for debugging and monitoring
 */
export const getTokenInfo = (token: string) => {
  const payload = decodeJWTPayload(token);
  if (!payload) {
    return null;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const issuedAt = payload.iat ? new Date(payload.iat * 1000) : null;
  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
  const timeRemaining = payload.exp ? payload.exp - currentTime : null;

  return {
    userId: payload.sub || payload.userId || payload.id,
    email: payload.email,
    roles: payload.roles || payload.permissions || [],
    issuedAt,
    expiresAt,
    timeRemaining,
    isExpired: timeRemaining ? timeRemaining <= 0 : false,
  };
};
