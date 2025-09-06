import { MMKV } from 'react-native-mmkv';

// Create MMKV instance
export const storage = new MMKV();

// Typed storage utilities
export const StorageService = {
  // String operations
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  // Number operations
  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },

  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  // Boolean operations
  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },

  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  // JSON operations
  getObject: <T>(key: string): T | undefined => {
    const jsonString = storage.getString(key);
    if (jsonString) {
      try {
        return JSON.parse(jsonString) as T;
      } catch (error) {
        console.error('Error parsing JSON from storage:', error);
        return undefined;
      }
    }
    return undefined;
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      const jsonString = JSON.stringify(value);
      storage.set(key, jsonString);
    } catch (error) {
      console.error('Error stringifying object for storage:', error);
    }
  },

  // Delete operations
  delete: (key: string): void => {
    storage.delete(key);
  },

  // Check if key exists
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  // Clear all data
  clearAll: (): void => {
    storage.clearAll();
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },
};

// Storage keys constants
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  APP_SETTINGS: 'app_settings',
} as const;
