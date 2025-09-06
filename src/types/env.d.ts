declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL: string;
    API_TIMEOUT: string;
    APP_NAME: string;
    APP_VERSION: string;
    ENABLE_ANALYTICS: string;
    ENABLE_CRASH_REPORTING: string;
    DEBUG_MODE: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
