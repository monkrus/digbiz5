import Config from 'react-native-config';

export const AppConfig = {
  apiUrl: Config.API_URL,
  apiTimeout: parseInt(Config.API_TIMEOUT, 10),
  appName: Config.APP_NAME,
  appVersion: Config.APP_VERSION,
  enableAnalytics: Config.ENABLE_ANALYTICS === 'true',
  enableCrashReporting: Config.ENABLE_CRASH_REPORTING === 'true',
  debugMode: Config.DEBUG_MODE === 'true',
};

export default AppConfig;
