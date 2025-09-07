/**
 * Android Build Verification Tests
 *
 * This test suite validates the Android project structure, configuration, and build capabilities
 * for a React Native application. It ensures that all necessary Android files, configurations,
 * and build tools are properly set up for successful Android app compilation and deployment.
 *
 * What these tests verify:
 * - Android project structure (gradle files, manifests, activities)
 * - Build configuration (SDK versions, package names, dependencies)
 * - Build process capabilities (gradle wrapper, build tools)
 * - Fastlane integration for automated builds and deployments
 * - Platform-specific requirements and compatibility settings
 *
 * These tests help catch Android build issues early in the development cycle.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Android Build Verification', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const androidDir = path.join(projectRoot, 'android');

  // Test Group: Android Project Structure
  // Validates that all essential Android project files and directories exist
  describe('Android Project Structure', () => {
    // Test: Android Directory Existence
    // Verifies that the main android/ directory exists in the project root
    test('should have Android project directory', () => {
      expect(fs.existsSync(androidDir)).toBe(true);
    });

    // Test: Gradle Build Files
    // Checks for both root-level and app-level build.gradle files required for Android builds
    test('should have build.gradle files', () => {
      const rootBuildGradlePath = path.join(androidDir, 'build.gradle');
      const appBuildGradlePath = path.join(androidDir, 'app/build.gradle');

      expect(fs.existsSync(rootBuildGradlePath)).toBe(true);
      expect(fs.existsSync(appBuildGradlePath)).toBe(true);
    });

    // Test: Gradle Wrapper
    // Validates that Gradle wrapper scripts and properties exist for consistent builds across environments
    test('should have gradle wrapper', () => {
      const gradlewPath = path.join(androidDir, 'gradlew');
      const gradlewBatPath = path.join(androidDir, 'gradlew.bat');
      const gradleWrapperPath = path.join(
        androidDir,
        'gradle/wrapper/gradle-wrapper.properties',
      );

      expect(fs.existsSync(gradlewPath) || fs.existsSync(gradlewBatPath)).toBe(
        true,
      );
      expect(fs.existsSync(gradleWrapperPath)).toBe(true);
    });

    // Test: Android Manifest
    // Ensures the AndroidManifest.xml file exists with app configuration and permissions
    test('should have AndroidManifest.xml', () => {
      const manifestPath = path.join(
        androidDir,
        'app/src/main/AndroidManifest.xml',
      );
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    // Test: Main Activity Class
    // Verifies that the main activity exists in either Java or Kotlin format
    test('should have MainActivity.java or MainActivity.kt', () => {
      const javaActivityPath = path.join(
        androidDir,
        'app/src/main/java/com/digbiz5/MainActivity.java',
      );
      const kotlinActivityPath = path.join(
        androidDir,
        'app/src/main/java/com/digbiz5/MainActivity.kt',
      );

      expect(
        fs.existsSync(javaActivityPath) || fs.existsSync(kotlinActivityPath),
      ).toBe(true);
    });
  });

  // Test Group: Android Configuration
  // Validates Android app configuration settings and dependencies
  describe('Android Configuration', () => {
    // Test: Package Name Configuration
    // Checks that the app package name is properly configured in build.gradle
    test('should have correct package name in build.gradle', () => {
      const appBuildGradlePath = path.join(androidDir, 'app/build.gradle');
      const buildGradleContent = fs.readFileSync(appBuildGradlePath, 'utf8');

      expect(buildGradleContent).toContain('applicationId');
      expect(buildGradleContent).toContain('com.digbiz5');
    });

    // Test: Minimum SDK Version
    // Verifies that minSdkVersion is configured for proper device compatibility
    test('should have minimum SDK version configured', () => {
      const appBuildGradlePath = path.join(androidDir, 'app/build.gradle');
      const buildGradleContent = fs.readFileSync(appBuildGradlePath, 'utf8');

      expect(buildGradleContent).toContain('minSdkVersion');
      expect(buildGradleContent).toContain('targetSdkVersion');
      expect(buildGradleContent).toContain('compileSdkVersion');
    });

    // Test: React Native Dependencies
    // Ensures React Native Android dependencies are properly configured
    test('should have React Native dependencies', () => {
      const settingsGradlePath = path.join(androidDir, 'settings.gradle');

      if (fs.existsSync(settingsGradlePath)) {
        const settingsContent = fs.readFileSync(settingsGradlePath, 'utf8');
        expect(settingsContent).toContain('react-native');
      }
    });
  });

  // Test Group: Android Build Process
  // Validates build tools and processes for successful Android compilation
  describe('Android Build Process', () => {
    // Test: Debug APK Build (Skipped - Resource Intensive)
    // This test would run './gradlew assembleDebug' to create a debug APK
    // Skipped by default as it requires full Android SDK and takes significant time
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('should build debug APK successfully', () => {
      jest.setTimeout(300000); // 5 minutes timeout

      expect(() => {
        execSync('./gradlew assembleDebug', {
          cwd: androidDir,
          stdio: 'pipe',
        });
      }).not.toThrow();

      const apkPath = path.join(
        androidDir,
        'app/build/outputs/apk/debug/app-debug.apk',
      );
      expect(fs.existsSync(apkPath)).toBe(true);
    }, 300000);

    // Test: Gradle Wrapper File Validation
    // Checks that gradlew script exists (permissions may vary in CI environments)
    test('should have gradlew script file', () => {
      const gradlewPath = path.join(androidDir, 'gradlew');
      const gradlewBatPath = path.join(androidDir, 'gradlew.bat');

      // Either Unix gradlew or Windows gradlew.bat should exist
      expect(fs.existsSync(gradlewPath) || fs.existsSync(gradlewBatPath)).toBe(
        true,
      );

      // If gradlew exists on Unix, it should be a file (not directory)
      if (fs.existsSync(gradlewPath)) {
        expect(fs.statSync(gradlewPath).isFile()).toBe(true);
      }
    });

    // Test: Gradle Wrapper Integrity
    // Validates that Gradle wrapper properties contain valid configuration
    test('should validate Gradle wrapper integrity', () => {
      const gradleWrapperPropsPath = path.join(
        androidDir,
        'gradle/wrapper/gradle-wrapper.properties',
      );
      const wrapperProps = fs.readFileSync(gradleWrapperPropsPath, 'utf8');

      expect(wrapperProps).toContain('distributionUrl');
      expect(wrapperProps).toContain('gradle');
    });
  });

  // Test Group: Android Fastlane Integration
  // Validates Fastlane setup for automated Android builds and deployments
  describe('Android Fastlane Integration', () => {
    // Test: Fastlane Configuration Files
    // Checks for Fastfile and Appfile in android/fastlane directory
    test('should have Android Fastlane configuration', () => {
      const androidFastfilePath = path.join(androidDir, 'fastlane/Fastfile');
      const androidAppfilePath = path.join(androidDir, 'fastlane/Appfile');

      expect(fs.existsSync(androidFastfilePath)).toBe(true);
      expect(fs.existsSync(androidAppfilePath)).toBe(true);
    });

    // Test: Fastfile Content Validation
    // Verifies that Fastfile contains required Android lanes and configuration
    test('should have valid Fastfile for Android', () => {
      const fastfilePath = path.join(androidDir, 'fastlane/Fastfile');
      const fastfileContent = fs.readFileSync(fastfilePath, 'utf8');

      expect(fastfileContent).toContain('platform :android');
      expect(fastfileContent).toContain('gradle');
      expect(fastfileContent).toContain('assembleDebug');
    });
  });
});
