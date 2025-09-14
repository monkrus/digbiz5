/**
 * Real-Time Sync Tests
 *
 * Tests for real-time synchronization including:
 * - WebSocket connection stability
 * - Data synchronization across devices
 * - Conflict resolution
 * - Offline-to-online sync
 * - Cross-platform sync consistency
 */

import {
  RealtimeSyncService,
  SyncEvent,
  SyncConflict,
  SyncState,
  DeviceInfo,
  SyncConfiguration,
} from '../../src/services/realtimeSyncService';

// Mock WebSocket
class MockWebSocket {
  readyState: number = 1; // WebSocket.OPEN
  url: string;
  onopen?: () => void;
  onclose?: () => void;
  onerror?: (error: any) => void;
  onmessage?: (event: { data: string }) => void;

  private messageQueue: string[] = [];

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.onopen?.(), 10);
  }

  send(data: string) {
    this.messageQueue.push(data);
  }

  close() {
    this.readyState = 3; // WebSocket.CLOSED
    setTimeout(() => this.onclose?.(), 10);
  }

  // Simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  getLastMessage(): any {
    const lastMessage = this.messageQueue[this.messageQueue.length - 1];
    return lastMessage ? JSON.parse(lastMessage) : null;
  }

  getAllMessages(): any[] {
    return this.messageQueue.map(msg => JSON.parse(msg));
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('Real-Time Sync Tests', () => {
  let syncService: RealtimeSyncService;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    syncService = new RealtimeSyncService({
      syncInterval: 1000,
      maxRetries: 3,
      conflictResolution: 'last-write-wins',
      enableCompression: true,
    });
  });

  afterEach(async () => {
    await syncService.disconnect();
  });

  describe('WebSocket Connection Management', () => {
    test('should establish WebSocket connection and handle lifecycle', async () => {
      const connectionEvents: string[] = [];

      syncService.on('connection_status', (status) => {
        connectionEvents.push(status.connected ? 'connected' : 'disconnected');
      });

      await syncService.connect();

      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(connectionEvents).toContain('connected');
      expect(syncService.isConnected()).toBe(true);

      await syncService.disconnect();

      expect(connectionEvents).toContain('disconnected');
      expect(syncService.isConnected()).toBe(false);
    });

    test('should handle connection failures and implement reconnection', async () => {
      let connectionAttempts = 0;
      const reconnectionDelays: number[] = [];

      syncService.on('reconnection_attempt', (attempt) => {
        connectionAttempts = attempt;
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          reconnectionDelays.push(delay);
        }
      });

      // Simulate connection failures
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            if (connectionAttempts < 2) {
              this.onerror?.(new Error('Connection failed'));
            } else {
              this.onopen?.();
            }
          }, 10);
        }
      };

      await syncService.connect();

      // Wait for reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(connectionAttempts).toBeGreaterThan(1);
      expect(reconnectionDelays[1]).toBeGreaterThan(reconnectionDelays[0]);

      // Restore original WebSocket
      (global as any).WebSocket = originalWebSocket;
    });

    test('should handle WebSocket message parsing errors gracefully', async () => {
      await syncService.connect();

      const errorEvents: any[] = [];
      syncService.on('sync_error', (error) => {
        errorEvents.push(error);
      });

      // Simulate malformed message
      const ws = syncService.getWebSocket() as MockWebSocket;
      ws.simulateMessage('invalid json string');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should handle parsing error without crashing
      expect(syncService.isConnected()).toBe(true);
    });
  });

  describe('Data Synchronization', () => {
    test('should synchronize data changes across devices', async () => {
      await syncService.connect();

      const syncedData: any[] = [];
      syncService.on('data_synced', (data) => {
        syncedData.push(data);
      });

      // Simulate data change from another device
      const changeEvent: SyncEvent = {
        id: 'change-1',
        type: 'update',
        entityType: 'message',
        entityId: 'msg123',
        data: {
          id: 'msg123',
          content: 'Updated message content',
          updatedAt: '2023-01-01T12:00:00Z',
        },
        timestamp: Date.now(),
        deviceId: 'device-2',
        userId: 'user123',
      };

      const ws = syncService.getWebSocket() as MockWebSocket;
      ws.simulateMessage({
        type: 'sync_event',
        event: changeEvent,
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(syncedData).toHaveLength(1);
      expect(syncedData[0].entityId).toBe('msg123');
      expect(syncedData[0].data.content).toBe('Updated message content');
    });

    test('should handle batch data synchronization efficiently', async () => {
      await syncService.connect();

      const batchSize = 50;
      const batchEvents: SyncEvent[] = Array.from({ length: batchSize }, (_, i) => ({
        id: `batch-event-${i}`,
        type: 'create',
        entityType: 'message',
        entityId: `msg${i}`,
        data: {
          id: `msg${i}`,
          content: `Batch message ${i}`,
          createdAt: new Date().toISOString(),
        },
        timestamp: Date.now() + i,
        deviceId: 'device-2',
        userId: 'user123',
      }));

      const syncedData: SyncEvent[] = [];
      syncService.on('data_synced', (data) => {
        syncedData.push(data);
      });

      const ws = syncService.getWebSocket() as MockWebSocket;
      ws.simulateMessage({
        type: 'sync_batch',
        events: batchEvents,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(syncedData).toHaveLength(batchSize);
      expect(syncedData[0].entityId).toBe('msg0');
      expect(syncedData[batchSize - 1].entityId).toBe(`msg${batchSize - 1}`);
    });

    test('should track sync state and handle incremental updates', async () => {
      await syncService.connect();

      const syncState: SyncState = {
        lastSyncTimestamp: Date.now() - 60000, // 1 minute ago
        deviceId: 'device-1',
        userId: 'user123',
        pendingChanges: [],
        syncVersion: 1,
      };

      syncService.setSyncState(syncState);

      // Request incremental sync
      await syncService.requestIncrementalSync();

      const ws = syncService.getWebSocket() as MockWebSocket;
      const lastMessage = ws.getLastMessage();

      expect(lastMessage.type).toBe('incremental_sync_request');
      expect(lastMessage.since).toBe(syncState.lastSyncTimestamp);
      expect(lastMessage.version).toBe(1);
    });

    test('should handle full sync when incremental sync fails', async () => {
      await syncService.connect();

      const syncEvents: string[] = [];
      syncService.on('sync_started', (type) => {
        syncEvents.push(type);
      });

      syncService.on('sync_completed', (type) => {
        syncEvents.push(`${type}_completed`);
      });

      // Simulate incremental sync failure
      const ws = syncService.getWebSocket() as MockWebSocket;
      ws.simulateMessage({
        type: 'incremental_sync_error',
        error: 'SYNC_CONFLICT',
        message: 'Too many conflicts, full sync required',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should automatically trigger full sync
      const messages = ws.getAllMessages();
      const fullSyncRequest = messages.find(msg => msg.type === 'full_sync_request');

      expect(fullSyncRequest).toBeDefined();
      expect(syncEvents).toContain('full_sync');
    });
  });

  describe('Conflict Resolution', () => {
    test('should resolve conflicts using last-write-wins strategy', async () => {
      await syncService.connect();

      const conflicts: SyncConflict[] = [];
      syncService.on('conflict_resolved', (conflict) => {
        conflicts.push(conflict);
      });

      const conflict: SyncConflict = {
        id: 'conflict-1',
        entityType: 'message',
        entityId: 'msg123',
        localVersion: {
          data: { content: 'Local version', updatedAt: '2023-01-01T12:00:00Z' },
          timestamp: new Date('2023-01-01T12:00:00Z').getTime(),
          deviceId: 'device-1',
        },
        remoteVersion: {
          data: { content: 'Remote version', updatedAt: '2023-01-01T12:01:00Z' },
          timestamp: new Date('2023-01-01T12:01:00Z').getTime(),
          deviceId: 'device-2',
        },
        resolutionStrategy: 'last-write-wins',
      };

      const resolution = await syncService.resolveConflict(conflict);

      expect(resolution.winningVersion).toBe('remote'); // Remote is newer
      expect(resolution.resolvedData.content).toBe('Remote version');
      expect(conflicts).toHaveLength(1);
    });

    test('should resolve conflicts using custom resolution rules', async () => {
      const customSyncService = new RealtimeSyncService({
        conflictResolution: 'custom',
        customResolver: (conflict: SyncConflict) => {
          // Custom rule: prefer local changes for messages, remote for other entities
          if (conflict.entityType === 'message') {
            return {
              winningVersion: 'local',
              resolvedData: conflict.localVersion.data,
              reason: 'Custom rule: prefer local messages',
            };
          }
          return {
            winningVersion: 'remote',
            resolvedData: conflict.remoteVersion.data,
            reason: 'Custom rule: prefer remote for non-messages',
          };
        },
      });

      await customSyncService.connect();

      const messageConflict: SyncConflict = {
        id: 'msg-conflict',
        entityType: 'message',
        entityId: 'msg456',
        localVersion: {
          data: { content: 'Local message' },
          timestamp: Date.now() - 1000,
          deviceId: 'device-1',
        },
        remoteVersion: {
          data: { content: 'Remote message' },
          timestamp: Date.now(),
          deviceId: 'device-2',
        },
        resolutionStrategy: 'custom',
      };

      const resolution = await customSyncService.resolveConflict(messageConflict);

      expect(resolution.winningVersion).toBe('local');
      expect(resolution.resolvedData.content).toBe('Local message');
      expect(resolution.reason).toBe('Custom rule: prefer local messages');

      await customSyncService.disconnect();
    });

    test('should handle complex three-way merge conflicts', async () => {
      await syncService.connect();

      // Simulate a three-way conflict: original, local, remote
      const threeWayConflict: SyncConflict = {
        id: 'threeway-conflict',
        entityType: 'profile',
        entityId: 'profile123',
        originalVersion: {
          data: {
            name: 'John Doe',
            email: 'john@example.com',
            bio: 'Original bio',
          },
          timestamp: Date.now() - 2000,
          deviceId: 'server',
        },
        localVersion: {
          data: {
            name: 'John Doe',
            email: 'john.doe@example.com', // Local change
            bio: 'Original bio',
          },
          timestamp: Date.now() - 1000,
          deviceId: 'device-1',
        },
        remoteVersion: {
          data: {
            name: 'John Doe',
            email: 'john@example.com',
            bio: 'Updated bio from remote', // Remote change
          },
          timestamp: Date.now() - 500,
          deviceId: 'device-2',
        },
        resolutionStrategy: 'three-way-merge',
      };

      const resolution = await syncService.resolveConflict(threeWayConflict);

      // Should merge both changes
      expect(resolution.resolvedData.email).toBe('john.doe@example.com'); // Local change
      expect(resolution.resolvedData.bio).toBe('Updated bio from remote'); // Remote change
      expect(resolution.winningVersion).toBe('merged');
    });

    test('should handle conflicting deletes and updates', async () => {
      await syncService.connect();

      const deleteUpdateConflict: SyncConflict = {
        id: 'delete-update-conflict',
        entityType: 'message',
        entityId: 'msg789',
        localVersion: {
          data: null, // Local delete
          timestamp: Date.now() - 500,
          deviceId: 'device-1',
          operation: 'delete',
        },
        remoteVersion: {
          data: { content: 'Updated content' }, // Remote update
          timestamp: Date.now() - 1000,
          deviceId: 'device-2',
          operation: 'update',
        },
        resolutionStrategy: 'last-write-wins',
      };

      const resolution = await syncService.resolveConflict(deleteUpdateConflict);

      // Delete happened after update, so delete wins
      expect(resolution.winningVersion).toBe('local');
      expect(resolution.resolvedData).toBeNull();
      expect(resolution.operation).toBe('delete');
    });
  });

  describe('Offline-to-Online Sync', () => {
    test('should queue changes while offline and sync when reconnected', async () => {
      const offlineChanges: SyncEvent[] = [];

      // Simulate offline state
      await syncService.connect();
      await syncService.disconnect();

      expect(syncService.isConnected()).toBe(false);

      // Make changes while offline
      const offlineChange1: SyncEvent = {
        id: 'offline-1',
        type: 'create',
        entityType: 'message',
        entityId: 'offline-msg-1',
        data: { content: 'Offline message 1' },
        timestamp: Date.now(),
        deviceId: 'device-1',
        userId: 'user123',
      };

      const offlineChange2: SyncEvent = {
        id: 'offline-2',
        type: 'update',
        entityType: 'message',
        entityId: 'offline-msg-2',
        data: { content: 'Updated offline message 2' },
        timestamp: Date.now() + 1000,
        deviceId: 'device-1',
        userId: 'user123',
      };

      // Queue offline changes
      await syncService.queueChange(offlineChange1);
      await syncService.queueChange(offlineChange2);

      const queueSize = syncService.getQueuedChangesCount();
      expect(queueSize).toBe(2);

      // Reconnect and sync
      await syncService.connect();

      const syncedChanges: SyncEvent[] = [];
      syncService.on('offline_sync_completed', (changes) => {
        syncedChanges.push(...changes);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(syncedChanges).toHaveLength(2);
      expect(syncedChanges[0].id).toBe('offline-1');
      expect(syncedChanges[1].id).toBe('offline-2');
    });

    test('should handle offline queue overflow gracefully', async () => {
      const maxQueueSize = 100;
      const syncServiceWithLimit = new RealtimeSyncService({
        maxOfflineQueueSize: maxQueueSize,
      });

      await syncServiceWithLimit.connect();
      await syncServiceWithLimit.disconnect();

      // Add more changes than queue limit
      const promises = Array.from({ length: 150 }, (_, i) =>
        syncServiceWithLimit.queueChange({
          id: `overflow-${i}`,
          type: 'create',
          entityType: 'message',
          entityId: `msg-${i}`,
          data: { content: `Message ${i}` },
          timestamp: Date.now() + i,
          deviceId: 'device-1',
          userId: 'user123',
        })
      );

      await Promise.all(promises);

      const queueSize = syncServiceWithLimit.getQueuedChangesCount();
      expect(queueSize).toBeLessThanOrEqual(maxQueueSize);

      await syncServiceWithLimit.disconnect();
    });

    test('should prioritize critical changes during offline sync', async () => {
      await syncService.connect();
      await syncService.disconnect();

      const normalChange: SyncEvent = {
        id: 'normal-change',
        type: 'update',
        entityType: 'profile',
        entityId: 'profile123',
        data: { bio: 'Updated bio' },
        timestamp: Date.now(),
        deviceId: 'device-1',
        userId: 'user123',
        priority: 'normal',
      };

      const criticalChange: SyncEvent = {
        id: 'critical-change',
        type: 'create',
        entityType: 'message',
        entityId: 'critical-msg',
        data: { content: 'Critical message' },
        timestamp: Date.now() + 1000,
        deviceId: 'device-1',
        userId: 'user123',
        priority: 'critical',
      };

      await syncService.queueChange(normalChange);
      await syncService.queueChange(criticalChange);

      const queuedChanges = syncService.getQueuedChanges();
      const sortedChanges = queuedChanges.sort((a, b) => {
        const priorityOrder = { critical: 3, high: 2, normal: 1, low: 0 };
        return priorityOrder[b.priority || 'normal'] - priorityOrder[a.priority || 'normal'];
      });

      expect(sortedChanges[0].id).toBe('critical-change');
      expect(sortedChanges[1].id).toBe('normal-change');
    });

    test('should handle partial sync failures during offline catch-up', async () => {
      await syncService.connect();
      await syncService.disconnect();

      // Queue multiple changes
      const changes = Array.from({ length: 10 }, (_, i) => ({
        id: `partial-${i}`,
        type: 'create' as const,
        entityType: 'message',
        entityId: `msg-${i}`,
        data: { content: `Message ${i}` },
        timestamp: Date.now() + i * 1000,
        deviceId: 'device-1',
        userId: 'user123',
      }));

      for (const change of changes) {
        await syncService.queueChange(change);
      }

      await syncService.connect();

      const failedSyncs: string[] = [];
      const successfulSyncs: string[] = [];

      syncService.on('sync_success', (change) => {
        successfulSyncs.push(change.id);
      });

      syncService.on('sync_failure', (change, error) => {
        failedSyncs.push(change.id);
      });

      // Simulate some sync failures
      const ws = syncService.getWebSocket() as MockWebSocket;
      setTimeout(() => {
        ws.simulateMessage({
          type: 'sync_error',
          changeId: 'partial-5',
          error: 'VALIDATION_FAILED',
        });
      }, 50);

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(successfulSyncs.length).toBeGreaterThan(0);
      expect(failedSyncs).toContain('partial-5');

      // Failed changes should be retried
      const retryQueue = syncService.getRetryQueue();
      expect(retryQueue.some(change => change.id === 'partial-5')).toBe(true);
    });
  });

  describe('Cross-Platform Consistency', () => {
    test('should maintain data consistency across different platforms', async () => {
      const devices: Array<{ id: string; platform: string; syncService: RealtimeSyncService }> = [
        { id: 'ios-device', platform: 'ios', syncService: new RealtimeSyncService() },
        { id: 'android-device', platform: 'android', syncService: new RealtimeSyncService() },
        { id: 'web-client', platform: 'web', syncService: new RealtimeSyncService() },
      ];

      // Connect all devices
      for (const device of devices) {
        await device.syncService.connect();
      }

      const syncedData: Array<{ deviceId: string; data: any }> = [];

      // Set up sync listeners for all devices
      devices.forEach(device => {
        device.syncService.on('data_synced', (data) => {
          syncedData.push({ deviceId: device.id, data });
        });
      });

      // Send change from iOS device
      const changeEvent: SyncEvent = {
        id: 'cross-platform-change',
        type: 'update',
        entityType: 'profile',
        entityId: 'user-profile',
        data: {
          name: 'Updated Name',
          status: 'active',
          lastUpdated: new Date().toISOString(),
        },
        timestamp: Date.now(),
        deviceId: 'ios-device',
        userId: 'user123',
      };

      await devices[0].syncService.sendChange(changeEvent);

      // Simulate server broadcasting to all other devices
      for (let i = 1; i < devices.length; i++) {
        const ws = devices[i].syncService.getWebSocket() as MockWebSocket;
        ws.simulateMessage({
          type: 'sync_event',
          event: changeEvent,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // All devices except the sender should receive the update
      expect(syncedData).toHaveLength(devices.length - 1);
      expect(syncedData.every(item => item.data.entityId === 'user-profile')).toBe(true);

      // Clean up
      for (const device of devices) {
        await device.syncService.disconnect();
      }
    });

    test('should handle platform-specific data transformations', async () => {
      const platformTransforms = {
        ios: (data: any) => ({
          ...data,
          // iOS-specific formatting
          timestamp: new Date(data.timestamp).toISOString(),
          deviceInfo: { platform: 'ios', version: '16.0' },
        }),
        android: (data: any) => ({
          ...data,
          // Android-specific formatting
          timestamp: new Date(data.timestamp).getTime(),
          deviceInfo: { platform: 'android', version: '13.0' },
        }),
        web: (data: any) => ({
          ...data,
          // Web-specific formatting
          timestamp: data.timestamp,
          deviceInfo: { platform: 'web', userAgent: 'Chrome/109.0.0.0' },
        }),
      };

      const rawData = {
        id: 'transform-test',
        content: 'Test content',
        timestamp: Date.now(),
      };

      const iosTransformed = platformTransforms.ios(rawData);
      const androidTransformed = platformTransforms.android(rawData);
      const webTransformed = platformTransforms.web(rawData);

      expect(typeof iosTransformed.timestamp).toBe('string');
      expect(typeof androidTransformed.timestamp).toBe('number');
      expect(iosTransformed.deviceInfo.platform).toBe('ios');
      expect(androidTransformed.deviceInfo.platform).toBe('android');
      expect(webTransformed.deviceInfo.platform).toBe('web');
    });

    test('should handle platform-specific sync optimizations', async () => {
      const mobileConfig: SyncConfiguration = {
        syncInterval: 5000, // Longer interval on mobile to save battery
        batchSize: 10, // Smaller batches on mobile
        compressionEnabled: true, // Enable compression for mobile networks
        wifiOnlySync: true, // Only sync on WiFi for mobile
      };

      const webConfig: SyncConfiguration = {
        syncInterval: 1000, // Faster sync on web
        batchSize: 50, // Larger batches on web
        compressionEnabled: false, // Less critical on web
        wifiOnlySync: false, // Always sync on web
      };

      const mobileSyncService = new RealtimeSyncService(mobileConfig);
      const webSyncService = new RealtimeSyncService(webConfig);

      await mobileSyncService.connect();
      await webSyncService.connect();

      expect(mobileSyncService.getConfiguration().syncInterval).toBe(5000);
      expect(webSyncService.getConfiguration().syncInterval).toBe(1000);

      expect(mobileSyncService.getConfiguration().batchSize).toBe(10);
      expect(webSyncService.getConfiguration().batchSize).toBe(50);

      await mobileSyncService.disconnect();
      await webSyncService.disconnect();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high-frequency sync events efficiently', async () => {
      await syncService.connect();

      const startTime = Date.now();
      const eventCount = 1000;
      const processedEvents: SyncEvent[] = [];

      syncService.on('data_synced', (event) => {
        processedEvents.push(event);
      });

      // Simulate high-frequency events
      const ws = syncService.getWebSocket() as MockWebSocket;

      for (let i = 0; i < eventCount; i++) {
        ws.simulateMessage({
          type: 'sync_event',
          event: {
            id: `high-freq-${i}`,
            type: 'update',
            entityType: 'typing_indicator',
            entityId: `typing-${i}`,
            data: { isTyping: i % 2 === 0 },
            timestamp: Date.now() + i,
            deviceId: 'device-2',
            userId: 'user123',
          },
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processedEvents).toHaveLength(eventCount);
      expect(processingTime).toBeLessThan(1000); // Should process 1000 events in less than 1 second
    });

    test('should implement sync batching for efficiency', async () => {
      await syncService.connect();

      const batchedEvents: SyncEvent[][] = [];
      syncService.on('sync_batch_processed', (batch) => {
        batchedEvents.push(batch);
      });

      // Queue multiple changes rapidly
      const changes = Array.from({ length: 25 }, (_, i) => ({
        id: `batch-${i}`,
        type: 'create' as const,
        entityType: 'message',
        entityId: `msg-${i}`,
        data: { content: `Batched message ${i}` },
        timestamp: Date.now() + i,
        deviceId: 'device-1',
        userId: 'user123',
      }));

      for (const change of changes) {
        await syncService.queueChange(change);
      }

      // Trigger batch processing
      await syncService.processBatch();

      expect(batchedEvents.length).toBeGreaterThan(0);

      const totalProcessedEvents = batchedEvents.reduce((sum, batch) => sum + batch.length, 0);
      expect(totalProcessedEvents).toBe(25);

      // Each batch should not exceed configured batch size
      batchedEvents.forEach(batch => {
        expect(batch.length).toBeLessThanOrEqual(syncService.getConfiguration().batchSize || 50);
      });
    });

    test('should implement memory-efficient event storage', async () => {
      const maxStoredEvents = 1000;
      const syncServiceWithLimit = new RealtimeSyncService({
        maxStoredEvents: maxStoredEvents,
      });

      await syncServiceWithLimit.connect();

      // Add more events than storage limit
      for (let i = 0; i < 1500; i++) {
        const event: SyncEvent = {
          id: `memory-test-${i}`,
          type: 'create',
          entityType: 'message',
          entityId: `msg-${i}`,
          data: { content: `Message ${i}` },
          timestamp: Date.now() + i,
          deviceId: 'device-1',
          userId: 'user123',
        };

        await syncServiceWithLimit.storeEvent(event);
      }

      const storedEventCount = syncServiceWithLimit.getStoredEventCount();
      expect(storedEventCount).toBeLessThanOrEqual(maxStoredEvents);

      // Oldest events should be evicted
      const oldestStoredEvent = syncServiceWithLimit.getOldestStoredEvent();
      expect(oldestStoredEvent?.id).not.toBe('memory-test-0');

      await syncServiceWithLimit.disconnect();
    });

    test('should handle network fluctuations gracefully', async () => {
      await syncService.connect();

      const networkEvents: string[] = [];
      syncService.on('network_status', (status) => {
        networkEvents.push(status);
      });

      // Simulate network fluctuations
      const simulateNetworkFluctuation = async () => {
        // Good connection
        syncService.setNetworkQuality('good');
        await new Promise(resolve => setTimeout(resolve, 100));

        // Poor connection
        syncService.setNetworkQuality('poor');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Offline
        syncService.setNetworkQuality('offline');
        await new Promise(resolve => setTimeout(resolve, 150));

        // Back online
        syncService.setNetworkQuality('good');
      };

      await simulateNetworkFluctuation();

      expect(networkEvents).toContain('good');
      expect(networkEvents).toContain('poor');
      expect(networkEvents).toContain('offline');

      // Sync service should adapt sync intervals based on network quality
      const poorNetworkInterval = syncService.getSyncInterval('poor');
      const goodNetworkInterval = syncService.getSyncInterval('good');

      expect(poorNetworkInterval).toBeGreaterThan(goodNetworkInterval);
    });
  });
});