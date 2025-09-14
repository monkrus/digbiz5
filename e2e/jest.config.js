/**
 * E2E Jest Configuration for Detox
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  testRegex: '__tests__/e2e/.*\\.(test|spec)\\.(js|ts)$',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['__tests__/e2e/**/*.{ts,js}', '!**/*.d.ts'],
};
