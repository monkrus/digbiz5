/* eslint-env jest */
/* eslint-disable */

/**
 * Jest Setup Configuration for React Native Testing
 *
 * This file configures the Jest testing environment for React Native applications.
 * It sets up necessary mocks and polyfills to ensure tests run properly in a Node.js
 * environment while simulating React Native components and APIs.
 *
 * What this setup does:
 * - Imports React Native Gesture Handler test setup for proper gesture mocking
 * - Mocks React Native Reanimated to prevent animation-related test failures
 * - Provides virtual mock for older React Native animation helper modules
 * - Ensures tests can run without actual native mobile environment dependencies
 *
 * This setup is automatically loaded before each test suite runs.
 */

// Import gesture handler setup for proper gesture mocking in tests
import 'react-native-gesture-handler/jestSetup';

// Mock React Native Reanimated to prevent animation-related test failures
// This mock provides a simplified version that works in the test environment
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock for older React Native versions - provides virtual module for animation helper
// This prevents "Cannot find module" errors in test environments
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});

// Mock InteractionManager to prevent cleanup errors after Jest teardown
// This fixes React Navigation animation cleanup issues in tests
const InteractionManager = require('react-native/Libraries/Interaction/InteractionManager');
InteractionManager.runAfterInteractions = jest.fn(callback => {
  if (callback) callback();
  return { cancel: jest.fn() };
});
InteractionManager.createInteractionHandle = jest.fn(() => 1);
InteractionManager.clearInteractionHandle = jest.fn();
InteractionManager.setDeadline = jest.fn();
