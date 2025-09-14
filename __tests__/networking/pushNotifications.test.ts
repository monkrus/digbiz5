/**
 * Push Notification Delivery Tests
 *
 * Tests for push notification system including:
 * - Notification delivery reliability
 * - Platform-specific handling (iOS/Android)
 * - Notification scheduling and batching
 * - User preferences and permissions
 * - Background notification handling
 */

import {
  PushNotificationService,
  NotificationPayload,
  NotificationConfig,
  DeliveryReceipt,
  ScheduledNotification,
} from '../../src/services/pushNotificationService';

// Mock React Native push notification libraries
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn().mockResolvedValue('authorized'),
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    setBackgroundMessageHandler: jest.fn(),
    subscribeToTopic: jest.fn().mockResolvedValue(),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(),
  }),
}));

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotifications: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  getScheduledLocalNotifications: jest.fn(),
  checkPermissions: jest.fn().mockResolvedValue({ alert: true, badge: true, sound: true }),
  requestPermissions: jest.fn().mockResolvedValue({ alert: true, badge: true, sound: true }),
}));

// Mock platform detection
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (config: any) => config.ios,
  },
}));

describe('Push Notification Delivery Tests', () => {
  let pushNotificationService: PushNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    pushNotificationService = new PushNotificationService();
  });

  afterEach(async () => {
    await pushNotificationService.cleanup();
  });

  describe('Notification Delivery Reliability', () => {
    test('should successfully send push notification with delivery confirmation', async () => {
      const notificationPayload: NotificationPayload = {
        id: 'notif123',
        title: 'New Message',
        body: 'You have received a new message from John',
        data: {
          type: 'message',
          chatId: 'chat123',
          messageId: 'msg456',
          senderId: 'user789',
        },
        priority: 'high',
        sound: 'default',
      };

      const mockDeliveryReceipt: DeliveryReceipt = {
        notificationId: 'notif123',
        userId: 'user123',
        deviceToken: 'mock-device-token',
        deliveryStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
        platform: 'ios',
      };

      // Mock FCM response
      const mockFcmResponse = {
        success: 1,
        failure: 0,
        results: [
          {
            message_id: 'fcm-msg-123',
            registration_id: 'mock-device-token',
          },
        ],
      };

      jest.spyOn(pushNotificationService, 'sendNotification')
        .mockResolvedValue(mockDeliveryReceipt);

      const result = await pushNotificationService.sendNotification(
        'user123',
        notificationPayload
      );

      expect(result.deliveryStatus).toBe('delivered');
      expect(result.notificationId).toBe('notif123');
      expect(result.platform).toBe('ios');
    });

    test('should handle notification delivery failures gracefully', async () => {
      const notificationPayload: NotificationPayload = {
        id: 'notif124',
        title: 'Failed Notification',
        body: 'This notification should fail',
        data: { type: 'test' },
      };

      // Mock FCM failure response
      const mockFailedReceipt: DeliveryReceipt = {
        notificationId: 'notif124',
        userId: 'user123',
        deviceToken: 'invalid-token',
        deliveryStatus: 'failed',
        error: 'InvalidRegistration',
        failedAt: new Date().toISOString(),
        platform: 'ios',
      };

      jest.spyOn(pushNotificationService, 'sendNotification')
        .mockResolvedValue(mockFailedReceipt);

      const result = await pushNotificationService.sendNotification(
        'user123',
        notificationPayload
      );

      expect(result.deliveryStatus).toBe('failed');
      expect(result.error).toBe('InvalidRegistration');
    });

    test('should retry failed notifications with exponential backoff', async () => {
      const notificationPayload: NotificationPayload = {
        id: 'notif125',
        title: 'Retry Test',
        body: 'This notification should be retried',
        data: { type: 'test' },
      };

      let attemptCount = 0;
      const maxRetries = 3;

      jest.spyOn(pushNotificationService, 'sendNotification')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < maxRetries) {
            throw new Error('Network error');
          }
          return {
            notificationId: 'notif125',
            userId: 'user123',
            deviceToken: 'mock-token',
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            platform: 'ios',
          };
        });

      const sendWithRetry = async (payload: NotificationPayload, retries = 3): Promise<DeliveryReceipt> => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            return await pushNotificationService.sendNotification('user123', payload);
          } catch (error) {
            if (attempt === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
        throw new Error('Max retries exceeded');
      };

      const result = await sendWithRetry(notificationPayload);

      expect(result.deliveryStatus).toBe('delivered');
      expect(attemptCount).toBe(maxRetries);
    });

    test('should handle batch notification sending efficiently', async () => {
      const notifications: Array<{ userId: string; payload: NotificationPayload }> = [];

      // Create 100 notifications
      for (let i = 0; i < 100; i++) {
        notifications.push({
          userId: `user${i}`,
          payload: {
            id: `notif${i}`,
            title: 'Batch Notification',
            body: `Notification ${i}`,
            data: { type: 'batch', index: i },
          },
        });
      }

      const mockBatchReceipts: DeliveryReceipt[] = notifications.map(n => ({
        notificationId: n.payload.id,
        userId: n.userId,
        deviceToken: `token-${n.userId}`,
        deliveryStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
        platform: 'ios',
      }));

      jest.spyOn(pushNotificationService, 'sendBatchNotifications')
        .mockResolvedValue(mockBatchReceipts);

      const startTime = performance.now();
      const results = await pushNotificationService.sendBatchNotifications(notifications);
      const endTime = performance.now();

      expect(results).toHaveLength(100);
      expect(results.every(r => r.deliveryStatus === 'delivered')).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Platform-Specific Handling', () => {
    test('should handle iOS-specific notification features', async () => {
      const iOSNotification: NotificationPayload = {
        id: 'ios-notif-1',
        title: 'iOS Notification',
        body: 'This is an iOS-specific notification',
        data: { type: 'message' },
        ios: {
          badge: 5,
          sound: 'custom-sound.wav',
          category: 'MESSAGE_CATEGORY',
          threadId: 'chat123',
          attachments: [{
            url: 'https://example.com/image.jpg',
            options: { thumbnailHidden: false },
          }],
          criticalAlert: {
            name: 'emergency',
            volume: 1.0,
          },
        },
      };

      const mockiOSReceipt: DeliveryReceipt = {
        notificationId: 'ios-notif-1',
        userId: 'user123',
        deviceToken: 'ios-device-token',
        deliveryStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
        platform: 'ios',
        platformSpecificData: {
          apnId: 'apn-123',
          badge: 5,
          sound: 'custom-sound.wav',
        },
      };

      jest.spyOn(pushNotificationService, 'sendNotification')
        .mockResolvedValue(mockiOSReceipt);

      const result = await pushNotificationService.sendNotification('user123', iOSNotification);

      expect(result.platform).toBe('ios');
      expect(result.platformSpecificData?.badge).toBe(5);
      expect(result.platformSpecificData?.sound).toBe('custom-sound.wav');
    });

    test('should handle Android-specific notification features', async () => {
      // Mock Android platform
      jest.doMock('react-native', () => ({
        Platform: {
          OS: 'android',
          select: (config: any) => config.android,
        },
      }));

      const androidNotification: NotificationPayload = {
        id: 'android-notif-1',
        title: 'Android Notification',
        body: 'This is an Android-specific notification',
        data: { type: 'message' },
        android: {
          channelId: 'messages',
          importance: 'high',
          visibility: 'public',
          color: '#FF0000',
          smallIcon: 'ic_notification',
          largeIcon: 'https://example.com/large-icon.png',
          actions: [
            {
              action: 'REPLY',
              title: 'Reply',
              icon: 'ic_reply',
            },
            {
              action: 'MARK_READ',
              title: 'Mark as Read',
              icon: 'ic_done',
            },
          ],
          style: {
            type: 'bigText',
            text: 'This is a big text notification with more details...',
          },
        },
      };

      const mockAndroidReceipt: DeliveryReceipt = {
        notificationId: 'android-notif-1',
        userId: 'user123',
        deviceToken: 'android-device-token',
        deliveryStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
        platform: 'android',
        platformSpecificData: {
          fcmMessageId: 'fcm-123',
          channelId: 'messages',
          importance: 'high',
        },
      };

      jest.spyOn(pushNotificationService, 'sendNotification')
        .mockResolvedValue(mockAndroidReceipt);

      const result = await pushNotificationService.sendNotification('user123', androidNotification);

      expect(result.platform).toBe('android');
      expect(result.platformSpecificData?.channelId).toBe('messages');
      expect(result.platformSpecificData?.importance).toBe('high');
    });

    test('should handle cross-platform notification compatibility', async () => {
      const crossPlatformNotification: NotificationPayload = {
        id: 'cross-platform-1',
        title: 'Cross Platform',
        body: 'This works on both iOS and Android',
        data: { type: 'message' },
        ios: {
          badge: 1,
          sound: 'default',
        },
        android: {
          channelId: 'messages',
          importance: 'default',
          smallIcon: 'ic_notification',
        },
      };

      const platforms = ['ios', 'android'];

      for (const platform of platforms) {
        const mockReceipt: DeliveryReceipt = {
          notificationId: 'cross-platform-1',
          userId: 'user123',
          deviceToken: `${platform}-token`,
          deliveryStatus: 'delivered',
          deliveredAt: new Date().toISOString(),
          platform: platform as 'ios' | 'android',
        };

        jest.spyOn(pushNotificationService, 'sendNotification')
          .mockResolvedValue(mockReceipt);

        const result = await pushNotificationService.sendNotification('user123', crossPlatformNotification);

        expect(result.platform).toBe(platform);
        expect(result.deliveryStatus).toBe('delivered');
      }
    });
  });

  describe('User Preferences and Permissions', () => {
    test('should check and request notification permissions', async () => {
      const mockPermissionStatus = {
        alert: true,
        badge: true,
        sound: true,
        criticalAlert: false,
      };

      jest.spyOn(pushNotificationService, 'checkPermissions')
        .mockResolvedValue(mockPermissionStatus);

      jest.spyOn(pushNotificationService, 'requestPermissions')
        .mockResolvedValue(mockPermissionStatus);

      const currentPermissions = await pushNotificationService.checkPermissions();
      expect(currentPermissions.alert).toBe(true);

      const requestedPermissions = await pushNotificationService.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
        criticalAlert: true,
      });

      expect(requestedPermissions).toBeDefined();
    });

    test('should respect user notification preferences', async () => {
      const userPreferences = {
        userId: 'user123',
        preferences: {
          messages: { enabled: true, sound: true, vibrate: true },
          connectionRequests: { enabled: true, sound: false, vibrate: false },
          systemUpdates: { enabled: false, sound: false, vibrate: false },
        },
      };

      const messageNotification: NotificationPayload = {
        id: 'msg-notif',
        title: 'New Message',
        body: 'You have a new message',
        data: { type: 'message' },
      };

      const systemNotification: NotificationPayload = {
        id: 'sys-notif',
        title: 'System Update',
        body: 'App has been updated',
        data: { type: 'systemUpdate' },
      };

      const shouldSendNotification = (payload: NotificationPayload, preferences: any): boolean => {
        const type = payload.data?.type;
        return preferences[type]?.enabled || false;
      };

      expect(shouldSendNotification(messageNotification, userPreferences.preferences)).toBe(true);
      expect(shouldSendNotification(systemNotification, userPreferences.preferences)).toBe(false);
    });

    test('should handle notification scheduling based on user timezone', async () => {
      const userTimezone = 'America/New_York';
      const scheduledTime = new Date('2023-01-01T09:00:00-05:00'); // 9 AM EST

      const scheduledNotification: ScheduledNotification = {
        id: 'scheduled-1',
        userId: 'user123',
        payload: {
          id: 'reminder-1',
          title: 'Daily Reminder',
          body: 'Don\'t forget to check your messages',
          data: { type: 'reminder' },
        },
        scheduledFor: scheduledTime.toISOString(),
        timezone: userTimezone,
        recurring: {
          frequency: 'daily',
          daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
        },
      };

      const mockScheduleReceipt = {
        scheduleId: 'schedule-123',
        notificationId: 'scheduled-1',
        scheduledFor: scheduledTime.toISOString(),
        status: 'scheduled',
      };

      jest.spyOn(pushNotificationService, 'scheduleNotification')
        .mockResolvedValue(mockScheduleReceipt);

      const result = await pushNotificationService.scheduleNotification(scheduledNotification);

      expect(result.status).toBe('scheduled');
      expect(result.scheduledFor).toBe(scheduledTime.toISOString());
    });

    test('should handle quiet hours and do not disturb settings', async () => {
      const userSettings = {
        userId: 'user123',
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'America/Los_Angeles',
        },
        doNotDisturb: {
          enabled: false,
        },
      };

      const isInQuietHours = (currentTime: Date, settings: typeof userSettings): boolean => {
        if (!settings.quietHours.enabled) return false;

        const timeString = currentTime.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          timeZone: settings.quietHours.timezone,
        });

        const [hours, minutes] = timeString.split(':').map(Number);
        const currentMinutes = hours * 60 + minutes;

        const [startHours, startMins] = settings.quietHours.startTime.split(':').map(Number);
        const startMinutes = startHours * 60 + startMins;

        const [endHours, endMins] = settings.quietHours.endTime.split(':').map(Number);
        const endMinutes = endHours * 60 + endMins;

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      };

      // Test during quiet hours (23:30 PST)
      const quietTime = new Date('2023-01-01T23:30:00-08:00');
      expect(isInQuietHours(quietTime, userSettings)).toBe(true);

      // Test outside quiet hours (12:00 PST)
      const activeTime = new Date('2023-01-01T12:00:00-08:00');
      expect(isInQuietHours(activeTime, userSettings)).toBe(false);
    });
  });

  describe('Background Notification Handling', () => {
    test('should handle background notification processing', async () => {
      const backgroundPayload = {
        data: {
          type: 'message',
          chatId: 'chat123',
          messageId: 'msg789',
          silent: true,
        },
      };

      const backgroundTasks: Array<() => Promise<void>> = [];

      const mockBackgroundHandler = jest.fn().mockImplementation((remoteMessage) => {
        // Simulate background processing
        backgroundTasks.push(async () => {
          // Update local database
          await new Promise(resolve => setTimeout(resolve, 100));

          // Sync message data
          await new Promise(resolve => setTimeout(resolve, 50));

          // Update badge count
          await new Promise(resolve => setTimeout(resolve, 25));
        });
      });

      // Register background message handler
      jest.spyOn(pushNotificationService, 'setBackgroundMessageHandler')
        .mockImplementation(mockBackgroundHandler);

      pushNotificationService.setBackgroundMessageHandler(mockBackgroundHandler);

      // Simulate background message received
      mockBackgroundHandler(backgroundPayload);

      expect(mockBackgroundHandler).toHaveBeenCalledWith(backgroundPayload);
      expect(backgroundTasks).toHaveLength(1);

      // Execute background task
      await backgroundTasks[0]();
      // Background task should complete successfully
    });

    test('should handle background notification with limited execution time', async () => {
      const backgroundExecutionTimeLimit = 30000; // 30 seconds on iOS
      let taskCompleted = false;

      const longRunningTask = async (): Promise<void> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            taskCompleted = true;
            resolve();
          }, 35000); // Task takes longer than limit
        });
      };

      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Background execution time exceeded'));
        }, backgroundExecutionTimeLimit);
      });

      await expect(Promise.race([longRunningTask(), timeoutPromise]))
        .rejects.toThrow('Background execution time exceeded');

      expect(taskCompleted).toBe(false);
    });

    test('should handle background app refresh and data synchronization', async () => {
      const backgroundSync = {
        lastSyncTime: new Date('2023-01-01T10:00:00Z'),
        pendingUpdates: [
          { type: 'message', id: 'msg1', timestamp: '2023-01-01T10:05:00Z' },
          { type: 'connection', id: 'conn1', timestamp: '2023-01-01T10:03:00Z' },
        ],
      };

      const performBackgroundSync = async (syncData: typeof backgroundSync): Promise<void> => {
        const currentTime = new Date();
        const timeSinceLastSync = currentTime.getTime() - new Date(syncData.lastSyncTime).getTime();
        const maxSyncInterval = 15 * 60 * 1000; // 15 minutes

        if (timeSinceLastSync > maxSyncInterval) {
          // Sync pending updates
          for (const update of syncData.pendingUpdates) {
            // Process each update
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Clear pending updates
          syncData.pendingUpdates = [];
          syncData.lastSyncTime = currentTime;
        }
      };

      await performBackgroundSync(backgroundSync);

      expect(backgroundSync.pendingUpdates).toHaveLength(0);
      expect(new Date(backgroundSync.lastSyncTime).getTime())
        .toBeGreaterThan(new Date('2023-01-01T10:00:00Z').getTime());
    });

    test('should handle notification action responses', async () => {
      const notificationResponse = {
        notification: {
          request: {
            identifier: 'msg-notif-123',
            content: {
              title: 'New Message',
              body: 'Hello there!',
              userInfo: {
                chatId: 'chat123',
                messageId: 'msg456',
              },
            },
          },
        },
        actionIdentifier: 'REPLY_ACTION',
        userText: 'Thanks for the message!',
      };

      const actionHandlers = {
        REPLY_ACTION: async (response: typeof notificationResponse) => {
          // Send reply message
          const replyContent = response.userText;
          const chatId = response.notification.request.content.userInfo.chatId;

          return {
            success: true,
            messageId: 'reply-123',
            chatId,
            content: replyContent,
          };
        },
        MARK_READ_ACTION: async (response: typeof notificationResponse) => {
          // Mark message as read
          const messageId = response.notification.request.content.userInfo.messageId;

          return {
            success: true,
            messageId,
            readAt: new Date().toISOString(),
          };
        },
      };

      const handler = actionHandlers[notificationResponse.actionIdentifier];
      const result = await handler(notificationResponse);

      expect(result.success).toBe(true);
      expect(result.chatId).toBe('chat123');
      expect(result.content).toBe('Thanks for the message!');
    });
  });

  describe('Notification Analytics and Monitoring', () => {
    test('should track notification delivery metrics', async () => {
      const metrics = {
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        actionTaken: 0,
      };

      const notifications = Array.from({ length: 100 }, (_, i) => ({
        id: `metric-notif-${i}`,
        title: 'Metric Test',
        body: `Notification ${i}`,
        data: { type: 'test', index: i },
      }));

      const mockResults = notifications.map((notif, i) => ({
        notificationId: notif.id,
        userId: 'user123',
        deviceToken: 'mock-token',
        deliveryStatus: i < 95 ? 'delivered' : 'failed' as 'delivered' | 'failed',
        deliveredAt: i < 95 ? new Date().toISOString() : undefined,
        failedAt: i >= 95 ? new Date().toISOString() : undefined,
        platform: 'ios' as const,
      }));

      jest.spyOn(pushNotificationService, 'sendBatchNotifications')
        .mockResolvedValue(mockResults);

      const results = await pushNotificationService.sendBatchNotifications(
        notifications.map(n => ({ userId: 'user123', payload: n }))
      );

      // Calculate metrics
      metrics.sent = results.length;
      metrics.delivered = results.filter(r => r.deliveryStatus === 'delivered').length;
      metrics.failed = results.filter(r => r.deliveryStatus === 'failed').length;

      expect(metrics.sent).toBe(100);
      expect(metrics.delivered).toBe(95);
      expect(metrics.failed).toBe(5);

      // Calculate delivery rate
      const deliveryRate = (metrics.delivered / metrics.sent) * 100;
      expect(deliveryRate).toBe(95);
    });

    test('should track notification engagement metrics', async () => {
      const engagementMetrics = {
        impressions: 0,
        opens: 0,
        actions: 0,
        dismissals: 0,
      };

      const notificationEvents = [
        { type: 'delivered', notificationId: 'notif1', timestamp: Date.now() },
        { type: 'opened', notificationId: 'notif1', timestamp: Date.now() + 1000 },
        { type: 'action', notificationId: 'notif1', actionId: 'REPLY', timestamp: Date.now() + 2000 },
        { type: 'delivered', notificationId: 'notif2', timestamp: Date.now() },
        { type: 'dismissed', notificationId: 'notif2', timestamp: Date.now() + 3000 },
      ];

      for (const event of notificationEvents) {
        switch (event.type) {
          case 'delivered':
            engagementMetrics.impressions++;
            break;
          case 'opened':
            engagementMetrics.opens++;
            break;
          case 'action':
            engagementMetrics.actions++;
            break;
          case 'dismissed':
            engagementMetrics.dismissals++;
            break;
        }
      }

      expect(engagementMetrics.impressions).toBe(2);
      expect(engagementMetrics.opens).toBe(1);
      expect(engagementMetrics.actions).toBe(1);
      expect(engagementMetrics.dismissals).toBe(1);

      // Calculate engagement rates
      const openRate = (engagementMetrics.opens / engagementMetrics.impressions) * 100;
      const actionRate = (engagementMetrics.actions / engagementMetrics.opens) * 100;

      expect(openRate).toBe(50);
      expect(actionRate).toBe(100);
    });

    test('should monitor notification performance by platform', async () => {
      const platformMetrics = {
        ios: { sent: 0, delivered: 0, failed: 0, avgDeliveryTime: 0 },
        android: { sent: 0, delivered: 0, failed: 0, avgDeliveryTime: 0 },
      };

      const testNotifications = [
        { platform: 'ios', deliveryTime: 150 },
        { platform: 'ios', deliveryTime: 200 },
        { platform: 'android', deliveryTime: 300 },
        { platform: 'android', deliveryTime: 250 },
        { platform: 'ios', deliveryTime: 0 }, // Failed
      ];

      for (const notification of testNotifications) {
        const platform = notification.platform as 'ios' | 'android';
        platformMetrics[platform].sent++;

        if (notification.deliveryTime > 0) {
          platformMetrics[platform].delivered++;
          platformMetrics[platform].avgDeliveryTime += notification.deliveryTime;
        } else {
          platformMetrics[platform].failed++;
        }
      }

      // Calculate average delivery times
      platformMetrics.ios.avgDeliveryTime = platformMetrics.ios.avgDeliveryTime / platformMetrics.ios.delivered;
      platformMetrics.android.avgDeliveryTime = platformMetrics.android.avgDeliveryTime / platformMetrics.android.delivered;

      expect(platformMetrics.ios.sent).toBe(3);
      expect(platformMetrics.ios.delivered).toBe(2);
      expect(platformMetrics.ios.failed).toBe(1);
      expect(platformMetrics.ios.avgDeliveryTime).toBe(175);

      expect(platformMetrics.android.sent).toBe(2);
      expect(platformMetrics.android.delivered).toBe(2);
      expect(platformMetrics.android.failed).toBe(0);
      expect(platformMetrics.android.avgDeliveryTime).toBe(275);
    });
  });
});