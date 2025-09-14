/**
 * Profile Error Handling Utilities
 *
 * This file contains utilities for handling profile-related errors including
 * error classification, user-friendly messages, retry logic, and error reporting.
 */

import { ProfileValidationErrors } from '../types/profile';

export enum ProfileErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ProfileError {
  type: ProfileErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  userMessage: string;
}

export interface ErrorContext {
  operation: string;
  profileId?: string;
  userId?: string;
  field?: string;
  metadata?: Record<string, any>;
}

/**
 * Profile Error Handler Class
 */
export class ProfileErrorHandler {
  /**
   * Classify and handle different types of errors
   */
  static handleError(error: any, context?: ErrorContext): ProfileError {
    const timestamp = new Date();

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        type: ProfileErrorType.NETWORK_ERROR,
        message: error.message,
        timestamp,
        retryable: true,
        userMessage:
          'Network connection error. Please check your internet connection and try again.',
        details: { context },
      };
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return {
        type: ProfileErrorType.VALIDATION_ERROR,
        message: error.message,
        timestamp,
        retryable: false,
        userMessage: 'Please check your input and try again.',
        details: { validationErrors: error.errors, context },
      };
    }

    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return {
        type: ProfileErrorType.AUTHENTICATION_ERROR,
        message: error.message,
        code: error.code,
        timestamp,
        retryable: false,
        userMessage: 'Authentication failed. Please log in again.',
        details: { context },
      };
    }

    // Permission errors
    if (this.isPermissionError(error)) {
      return {
        type: ProfileErrorType.PERMISSION_ERROR,
        message: error.message,
        timestamp,
        retryable: false,
        userMessage: "You don't have permission to perform this action.",
        details: { context },
      };
    }

    // Not found errors (check before file upload to avoid conflict)
    if (this.isNotFoundError(error)) {
      return {
        type: ProfileErrorType.NOT_FOUND_ERROR,
        message: error.message,
        timestamp,
        retryable: false,
        userMessage: 'The requested profile was not found.',
        details: { context },
      };
    }

    // File upload errors
    if (this.isFileUploadError(error)) {
      return {
        type: ProfileErrorType.FILE_UPLOAD_ERROR,
        message: error.message,
        timestamp,
        retryable: true,
        userMessage:
          'Failed to upload file. Please try again with a different file.',
        details: { context },
      };
    }

    // Rate limit errors
    if (this.isRateLimitError(error)) {
      return {
        type: ProfileErrorType.RATE_LIMIT_ERROR,
        message: error.message,
        timestamp,
        retryable: true,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        details: { context },
      };
    }

    // Server errors
    if (this.isServerError(error)) {
      return {
        type: ProfileErrorType.SERVER_ERROR,
        message: error.message,
        code: error.status?.toString(),
        timestamp,
        retryable: true,
        userMessage: 'Server error occurred. Please try again later.',
        details: { context },
      };
    }

    // Unknown errors
    return {
      type: ProfileErrorType.UNKNOWN_ERROR,
      message: error.message || 'An unknown error occurred',
      timestamp,
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
      details: { originalError: error, context },
    };
  }

  /**
   * Get user-friendly error message based on error type and context
   */
  static getUserFriendlyMessage(
    error: ProfileError,
    context?: ErrorContext,
  ): string {
    const operation = context?.operation || 'operation';

    switch (error.type) {
      case ProfileErrorType.VALIDATION_ERROR:
        return this.getValidationErrorMessage(error, context);

      case ProfileErrorType.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection and try again.';

      case ProfileErrorType.SERVER_ERROR:
        if (operation === 'create') {
          return 'Failed to create profile. Please try again later.';
        } else if (operation === 'update') {
          return 'Failed to update profile. Please try again later.';
        } else if (operation === 'upload') {
          return 'Failed to upload photo. Please try again later.';
        }
        return 'Server error occurred. Please try again later.';

      case ProfileErrorType.AUTHENTICATION_ERROR:
        return 'Your session has expired. Please log in again.';

      case ProfileErrorType.PERMISSION_ERROR:
        return "You don't have permission to access or modify this profile.";

      case ProfileErrorType.FILE_UPLOAD_ERROR:
        return 'Failed to upload the image. Please ensure the file is a valid image under 10MB.';

      case ProfileErrorType.NOT_FOUND_ERROR:
        return 'The requested profile could not be found.';

      case ProfileErrorType.RATE_LIMIT_ERROR:
        return "You're making too many requests. Please wait a moment and try again.";

      default:
        return (
          error.userMessage || 'An unexpected error occurred. Please try again.'
        );
    }
  }

  /**
   * Get specific validation error messages
   */
  private static getValidationErrorMessage(
    error: ProfileError,
    context?: ErrorContext,
  ): string {
    const field = context?.field;
    const validationErrors = error.details?.validationErrors;

    if (field && validationErrors?.[field]) {
      return validationErrors[field];
    }

    if (validationErrors && typeof validationErrors === 'object') {
      const firstError = Object.values(validationErrors)[0];
      if (typeof firstError === 'string') {
        return firstError;
      }
    }

    return 'Please check your input and correct any errors.';
  }

  /**
   * Check if error should trigger a retry
   */
  static shouldRetry(error: ProfileError, attemptCount: number = 0): boolean {
    if (!error.retryable || attemptCount >= 3) {
      return false;
    }

    // Don't retry validation and permission errors
    if (
      error.type === ProfileErrorType.VALIDATION_ERROR ||
      error.type === ProfileErrorType.PERMISSION_ERROR ||
      error.type === ProfileErrorType.AUTHENTICATION_ERROR
    ) {
      return false;
    }

    // Implement exponential backoff for rate limits
    if (error.type === ProfileErrorType.RATE_LIMIT_ERROR) {
      return attemptCount < 2;
    }

    return true;
  }

  /**
   * Calculate retry delay in milliseconds
   */
  static getRetryDelay(error: ProfileError, attemptCount: number): number {
    const baseDelay = 1000; // 1 second

    switch (error.type) {
      case ProfileErrorType.RATE_LIMIT_ERROR:
        // Exponential backoff for rate limits: 2s, 4s, 8s
        return Math.min(baseDelay * Math.pow(2, attemptCount + 1), 30000);

      case ProfileErrorType.NETWORK_ERROR:
        // Linear increase for network errors: 1s, 2s, 3s
        return baseDelay * (attemptCount + 1);

      case ProfileErrorType.SERVER_ERROR:
        // Exponential backoff for server errors: 1s, 2s, 4s
        return Math.min(baseDelay * Math.pow(2, attemptCount), 10000);

      default:
        return baseDelay;
    }
  }

  /**
   * Error type detection methods
   */
  private static isNetworkError(error: any): boolean {
    return (
      error.name === 'NetworkError' ||
      error.message?.includes('Network') ||
      error.message?.includes('fetch') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  private static isValidationError(error: any): boolean {
    return (
      error.name === 'ValidationError' ||
      error.status === 400 ||
      error.code === 'VALIDATION_ERROR' ||
      (error.errors && typeof error.errors === 'object')
    );
  }

  private static isAuthenticationError(error: any): boolean {
    return (
      error.status === 401 ||
      error.code === 'UNAUTHORIZED' ||
      error.message?.includes('Authentication') ||
      error.message?.includes('Unauthorized')
    );
  }

  private static isPermissionError(error: any): boolean {
    return (
      error.status === 403 ||
      error.code === 'FORBIDDEN' ||
      error.message?.includes('Permission') ||
      error.message?.includes('Forbidden')
    );
  }

  private static isFileUploadError(error: any): boolean {
    return (
      error.code === 'FILE_UPLOAD_ERROR' ||
      error.message?.includes('upload') ||
      error.message?.includes('file') ||
      (error.status >= 400 &&
        error.status < 500 &&
        error.message?.includes('image'))
    );
  }

  private static isNotFoundError(error: any): boolean {
    return (
      error.status === 404 ||
      error.code === 'NOT_FOUND' ||
      error.message?.includes('not found')
    );
  }

  private static isRateLimitError(error: any): boolean {
    return (
      error.status === 429 ||
      error.code === 'RATE_LIMIT' ||
      error.message?.includes('rate limit') ||
      error.message?.includes('too many requests')
    );
  }

  private static isServerError(error: any): boolean {
    return (
      error.status >= 500 ||
      error.code === 'SERVER_ERROR' ||
      error.message?.includes('Server Error')
    );
  }

  /**
   * Log error for debugging and monitoring
   */
  static logError(error: ProfileError, context?: ErrorContext): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      context,
      details: error.details,
    };

    if (__DEV__) {
      console.error('Profile Error:', logData);
    }

    // In production, you might want to send this to a logging service
    // like Sentry, LogRocket, or your own analytics service
    if (!__DEV__) {
      // Example: analytics.track('profile_error', logData);
    }
  }

  /**
   * Create error from validation result
   */
  static createValidationError(errors: ProfileValidationErrors): ProfileError {
    const firstError = Object.values(errors)[0] || 'Validation failed';

    return {
      type: ProfileErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      timestamp: new Date(),
      retryable: false,
      userMessage: firstError,
      details: { validationErrors: errors },
    };
  }

  /**
   * Format multiple validation errors for display
   */
  static formatValidationErrors(errors: ProfileValidationErrors): string[] {
    return Object.entries(errors)
      .filter(([_, message]) => message)
      .map(([field, message]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${message}`;
      });
  }

  /**
   * Check if two errors are the same
   */
  static isSameError(error1: ProfileError, error2: ProfileError): boolean {
    return (
      error1.type === error2.type &&
      error1.message === error2.message &&
      error1.code === error2.code
    );
  }

  /**
   * Create a recovery suggestion based on error type
   */
  static getRecoverySuggestion(error: ProfileError): string[] {
    const suggestions: string[] = [];

    switch (error.type) {
      case ProfileErrorType.NETWORK_ERROR:
        suggestions.push('Check your internet connection');
        suggestions.push('Try again in a few moments');
        suggestions.push('Switch to a different network if possible');
        break;

      case ProfileErrorType.VALIDATION_ERROR:
        suggestions.push('Review and correct the highlighted fields');
        suggestions.push('Ensure all required fields are filled');
        suggestions.push('Check that information meets the specified format');
        break;

      case ProfileErrorType.FILE_UPLOAD_ERROR:
        suggestions.push('Ensure the image is less than 10MB');
        suggestions.push('Try using a different image format (JPEG, PNG)');
        suggestions.push('Check your internet connection');
        break;

      case ProfileErrorType.AUTHENTICATION_ERROR:
        suggestions.push('Log out and log in again');
        suggestions.push('Clear your app cache');
        break;

      case ProfileErrorType.RATE_LIMIT_ERROR:
        suggestions.push('Wait a few minutes before trying again');
        suggestions.push('Avoid making multiple rapid requests');
        break;

      case ProfileErrorType.SERVER_ERROR:
        suggestions.push('Try again later');
        suggestions.push('Contact support if the problem persists');
        break;

      default:
        suggestions.push('Try again');
        suggestions.push('Restart the app if the problem persists');
        suggestions.push('Contact support if you continue having issues');
    }

    return suggestions;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: ProfileError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = ProfileErrorHandler.handleError(error, context);

      if (
        attempt === maxRetries ||
        !ProfileErrorHandler.shouldRetry(lastError, attempt)
      ) {
        ProfileErrorHandler.logError(lastError, context);
        throw lastError;
      }

      const delay = ProfileErrorHandler.getRetryDelay(lastError, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Async wrapper for profile operations with error handling
 */
export async function withProfileErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const profileError = ProfileErrorHandler.handleError(error, context);
    ProfileErrorHandler.logError(profileError, context);
    throw profileError;
  }
}
