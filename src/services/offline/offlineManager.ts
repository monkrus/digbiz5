/**
 * Offline Manager Service
 *
 * Provides comprehensive offline resilience including data caching,
 * sync queue management, and offline-first architecture
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[]; // Action IDs this depends on
  conflictResolution?: 'server' | 'client' | 'merge' | 'manual';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  etag?: string;
  lastModified?: string;
  dependencies?: string[];
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingActions: number;
  failedActions: number;
  syncInProgress: boolean;
  nextSyncTime?: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxCacheSize: number;
  cleanupInterval: number;
  compressionEnabled: boolean;
}

interface SyncConfig {
  batchSize: number;
  retryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
  conflictResolution: OfflineAction['conflictResolution'];
}

class OfflineManager {
  private isConnected: boolean = true;
  private cache = new Map<string, CacheEntry>();
  private syncQueue: OfflineAction[] = [];
  private syncInProgress: boolean = false;
  private listeners = new Set<(status: SyncStatus) => void>();
  private lastSyncTime: number = 0;
  private syncTimer: NodeJS.Timeout | null = null;

  private cacheConfig: CacheConfig = {
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    cleanupInterval: 30 * 60 * 1000, // 30 minutes
    compressionEnabled: true,
  };

  private syncConfig: SyncConfig = {
    batchSize: 10,
    retryDelay: 1000,
    maxRetryDelay: 30000,
    backoffMultiplier: 2,
    conflictResolution: 'server',
  };

  constructor() {
    this.initializeNetworkListener();
    this.loadCacheFromStorage();
    this.loadSyncQueueFromStorage();
    this.startPeriodicCleanup();
  }

  // Network connectivity management
  private initializeNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;

      console.log(
        `Network status changed: ${this.isConnected ? 'online' : 'offline'}`,
      );

      // Start sync when coming back online
      if (!wasConnected && this.isConnected) {
        this.handleComingOnline();
      }

      this.notifyListeners();
    });

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isConnected = state.isConnected ?? false;
    });
  }

  private async handleComingOnline(): Promise<void> {
    console.log('Device came online, starting sync...');
    await this.processSyncQueue();
  }

  // Cache management
  async cacheData<T = any>(
    key: string,
    data: T,
    ttl?: number,
    options: {
      etag?: string;
      lastModified?: string;
      dependencies?: string[];
    } = {},
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheConfig.defaultTTL,
      etag: options.etag,
      lastModified: options.lastModified,
      dependencies: options.dependencies,
    };

    this.cache.set(key, entry);
    await this.persistCacheEntry(key, entry);

    // Check cache size and cleanup if necessary
    await this.enforceMaxCacheSize();
  }

  async getFromCache<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      // Try to load from storage
      const storedEntry = await this.loadCacheEntryFromStorage<T>(key);
      if (storedEntry) {
        this.cache.set(key, storedEntry);
        return this.validateCacheEntry(storedEntry);
      }
      return null;
    }

    return this.validateCacheEntry(entry);
  }

  private validateCacheEntry<T>(entry: CacheEntry<T>): T | null {
    const now = Date.now();
    const isExpired = now > entry.timestamp + entry.ttl;

    if (isExpired) {
      console.log('Cache entry expired');
      return null;
    }

    return entry.data;
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      // Invalidate entries matching pattern
      const keysToRemove: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        this.cache.delete(key);
        await this.removeCacheEntryFromStorage(key);
      }
    } else {
      // Invalidate all cache
      this.cache.clear();
      await this.clearCacheStorage();
    }
  }

  // Offline action queue management
  async queueOfflineAction(
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>,
  ): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3,
    };

    // Insert action based on priority
    this.insertActionByPriority(offlineAction);
    await this.persistSyncQueue();

    console.log(
      `Queued offline action: ${offlineAction.type} ${offlineAction.endpoint}`,
    );

    // Try to process immediately if online
    if (this.isConnected && !this.syncInProgress) {
      this.processSyncQueue();
    }

    return offlineAction.id;
  }

  private insertActionByPriority(action: OfflineAction): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const actionPriority = priorityOrder[action.priority];

    let insertIndex = this.syncQueue.length;

    for (let i = 0; i < this.syncQueue.length; i++) {
      const queuePriority = priorityOrder[this.syncQueue[i].priority];
      if (actionPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.syncQueue.splice(insertIndex, 0, action);
  }

  async removeFromSyncQueue(actionId: string): Promise<boolean> {
    const index = this.syncQueue.findIndex(action => action.id === actionId);
    if (index >= 0) {
      this.syncQueue.splice(index, 1);
      await this.persistSyncQueue();
      return true;
    }
    return false;
  }

  // Sync processing
  private async processSyncQueue(): Promise<void> {
    if (
      this.syncInProgress ||
      !this.isConnected ||
      this.syncQueue.length === 0
    ) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    console.log(`Processing sync queue with ${this.syncQueue.length} actions`);

    const batch = this.syncQueue.splice(0, this.syncConfig.batchSize);
    const processedActions: string[] = [];

    try {
      for (const action of batch) {
        try {
          // Check dependencies
          if (action.dependencies?.length) {
            const dependenciesMet = this.checkDependencies(action.dependencies);
            if (!dependenciesMet) {
              // Put back in queue for later
              this.syncQueue.unshift(action);
              continue;
            }
          }

          await this.executeAction(action);
          processedActions.push(action.id);
          console.log(`Successfully executed action: ${action.id}`);
        } catch (error) {
          console.error(`Failed to execute action ${action.id}:`, error);
          await this.handleActionFailure(action, error);
        }
      }

      this.lastSyncTime = Date.now();
      await this.persistSyncQueue();
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();

      // Continue processing if there are more actions
      if (this.syncQueue.length > 0 && this.isConnected) {
        // Delay to prevent overwhelming the server
        setTimeout(() => this.processSyncQueue(), 1000);
      }
    }
  }

  private checkDependencies(dependencies: string[]): boolean {
    // Check if all dependent actions have been processed
    for (const depId of dependencies) {
      const stillInQueue = this.syncQueue.some(action => action.id === depId);
      if (stillInQueue) {
        return false;
      }
    }
    return true;
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const { endpoint, method, data, headers = {} } = action;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle response and update cache if necessary
    if (method === 'GET') {
      const responseData = await response.json();
      await this.cacheData(
        this.getCacheKey(endpoint, method),
        responseData,
        undefined,
        {
          etag: response.headers.get('etag') || undefined,
          lastModified: response.headers.get('last-modified') || undefined,
        },
      );
    }
  }

  private async handleActionFailure(
    action: OfflineAction,
    error: any,
  ): Promise<void> {
    action.retryCount++;

    if (action.retryCount < action.maxRetries) {
      // Calculate retry delay with exponential backoff
      const delay = Math.min(
        this.syncConfig.retryDelay *
          Math.pow(this.syncConfig.backoffMultiplier, action.retryCount - 1),
        this.syncConfig.maxRetryDelay,
      );

      console.log(
        `Retrying action ${action.id} in ${delay}ms (attempt ${action.retryCount})`,
      );

      // Put back in queue with delay
      setTimeout(() => {
        this.syncQueue.unshift(action);
      }, delay);
    } else {
      console.error(
        `Action ${action.id} failed after ${action.maxRetries} attempts`,
      );
      // Store failed action for manual review
      await this.storeFailedAction(action, error);
    }
  }

  // Conflict resolution
  async resolveConflict(
    localData: any,
    serverData: any,
    conflictResolution: OfflineAction['conflictResolution'] = 'server',
  ): Promise<any> {
    switch (conflictResolution) {
      case 'server':
        return serverData;

      case 'client':
        return localData;

      case 'merge':
        return this.mergeData(localData, serverData);

      case 'manual':
        // Store conflict for manual resolution
        await this.storeConflict(localData, serverData);
        return serverData; // Default to server while waiting for manual resolution

      default:
        return serverData;
    }
  }

  private mergeData(localData: any, serverData: any): any {
    // Simple merge strategy - can be customized based on data structure
    if (typeof localData === 'object' && typeof serverData === 'object') {
      return {
        ...serverData,
        ...localData,
        // Prefer server timestamps
        createdAt: serverData.createdAt || localData.createdAt,
        updatedAt: serverData.updatedAt || localData.updatedAt,
      };
    }

    // For non-objects, prefer server data
    return serverData;
  }

  // API wrapper with offline support
  async offlineFirstRequest<T = any>(
    endpoint: string,
    options: {
      method?: string;
      data?: any;
      headers?: Record<string, string>;
      cacheFirst?: boolean;
      cacheTTL?: number;
      priority?: OfflineAction['priority'];
    } = {},
  ): Promise<T> {
    const {
      method = 'GET',
      data,
      headers = {},
      cacheFirst = true,
      cacheTTL,
      priority = 'medium',
    } = options;

    const cacheKey = this.getCacheKey(endpoint, method, data);

    // Try cache first for GET requests
    if (method === 'GET' && cacheFirst) {
      const cachedData = await this.getFromCache<T>(cacheKey);
      if (cachedData) {
        console.log(`Serving from cache: ${endpoint}`);
        return cachedData;
      }
    }

    // If online, make request
    if (this.isConnected) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Cache successful GET responses
        if (method === 'GET') {
          await this.cacheData(cacheKey, responseData, cacheTTL);
        }

        return responseData;
      } catch (error) {
        console.error(`Request failed: ${endpoint}`, error);

        // For GET requests, try cache as fallback
        if (method === 'GET') {
          const cachedData = await this.getFromCache<T>(cacheKey);
          if (cachedData) {
            console.log(`Serving stale cache due to error: ${endpoint}`);
            return cachedData;
          }
        }

        throw error;
      }
    }

    // If offline
    if (method === 'GET') {
      // Try to serve from cache
      const cachedData = await this.getFromCache<T>(cacheKey);
      if (cachedData) {
        console.log(`Serving from cache (offline): ${endpoint}`);
        return cachedData;
      }
      throw new Error('No cached data available offline');
    } else {
      // Queue for later processing
      await this.queueOfflineAction({
        type: this.mapMethodToType(method),
        endpoint,
        method: method as OfflineAction['method'],
        data,
        headers,
        priority,
        maxRetries: 3,
      });

      // Return optimistic response for non-GET requests
      return this.generateOptimisticResponse<T>(method, data);
    }
  }

  private getCacheKey(endpoint: string, method: string, data?: any): string {
    const dataHash = data ? JSON.stringify(data) : '';
    return `${method}:${endpoint}:${dataHash}`;
  }

  private mapMethodToType(method: string): OfflineAction['type'] {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'SYNC';
    }
  }

  private generateOptimisticResponse<T>(method: string, data?: any): T {
    // Generate optimistic response based on method and data
    switch (method.toUpperCase()) {
      case 'POST':
        return {
          ...data,
          id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
        } as T;

      case 'PUT':
      case 'PATCH':
        return {
          ...data,
          updatedAt: new Date().toISOString(),
          status: 'pending',
        } as T;

      case 'DELETE':
        return { success: true, status: 'pending' } as T;

      default:
        return { status: 'pending' } as T;
    }
  }

  // Storage persistence
  private async persistCacheEntry(
    key: string,
    entry: CacheEntry,
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to persist cache entry:', error);
    }
  }

  private async loadCacheEntryFromStorage<T>(
    key: string,
  ): Promise<CacheEntry<T> | null> {
    try {
      const data = await AsyncStorage.getItem(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load cache entry:', error);
      return null;
    }
  }

  private async removeCacheEntryFromStorage(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Failed to remove cache entry:', error);
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache:'));

      for (const storageKey of cacheKeys) {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          const key = storageKey.replace('cache:', '');
          const entry = JSON.parse(data);
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private async clearCacheStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache storage:', error);
    }
  }

  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private async loadSyncQueueFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('sync_queue');
      if (data) {
        this.syncQueue = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async storeFailedAction(
    action: OfflineAction,
    error: any,
  ): Promise<void> {
    try {
      const failedAction = {
        action,
        error: error.message,
        timestamp: Date.now(),
      };

      const key = `failed_action:${action.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(failedAction));
    } catch (error) {
      console.error('Failed to store failed action:', error);
    }
  }

  private async storeConflict(localData: any, serverData: any): Promise<void> {
    try {
      const conflict = {
        localData,
        serverData,
        timestamp: Date.now(),
        id: `conflict_${Date.now()}`,
      };

      const key = `conflict:${conflict.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(conflict));
    } catch (error) {
      console.error('Failed to store conflict:', error);
    }
  }

  // Cleanup and maintenance
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.cacheConfig.cleanupInterval);
  }

  private async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      await this.removeCacheEntryFromStorage(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  private async enforceMaxCacheSize(): Promise<void> {
    const currentSize = this.estimateCacheSize();

    if (currentSize > this.cacheConfig.maxCacheSize) {
      // Remove oldest entries until under limit
      const sortedEntries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      );

      while (
        this.estimateCacheSize() > this.cacheConfig.maxCacheSize &&
        sortedEntries.length > 0
      ) {
        const [key] = sortedEntries.shift()!;
        this.cache.delete(key);
        await this.removeCacheEntryFromStorage(key);
      }
    }
  }

  private estimateCacheSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length;
    }
    return size;
  }

  // Public API
  getStatus(): SyncStatus {
    return {
      isOnline: this.isConnected,
      lastSyncTime: this.lastSyncTime,
      pendingActions: this.syncQueue.length,
      failedActions: this.syncQueue.filter(a => a.retryCount >= a.maxRetries)
        .length,
      syncInProgress: this.syncInProgress,
    };
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  async forcSync(): Promise<void> {
    if (this.isConnected) {
      await this.processSyncQueue();
    }
  }

  async clearOfflineData(): Promise<void> {
    this.syncQueue = [];
    await this.invalidateCache();
    await AsyncStorage.removeItem('sync_queue');
  }

  getCacheStats(): {
    entries: number;
    size: number;
    hitRate: number;
  } {
    return {
      entries: this.cache.size,
      size: this.estimateCacheSize(),
      hitRate: 0, // Would track hits/misses in production
    };
  }
}

export const offlineManager = new OfflineManager();
export default offlineManager;
