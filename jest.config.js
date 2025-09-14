/**
 * Jest Configuration
 *
 * Comprehensive Jest configuration for React Native with support for
 * unit tests, integration tests, and component testing.
 */

module.exports = {
  preset: 'react-native',

  // Test environment
  testEnvironment: 'node',

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/_tests_/**/*.test.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/__tests__/setup/',
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/_tests_/setup.js',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module name mapping for React Native modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/__tests__/$1',
    '^react-native-image-picker$':
      '<rootDir>/__tests__/mocks/react-native-image-picker.js',
    '^react-native-image-crop-picker$':
      '<rootDir>/__tests__/mocks/react-native-image-crop-picker.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__tests__/mocks/imageMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/_tests_/setup.js',
    '<rootDir>/__tests__/setup/testSetup.js',
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx,js,jsx}',
    '!src/types/**/*',
    '!src/data/**/*',
    '!src/config/**/*',
  ],

  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    './src/services/': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    './src/store/': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  coverageDirectory: '<rootDir>/coverage',

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Timeout for tests
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Global variables
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
    __DEV__: true,
  },

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  // Transform ignore patterns - updated for comprehensive coverage
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-google-signin|react-clone-referenced-element|@react-native-community|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-paper|react-redux|@reduxjs/toolkit|immer|react-native-mmkv|react-native-permissions|react-native-vector-icons|react-native-linkedin)/)',
  ],

  // Performance monitoring
  maxWorkers: '50%',

  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Error handling
  errorOnDeprecated: true,
};
