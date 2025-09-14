/**
 * Contact Sync Service
 *
 * Manages cloud backup, device contact integration, conflict resolution,
 * and background sync operations for contacts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundJob from 'react-native-background-job';
import NetInfo from '@react-native-community/netinfo';
import Contacts from 'react-native-contacts';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  Contact,
  ContactSyncConfig,
  ContactSyncStatus,
  ContactBackup,
  ContactRestoreJob,
} from '../types/contacts';
// import { contactDatabaseService } from './contactDatabaseService';
import { contactManagementService } from './contactManagementService';
import { trackEvent } from './analyticsService';

export interface SyncQueueItem {
  id: string;
  contactId: string;
  action: 'create' | 'update' | 'delete';
  data: Contact | null;
  timestamp: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export interface ConflictResolution {
  contactId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: Contact;
}

export interface DeviceContact {
  recordID: string;
  givenName: string;
  familyName: string;
  emailAddresses: Array<{ label: string; email: string }>;
  phoneNumbers: Array<{ label: string; number: string }>;
  company: string;
  jobTitle: string;
  note: string;
}

export class ContactSyncService {
  private static instance: ContactSyncService;
  private syncConfig: ContactSyncConfig = {
    enabled: true,
    autoSync: true,
    syncInterval: 30, // 30 minutes
    conflictResolution: 'newest_wins',
    includePhotos: false,
    includeNotes: true,
    includeInteractions: true,
    deviceContactsEnabled: false,
    cloudBackupEnabled: true,
  };

  private syncStatus: ContactSyncStatus = {
    isOnline: false,
    pendingUploads: 0,
    pendingDownloads: 0,
    conflicts: 0,
    errors: [],
    syncInProgress: false,
  };

  private syncQueue: SyncQueueItem[] = [];
  private backgroundJobStarted = false;

  private constructor() {
    this.loadSyncConfig();
    this.loadSyncQueue();
    this.setupNetworkListener();
  }

  static getInstance(): ContactSyncService {
    if (!ContactSyncService.instance) {
      ContactSyncService.instance = new ContactSyncService();
    }
    return ContactSyncService.instance;
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    await this.loadSyncConfig();
    await this.loadSyncQueue();

    if (this.syncConfig.autoSync) {
      await this.startBackgroundSync();
    }

    trackEvent('contact_sync_initialized', {
      autoSync: this.syncConfig.autoSync,
      deviceContactsEnabled: this.syncConfig.deviceContactsEnabled,
      cloudBackupEnabled: this.syncConfig.cloudBackupEnabled,
    });
  }

  /**
   * Get current sync configuration
   */
  getSyncConfig(): ContactSyncConfig {
    return { ...this.syncConfig };
  }

  /**
   * Update sync configuration
   */
  async updateSyncConfig(updates: Partial<ContactSyncConfig>): Promise<void> {
    this.syncConfig = { ...this.syncConfig, ...updates };
    await AsyncStorage.setItem(
      'contact_sync_config',
      JSON.stringify(this.syncConfig),
    );

    if (this.syncConfig.autoSync && !this.backgroundJobStarted) {
      await this.startBackgroundSync();
    } else if (!this.syncConfig.autoSync && this.backgroundJobStarted) {
      await this.stopBackgroundSync();
    }

    trackEvent('contact_sync_config_updated', { updates });
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): ContactSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Manually trigger sync
   */
  async syncNow(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    await this.performSync();
  }

  /**
   * Add contact to sync queue
   */
  async queueContactSync(
    contactId: string,
    action: SyncQueueItem['action'],
    data?: Contact,
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      action,
      data: data || null,
      timestamp: new Date().toISOString(),
      attempts: 0,
    };

    this.syncQueue.push(item);
    await this.saveSyncQueue();

    // Update status
    this.syncStatus.pendingUploads = this.syncQueue.length;

    trackEvent('contact_queued_for_sync', {
      contactId,
      action,
      queueSize: this.syncQueue.length,
    });

    // Try immediate sync if online
    if (this.syncStatus.isOnline && this.syncConfig.autoSync) {
      this.performSync().catch(console.error);
    }
  }

  /**
   * Enable device contacts integration
   */
  async enableDeviceContactsSync(): Promise<boolean> {
    try {
      const hasPermission = await this.requestContactsPermission();
      if (!hasPermission) {
        return false;
      }

      this.syncConfig.deviceContactsEnabled = true;
      await this.updateSyncConfig({ deviceContactsEnabled: true });

      // Initial sync with device contacts
      await this.syncWithDeviceContacts();

      return true;
    } catch (error) {
      trackEvent('device_contacts_sync_failed', { error: error.message });
      return false;
    }
  }

  /**
   * Sync with device contacts
   */
  async syncWithDeviceContacts(): Promise<void> {
    if (!this.syncConfig.deviceContactsEnabled) {
      return;
    }

    const hasPermission = await this.checkContactsPermission();
    if (!hasPermission) {
      throw new Error('Contacts permission not granted');
    }

    try {
      const deviceContacts = await Contacts.getAll();
      const appContacts = await contactManagementService.getAllContacts();

      // Convert device contacts to app format
      const convertedContacts = deviceContacts.map(this.convertDeviceContact);

      // Find new contacts to import
      const existingContactIds = new Set(appContacts.map(c => c.id));
      const newContacts = convertedContacts.filter(
        c => !existingContactIds.has(c.id),
      );

      if (newContacts.length > 0) {
        await contactManagementService.bulkSaveContacts(newContacts);

        trackEvent('device_contacts_imported', {
          importedCount: newContacts.length,
          totalDeviceContacts: deviceContacts.length,
        });
      }

      // Optionally sync app contacts back to device
      // This would require additional logic and permissions
    } catch (error) {
      trackEvent('device_contacts_sync_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a backup of all contacts
   */
  async createBackup(
    name?: string,
    includePhotos: boolean = false,
  ): Promise<ContactBackup> {
    const contacts = await contactManagementService.getAllContacts();

    const backup: ContactBackup = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Backup ${new Date().toLocaleDateString()}`,
      contactCount: contacts.length,
      size: 0,
      createdAt: new Date().toISOString(),
      type: 'manual',
      format: 'json',
      encryptionEnabled: false,
      status: 'pending',
    };

    try {
      // Prepare backup data
      const backupData = {
        version: '1.0',
        createdAt: backup.createdAt,
        contacts: includePhotos
          ? contacts
          : contacts.map(this.stripPhotosFromContact),
        metadata: {
          appVersion: '1.0.0',
          platform: Platform.OS,
          contactCount: contacts.length,
        },
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      backup.size = Buffer.byteLength(backupJson, 'utf8');

      // Save backup locally
      const localPath = await this.saveBackupLocally(backup.id, backupJson);
      backup.localPath = localPath;

      // Upload to cloud if enabled
      if (this.syncConfig.cloudBackupEnabled) {
        const cloudUrl = await this.uploadBackupToCloud(backup.id, backupJson);
        backup.cloudUrl = cloudUrl;
      }

      backup.status = 'completed';

      // Store backup metadata
      await this.saveBackupMetadata(backup);

      trackEvent('contact_backup_created', {
        backupId: backup.id,
        contactCount: backup.contactCount,
        size: backup.size,
        cloudEnabled: this.syncConfig.cloudBackupEnabled,
      });

      return backup;
    } catch (error) {
      backup.status = 'failed';
      trackEvent('contact_backup_failed', {
        backupId: backup.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Restore contacts from backup
   */
  async restoreFromBackup(
    backupId: string,
    options: {
      mergeExisting?: boolean;
      updateExisting?: boolean;
      preserveIds?: boolean;
    } = {},
  ): Promise<ContactRestoreJob> {
    const job: ContactRestoreJob = {
      id: `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      backupId,
      status: 'pending',
      progress: {
        totalContacts: 0,
        processedContacts: 0,
        errors: 0,
      },
      options: {
        mergeExisting: options.mergeExisting || false,
        updateExisting: options.updateExisting || true,
        preserveIds: options.preserveIds || false,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      // Load backup data
      const backupData = await this.loadBackupData(backupId);
      if (!backupData || !backupData.contacts) {
        throw new Error('Invalid backup data');
      }

      job.progress.totalContacts = backupData.contacts.length;
      job.status = 'processing';

      // Process contacts
      const existingContacts = await contactManagementService.getAllContacts();
      const existingContactMap = new Map(existingContacts.map(c => [c.id, c]));

      const contactsToSave: Contact[] = [];
      let processed = 0;
      let errors = 0;

      for (const backupContact of backupData.contacts) {
        try {
          let contactToSave = { ...backupContact };

          if (!job.options.preserveIds) {
            contactToSave.id = `contact_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }

          const existingContact = existingContactMap.get(contactToSave.id);

          if (existingContact) {
            if (job.options.updateExisting) {
              contactToSave.updatedAt = new Date().toISOString();
            } else if (!job.options.mergeExisting) {
              // Skip if not updating or merging
              processed++;
              continue;
            }
          }

          contactsToSave.push(contactToSave);
          processed++;
        } catch (error) {
          errors++;
          console.error('Error processing contact during restore:', error);
        }

        job.progress.processedContacts = processed;
        job.progress.errors = errors;
      }

      // Save all contacts
      if (contactsToSave.length > 0) {
        await contactManagementService.bulkSaveContacts(contactsToSave);
      }

      job.status = 'completed';
      job.completedAt = new Date().toISOString();

      trackEvent('contact_restore_completed', {
        jobId: job.id,
        backupId,
        totalContacts: job.progress.totalContacts,
        processedContacts: job.progress.processedContacts,
        errors: job.progress.errors,
      });

      return job;
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;

      trackEvent('contact_restore_failed', {
        jobId: job.id,
        backupId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Get available backups
   */
  async getAvailableBackups(): Promise<ContactBackup[]> {
    try {
      const backupsJson = await AsyncStorage.getItem('contact_backups');
      return backupsJson ? JSON.parse(backupsJson) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backups = await this.getAvailableBackups();
    const backup = backups.find(b => b.id === backupId);

    if (backup) {
      // Delete local file if exists
      if (backup.localPath) {
        // Implementation would delete local file
      }

      // Delete from cloud if exists
      if (backup.cloudUrl) {
        await this.deleteBackupFromCloud(backupId);
      }

      // Remove from metadata
      const updatedBackups = backups.filter(b => b.id !== backupId);
      await AsyncStorage.setItem(
        'contact_backups',
        JSON.stringify(updatedBackups),
      );

      trackEvent('contact_backup_deleted', { backupId });
    }
  }

  // Private methods

  private async loadSyncConfig(): Promise<void> {
    try {
      const configJson = await AsyncStorage.getItem('contact_sync_config');
      if (configJson) {
        this.syncConfig = { ...this.syncConfig, ...JSON.parse(configJson) };
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem('contact_sync_queue');
      if (queueJson) {
        this.syncQueue = JSON.parse(queueJson);
        this.syncStatus.pendingUploads = this.syncQueue.length;
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'contact_sync_queue',
        JSON.stringify(this.syncQueue),
      );
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isConnected || false;

      // If we just came online and auto-sync is enabled, trigger sync
      if (!wasOnline && this.syncStatus.isOnline && this.syncConfig.autoSync) {
        this.performSync().catch(console.error);
      }
    });
  }

  private async startBackgroundSync(): Promise<void> {
    if (this.backgroundJobStarted) {
      return;
    }

    BackgroundJob.start({
      jobKey: 'contactSync',
      period: this.syncConfig.syncInterval * 60 * 1000, // Convert to milliseconds
    });

    this.backgroundJobStarted = true;
  }

  private async stopBackgroundSync(): Promise<void> {
    if (!this.backgroundJobStarted) {
      return;
    }

    BackgroundJob.stop({
      jobKey: 'contactSync',
    });

    this.backgroundJobStarted = false;
  }

  private async performSync(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.errors = [];

    try {
      // Process upload queue
      await this.processUploadQueue();

      // Check for remote changes
      await this.processDownloads();

      // Update last sync time
      this.syncConfig.lastSyncAt = new Date().toISOString();
      await this.updateSyncConfig({ lastSyncAt: this.syncConfig.lastSyncAt });

      trackEvent('contact_sync_completed', {
        uploadedItems: this.syncQueue.length,
        downloadedItems: this.syncStatus.pendingDownloads,
        conflicts: this.syncStatus.conflicts,
      });
    } catch (error) {
      this.syncStatus.errors.push(error.message);
      trackEvent('contact_sync_failed', { error: error.message });
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  private async processUploadQueue(): Promise<void> {
    const maxRetries = 3;
    const itemsToRemove: string[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.uploadContactChange(item);
        itemsToRemove.push(item.id);
      } catch (error) {
        item.attempts++;
        item.lastAttempt = new Date().toISOString();
        item.error = error.message;

        if (item.attempts >= maxRetries) {
          itemsToRemove.push(item.id);
          this.syncStatus.errors.push(
            `Failed to sync contact ${item.contactId}: ${error.message}`,
          );
        }
      }
    }

    // Remove processed items
    this.syncQueue = this.syncQueue.filter(
      item => !itemsToRemove.includes(item.id),
    );
    this.syncStatus.pendingUploads = this.syncQueue.length;
    await this.saveSyncQueue();
  }

  private async processDownloads(): Promise<void> {
    // Implementation would fetch changes from cloud/server
    // This is a simplified placeholder
    this.syncStatus.pendingDownloads = 0;
  }

  private async uploadContactChange(item: SyncQueueItem): Promise<void> {
    // Implementation would upload change to cloud/server API
    // This is a simplified placeholder that just logs the action
    console.log(
      `Uploading contact change: ${item.action} for contact ${item.contactId}`,
    );

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async requestContactsPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const permission = await Contacts.requestPermission();
      return permission === 'authorized';
    } else {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      return permission === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  private async checkContactsPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const permission = await Contacts.checkPermission();
      return permission === 'authorized';
    } else {
      const permission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      return permission;
    }
  }

  private convertDeviceContact(deviceContact: any): Contact {
    const fields = [];
    let fieldOrder = 0;

    // Name
    const fullName = `${deviceContact.givenName || ''} ${
      deviceContact.familyName || ''
    }`.trim();
    if (fullName) {
      fields.push({
        id: `field_${fieldOrder++}`,
        type: 'name',
        label: 'Name',
        value: fullName,
        isEditable: true,
      });
    }

    // Company
    if (deviceContact.company) {
      fields.push({
        id: `field_${fieldOrder++}`,
        type: 'company',
        label: 'Company',
        value: deviceContact.company,
        isEditable: true,
      });
    }

    // Job title
    if (deviceContact.jobTitle) {
      fields.push({
        id: `field_${fieldOrder++}`,
        type: 'title',
        label: 'Title',
        value: deviceContact.jobTitle,
        isEditable: true,
      });
    }

    // Email addresses
    deviceContact.emailAddresses?.forEach((email: any) => {
      fields.push({
        id: `field_${fieldOrder++}`,
        type: 'email',
        label: email.label || 'Email',
        value: email.email,
        isEditable: true,
      });
    });

    // Phone numbers
    deviceContact.phoneNumbers?.forEach((phone: any) => {
      fields.push({
        id: `field_${fieldOrder++}`,
        type: 'phone',
        label: phone.label || 'Phone',
        value: phone.number,
        isEditable: true,
      });
    });

    return {
      id: `device_${deviceContact.recordID}`,
      fields,
      source: 'sync',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['device-contact'],
      isVerified: false,
      needsReview: false,
    };
  }

  private stripPhotosFromContact(contact: Contact): Contact {
    // Remove photo URLs to reduce backup size
    return {
      ...contact,
      imageUri: undefined,
      fields: contact.fields.map(field =>
        field.type === 'photo' ? { ...field, value: '' } : field,
      ),
    };
  }

  private async saveBackupLocally(
    backupId: string,
    data: string,
  ): Promise<string> {
    // Implementation would save to device storage
    // Return local file path
    return `backups/${backupId}.json`;
  }

  private async uploadBackupToCloud(
    backupId: string,
    data: string,
  ): Promise<string> {
    // Implementation would upload to cloud storage (iCloud, Google Drive, etc.)
    // Return cloud URL
    return `cloud://backups/${backupId}.json`;
  }

  private async deleteBackupFromCloud(backupId: string): Promise<void> {
    // Implementation would delete from cloud storage
  }

  private async saveBackupMetadata(backup: ContactBackup): Promise<void> {
    const backups = await this.getAvailableBackups();
    backups.push(backup);
    await AsyncStorage.setItem('contact_backups', JSON.stringify(backups));
  }

  private async loadBackupData(backupId: string): Promise<any> {
    // Implementation would load backup data from local or cloud storage
    // Return parsed backup data
    return null;
  }

  // Missing methods for offline functionality
  async checkConnectivity(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  onNetworkStateChange(callback: (isConnected: boolean) => void): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      callback(state.isConnected === true);
    });
    return unsubscribe;
  }

  async queueOfflineOperation(operation: any): Promise<void> {
    // Add operation to offline queue
    const queue = await AsyncStorage.getItem('offline_operations');
    const operations = queue ? JSON.parse(queue) : [];
    operations.push({ ...operation, timestamp: Date.now() });
    await AsyncStorage.setItem('offline_operations', JSON.stringify(operations));
  }

  async processOfflineQueue(): Promise<void> {
    const queue = await AsyncStorage.getItem('offline_operations');
    if (!queue) return;

    const operations = JSON.parse(queue);
    const processedOperations = [];

    for (const operation of operations) {
      try {
        // Process each operation based on type
        if (operation.type === 'create') {
          await contactManagementService.createContact(operation.data);
        } else if (operation.type === 'update') {
          await contactManagementService.updateContact(operation.id, operation.data);
        } else if (operation.type === 'delete') {
          await contactManagementService.deleteContact(operation.id);
        }
        processedOperations.push(operation);
      } catch (error) {
        // Keep failed operations for retry
        console.error('Failed to process offline operation:', error);
      }
    }

    // Remove processed operations
    const remainingOperations = operations.filter(
      op => !processedOperations.includes(op)
    );
    await AsyncStorage.setItem('offline_operations', JSON.stringify(remainingOperations));
  }
}

export const contactSyncService = ContactSyncService.getInstance();
export default ContactSyncService;
