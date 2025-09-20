/**
 * Image Cache Service
 *
 * Handles intelligent image caching with memory and disk persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem {
  uri: string;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  maxSize: number;
}

class ImageCacheService {
  private cache = new Map<string, CacheItem>();
  private readonly CACHE_PREFIX = 'image_cache_';
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_ITEMS = 500;
  private readonly CLEANUP_THRESHOLD = 0.8; // Clean up when 80% full
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor() {
    this.loadCacheIndex();
    this.setupPeriodicCleanup();
  }

  // Get cached image
  async get(key: string): Promise<string | null> {
    try {
      const item = this.cache.get(key);

      if (!item) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (this.isExpired(item)) {
        await this.remove(key);
        this.stats.misses++;
        return null;
      }

      // Update access stats
      item.accessCount++;
      item.lastAccessed = Date.now();
      this.cache.set(key, item);

      this.stats.hits++;
      return item.uri;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  // Cache image
  async set(key: string, uri: string, size?: number): Promise<void> {
    try {
      const estimatedSize = size || this.estimateImageSize(uri);

      // Check if we need to make space
      if (this.shouldCleanup(estimatedSize)) {
        await this.cleanup();
      }

      const item: CacheItem = {
        uri,
        timestamp: Date.now(),
        size: estimatedSize,
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      this.cache.set(key, item);

      // Persist to storage
      await this.persistItem(key, item);
      await this.saveCacheIndex();
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  // Remove cached image
  async remove(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
      await this.saveCacheIndex();
    } catch (error) {
      console.error('Error removing cached image:', error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      const keys = Array.from(this.cache.keys());
      await Promise.all(
        keys.map(key => AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`)),
      );

      this.cache.clear();
      await AsyncStorage.removeItem(`${this.CACHE_PREFIX}index`);

      this.stats = { hits: 0, misses: 0, evictions: 0 };
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, item) => sum + item.size,
      0,
    );

    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0;

    return {
      totalSize,
      itemCount: this.cache.size,
      hitRate,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }

  // Preload images
  async preload(
    urls: string[],
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): Promise<void> {
    const delay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 500;

    for (const url of urls) {
      try {
        const key = this.generateKey(url);
        const cached = await this.get(key);

        if (!cached) {
          await new Promise(resolve => setTimeout(resolve, delay));
          await this.downloadAndCache(key, url);
        }
      } catch (error) {
        console.error('Error preloading image:', url, error);
      }
    }
  }

  // Prefetch images for specific screens
  async prefetchForScreen(
    screenName: string,
    imageUrls: string[],
  ): Promise<void> {
    const batchSize = 3; // Process 3 images at a time
    const batches = [];

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      batches.push(imageUrls.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(async url => {
          try {
            const key = this.generateKey(url);
            const cached = await this.get(key);

            if (!cached) {
              await this.downloadAndCache(key, url);
            }
          } catch (error) {
            console.error(
              'Error prefetching image for screen:',
              screenName,
              error,
            );
          }
        }),
      );
    }
  }

  // Smart cache management
  private async cleanup(): Promise<void> {
    try {
      const items = Array.from(this.cache.entries());
      const currentTime = Date.now();

      // Sort by priority (least recently used + least accessed)
      items.sort(([, a], [, b]) => {
        const aScore = (currentTime - a.lastAccessed) / a.accessCount;
        const bScore = (currentTime - b.lastAccessed) / b.accessCount;
        return bScore - aScore;
      });

      // Remove oldest 25% of items
      const removeCount = Math.ceil(items.length * 0.25);
      const itemsToRemove = items.slice(0, removeCount);

      for (const [key] of itemsToRemove) {
        await this.remove(key);
        this.stats.evictions++;
      }

      console.log(`Cache cleanup: removed ${removeCount} items`);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  private shouldCleanup(newItemSize: number): boolean {
    const stats = this.getStats();
    const wouldExceedSize =
      stats.totalSize + newItemSize >
      this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD;
    const wouldExceedCount =
      stats.itemCount >= this.MAX_ITEMS * this.CLEANUP_THRESHOLD;

    return wouldExceedSize || wouldExceedCount;
  }

  private isExpired(item: CacheItem): boolean {
    const now = Date.now();
    return now - item.timestamp > this.CACHE_EXPIRY;
  }

  private estimateImageSize(uri: string): number {
    // Rough estimation based on URL patterns
    if (uri.includes('thumbnail') || uri.includes('small')) {
      return 50 * 1024; // 50KB
    }
    if (uri.includes('medium')) {
      return 200 * 1024; // 200KB
    }
    if (uri.includes('large') || uri.includes('original')) {
      return 800 * 1024; // 800KB
    }

    return 300 * 1024; // Default 300KB
  }

  private generateKey(uri: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async downloadAndCache(key: string, uri: string): Promise<void> {
    try {
      // In a real implementation, you would download the image
      // For now, we'll just cache the URI
      await this.set(key, uri);
    } catch (error) {
      console.error('Error downloading and caching image:', error);
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(`${this.CACHE_PREFIX}index`);
      if (indexData) {
        const index = JSON.parse(indexData);
        this.cache = new Map(index);

        // Clean up expired items
        const currentTime = Date.now();
        for (const [key, item] of this.cache.entries()) {
          if (this.isExpired(item)) {
            await this.remove(key);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cache index:', error);
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const index = Array.from(this.cache.entries());
      await AsyncStorage.setItem(
        `${this.CACHE_PREFIX}index`,
        JSON.stringify(index),
      );
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  private async persistItem(key: string, item: CacheItem): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(item),
      );
    } catch (error) {
      console.error('Error persisting cache item:', error);
    }
  }

  private setupPeriodicCleanup(): void {
    // Run cleanup every 30 minutes
    setInterval(() => {
      this.performMaintenanceCleanup();
    }, 30 * 60 * 1000);
  }

  private async performMaintenanceCleanup(): Promise<void> {
    try {
      const stats = this.getStats();

      // Only clean up if we're above the threshold
      if (
        stats.totalSize > this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD ||
        stats.itemCount > this.MAX_ITEMS * this.CLEANUP_THRESHOLD
      ) {
        await this.cleanup();
      }

      // Remove expired items
      const currentTime = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (this.isExpired(item)) {
          await this.remove(key);
        }
      }
    } catch (error) {
      console.error('Error during maintenance cleanup:', error);
    }
  }

  // Memory pressure handling
  async handleMemoryPressure(): Promise<void> {
    try {
      // Aggressively clean cache on memory pressure
      const items = Array.from(this.cache.entries());
      const removeCount = Math.ceil(items.length * 0.5); // Remove 50%

      items.sort(([, a], [, b]) => {
        return Date.now() - a.lastAccessed - (Date.now() - b.lastAccessed);
      });

      const itemsToRemove = items.slice(0, removeCount);
      for (const [key] of itemsToRemove) {
        await this.remove(key);
      }

      console.log(`Memory pressure cleanup: removed ${removeCount} items`);
    } catch (error) {
      console.error('Error handling memory pressure:', error);
    }
  }

  // Export cache data for debugging
  async exportCacheData(): Promise<any> {
    const stats = this.getStats();
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      ...item,
      sizeKB: Math.round(item.size / 1024),
      ageHours: Math.round((Date.now() - item.timestamp) / (1000 * 60 * 60)),
    }));

    return {
      stats,
      items,
      settings: {
        maxSize: this.MAX_CACHE_SIZE,
        maxItems: this.MAX_ITEMS,
        cleanupThreshold: this.CLEANUP_THRESHOLD,
        expiryDays: this.CACHE_EXPIRY / (24 * 60 * 60 * 1000),
      },
    };
  }
}

export const imageCache = new ImageCacheService();
export default imageCache;
