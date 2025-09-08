/**
 * Profile Error Handling Unit Tests
 * 
 * This test suite validates the ProfileErrorHandler class including error
 * classification, user-friendly messages, retry logic, and error recovery.
 */

import {
  ProfileErrorHandler,
  ProfileErrorType,
  ProfileError,
  ErrorContext,
  retryWithBackoff,
  withProfileErrorHandling,
} from '../../../src/utils/profileErrorHandling';
import { ProfileValidationErrors } from '../../../src/types/profile';

describe('ProfileErrorHandler', () => {
  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = { name: 'NetworkError', message: 'Network connection failed' };
      const error = ProfileErrorHandler.handleError(networkError);

      expect(error.type).toBe(ProfileErrorType.NETWORK_ERROR);
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('Network connection error');
    });

    it('should classify validation errors correctly', () => {
      const validationError = {
        status: 400,
        errors: { name: 'Name is required', email: 'Invalid email' },
        message: 'Validation failed'
      };
      const error = ProfileErrorHandler.handleError(validationError);

      expect(error.type).toBe(ProfileErrorType.VALIDATION_ERROR);
      expect(error.retryable).toBe(false);
      expect(error.details.validationErrors).toEqual(validationError.errors);
    });

    it('should classify authentication errors correctly', () => {
      const authError = { status: 401, message: 'Unauthorized access' };
      const error = ProfileErrorHandler.handleError(authError);

      expect(error.type).toBe(ProfileErrorType.AUTHENTICATION_ERROR);
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('Authentication failed');
    });

    it('should classify permission errors correctly', () => {
      const permissionError = { status: 403, message: 'Forbidden' };
      const error = ProfileErrorHandler.handleError(permissionError);

      expect(error.type).toBe(ProfileErrorType.PERMISSION_ERROR);
      expect(error.retryable).toBe(false);
    });

    it('should classify file upload errors correctly', () => {
      const uploadError = {
        code: 'FILE_UPLOAD_ERROR',
        message: 'File upload failed'
      };
      const error = ProfileErrorHandler.handleError(uploadError);

      expect(error.type).toBe(ProfileErrorType.FILE_UPLOAD_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('should classify not found errors correctly', () => {
      const notFoundError = { status: 404, message: 'Profile not found' };
      const error = ProfileErrorHandler.handleError(notFoundError);

      expect(error.type).toBe(ProfileErrorType.NOT_FOUND_ERROR);
      expect(error.retryable).toBe(false);
    });

    it('should classify rate limit errors correctly', () => {
      const rateLimitError = { status: 429, message: 'Too many requests' };
      const error = ProfileErrorHandler.handleError(rateLimitError);

      expect(error.type).toBe(ProfileErrorType.RATE_LIMIT_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('should classify server errors correctly', () => {
      const serverError = { status: 500, message: 'Internal server error' };
      const error = ProfileErrorHandler.handleError(serverError);

      expect(error.type).toBe(ProfileErrorType.SERVER_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('should classify unknown errors correctly', () => {
      const unknownError = { message: 'Something went wrong' };
      const error = ProfileErrorHandler.handleError(unknownError);

      expect(error.type).toBe(ProfileErrorType.UNKNOWN_ERROR);
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('unexpected error');
    });

    it('should include context in error details', () => {
      const context: ErrorContext = {
        operation: 'createProfile',
        userId: 'user-123',
        metadata: { attempt: 1 }
      };
      const error = ProfileErrorHandler.handleError(new Error('Test error'), context);

      expect(error.details.context).toEqual(context);
    });
  });

  describe('User-Friendly Messages', () => {
    it('should return context-specific server error messages', () => {
      const serverError: ProfileError = {
        type: ProfileErrorType.SERVER_ERROR,
        message: 'Server error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Server error occurred',
      };

      const createContext = { operation: 'create' };
      const updateContext = { operation: 'update' };
      const uploadContext = { operation: 'upload' };

      expect(ProfileErrorHandler.getUserFriendlyMessage(serverError, createContext))
        .toContain('Failed to create profile');
      expect(ProfileErrorHandler.getUserFriendlyMessage(serverError, updateContext))
        .toContain('Failed to update profile');
      expect(ProfileErrorHandler.getUserFriendlyMessage(serverError, uploadContext))
        .toContain('Failed to upload photo');
    });

    it('should return specific validation error messages', () => {
      const validationError: ProfileError = {
        type: ProfileErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        timestamp: new Date(),
        retryable: false,
        userMessage: 'Please check your input',
        details: {
          validationErrors: {
            name: 'Name is required',
            email: 'Invalid email format'
          }
        }
      };

      const fieldContext = { field: 'name' };
      const message = ProfileErrorHandler.getUserFriendlyMessage(validationError, fieldContext);
      
      expect(message).toBe('Name is required');
    });

    it('should return generic validation message when no specific field', () => {
      const validationError: ProfileError = {
        type: ProfileErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        timestamp: new Date(),
        retryable: false,
        userMessage: 'Please check your input',
        details: {
          validationErrors: {
            name: 'Name is required'
          }
        }
      };

      const message = ProfileErrorHandler.getUserFriendlyMessage(validationError);
      
      expect(message).toBe('Name is required');
    });

    it('should handle different error types with appropriate messages', () => {
      const errorTypes = [
        { type: ProfileErrorType.NETWORK_ERROR, expectedText: 'internet connection' },
        { type: ProfileErrorType.AUTHENTICATION_ERROR, expectedText: 'session has expired' },
        { type: ProfileErrorType.PERMISSION_ERROR, expectedText: 'permission' },
        { type: ProfileErrorType.FILE_UPLOAD_ERROR, expectedText: 'Failed to upload' },
        { type: ProfileErrorType.RATE_LIMIT_ERROR, expectedText: 'too many requests' },
      ];

      errorTypes.forEach(({ type, expectedText }) => {
        const error: ProfileError = {
          type,
          message: 'Test error',
          timestamp: new Date(),
          retryable: true,
          userMessage: 'Generic message',
        };

        const message = ProfileErrorHandler.getUserFriendlyMessage(error);
        expect(message.toLowerCase()).toContain(expectedText.toLowerCase());
      });
    });
  });

  describe('Retry Logic', () => {
    it('should allow retry for retryable errors under max attempts', () => {
      const retryableError: ProfileError = {
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Network error',
      };

      expect(ProfileErrorHandler.shouldRetry(retryableError, 0)).toBe(true);
      expect(ProfileErrorHandler.shouldRetry(retryableError, 1)).toBe(true);
      expect(ProfileErrorHandler.shouldRetry(retryableError, 2)).toBe(true);
      expect(ProfileErrorHandler.shouldRetry(retryableError, 3)).toBe(false);
    });

    it('should not retry non-retryable errors', () => {
      const nonRetryableError: ProfileError = {
        type: ProfileErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        timestamp: new Date(),
        retryable: false,
        userMessage: 'Validation failed',
      };

      expect(ProfileErrorHandler.shouldRetry(nonRetryableError, 0)).toBe(false);
    });

    it('should not retry validation and permission errors even if marked retryable', () => {
      const validationError: ProfileError = {
        type: ProfileErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Validation failed',
      };

      const permissionError: ProfileError = {
        type: ProfileErrorType.PERMISSION_ERROR,
        message: 'Permission denied',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Permission denied',
      };

      expect(ProfileErrorHandler.shouldRetry(validationError, 0)).toBe(false);
      expect(ProfileErrorHandler.shouldRetry(permissionError, 0)).toBe(false);
    });

    it('should limit rate limit retries', () => {
      const rateLimitError: ProfileError = {
        type: ProfileErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limit exceeded',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Rate limit exceeded',
      };

      expect(ProfileErrorHandler.shouldRetry(rateLimitError, 0)).toBe(true);
      expect(ProfileErrorHandler.shouldRetry(rateLimitError, 1)).toBe(true);
      expect(ProfileErrorHandler.shouldRetry(rateLimitError, 2)).toBe(false);
    });
  });

  describe('Retry Delays', () => {
    it('should calculate exponential backoff for rate limit errors', () => {
      const rateLimitError: ProfileError = {
        type: ProfileErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limit',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Rate limit',
      };

      expect(ProfileErrorHandler.getRetryDelay(rateLimitError, 0)).toBe(2000); // 2s
      expect(ProfileErrorHandler.getRetryDelay(rateLimitError, 1)).toBe(4000); // 4s
      expect(ProfileErrorHandler.getRetryDelay(rateLimitError, 2)).toBe(8000); // 8s
    });

    it('should calculate linear increase for network errors', () => {
      const networkError: ProfileError = {
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Network error',
      };

      expect(ProfileErrorHandler.getRetryDelay(networkError, 0)).toBe(1000); // 1s
      expect(ProfileErrorHandler.getRetryDelay(networkError, 1)).toBe(2000); // 2s
      expect(ProfileErrorHandler.getRetryDelay(networkError, 2)).toBe(3000); // 3s
    });

    it('should calculate exponential backoff for server errors', () => {
      const serverError: ProfileError = {
        type: ProfileErrorType.SERVER_ERROR,
        message: 'Server error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Server error',
      };

      expect(ProfileErrorHandler.getRetryDelay(serverError, 0)).toBe(1000); // 1s
      expect(ProfileErrorHandler.getRetryDelay(serverError, 1)).toBe(2000); // 2s
      expect(ProfileErrorHandler.getRetryDelay(serverError, 2)).toBe(4000); // 4s
    });

    it('should cap retry delays at maximum values', () => {
      const rateLimitError: ProfileError = {
        type: ProfileErrorType.RATE_LIMIT_ERROR,
        message: 'Rate limit',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Rate limit',
      };

      const serverError: ProfileError = {
        type: ProfileErrorType.SERVER_ERROR,
        message: 'Server error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Server error',
      };

      // Very high attempt count should be capped
      expect(ProfileErrorHandler.getRetryDelay(rateLimitError, 10)).toBeLessThanOrEqual(30000);
      expect(ProfileErrorHandler.getRetryDelay(serverError, 10)).toBeLessThanOrEqual(10000);
    });
  });

  describe('Error Utilities', () => {
    it('should create validation error from validation result', () => {
      const validationErrors: ProfileValidationErrors = {
        name: 'Name is required',
        email: 'Invalid email format',
      };

      const error = ProfileErrorHandler.createValidationError(validationErrors);

      expect(error.type).toBe(ProfileErrorType.VALIDATION_ERROR);
      expect(error.retryable).toBe(false);
      expect(error.details.validationErrors).toEqual(validationErrors);
      expect(error.userMessage).toBe('Name is required');
    });

    it('should format validation errors for display', () => {
      const validationErrors: ProfileValidationErrors = {
        name: 'Name is required',
        email: 'Invalid email format',
        phone: '', // Empty error should be filtered out
      };

      const formatted = ProfileErrorHandler.formatValidationErrors(validationErrors);

      expect(formatted).toHaveLength(2);
      expect(formatted).toContain('Name: Name is required');
      expect(formatted).toContain('Email: Invalid email format');
      expect(formatted).not.toContain('Phone:');
    });

    it('should compare errors correctly', () => {
      const error1: ProfileError = {
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        code: 'NET_001',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Network error',
      };

      const error2: ProfileError = {
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        code: 'NET_001',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Network error',
      };

      const error3: ProfileError = {
        type: ProfileErrorType.SERVER_ERROR,
        message: 'Server error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Server error',
      };

      expect(ProfileErrorHandler.isSameError(error1, error2)).toBe(true);
      expect(ProfileErrorHandler.isSameError(error1, error3)).toBe(false);
    });

    it('should provide recovery suggestions for different error types', () => {
      const errorTypes = [
        { type: ProfileErrorType.NETWORK_ERROR, expectedSuggestions: ['internet connection', 'Try again'] },
        { type: ProfileErrorType.VALIDATION_ERROR, expectedSuggestions: ['highlighted fields', 'required fields'] },
        { type: ProfileErrorType.FILE_UPLOAD_ERROR, expectedSuggestions: ['10MB', 'image format'] },
        { type: ProfileErrorType.AUTHENTICATION_ERROR, expectedSuggestions: ['Log out', 'log in'] },
        { type: ProfileErrorType.RATE_LIMIT_ERROR, expectedSuggestions: ['Wait', 'rapid requests'] },
        { type: ProfileErrorType.SERVER_ERROR, expectedSuggestions: ['Try again later', 'support'] },
      ];

      errorTypes.forEach(({ type, expectedSuggestions }) => {
        const error: ProfileError = {
          type,
          message: 'Test error',
          timestamp: new Date(),
          retryable: true,
          userMessage: 'Test error',
        };

        const suggestions = ProfileErrorHandler.getRecoverySuggestion(error);
        expect(suggestions.length).toBeGreaterThan(0);
        
        const allSuggestions = suggestions.join(' ').toLowerCase();
        expectedSuggestions.forEach(expectedText => {
          expect(allSuggestions).toContain(expectedText.toLowerCase());
        });
      });
    });
  });

  describe('Error Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log errors in development', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      const error: ProfileError = {
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Network error',
      };

      const context: ErrorContext = { operation: 'test' };
      ProfileErrorHandler.logError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('Profile Error:', expect.objectContaining({
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        context,
      }));

      (global as any).__DEV__ = originalDev;
    });

    it('should not log to console in production', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;

      const error: ProfileError = {
        type: ProfileErrorType.NETWORK_ERROR,
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
        userMessage: 'Network error',
      };

      ProfileErrorHandler.logError(error);

      expect(consoleSpy).not.toHaveBeenCalled();

      (global as any).__DEV__ = originalDev;
    });
  });
});

describe('Retry Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(operation, { operation: 'test' });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const validationError = { status: 400, errors: { name: 'Required' } };
      const operation = jest.fn().mockRejectedValue(validationError);

      await expect(retryWithBackoff(operation, { operation: 'test' }))
        .rejects.toMatchObject({
          type: ProfileErrorType.VALIDATION_ERROR,
        });

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      const operation = jest.fn().mockRejectedValue(networkError);

      await expect(retryWithBackoff(operation, { operation: 'test' }, 2))
        .rejects.toMatchObject({
          type: ProfileErrorType.NETWORK_ERROR,
        });

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should wait between retries', async () => {
      jest.useFakeTimers();
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      const operation = jest.fn().mockRejectedValue(networkError);

      const promise = retryWithBackoff(operation, { operation: 'test' }, 1);

      // Fast-forward past the retry delay
      jest.advanceTimersByTime(2000);

      await expect(promise).rejects.toMatchObject({
        type: ProfileErrorType.NETWORK_ERROR,
      });

      jest.useRealTimers();
    }, 10000);
  });

  describe('withProfileErrorHandling', () => {
    it('should return result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withProfileErrorHandling(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should wrap and throw ProfileError on failure', async () => {
      const originalError = new Error('Original error');
      const operation = jest.fn().mockRejectedValue(originalError);

      await expect(withProfileErrorHandling(operation, { operation: 'test' }))
        .rejects.toMatchObject({
          type: ProfileErrorType.UNKNOWN_ERROR,
          message: 'Original error',
        });
    });

    it('should preserve error context', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      const context = { operation: 'test', userId: 'user-123' };

      try {
        await withProfileErrorHandling(operation, context);
      } catch (error) {
        expect((error as ProfileError).details.context).toEqual(context);
      }
    });
  });
});