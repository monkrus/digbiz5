/**
 * Connection State Transitions Tests
 *
 * Tests for connection lifecycle management including:
 * - Connection request flow
 * - State transitions (pending → connected → blocked)
 * - Edge cases and error handling
 * - Concurrent state changes
 */

import connectionService from '../../src/services/connectionService';
import {
  ConnectionRequestData,
  ConnectionActionRequest,
  ConnectionStatus,
  BlockUserRequest,
  UnblockUserRequest
} from '../../src/types/connections';

// Mock fetch globally
global.fetch = jest.fn();

// Mock auth token
jest.mock('../../src/services/connectionService', () => {
  const actualService = jest.requireActual('../../src/services/connectionService');
  return {
    ...actualService,
    default: {
      ...actualService.default,
      getAuthToken: jest.fn().mockResolvedValue('mock-token'),
    },
  };
});

describe('Connection State Transitions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Connection Request Flow', () => {
    test('should send connection request and create pending state', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection request sent',
        request: {
          id: 'req123',
          fromUserId: 'user1',
          toUserId: 'user2',
          status: 'pending',
          sentAt: '2023-01-01T00:00:00Z',
          message: 'Hi, let\'s connect!',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const requestData: ConnectionRequestData = {
        toUserId: 'user2',
        message: 'Hi, let\'s connect!',
      };

      const result = await connectionService.sendConnectionRequest(requestData);

      expect(result.success).toBe(true);
      expect(result.request.status).toBe('pending');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/connections/requests'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    test('should handle duplicate connection request attempts', async () => {
      const mockResponse = {
        success: false,
        message: 'Connection request already exists',
        error: 'DUPLICATE_REQUEST',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => mockResponse,
      } as Response);

      const requestData: ConnectionRequestData = {
        toUserId: 'user2',
        message: 'Hi, let\'s connect again!',
      };

      await expect(connectionService.sendConnectionRequest(requestData))
        .rejects.toThrow('Send connection request failed: Conflict');
    });

    test('should validate connection request data', async () => {
      const invalidRequestData = {
        toUserId: '', // Empty user ID
        message: 'A'.repeat(1001), // Too long message
      } as ConnectionRequestData;

      const mockResponse = {
        success: false,
        message: 'Invalid request data',
        errors: {
          toUserId: 'User ID is required',
          message: 'Message too long',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockResponse,
      } as Response);

      await expect(connectionService.sendConnectionRequest(invalidRequestData))
        .rejects.toThrow('Send connection request failed: Bad Request');
    });
  });

  describe('Connection State Transitions', () => {
    test('should transition from pending to connected on accept', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection request accepted',
        request: {
          id: 'req123',
          status: 'accepted',
          updatedAt: '2023-01-01T01:00:00Z',
        },
        connection: {
          id: 'conn123',
          fromUserId: 'user1',
          toUserId: 'user2',
          status: 'connected',
          connectedAt: '2023-01-01T01:00:00Z',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const actionRequest: ConnectionActionRequest = {
        requestId: 'req123',
        action: 'accept',
      };

      const result = await connectionService.handleConnectionRequest(actionRequest);

      expect(result.success).toBe(true);
      expect(result.request.status).toBe('accepted');
      expect(result.connection?.status).toBe('connected');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/connections/requests/req123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'accept' }),
        })
      );
    });

    test('should transition from pending to rejected on reject', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection request rejected',
        request: {
          id: 'req123',
          status: 'rejected',
          updatedAt: '2023-01-01T01:00:00Z',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const actionRequest: ConnectionActionRequest = {
        requestId: 'req123',
        action: 'reject',
        message: 'Not interested at this time',
      };

      const result = await connectionService.handleConnectionRequest(actionRequest);

      expect(result.success).toBe(true);
      expect(result.request.status).toBe('rejected');
      expect(result.connection).toBeUndefined();
    });

    test('should handle cancel request for sent requests', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection request canceled',
        request: {
          id: 'req123',
          status: 'canceled',
          updatedAt: '2023-01-01T01:00:00Z',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const actionRequest: ConnectionActionRequest = {
        requestId: 'req123',
        action: 'cancel',
      };

      const result = await connectionService.handleConnectionRequest(actionRequest);

      expect(result.success).toBe(true);
      expect(result.request.status).toBe('canceled');
    });

    test('should prevent invalid state transitions', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid state transition',
        error: 'INVALID_TRANSITION',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockResponse,
      } as Response);

      const actionRequest: ConnectionActionRequest = {
        requestId: 'req123',
        action: 'accept', // Trying to accept already processed request
      };

      await expect(connectionService.handleConnectionRequest(actionRequest))
        .rejects.toThrow('Handle connection request failed: Bad Request');
    });
  });

  describe('Connection Management', () => {
    test('should remove connection and maintain data integrity', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection removed successfully',
        connection: {
          id: 'conn123',
          status: 'removed',
          removedAt: '2023-01-01T02:00:00Z',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connectionService.removeConnection({
        connectionId: 'conn123',
        reason: 'no_longer_relevant',
        blockUser: false,
      });

      expect(result.success).toBe(true);
      expect(result.connection.status).toBe('removed');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/connections/conn123'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({
            reason: 'no_longer_relevant',
            blockUser: false,
          }),
        })
      );
    });

    test('should remove connection and block user simultaneously', async () => {
      const mockResponse = {
        success: true,
        message: 'Connection removed and user blocked',
        connection: {
          id: 'conn123',
          status: 'removed',
          removedAt: '2023-01-01T02:00:00Z',
        },
        blockedUser: {
          id: 'block123',
          userId: 'user2',
          blockedAt: '2023-01-01T02:00:00Z',
          reason: 'inappropriate_behavior',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connectionService.removeConnection({
        connectionId: 'conn123',
        reason: 'inappropriate_behavior',
        blockUser: true,
      });

      expect(result.success).toBe(true);
      expect(result.connection.status).toBe('removed');
      expect(result.blockedUser).toBeDefined();
    });

    test('should handle connection status check', async () => {
      const mockResponse = {
        success: true,
        status: 'connected' as ConnectionStatus,
        connection: {
          id: 'conn123',
          connectedAt: '2023-01-01T01:00:00Z',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await connectionService.getConnectionStatus('user2');

      expect(result.success).toBe(true);
      expect(result.status).toBe('connected');
      expect(result.connection).toBeDefined();
    });
  });

  describe('Blocking and Unblocking', () => {
    test('should block user and prevent further interactions', async () => {
      const mockResponse = {
        success: true,
        message: 'User blocked successfully',
        blockedUser: {
          id: 'block123',
          userId: 'user2',
          blockedAt: '2023-01-01T03:00:00Z',
          reason: 'spam',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const blockRequest: BlockUserRequest = {
        userId: 'user2',
        reason: 'spam',
      };

      const result = await connectionService.blockUser(blockRequest);

      expect(result.success).toBe(true);
      expect(result.blockedUser.userId).toBe('user2');
      expect(result.blockedUser.reason).toBe('spam');
    });

    test('should unblock user and restore normal interaction capability', async () => {
      const mockResponse = {
        success: true,
        message: 'User unblocked successfully',
        unblockedUser: {
          userId: 'user2',
          unblockedAt: '2023-01-01T04:00:00Z',
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const unblockRequest: UnblockUserRequest = {
        userId: 'user2',
      };

      const result = await connectionService.unblockUser(unblockRequest);

      expect(result.success).toBe(true);
      expect(result.unblockedUser.userId).toBe('user2');
    });

    test('should handle blocking non-existent user', async () => {
      const mockResponse = {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => mockResponse,
      } as Response);

      const blockRequest: BlockUserRequest = {
        userId: 'nonexistent',
        reason: 'spam',
      };

      await expect(connectionService.blockUser(blockRequest))
        .rejects.toThrow('Block user failed: Not Found');
    });

    test('should prevent blocking already blocked user', async () => {
      const mockResponse = {
        success: false,
        message: 'User is already blocked',
        error: 'ALREADY_BLOCKED',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => mockResponse,
      } as Response);

      const blockRequest: BlockUserRequest = {
        userId: 'user2',
        reason: 'spam',
      };

      await expect(connectionService.blockUser(blockRequest))
        .rejects.toThrow('Block user failed: Conflict');
    });
  });

  describe('Concurrent State Changes', () => {
    test('should handle concurrent connection requests gracefully', async () => {
      // Simulate two users trying to connect to each other simultaneously
      const mockResponse1 = {
        success: true,
        message: 'Connection request sent',
        request: { id: 'req123', status: 'pending' },
      };

      const mockResponse2 = {
        success: false,
        message: 'Connection already exists',
        error: 'DUPLICATE_REQUEST',
      };

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: async () => mockResponse2,
        } as Response);

      const request1 = connectionService.sendConnectionRequest({
        toUserId: 'user2',
        message: 'Let\'s connect!',
      });

      const request2 = connectionService.sendConnectionRequest({
        toUserId: 'user1',
        message: 'I\'d like to connect!',
      });

      const results = await Promise.allSettled([request1, request2]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    test('should handle concurrent accept/reject operations', async () => {
      const mockAcceptResponse = {
        success: true,
        message: 'Connection request accepted',
        request: { id: 'req123', status: 'accepted' },
      };

      const mockRejectResponse = {
        success: false,
        message: 'Request already processed',
        error: 'ALREADY_PROCESSED',
      };

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAcceptResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: async () => mockRejectResponse,
        } as Response);

      const acceptAction = connectionService.handleConnectionRequest({
        requestId: 'req123',
        action: 'accept',
      });

      const rejectAction = connectionService.handleConnectionRequest({
        requestId: 'req123',
        action: 'reject',
      });

      const results = await Promise.allSettled([acceptAction, rejectAction]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    test('should handle rapid state changes correctly', async () => {
      // Test rapid sequence: send request → accept → remove connection
      const responses = [
        { success: true, request: { id: 'req123', status: 'pending' } },
        { success: true, request: { id: 'req123', status: 'accepted' }, connection: { id: 'conn123', status: 'connected' } },
        { success: true, connection: { id: 'conn123', status: 'removed' } },
      ];

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockImplementation(() =>
          Promise.resolve({
            ok: true,
            json: async () => responses.shift(),
          } as Response)
        );

      // Send request
      const sendResult = await connectionService.sendConnectionRequest({
        toUserId: 'user2',
        message: 'Hi!',
      });

      // Accept request
      const acceptResult = await connectionService.handleConnectionRequest({
        requestId: 'req123',
        action: 'accept',
      });

      // Remove connection
      const removeResult = await connectionService.removeConnection({
        connectionId: 'conn123',
        reason: 'changed_mind',
        blockUser: false,
      });

      expect(sendResult.request.status).toBe('pending');
      expect(acceptResult.request.status).toBe('accepted');
      expect(removeResult.connection.status).toBe('removed');
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should retry failed requests with exponential backoff', async () => {
      let callCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, request: { id: 'req123', status: 'pending' } }),
        } as Response);
      });

      // Mock retry mechanism (this would be part of the service implementation)
      const sendWithRetry = async (data: ConnectionRequestData, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await connectionService.sendConnectionRequest(data);
          } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
      };

      const result = await sendWithRetry({
        toUserId: 'user2',
        message: 'Hi!',
      });

      expect(result.success).toBe(true);
      expect(callCount).toBe(3); // Failed twice, succeeded on third try
    });

    test('should handle network timeouts gracefully', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      await expect(connectionService.sendConnectionRequest({
        toUserId: 'user2',
        message: 'Hi!',
      })).rejects.toThrow('Request timeout');
    });

    test('should handle malformed server responses', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      await expect(connectionService.sendConnectionRequest({
        toUserId: 'user2',
        message: 'Hi!',
      })).rejects.toThrow();
    });

    test('should handle server errors with proper error codes', async () => {
      const mockResponse = {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => mockResponse,
      } as Response);

      await expect(connectionService.sendConnectionRequest({
        toUserId: 'user2',
        message: 'Hi!',
      })).rejects.toThrow('Send connection request failed: Internal Server Error');
    });
  });

  describe('Data Consistency', () => {
    test('should maintain referential integrity across state changes', async () => {
      // Mock a sequence that tests data consistency
      const connectionData = {
        id: 'conn123',
        fromUserId: 'user1',
        toUserId: 'user2',
        status: 'connected',
        connectedAt: '2023-01-01T01:00:00Z',
      };

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            connections: [connectionData],
            pagination: { total: 1, page: 1 },
          }),
        } as Response);

      const connections = await connectionService.getConnections();

      expect(connections.success).toBe(true);
      expect(connections.connections).toHaveLength(1);
      expect(connections.connections[0].id).toBe('conn123');
      expect(connections.connections[0].status).toBe('connected');
    });

    test('should validate state transitions against business rules', () => {
      // This would test client-side validation before making API calls
      const validTransitions = {
        'pending': ['accepted', 'rejected', 'canceled'],
        'accepted': ['connected'],
        'rejected': [],
        'canceled': [],
        'connected': ['removed'],
        'removed': [],
        'blocked': ['unblocked'],
      };

      const isValidTransition = (currentState: string, newState: string): boolean => {
        return validTransitions[currentState]?.includes(newState) || false;
      };

      expect(isValidTransition('pending', 'accepted')).toBe(true);
      expect(isValidTransition('pending', 'connected')).toBe(false); // Must go through accepted first
      expect(isValidTransition('connected', 'pending')).toBe(false); // Cannot go backwards
      expect(isValidTransition('rejected', 'accepted')).toBe(false); // Final state
    });
  });
});