import Config from 'react-native-config';

export interface EnvConfig {
  apiUrl: string;
  webUrl: string;
  apiTimeout: number;
  appName: string;
  appVersion: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  debugMode: boolean;
}

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  mode: 'light' | 'dark';
}

export const AppConfig: EnvConfig = {
  apiUrl: Config.API_URL || 'https://api.example.com',
  webUrl: (Config as any).WEB_URL || 'https://example.com',
  apiTimeout: parseInt(Config.API_TIMEOUT || '5000', 10),
  appName: Config.APP_NAME || 'DigBiz5',
  appVersion: Config.APP_VERSION || '1.0.0',
  enableAnalytics: Config.ENABLE_ANALYTICS === 'true',
  enableCrashReporting: Config.ENABLE_CRASH_REPORTING === 'true',
  debugMode: Config.DEBUG_MODE === 'true',
};

export const DefaultTheme: Theme = {
  primaryColor: '#007AFF',
  secondaryColor: '#FF9500',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  mode: 'light',
};

export default AppConfig;
