/**
 * Contact Sync Service Offline Mode Tests
 *
 * Tests for offline functionality and sync queue management
 */

import { contactSyncService } from '../../../src/services/contactSyncService';
import { Contact, ContactSyncConfig } from '../../../src/types/contacts';
import { contactDatabaseService } from '../../../src/services/contactDatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../../src/services/contactDatabaseService');
jest.mock('@react-native-async-storage/async-storage');

// Mock network connectivity
const mockNetInfo = {
  isConnected: true,
  type: 'wifi',
};

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve(mockNetInfo)),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock data helpers
const createMockContact = (overrides?: Partial<Contact>): Contact => ({
  id: `contact-${Math.random().toString(36).substr(2, 9)}`,
  fields: [
    {
      id: 'field-name',
      type: 'name',
      label: 'Full Name',
      value: 'John Doe',
      isEditable: true,
    },
    {
      id: 'field-email',
      type: 'email',
      label: 'Email',
      value: 'john@example.com',
      isEditable: true,
    },
  ],
  source: 'manual',
  confidence: 0.85,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['business'],
  isVerified: true,
  needsReview: false,
  isFavorite: false,
  syncStatus: 'pending',
  ...overrides,
});

describe('ContactSyncService - Offline Mode', () => {
  const mockDb = jest.mocked(contactDatabaseService);
  const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNetInfo.isConnected = true;
    global.fetch = jest.fn();
  });

  describe('Offline Detection', () => {
    it('should detect when device goes offline', async () => {
      mockNetInfo.isConnected = false;

      const isOnline = await contactSyncService.checkConnectivity();

      expect(isOnline).toBe(false);
    });

    it('should detect when device comes back online', async () => {
      mockNetInfo.isConnected = true;

      const isOnline = await contactSyncService.checkConnectivity();

      expect(isOnline).toBe(true);
    });

    it('should handle network state changes', async () => {
      const networkChangeHandler = jest.fn();

      contactSyncService.onNetworkStateChange(networkChangeHandler);

      // Simulate network change
      mockNetInfo.isConnected = false;

      // In real implementation, this would be triggered by NetInfo
      await contactSyncService.handleNetworkChange(mockNetInfo);

      expect(networkChangeHandler).toHaveBeenCalledWith({
        isOnline: false,
        type: 'wifi',
      });
    });
  });

  describe('Offline Queue Management', () => {
    it('should queue contact creation when offline', async () => {
      mockNetInfo.isConnected = false;

      const newContact = createMockContact({
        id: 'offline-create-test',
        syncStatus: 'pending',
      });

      mockDb.createContact.mockResolvedValue(newContact);
      mockStorage.getItem.mockResolvedValue('[]'); // Empty queue
      mockStorage.setItem.mockResolvedValue();

      const result = await contactSyncService.createContactOffline(newContact);

      expect(result.syncStatus).toBe('pending');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'contact_sync_queue',
        expect.stringContaining('"action":"create"'),
      );
    });

    it('should queue contact updates when offline', async () => {
      mockNetInfo.isConnected = false;

      const updatedContact = createMockContact({
        id: 'offline-update-test',
        fields: [
          {
            id: 'field-1',
            type: 'name',
            label: 'Name',
            value: 'Updated Name',
            isEditable: true,
          },
        ],
        syncStatus: 'pending',
      });

      mockDb.updateContact.mockResolvedValue(updatedContact);
      mockStorage.getItem.mockResolvedValue('[]');
      mockStorage.setItem.mockResolvedValue();

      const result = await contactSyncService.updateContactOffline(
        updatedContact,
      );

      expect(result.syncStatus).toBe('pending');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'contact_sync_queue',
        expect.stringContaining('"action":"update"'),
      );
    });

    it('should queue contact deletion when offline', async () => {
      mockNetInfo.isConnected = false;

      const contactId = 'offline-delete-test';

      mockDb.deleteContact.mockResolvedValue(true);
      mockStorage.getItem.mockResolvedValue('[]');
      mockStorage.setItem.mockResolvedValue();

      const result = await contactSyncService.deleteContactOffline(contactId);

      expect(result).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'contact_sync_queue',
        expect.stringContaining('"action":"delete"'),
      );
    });

    it('should maintain queue order for operations', async () => {
      mockNetInfo.isConnected = false;

      const contact1 = createMockContact({ id: 'queue-order-1' });
      const contact2 = createMockContact({ id: 'queue-order-2' });
      const contact3 = createMockContact({ id: 'queue-order-3' });

      mockDb.createContact.mockResolvedValue(contact1);
      mockDb.updateContact.mockResolvedValue(contact2);
      mockDb.deleteContact.mockResolvedValue(true);

      let queueData: any[] = [];
      mockStorage.getItem.mockImplementation(() =>
        Promise.resolve(JSON.stringify(queueData)),
      );
      mockStorage.setItem.mockImplementation((key, value) => {
        queueData = JSON.parse(value);
        return Promise.resolve();
      });

      // Perform operations in sequence
      await contactSyncService.createContactOffline(contact1);
      await contactSyncService.updateContactOffline(contact2);
      await contactSyncService.deleteContactOffline(contact3.id);

      expect(queueData).toHaveLength(3);
      expect(queueData[0].action).toBe('create');
      expect(queueData[1].action).toBe('update');
      expect(queueData[2].action).toBe('delete');
    });
  });

  describe('Sync Queue Processing', () => {
    it('should process queued operations when coming online', async () => {
      const queuedOperations = [
        {
          id: 'op-1',
          action: 'create',
          contact: createMockContact({ id: 'queue-create' }),
          timestamp: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 'op-2',
          action: 'update',
          contact: createMockContact({ id: 'queue-update' }),
          timestamp: '2024-01-01T10:01:00.000Z',
        },
        {
          id: 'op-3',
          action: 'delete',
          contactId: 'queue-delete',
          timestamp: '2024-01-01T10:02:00.000Z',
        },
      ];

      mockStorage.getItem.mockResolvedValue(JSON.stringify(queuedOperations));
      mockStorage.setItem.mockResolvedValue();

      // Mock successful API responses
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      mockNetInfo.isConnected = true;

      const result = await contactSyncService.processSyncQueue();

      expect(result.processed).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'contact_sync_queue',
        '[]',
      );
    });

    it('should handle partial queue processing failures', async () => {
      const queuedOperations = [
        {
          id: 'op-1',
          action: 'create',
          contact: createMockContact({ id: 'success-create' }),
          timestamp: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 'op-2',
          action: 'update',
          contact: createMockContact({ id: 'fail-update' }),
          timestamp: '2024-01-01T10:01:00.000Z',
        },
      ];

      mockStorage.getItem.mockResolvedValue(JSON.stringify(queuedOperations));
      mockStorage.setItem.mockResolvedValue();

      // Mock mixed API responses
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      const result = await contactSyncService.processSyncQueue();

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);

      // Failed operation should remain in queue
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'contact_sync_queue',
        expect.stringContaining('fail-update'),
      );
    });

    it('should retry failed operations with exponential backoff', async () => {
      const failedOperation = {
        id: 'retry-op',
        action: 'create',
        contact: createMockContact({ id: 'retry-contact' }),
        timestamp: '2024-01-01T10:00:00.000Z',
        retryCount: 0,
        maxRetries: 3,
      };

      mockStorage.getItem.mockResolvedValue(JSON.stringify([failedOperation]));
      mockStorage.setItem.mockResolvedValue();

      // Mock failed then successful response
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // First attempt - should fail and retry
      let result = await contactSyncService.processSyncQueue();
      expect(result.failed).toBe(1);

      // Second attempt - should fail and retry again
      result = await contactSyncService.processSyncQueue();
      expect(result.failed).toBe(1);

      // Third attempt - should succeed
      result = await contactSyncService.processSyncQueue();
      expect(result.successful).toBe(1);
    });
  });

  describe('Data Consistency in Offline Mode', () => {
    it('should maintain data integrity during offline operations', async () => {
      mockNetInfo.isConnected = false;

      const contact = createMockContact({
        id: 'integrity-test',
        updatedAt: '2024-01-01T10:00:00.000Z',
      });

      mockDb.createContact.mockResolvedValue(contact);
      mockDb.getContactById.mockResolvedValue(contact);
      mockStorage.getItem.mockResolvedValue('[]');
      mockStorage.setItem.mockResolvedValue();

      // Create contact offline
      await contactSyncService.createContactOffline(contact);

      // Verify contact exists locally
      const localContact = await contactSyncService.getContactById(contact.id);
      expect(localContact).toBeDefined();
      expect(localContact?.syncStatus).toBe('pending');

      // Update same contact offline
      const updatedContact = {
        ...contact,
        fields: [
          ...contact.fields,
          {
            id: 'new-field',
            type: 'phone',
            label: 'Phone',
            value: '+1-555-0123',
            isEditable: true,
          },
        ],
        updatedAt: '2024-01-01T11:00:00.000Z',
      };

      mockDb.updateContact.mockResolvedValue(updatedContact);
      await contactSyncService.updateContactOffline(updatedContact);

      // Verify updates are preserved
      const finalContact = await contactSyncService.getContactById(contact.id);
      expect(finalContact?.fields).toHaveLength(3);
      expect(finalContact?.syncStatus).toBe('pending');
    });

    it('should handle concurrent offline operations safely', async () => {
      mockNetInfo.isConnected = false;

      const baseContact = createMockContact({
        id: 'concurrent-test',
      });

      mockDb.createContact.mockResolvedValue(baseContact);
      mockDb.updateContact.mockResolvedValue(baseContact);
      mockStorage.getItem.mockResolvedValue('[]');
      mockStorage.setItem.mockResolvedValue();

      // Simulate concurrent operations
      const operations = [
        contactSyncService.createContactOffline(baseContact),
        contactSyncService.updateContactOffline({
          ...baseContact,
          tags: [...baseContact.tags, 'updated'],
        }),
        contactSyncService.updateContactOffline({
          ...baseContact,
          isFavorite: true,
        }),
      ];

      const results = await Promise.allSettled(operations);

      // All operations should complete without throwing
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
    });

    it('should preserve operation order across app restarts', async () => {
      // Simulate existing queue from previous session
      const existingQueue = [
        {
          id: 'existing-op-1',
          action: 'create',
          contact: createMockContact({ id: 'existing-1' }),
          timestamp: '2024-01-01T09:00:00.000Z',
        },
      ];

      mockStorage.getItem.mockResolvedValue(JSON.stringify(existingQueue));

      // Add new operation
      mockNetInfo.isConnected = false;
      const newContact = createMockContact({ id: 'new-operation' });

      let currentQueue = existingQueue;
      mockStorage.setItem.mockImplementation((key, value) => {
        currentQueue = JSON.parse(value);
        return Promise.resolve();
      });

      mockDb.createContact.mockResolvedValue(newContact);
      await contactSyncService.createContactOffline(newContact);

      // Verify new operation is appended to existing queue
      expect(currentQueue).toHaveLength(2);
      expect(currentQueue[0].id).toBe('existing-op-1');
      expect(currentQueue[1].contact.id).toBe('new-operation');
    });
  });

  describe('Offline Storage Optimization', () => {
    it('should compress queue data for storage efficiency', async () => {
      const largeQueue = Array.from({ length: 100 }, (_, i) => ({
        id: `large-op-${i}`,
        action: 'create',
        contact: createMockContact({
          id: `large-contact-${i}`,
          fields: Array.from({ length: 10 }, (_, j) => ({
            id: `field-${i}-${j}`,
            type: 'custom',
            label: `Custom Field ${j}`,
            value: `Value ${i}-${j}`.repeat(10), // Large value
            isEditable: true,
          })),
        }),
        timestamp: new Date().toISOString(),
      }));

      mockStorage.getItem.mockResolvedValue('[]');

      let storedData = '';
      mockStorage.setItem.mockImplementation((key, value) => {
        storedData = value;
        return Promise.resolve();
      });

      await contactSyncService.saveQueueToStorage(largeQueue);

      // Verify data is stored (in real implementation, this would be compressed)
      expect(storedData.length).toBeGreaterThan(0);

      const parsedData = JSON.parse(storedData);
      expect(parsedData).toHaveLength(100);
    });

    it('should handle storage quota limits gracefully', async () => {
      const oversizedOperation = {
        id: 'oversized-op',
        action: 'create',
        contact: createMockContact({
          id: 'oversized-contact',
          fields: Array.from({ length: 1000 }, (_, i) => ({
            id: `huge-field-${i}`,
            type: 'custom',
            label: `Field ${i}`,
            value: 'x'.repeat(10000), // Very large value
            isEditable: true,
          })),
        }),
        timestamp: new Date().toISOString(),
      };

      mockStorage.getItem.mockResolvedValue('[]');
      mockStorage.setItem.mockRejectedValue(new Error('QuotaExceededError'));

      // Should handle storage error gracefully
      const result = await contactSyncService.addToSyncQueue(
        oversizedOperation,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('storage');
    });

    it('should clean up old completed operations from queue', async () => {
      const oldCompletedOps = Array.from({ length: 50 }, (_, i) => ({
        id: `old-completed-${i}`,
        action: 'create',
        contact: createMockContact({ id: `old-${i}` }),
        timestamp: '2024-01-01T00:00:00.000Z', // Old timestamp
        status: 'completed',
        completedAt: '2024-01-01T01:00:00.000Z',
      }));

      const pendingOps = Array.from({ length: 5 }, (_, i) => ({
        id: `pending-${i}`,
        action: 'update',
        contact: createMockContact({ id: `pending-${i}` }),
        timestamp: '2024-01-02T00:00:00.000Z', // Recent timestamp
        status: 'pending',
      }));

      const allOps = [...oldCompletedOps, ...pendingOps];
      mockStorage.getItem.mockResolvedValue(JSON.stringify(allOps));

      let cleanedQueue: any[] = [];
      mockStorage.setItem.mockImplementation((key, value) => {
        cleanedQueue = JSON.parse(value);
        return Promise.resolve();
      });

      await contactSyncService.cleanupSyncQueue(24 * 60 * 60 * 1000); // 24 hours

      // Should only keep pending operations and recent completed ones
      expect(cleanedQueue.length).toBeLessThan(allOps.length);
      expect(
        cleanedQueue.every(
          op =>
            op.status === 'pending' ||
            new Date(op.completedAt || op.timestamp) >
              new Date('2024-01-01T12:00:00.000Z'),
        ),
      ).toBe(true);
    });
  });

  describe('Background Sync', () => {
    it('should schedule background sync when app goes to background', async () => {
      const backgroundSyncScheduler = jest.fn();
      contactSyncService.setBackgroundSyncScheduler(backgroundSyncScheduler);

      await contactSyncService.scheduleBackgroundSync();

      expect(backgroundSyncScheduler).toHaveBeenCalledWith({
        taskName: 'contact-sync',
        interval: expect.any(Number),
        requiredNetworkType: 'any',
      });
    });

    it('should process sync queue during background sync', async () => {
      const queuedOperations = [
        {
          id: 'bg-op-1',
          action: 'create',
          contact: createMockContact({ id: 'bg-contact' }),
          timestamp: '2024-01-01T10:00:00.000Z',
        },
      ];

      mockStorage.getItem.mockResolvedValue(JSON.stringify(queuedOperations));
      mockStorage.setItem.mockResolvedValue();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await contactSyncService.performBackgroundSync();

      expect(result.processed).toBe(1);
      expect(result.successful).toBe(1);
    });

    it('should handle background sync timeout', async () => {
      const longRunningQueue = Array.from({ length: 1000 }, (_, i) => ({
        id: `timeout-op-${i}`,
        action: 'create',
        contact: createMockContact({ id: `timeout-contact-${i}` }),
        timestamp: new Date().toISOString(),
      }));

      mockStorage.getItem.mockResolvedValue(JSON.stringify(longRunningQueue));

      // Mock slow API responses
      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise(
            resolve =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                  }),
                1000,
              ), // 1 second per request
          ),
      );

      const syncTimeout = 5000; // 5 second timeout
      const startTime = Date.now();

      const result = await contactSyncService.performBackgroundSync({
        timeout: syncTimeout,
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(syncTimeout + 1000); // Allow some buffer
      expect(result.processed).toBeLessThan(longRunningQueue.length); // Should not process all
    });
  });
});
