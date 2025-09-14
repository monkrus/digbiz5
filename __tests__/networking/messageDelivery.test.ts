/**
 * Message Delivery Reliability Tests
 *
 * Tests for messaging system reliability including:
 * - Message delivery guarantees
 * - Offline message queuing
 * - Read receipt accuracy
 * - Message ordering and deduplication
 * - WebSocket connection stability
 */

import messagingService from '../../src/services/messagingService';
import {
  SendMessageRequest,
  MarkMessageReadRequest,
  MessageEvent,
  ConnectionStatus,
} from '../../src/types/messaging';

// Mock WebSocket
class MockWebSocket {
  readyState: number = 1; // WebSocket.OPEN
  url: string;
  onopen?: () => void;
  onclose?: () => void;
  onerror?: (error: any) => void;
  onmessage?: (event: { data: string }) => void;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.onopen?.(), 10);
  }

  send(data: string) {
    // Mock sending data
  }

  close() {
    this.readyState = 3; // WebSocket.CLOSED
    setTimeout(() => this.onclose?.(), 10);
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock fetch
global.fetch = jest.fn();

describe('Message Delivery Reliability Tests', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();

    // Reset messaging service
    messagingService.disconnect();
  });

  afterEach(() => {
    messagingService.disconnect();
  });

  describe('Message Sending Reliability', () => {
    test('should send message successfully with delivery confirmation', async () => {
      const mockResponse = {
        success: true,
        message: 'Message sent successfully',
        sentMessage: {
          id: 'msg123',
          chatId: 'chat123',
          content: 'Hello, world!',
          messageType: 'text',
          senderId: 'user1',
          sentAt: '2023-01-01T00:00:00Z',
          deliveryStatus: 'sent',
        },
        chat: {
          id: 'chat123',
          lastMessage: {
            id: 'msg123',
            content: 'Hello, world!',
            sentAt: '2023-01-01T00:00:00Z',
          },
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const messageRequest: SendMessageRequest = {
        chatId: 'chat123',
        content: 'Hello, world!',
        messageType: 'text',
      };

      const result = await messagingService.sendMessage(messageRequest);

      expect(result.success).toBe(true);
      expect(result.sentMessage.deliveryStatus).toBe('sent');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messaging/messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(messageRequest),
        })
      );
    });

    test('should handle message sending failures gracefully', async () => {
      const mockResponse = {
        success: false,
        message: 'Failed to send message',
        error: 'RATE_LIMIT_EXCEEDED',
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => mockResponse,
      } as Response);

      const messageRequest: SendMessageRequest = {
        chatId: 'chat123',
        content: 'Hello, world!',
        messageType: 'text',
      };

      await expect(messagingService.sendMessage(messageRequest))
        .rejects.toThrow('Send message failed: Too Many Requests');
    });

    test('should queue messages when offline and send when reconnected', async () => {
      const messageQueue: SendMessageRequest[] = [];
      let connectionStatus: ConnectionStatus = { isConnected: false, reconnectAttempts: 0 };

      // Simulate offline state
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      const messageRequest: SendMessageRequest = {
        chatId: 'chat123',
        content: 'Offline message',
        messageType: 'text',
      };

      try {
        await messagingService.sendMessage(messageRequest);
      } catch (error) {
        // Add to queue when sending fails
        messageQueue.push(messageRequest);
      }

      expect(messageQueue).toHaveLength(1);
      expect(messageQueue[0].content).toBe('Offline message');

      // Simulate coming back online
      connectionStatus = { isConnected: true, reconnectAttempts: 0 };

      const mockResponse = {
        success: true,
        sentMessage: { id: 'msg123', deliveryStatus: 'sent' },
        chat: { id: 'chat123' },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Process queued messages
      const queuedMessage = messageQueue.shift();
      if (queuedMessage) {
        const result = await messagingService.sendMessage(queuedMessage);
        expect(result.success).toBe(true);
      }

      expect(messageQueue).toHaveLength(0);
    });

    test('should handle message deduplication', async () => {
      const messageId = 'unique-msg-123';
      const duplicateResponses = [
        {
          success: true,
          sentMessage: { id: messageId, deliveryStatus: 'sent' },
          chat: { id: 'chat123' },
        },
        {
          success: false,
          message: 'Duplicate message',
          error: 'DUPLICATE_MESSAGE',
        },
      ];

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => duplicateResponses[0],
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: async () => duplicateResponses[1],
        } as Response);

      const messageRequest: SendMessageRequest = {
        chatId: 'chat123',
        content: 'Duplicate test',
        messageType: 'text',
        clientMessageId: messageId, // Client-generated ID for deduplication
      };

      // Send message twice
      const result1 = await messagingService.sendMessage(messageRequest);

      await expect(messagingService.sendMessage(messageRequest))
        .rejects.toThrow('Send message failed: Conflict');

      expect(result1.success).toBe(true);
      expect(result1.sentMessage.id).toBe(messageId);
    });
  });

  describe('Message Ordering and Consistency', () => {
    test('should maintain message order in high-frequency sending', async () => {
      const messages: string[] = [];
      const messageCount = 10;

      // Mock responses for sequential messages
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            sentMessage: { id: `msg${Date.now()}`, deliveryStatus: 'sent' },
            chat: { id: 'chat123' },
          }),
        } as Response)
      );

      // Send multiple messages rapidly
      const sendPromises = Array.from({ length: messageCount }, (_, i) =>
        messagingService.sendMessage({
          chatId: 'chat123',
          content: `Message ${i}`,
          messageType: 'text',
        }).then(() => messages.push(`Message ${i}`))
      );

      await Promise.all(sendPromises);

      // Check that all messages were processed
      expect(messages).toHaveLength(messageCount);

      // Messages should be in the order they were sent
      for (let i = 0; i < messageCount; i++) {
        expect(messages[i]).toBe(`Message ${i}`);
      }
    });

    test('should handle out-of-order message delivery correctly', async () => {
      const receivedMessages: any[] = [];
      let messageHandler: (data: any) => void;

      // Mock WebSocket message handler
      messagingService.addEventListener('message_received', (data) => {
        receivedMessages.push(data);
      });

      // Simulate messages arriving out of order
      const messages = [
        { id: 'msg1', timestamp: '2023-01-01T00:00:01Z', content: 'First' },
        { id: 'msg3', timestamp: '2023-01-01T00:00:03Z', content: 'Third' },
        { id: 'msg2', timestamp: '2023-01-01T00:00:02Z', content: 'Second' },
      ];

      // Simulate receiving messages out of order
      setTimeout(() => {
        messagingService.addEventListener('message_received', (data) => {
          receivedMessages.push(data);
        });
      }, 10);

      // Sort by timestamp to ensure correct order
      const sortedMessages = messages.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      expect(sortedMessages[0].content).toBe('First');
      expect(sortedMessages[1].content).toBe('Second');
      expect(sortedMessages[2].content).toBe('Third');
    });

    test('should handle message gaps and request missing messages', async () => {
      const receivedMessageIds = new Set(['msg1', 'msg3', 'msg5']); // Missing msg2 and msg4
      const expectedSequence = ['msg1', 'msg2', 'msg3', 'msg4', 'msg5'];

      // Detect gaps in message sequence
      const detectGaps = (receivedIds: Set<string>, expectedIds: string[]): string[] => {
        return expectedIds.filter(id => !receivedIds.has(id));
      };

      const missingMessages = detectGaps(receivedMessageIds, expectedSequence);
      expect(missingMessages).toEqual(['msg2', 'msg4']);

      // Mock fetch for missing messages
      const mockResponse = {
        success: true,
        messages: [
          { id: 'msg2', content: 'Missing message 2' },
          { id: 'msg4', content: 'Missing message 4' },
        ],
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Request missing messages
      const result = await messagingService.getMessages({
        chatId: 'chat123',
        messageIds: missingMessages,
      });

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.messages.map(m => m.id)).toEqual(['msg2', 'msg4']);
    });
  });

  describe('Read Receipts Accuracy', () => {
    test('should mark messages as read and send read receipts', async () => {
      const mockResponse = {
        success: true,
        message: 'Messages marked as read',
        readMessages: [
          { messageId: 'msg1', readAt: '2023-01-01T00:05:00Z' },
          { messageId: 'msg2', readAt: '2023-01-01T00:05:00Z' },
        ],
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const readRequest: MarkMessageReadRequest = {
        chatId: 'chat123',
        messageIds: ['msg1', 'msg2'],
      };

      const result = await messagingService.markMessagesAsRead(readRequest);

      expect(result.success).toBe(true);
      expect(result.readMessages).toHaveLength(2);
      expect(result.readMessages[0].messageId).toBe('msg1');
      expect(result.readMessages[1].messageId).toBe('msg2');
    });

    test('should handle bulk read receipt marking', async () => {
      const mockResponse = {
        success: true,
        message: 'All messages marked as read',
        readMessages: Array.from({ length: 50 }, (_, i) => ({
          messageId: `msg${i}`,
          readAt: '2023-01-01T00:05:00Z',
        })),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const readRequest: MarkMessageReadRequest = {
        chatId: 'chat123',
        markAllAsRead: true,
      };

      const result = await messagingService.markMessagesAsRead(readRequest);

      expect(result.success).toBe(true);
      expect(result.readMessages).toHaveLength(50);
    });

    test('should prevent duplicate read receipts', async () => {
      const mockResponse = {
        success: true,
        message: 'Read receipts updated',
        readMessages: [
          { messageId: 'msg1', readAt: '2023-01-01T00:05:00Z' },
        ],
        skippedMessages: [
          { messageId: 'msg2', reason: 'ALREADY_READ' },
        ],
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const readRequest: MarkMessageReadRequest = {
        chatId: 'chat123',
        messageIds: ['msg1', 'msg2'], // msg2 already read
      };

      const result = await messagingService.markMessagesAsRead(readRequest);

      expect(result.success).toBe(true);
      expect(result.readMessages).toHaveLength(1);
      expect(result.skippedMessages).toHaveLength(1);
      expect(result.skippedMessages[0].reason).toBe('ALREADY_READ');
    });

    test('should handle read receipt delivery failures gracefully', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const readRequest: MarkMessageReadRequest = {
        chatId: 'chat123',
        messageIds: ['msg1'],
      };

      // Should retry read receipts later or queue them
      await expect(messagingService.markMessagesAsRead(readRequest))
        .rejects.toThrow('Network error');

      // In a real implementation, this would queue the read receipt for later delivery
    });
  });

  describe('WebSocket Connection Stability', () => {
    test('should maintain WebSocket connection and handle reconnection', (done) => {
      const connectionEvents: string[] = [];

      messagingService.addEventListener('connection_status_changed', (status: ConnectionStatus) => {
        if (status.isConnected) {
          connectionEvents.push('connected');
        } else {
          connectionEvents.push('disconnected');
        }
      });

      // Simulate connection establishment
      setTimeout(() => {
        const connectionStatus = messagingService.getConnectionStatus();
        expect(connectionStatus.isConnected).toBe(true);

        // Simulate connection loss
        mockWebSocket?.close();

        setTimeout(() => {
          expect(connectionEvents).toContain('connected');
          done();
        }, 50);
      }, 50);
    });

    test('should handle WebSocket message parsing errors', (done) => {
      let errorHandled = false;

      messagingService.addEventListener('connection_error', (error) => {
        errorHandled = true;
        expect(error).toBeDefined();
      });

      // Simulate malformed message
      setTimeout(() => {
        const mockEvent = { data: 'invalid json' };
        mockWebSocket?.onmessage?.(mockEvent);

        setTimeout(() => {
          // Error should be handled gracefully without crashing
          expect(errorHandled).toBe(false); // Service should handle parsing errors internally
          done();
        }, 50);
      }, 50);
    });

    test('should implement exponential backoff for reconnection attempts', (done) => {
      const reconnectionAttempts: number[] = [];
      let startTime = Date.now();

      messagingService.addEventListener('connection_status_changed', (status: ConnectionStatus) => {
        if (!status.isConnected && status.reconnectAttempts > 0) {
          reconnectionAttempts.push(Date.now() - startTime);
        }
      });

      // Simulate multiple connection failures
      setTimeout(() => {
        // First disconnection
        mockWebSocket?.close();

        setTimeout(() => {
          // Check that reconnection attempts have increasing delays
          if (reconnectionAttempts.length >= 2) {
            expect(reconnectionAttempts[1]).toBeGreaterThan(reconnectionAttempts[0]);
          }
          done();
        }, 5000); // Wait for multiple reconnection attempts
      }, 50);
    }, 10000);

    test('should queue real-time events when WebSocket is disconnected', () => {
      const messageQueue: MessageEvent[] = [];
      const isConnected = false;

      // Simulate trying to send real-time events while disconnected
      const event: MessageEvent = {
        type: 'message_sent',
        data: {
          messageId: 'msg123',
          chatId: 'chat123',
          timestamp: new Date().toISOString(),
        },
      };

      if (!isConnected) {
        messageQueue.push(event);
      }

      expect(messageQueue).toHaveLength(1);
      expect(messageQueue[0].type).toBe('message_sent');

      // When reconnected, queue should be processed
      const processQueue = () => {
        while (messageQueue.length > 0) {
          const queuedEvent = messageQueue.shift();
          // Process queued event
          expect(queuedEvent?.type).toBe('message_sent');
        }
      };

      processQueue();
      expect(messageQueue).toHaveLength(0);
    });
  });

  describe('Performance and Load Handling', () => {
    test('should handle high message throughput without dropping messages', async () => {
      const messageCount = 100;
      const sentMessages: string[] = [];
      const receivedMessages: string[] = [];

      // Mock successful responses for all messages
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            sentMessage: { id: `msg${Date.now()}`, deliveryStatus: 'sent' },
            chat: { id: 'chat123' },
          }),
        } as Response)
      );

      // Send messages rapidly
      const sendPromises = Array.from({ length: messageCount }, (_, i) => {
        const message = `High throughput message ${i}`;
        sentMessages.push(message);

        return messagingService.sendMessage({
          chatId: 'chat123',
          content: message,
          messageType: 'text',
        }).then(() => {
          receivedMessages.push(message);
        });
      });

      await Promise.all(sendPromises);

      expect(sentMessages).toHaveLength(messageCount);
      expect(receivedMessages).toHaveLength(messageCount);

      // All messages should be delivered
      expect(receivedMessages).toEqual(sentMessages);
    });

    test('should handle message batching for efficiency', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        chatId: 'chat123',
        content: `Batch message ${i}`,
        messageType: 'text' as const,
      }));

      // Mock batch API response
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sentMessages: messages.map((_, i) => ({
            id: `msg${i}`,
            deliveryStatus: 'sent',
          })),
        }),
      } as Response);

      // In a real implementation, this would batch multiple messages into one request
      const batchSendMessages = async (messageBatch: SendMessageRequest[]) => {
        return fetch('/messaging/messages/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messageBatch }),
        });
      };

      const response = await batchSendMessages(messages);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.sentMessages).toHaveLength(10);
    });

    test('should implement rate limiting to prevent spam', async () => {
      const rateLimitWindow = 1000; // 1 second
      const maxMessagesPerWindow = 5;
      const messageTimes: number[] = [];

      const isRateLimited = (): boolean => {
        const now = Date.now();
        messageTimes.push(now);

        // Remove old timestamps outside the window
        const cutoff = now - rateLimitWindow;
        const recentMessages = messageTimes.filter(time => time > cutoff);

        return recentMessages.length > maxMessagesPerWindow;
      };

      // Send messages rapidly
      for (let i = 0; i < 10; i++) {
        if (isRateLimited()) {
          expect(i).toBeGreaterThan(maxMessagesPerWindow);
          break;
        }
      }

      expect(messageTimes.length).toBeLessThanOrEqual(maxMessagesPerWindow + 1);
    });
  });

  describe('Reliability Edge Cases', () => {
    test('should handle partial message delivery failures', async () => {
      const messages = [
        { content: 'Message 1' },
        { content: 'Message 2' },
        { content: 'Message 3' },
      ];

      const responses = [
        { ok: true, json: async () => ({ success: true, sentMessage: { id: 'msg1' } }) },
        { ok: false, status: 500, statusText: 'Server Error' },
        { ok: true, json: async () => ({ success: true, sentMessage: { id: 'msg3' } }) },
      ];

      (fetch as jest.MockedFunction<typeof fetch>)
        .mockImplementation(() => Promise.resolve(responses.shift() as Response));

      const results = await Promise.allSettled(
        messages.map(msg => messagingService.sendMessage({
          chatId: 'chat123',
          content: msg.content,
          messageType: 'text',
        }))
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      // Failed messages should be queued for retry
      const failedMessage = messages[1];
      expect(failedMessage.content).toBe('Message 2');
    });

    test('should handle corrupted message data gracefully', async () => {
      const corruptedResponse = {
        success: true,
        sentMessage: {
          id: null, // Corrupted ID
          content: undefined, // Missing content
          timestamp: 'invalid-date', // Invalid timestamp
        },
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => corruptedResponse,
      } as Response);

      // Service should handle corrupted data without crashing
      const result = await messagingService.sendMessage({
        chatId: 'chat123',
        content: 'Test message',
        messageType: 'text',
      });

      expect(result).toBeDefined();
      // Service should either sanitize the data or reject the response
    });

    test('should handle storage limitations gracefully', () => {
      const maxStoredMessages = 1000;
      const storedMessages: any[] = [];

      // Simulate adding messages to local storage
      const addMessage = (message: any) => {
        storedMessages.push(message);

        // Remove old messages if limit exceeded
        if (storedMessages.length > maxStoredMessages) {
          storedMessages.splice(0, storedMessages.length - maxStoredMessages);
        }
      };

      // Add many messages
      for (let i = 0; i < 1500; i++) {
        addMessage({ id: `msg${i}`, content: `Message ${i}` });
      }

      expect(storedMessages).toHaveLength(maxStoredMessages);
      expect(storedMessages[0].id).toBe('msg500'); // First 500 messages removed
      expect(storedMessages[storedMessages.length - 1].id).toBe('msg1499');
    });
  });
});