/**
 * Project Setup Verification Tests
 *
 * This test suite validates the fundamental project setup, structure, and configuration
 * for the React Native application. It ensures that all necessary dependencies, files,
 * directories, and configurations are properly in place for development and production.
 *
 * What these tests verify:
 * - Required dependencies installation and availability
 * - Project directory structure and essential files
 * - Environment configuration and variables setup
 * - CI/CD pipeline configuration (GitHub Actions, Fastlane)
 * - Development tools and configuration files
 * - Platform-specific directory structure
 *
 * These tests act as a comprehensive project health check and setup validation.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Project Setup Verification', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  // Test Group: Dependencies Installation
  // Validates that all required npm packages are properly installed
  describe('Dependencies Installation', () => {
    // Test: Required Dependencies Check
    // Verifies that all essential React Native and third-party packages are present
    test('should have all required dependencies installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const requiredDeps = [
        '@react-navigation/native',
        '@react-navigation/stack',
        '@react-navigation/bottom-tabs',
        '@react-navigation/drawer',
        'react-native-paper',
        '@reduxjs/toolkit',
        'react-redux',
        'react-hook-form',
        '@hookform/resolvers',
        'react-native-mmkv',
        'react-native-config',
        'react-native-safe-area-context',
        'react-native-screens',
        'react-native-gesture-handler',
        'react-native-vector-icons',
        'yup',
      ];

      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies[dep]).toBeDefined();
      });
    });

    // Test: Node Modules Directory
    // Checks that node_modules exists indicating successful npm/yarn install
    test('should have node_modules directory', () => {
      const nodeModulesPath = path.join(projectRoot, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
    });

    // Test: Lock File Existence
    // Ensures dependency versions are locked via package-lock.json or yarn.lock
    test('should have package-lock.json or yarn.lock', () => {
      const packageLockPath = path.join(projectRoot, 'package-lock.json');
      const yarnLockPath = path.join(projectRoot, 'yarn.lock');

      expect(
        fs.existsSync(packageLockPath) || fs.existsSync(yarnLockPath),
      ).toBe(true);
    });
  });

  // Test Group: Project Structure
  // Validates essential project files and directory organization
  describe('Project Structure', () => {
    // Test: Configuration Files
    // Checks for all essential config files (package.json, tsconfig, babel, etc.)
    test('should have required configuration files', () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        '.eslintrc.js',
        '.prettierrc.js',
        'babel.config.js',
        'metro.config.js',
        'App.tsx',
        '.env',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    // Test: Source Directory Structure
    // Validates that the src/ directory has proper organization (store, screens, types, utils)
    test('should have source directory structure', () => {
      const requiredDirs = [
        'src/store',
        'src/screens',
        'src/types',
        'src/utils',
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(projectRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    // Test: Platform-Specific Directories
    // Ensures both iOS and Android platform directories exist for native builds
    test('should have platform-specific directories', () => {
      const platformDirs = ['ios', 'android'];

      platformDirs.forEach(dir => {
        const dirPath = path.join(projectRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  // Test Group: Environment Configuration
  // Validates environment setup and configuration management
  describe('Environment Configuration', () => {
    // Test: Environment Variables File
    // Checks that .env exists with required environment variables
    test('should have environment variables file', () => {
      const envPath = path.join(projectRoot, '.env');
      expect(fs.existsSync(envPath)).toBe(true);

      const envContent = fs.readFileSync(envPath, 'utf8');
      expect(envContent).toContain('API_URL');
      expect(envContent).toContain('APP_NAME');
      expect(envContent).toContain('DEBUG_MODE');
    });

    // Test: Environment TypeScript Declarations
    // Verifies that TypeScript declarations exist for environment variables
    test('should have TypeScript declarations for env', () => {
      const envTypesPath = path.join(projectRoot, 'src/types/env.d.ts');
      expect(fs.existsSync(envTypesPath)).toBe(true);
    });
  });

  // Test Group: CI/CD Configuration
  // Validates continuous integration and deployment setup
  describe('CI/CD Configuration', () => {
    // Test: GitHub Actions Workflows
    // Checks for CI/CD workflow files in .github/workflows directory
    test('should have GitHub Actions workflows', () => {
      const workflowsDir = path.join(projectRoot, '.github/workflows');
      expect(fs.existsSync(workflowsDir)).toBe(true);

      const requiredWorkflows = [
        'ci.yml',
        'android-build.yml',
        'ios-build.yml',
        'deploy.yml',
      ];

      requiredWorkflows.forEach(workflow => {
        const workflowPath = path.join(workflowsDir, workflow);
        expect(fs.existsSync(workflowPath)).toBe(true);
      });
    });

    // Test: Fastlane Configuration
    // Verifies that Fastlane automation is configured for both iOS and Android
    test('should have Fastlane configuration', () => {
      const iosFastlanePath = path.join(projectRoot, 'ios/fastlane/Fastfile');
      const androidFastlanePath = path.join(
        projectRoot,
        'android/fastlane/Fastfile',
      );

      expect(fs.existsSync(iosFastlanePath)).toBe(true);
      expect(fs.existsSync(androidFastlanePath)).toBe(true);
    });
  });
});
