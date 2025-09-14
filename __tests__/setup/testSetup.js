/**
 * Test Setup Configuration
 *
 * Global test setup for mocking React Native modules and
 * configuring test environment.
 */

require('react-native-gesture-handler/jestSetup');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(options => options.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
  Share: {
    share: jest.fn(() => Promise.resolve()),
  },
  DevMenu: {
    reload: jest.fn(),
    addItem: jest.fn(),
  },
  TurboModuleRegistry: {
    get: jest.fn(),
    getEnforcing: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn(styles => styles),
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  FlatList: 'FlatList',
  TextInput: 'TextInput',
  Button: 'Button',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  StatusBar: 'StatusBar',
  Modal: 'Modal',
  Switch: 'Switch',
  Picker: 'Picker',
}));

// Mock TurboModuleRegistry specifically
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn(),
  getEnforcing: jest.fn(),
}));

// Mock MMKV
const mockMMKVInstance = {
  set: jest.fn(),
  getString: jest.fn(() => 'mock_key'),
  getNumber: jest.fn(() => 0),
  getBoolean: jest.fn(() => false),
  contains: jest.fn(() => false),
  delete: jest.fn(),
  clearAll: jest.fn(),
  size: 0,
};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => mockMMKVInstance),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  requestMultiple: jest.fn(),
  openSettings: jest.fn(),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      CONTACTS: 'ios.permission.CONTACTS',
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
      MICROPHONE: 'ios.permission.MICROPHONE',
      NOTIFICATIONS: 'ios.permission.NOTIFICATIONS',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_CONTACTS: 'android.permission.READ_CONTACTS',
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/FontAwesome', () => 'FontAwesome');

// Mock CryptoJS
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(data => ({ toString: () => `encrypted_${data}` })),
    decrypt: jest.fn(data => ({
      toString: jest.fn(() => data.replace('encrypted_', '')),
    })),
  },
  lib: {
    WordArray: {
      random: jest.fn(() => ({ toString: () => 'random_key' })),
    },
  },
  enc: {
    Utf8: 'utf8',
  },
}));

// Note: tokenUtils is not mocked to allow actual testing of utility functions

// Mock config
jest.mock('../../src/utils/config', () => ({
  AppConfig: {
    apiUrl: 'https://api.test.com',
    timeout: 10000,
  },
}));

// Mock config/env
jest.mock('../../src/config/env', () => ({
  API_BASE_URL: 'https://api.test.com',
  API_TIMEOUT: 10000,
}));

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => {
  const mockDatabase = {
    contacts: new Map(),
    notes: new Map(),
    interactions: new Map(),
  };

  return {
    enablePromise: jest.fn(),
    DEBUG: jest.fn(),
    openDatabase: jest.fn(() => ({
      transaction: jest.fn(callback => {
        const tx = {
          executeSql: jest.fn((sql, params, successCallback) => {
            const result = {
              rows: {
                length: 0,
                item: jest.fn(),
                raw: jest.fn(() => []),
              },
              insertId: 1,
              rowsAffected: 1,
            };
            if (successCallback) successCallback(tx, result);
          }),
        };
        callback(tx);
      }),
      executeSql: jest.fn((sql, params) => {
        // Mock database operations
        if (sql.includes('INSERT OR REPLACE INTO contacts')) {
          const [id] = params;
          mockDatabase.contacts.set(id, params);
          return Promise.resolve([
            {
              rows: { length: 0, item: jest.fn(), raw: jest.fn(() => []) },
              insertId: 1,
              rowsAffected: 1,
            },
          ]);
        }

        if (sql.includes('SELECT * FROM contacts WHERE id = ?')) {
          const [id] = params;
          if (mockDatabase.contacts.has(id)) {
            const contactData = mockDatabase.contacts.get(id);
            const contact = {
              id: contactData[0],
              fields_json: contactData[1],
              source: contactData[2],
              confidence: contactData[3],
              raw_text: contactData[4],
              image_uri: contactData[5],
              created_at: contactData[6],
              updated_at: contactData[7],
              tags_json: contactData[8],
              is_verified: contactData[9],
              needs_review: contactData[10],
              is_favorite: contactData[11],
              last_interaction_at: contactData[12],
              sync_status: contactData[13],
              conflict_data_json: contactData[14],
            };
            return Promise.resolve([
              {
                rows: {
                  length: 1,
                  item: jest.fn(() => contact),
                  raw: jest.fn(() => [contact]),
                },
              },
            ]);
          } else {
            return Promise.resolve([
              {
                rows: { length: 0, item: jest.fn(), raw: jest.fn(() => []) },
              },
            ]);
          }
        }

        if (sql.includes('DELETE FROM contacts WHERE id = ?')) {
          const [id] = params;
          const existed = mockDatabase.contacts.has(id);
          mockDatabase.contacts.delete(id);
          return Promise.resolve([
            {
              rows: { length: 0, item: jest.fn(), raw: jest.fn(() => []) },
              rowsAffected: existed ? 1 : 0,
            },
          ]);
        }

        // Default response for other queries
        return Promise.resolve([
          {
            rows: { length: 0, item: jest.fn(), raw: jest.fn(() => []) },
            insertId: 1,
            rowsAffected: 1,
          },
        ]);
      }),
      close: jest.fn(() => Promise.resolve()),
    })),
  };
});

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getAvailableCameraDevices: jest.fn(() =>
      Promise.resolve([
        {
          id: 'back',
          position: 'back',
          name: 'Back Camera',
          hasFlash: true,
          hasTorch: true,
          isMultiCam: false,
          minFocusDistance: 10,
          supportsDepthCapture: false,
          supportsLowLightBoost: false,
          supportsRawCapture: false,
          supportsFocus: true,
          supportsZoom: true,
        },
      ]),
    ),
    getCameraPermissionStatus: jest.fn(() => Promise.resolve('granted')),
    requestCameraPermission: jest.fn(() => Promise.resolve('granted')),
  },
  useCameraDevices: jest.fn(() => ({
    back: {
      id: 'back',
      position: 'back',
      name: 'Back Camera',
      hasFlash: true,
      hasTorch: true,
    },
  })),
  useFrameProcessor: jest.fn(),
  runOnJS: jest.fn(),
}));

// Mock @react-native-ml-kit/text-recognition
jest.mock('@react-native-ml-kit/text-recognition', () => ({
  TextRecognition: {
    recognize: jest.fn(() =>
      Promise.resolve({
        text: 'John Doe\nSoftware Engineer\njohn@example.com\n+1-555-0123\nAcme Corp\n123 Main St',
        blocks: [
          {
            text: 'John Doe',
            frame: { x: 10, y: 10, width: 100, height: 20 },
            lines: [
              {
                text: 'John Doe',
                frame: { x: 10, y: 10, width: 100, height: 20 },
              },
            ],
            confidence: 0.9,
          },
          {
            text: 'Software Engineer',
            frame: { x: 10, y: 35, width: 120, height: 15 },
            lines: [
              {
                text: 'Software Engineer',
                frame: { x: 10, y: 35, width: 120, height: 15 },
              },
            ],
            confidence: 0.8,
          },
          {
            text: 'john@example.com',
            frame: { x: 10, y: 55, width: 130, height: 15 },
            lines: [
              {
                text: 'john@example.com',
                frame: { x: 10, y: 55, width: 130, height: 15 },
              },
            ],
            confidence: 0.85,
          },
          {
            text: '+1-555-0123',
            frame: { x: 10, y: 75, width: 100, height: 15 },
            lines: [
              {
                text: '+1-555-0123',
                frame: { x: 10, y: 75, width: 100, height: 15 },
              },
            ],
            confidence: 0.75,
          },
          {
            text: 'Acme Corp',
            frame: { x: 10, y: 95, width: 80, height: 15 },
            lines: [
              {
                text: 'Acme Corp',
                frame: { x: 10, y: 95, width: 80, height: 15 },
              },
            ],
            confidence: 0.8,
          },
          {
            text: '123 Main St',
            frame: { x: 10, y: 115, width: 90, height: 15 },
            lines: [
              {
                text: '123 Main St',
                frame: { x: 10, y: 115, width: 90, height: 15 },
              },
            ],
            confidence: 0.7,
          },
        ],
      }),
    ),
  },
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn((options, callback) => {
    callback({
      assets: [
        {
          uri: 'file:///path/to/camera-image.jpg',
          width: 800,
          height: 600,
          fileSize: 50000,
          type: 'image/jpeg',
          fileName: 'camera-image.jpg',
        },
      ],
    });
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    callback({
      assets: [
        {
          uri: 'file:///path/to/library-image.jpg',
          width: 800,
          height: 600,
          fileSize: 50000,
          type: 'image/jpeg',
          fileName: 'library-image.jpg',
        },
      ],
    });
  }),
  ImagePicker: {
    showImagePicker: jest.fn(),
  },
}));

// Mock react-native-image-crop-picker
jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(() =>
    Promise.resolve([
      {
        path: '/path/to/image.jpg',
        width: 800,
        height: 600,
        mime: 'image/jpeg',
        size: 50000,
        modificationDate: '1640995200000',
      },
    ]),
  ),
  openCamera: jest.fn(() =>
    Promise.resolve({
      path: '/path/to/camera-image.jpg',
      width: 800,
      height: 600,
      mime: 'image/jpeg',
      size: 50000,
      modificationDate: '1640995200000',
    }),
  ),
}));

// Mock react-native-background-job
jest.mock('react-native-background-job', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  cancel: jest.fn(),
  isRunning: jest.fn(() => false),
  register: jest.fn(),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    }),
  ),
  addEventListener: jest.fn(callback => {
    callback({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });
    return jest.fn(); // unsubscribe function
  }),
}));

// Mock react-native-contacts
jest.mock('react-native-contacts', () => ({
  getAll: jest.fn(() =>
    Promise.resolve([
      {
        recordID: '1',
        displayName: 'John Doe',
        givenName: 'John',
        familyName: 'Doe',
        emailAddresses: [{ label: 'work', email: 'john@example.com' }],
        phoneNumbers: [{ label: 'mobile', number: '+1-555-0123' }],
        company: 'Acme Corp',
        jobTitle: 'Software Engineer',
      },
    ]),
  ),
  getContactById: jest.fn(id =>
    Promise.resolve({
      recordID: id,
      displayName: 'John Doe',
      givenName: 'John',
      familyName: 'Doe',
      emailAddresses: [{ label: 'work', email: 'john@example.com' }],
      phoneNumbers: [{ label: 'mobile', number: '+1-555-0123' }],
    }),
  ),
  addContact: jest.fn(() => Promise.resolve()),
  updateContact: jest.fn(() => Promise.resolve()),
  deleteContact: jest.fn(() => Promise.resolve()),
  getPermission: jest.fn(() => Promise.resolve('authorized')),
  requestPermission: jest.fn(() => Promise.resolve('authorized')),
}));

// Mock the entire tokenStorage module to prevent instantiation issues
jest.mock('../../src/services/tokenStorage', () => {
  const mockTokenStorage = {
    setTokens: jest.fn(),
    getTokens: jest.fn(),
    removeTokens: jest.fn(),
    clearAll: jest.fn(),
    hasValidTokens: jest.fn(() => Promise.resolve(false)),
    updateAccessToken: jest.fn(),
    getStorageInfo: jest.fn(() => ({
      hasAccessToken: false,
      hasRefreshToken: false,
      hasEncryptionKey: false,
      storageSize: 0,
    })),
  };

  return {
    SecureTokenStorage: jest.fn(() => mockTokenStorage),
    tokenStorage: mockTokenStorage,
    createTokenStorage: jest.fn(() => mockTokenStorage),
  };
});

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(() => 'test-id'),
    getState: jest.fn(),
    getParent: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
  }),
  useRoute: () => ({
    key: 'test-route',
    name: 'TestScreen',
    params: {},
    path: undefined,
  }),
  useFocusEffect: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  State: {
    BEGAN: 'BEGAN',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    SUCCEEDED: 'SUCCEEDED',
    END: 'END',
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    ScrollView: 'Animated.ScrollView',
    createAnimatedComponent: jest.fn(),
    Value: jest.fn(),
    timing: jest.fn(),
    spring: jest.fn(),
    parallel: jest.fn(),
    sequence: jest.fn(),
    stagger: jest.fn(),
    interpolate: jest.fn(),
  },
  Easing: {
    linear: jest.fn(),
    ease: jest.fn(),
    quad: jest.fn(),
    cubic: jest.fn(),
  },
  Extrapolate: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity',
  },
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({
        user: {
          id: 'test-id',
          name: 'Test User',
          email: 'test@example.com',
          photo: null,
        },
      }),
    ),
    signInSilently: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    revokeAccess: jest.fn(() => Promise.resolve()),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
    getTokens: jest.fn(() =>
      Promise.resolve({
        accessToken: 'test-access-token',
        idToken: 'test-id-token',
      }),
    ),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Mock LinkedIn
jest.mock('react-native-linkedin', () => ({
  LinkedInModal: 'LinkedInModal',
}));

// Global fetch mock
global.fetch = jest.fn();

// Global crypto mock for secure random generation
global.crypto = {
  getRandomValues: jest.fn(array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};

// Console warnings suppression for tests
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  // Suppress specific React Native warnings during tests
  console.warn = jest.fn(message => {
    if (
      message.includes('componentWillReceiveProps') ||
      message.includes('componentWillMount') ||
      message.includes('VirtualizedLists should never be nested')
    ) {
      return;
    }
    originalWarn(message);
  });

  console.error = jest.fn(message => {
    if (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: validateDOMNesting')
    ) {
      return;
    }
    originalError(message);
  });
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Test utilities available globally
global.flushPromises = () => new Promise(setImmediate);
global.withTimeout = (promise, timeout = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), timeout),
    ),
  ]);
};

// Mock timers setup
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
