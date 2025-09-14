/**
 * Test Utilities
 *
 * Common utilities, mocks, and helpers for testing across the application.
 */

import { render, RenderOptions } from '@testing-library/react-native';
import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

import authSlice from '../../src/store/authSlice';
import profileSlice from '../../src/store/profileSlice';
import onboardingSlice from '../../src/store/slices/onboardingSlice';
import { RootState } from '../../src/store/store';

// Mock data
export const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  title: 'Software Engineer',
  company: 'Test Company',
  bio: 'Test bio',
  profilePhoto: 'https://example.com/photo.jpg',
  isVerified: false,
  socialLinks: {
    linkedin: 'https://linkedin.com/in/testuser',
    twitter: null,
    github: null,
    instagram: null,
    facebook: null,
  },
  skills: ['React', 'TypeScript', 'Testing'],
  location: 'San Francisco, CA',
  phone: '+1234567890',
  website: 'https://testuser.com',
  isPublic: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockTokens = {
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
  expiresIn: 3600,
  tokenType: 'Bearer' as const,
};

export const mockOnboardingData = {
  userType: 'founder' as const,
  industry: {
    id: 'software',
    name: 'Software & SaaS',
    category: 'technology',
    keywords: ['software', 'saas', 'platform'],
  },
  location: {
    id: 'sf-ca-us',
    city: 'San Francisco',
    country: 'United States',
    timezone: 'America/Los_Angeles',
  },
  timezone: {
    id: 'pst',
    name: 'Pacific Time (PST)',
    offset: '-08:00',
    region: 'North America',
  },
  permissions: {
    contacts: true,
    notifications: true,
    location: false,
    camera: false,
    microphone: false,
  },
  completedSteps: 5,
  isCompleted: true,
};

// Initial test state
export const initialTestState: Partial<RootState> = {
  auth: {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastLoginAt: null,
    loginAttempts: 0,
    isLocked: false,
    lockUntil: null,
  },
  profile: {
    profiles: {},
    currentProfile: null,
    isLoading: false,
    error: null,
    uploadProgress: 0,
    lastUpdated: null,
  },
  onboarding: {
    userType: null,
    industry: null,
    location: null,
    timezone: null,
    permissions: {
      contacts: false,
      notifications: false,
      location: false,
      camera: false,
      microphone: false,
    },
    completedSteps: 0,
    isCompleted: false,
    isLoading: false,
    error: null,
    hasCompletedOnboarding: false,
    currentStep: 0,
  },
};

// Create test store
export const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      profile: profileSlice,
      onboarding: onboardingSlice,
    },
    preloadedState: preloadedState || initialTestState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for testing
      }),
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
  withNavigation?: boolean;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    withNavigation = false,
    ...renderOptions
  }: CustomRenderOptions = {},
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    const WrappedChildren = <Provider store={store}>{children}</Provider>;

    if (withNavigation) {
      return <NavigationContainer>{WrappedChildren}</NavigationContainer>;
    }

    return WrappedChildren;
  };

  return {
    store,
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
  };
};

// Mock async storage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Mock MMKV storage
export const mockMMKV = {
  set: jest.fn(),
  getString: jest.fn(),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  contains: jest.fn(),
  delete: jest.fn(),
  clearAll: jest.fn(),
  size: 0,
};

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response);
};

export const mockFetchError = (message = 'Network error') => {
  return Promise.reject(new Error(message));
};

// Mock permissions
export const mockPermissions = {
  check: jest.fn(),
  request: jest.fn(),
  requestMultiple: jest.fn(),
  openSettings: jest.fn(),
};

// Mock image picker
export const mockImagePicker = {
  pickImage: jest.fn(),
  validateImage: jest.fn(),
  compressImage: jest.fn(),
};

// Mock navigation
export const mockNavigation = {
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
};

// Mock route
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
  path: undefined,
};

// Helper functions for test assertions
export const waitForAsyncActions = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

export const flushPromises = () => {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
};

// Mock crypto for secure storage tests
export const mockCrypto = {
  getRandomValues: jest.fn(array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};

// Mock CryptoJS
export const mockCryptoJS = {
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
};

// Test data generators
export const generateTestUser = (overrides: Partial<typeof mockUser> = {}) => {
  return { ...mockUser, ...overrides };
};

export const generateTestTokens = (
  overrides: Partial<typeof mockTokens> = {},
) => {
  return { ...mockTokens, ...overrides };
};

// Mock alert
export const mockAlert = {
  alert: jest.fn(),
};

// Setup and teardown helpers
export const setupMocks = () => {
  // Reset all mocks
  jest.clearAllMocks();

  // Setup default mock implementations
  global.fetch = jest.fn();
  global.crypto = mockCrypto as any;

  // Mock timers
  jest.useFakeTimers();
};

export const teardownMocks = () => {
  jest.useRealTimers();
  jest.restoreAllMocks();
};

// Custom matchers for better assertions
export const customMatchers = {
  toBeAuthenticatedUser: (received: any) => {
    const pass =
      received && received.isAuthenticated && received.user && received.tokens;
    return {
      message: () => `expected user to be authenticated`,
      pass,
    };
  },

  toHaveValidTokens: (received: any) => {
    const pass =
      received &&
      received.accessToken &&
      received.refreshToken &&
      received.expiresIn > 0;
    return {
      message: () => `expected tokens to be valid`,
      pass,
    };
  },

  toBeValidProfile: (received: any) => {
    const pass = received && received.name && received.email && received.title;
    return {
      message: () => `expected profile to be valid`,
      pass,
    };
  },
};

// Test timeout helper
export const withTimeout = (promise: Promise<any>, timeout = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), timeout),
    ),
  ]);
};
