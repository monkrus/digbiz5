import Config from 'react-native-config';

export const ENV = {
  API_URL: Config.API_URL || 'http://localhost:3000/api',
  API_TIMEOUT: parseInt(Config.API_TIMEOUT || '10000', 10),
  APP_NAME: Config.APP_NAME || 'DigBiz5',
  APP_VERSION: Config.APP_VERSION || '1.0.0',
  ENABLE_ANALYTICS: Config.ENABLE_ANALYTICS === 'true',
  ENABLE_CRASH_REPORTING: Config.ENABLE_CRASH_REPORTING === 'true',
  DEBUG_MODE: Config.DEBUG_MODE === 'true',
} as const;

// Type for environment variables
export type EnvConfig = typeof ENV;
