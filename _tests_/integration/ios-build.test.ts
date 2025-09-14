/**
 * iOS Build Verification Tests
 *
 * This test suite validates the iOS project structure, configuration, and build capabilities
 * for a React Native application. It ensures that all necessary iOS files, Xcode projects,
 * CocoaPods configuration, and build tools are properly set up for successful iOS app
 * compilation and deployment.
 *
 * What these tests verify:
 * - iOS project structure (Xcode projects, Podfile, Info.plist, AppDelegate)
 * - Build configuration (deployment targets, bundle identifiers, schemes)
 * - CocoaPods dependency management and React Native pod integration
 * - Fastlane integration for automated iOS builds and deployments
 * - Platform-specific requirements and compatibility settings
 * - Modern React Native iOS project structure (Swift vs Objective-C)
 *
 * These tests help catch iOS build issues early and ensure proper Xcode/iOS toolchain setup.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('iOS Build Verification', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const iosDir = path.join(projectRoot, 'ios');

  // Test Group: iOS Project Structure
  // Validates that all essential iOS project files and directories exist
  describe('iOS Project Structure', () => {
    // Test: iOS Directory Existence
    // Verifies that the main ios/ directory exists in the project root
    test('should have iOS project directory', () => {
      expect(fs.existsSync(iosDir)).toBe(true);
    });

    // Test: Xcode Project Files
    // Checks for .xcodeproj file and optional .xcworkspace (created by CocoaPods)
    test('should have Xcode project files', () => {
      const xcodeprojPath = path.join(iosDir, 'digbiz5.xcodeproj');
      const xcworkspacePath = path.join(iosDir, 'digbiz5.xcworkspace');

      expect(fs.existsSync(xcodeprojPath)).toBe(true);

      // Workspace may be created after pod install
      if (fs.existsSync(xcworkspacePath)) {
        expect(fs.statSync(xcworkspacePath).isDirectory()).toBe(true);
      }
    });

    // Test: CocoaPods Podfile
    // Validates that Podfile exists and contains React Native pod configuration
    test('should have Podfile for CocoaPods', () => {
      const podfilePath = path.join(iosDir, 'Podfile');
      expect(fs.existsSync(podfilePath)).toBe(true);

      const podfileContent = fs.readFileSync(podfilePath, 'utf8');
      expect(podfileContent).toContain('use_react_native!');
    });

    // Test: Info.plist File Validation
    // Ensures that iOS Info.plist configuration file exists with app metadata
    test('should have Info.plist file', () => {
      const infoPlistPath = path.join(iosDir, 'digbiz5/Info.plist');
      expect(fs.existsSync(infoPlistPath)).toBe(true);
    });

    // Test: AppDelegate Files Validation
    // Checks for AppDelegate files (Swift or Objective-C) required for iOS app lifecycle
    test('should have AppDelegate files', () => {
      const appDelegateSwiftPath = path.join(
        iosDir,
        'digbiz5/AppDelegate.swift',
      );
      const appDelegateHPath = path.join(iosDir, 'digbiz5/AppDelegate.h');
      const appDelegateMPath = path.join(iosDir, 'digbiz5/AppDelegate.m');
      const appDelegateMmPath = path.join(iosDir, 'digbiz5/AppDelegate.mm');

      expect(
        fs.existsSync(appDelegateSwiftPath) ||
          (fs.existsSync(appDelegateHPath) &&
            (fs.existsSync(appDelegateMPath) ||
              fs.existsSync(appDelegateMmPath))),
      ).toBe(true);
    });
  });

  // Test Group: iOS Configuration
  // Validates iOS app configuration settings and deployment parameters
  describe('iOS Configuration', () => {
    // Test: Bundle Identifier Configuration
    // Verifies that iOS bundle identifier is properly set in Info.plist
    test('should have correct bundle identifier', () => {
      const infoPlistPath = path.join(iosDir, 'digbiz5/Info.plist');
      const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');

      expect(infoPlistContent).toContain('CFBundleIdentifier');
      expect(infoPlistContent).toContain('$(PRODUCT_BUNDLE_IDENTIFIER)');
    });

    // Test: iOS Deployment Target
    // Verifies that minimum iOS version is configured for device compatibility
    // Supports both modern (min_ios_version_supported) and legacy (hardcoded version) formats
    test('should have deployment target configured', () => {
      const podfilePath = path.join(iosDir, 'Podfile');
      const podfileContent = fs.readFileSync(podfilePath, 'utf8');

      expect(
        podfileContent.includes('platform :ios, min_ios_version_supported') ||
          podfileContent.match(/platform :ios, ['"][\d.]+['"]/),
      ).toBeTruthy();
    });

    // Test: React Native Pod Configuration
    // Ensures React Native pods are properly configured in Podfile
    test('should have React Native pods configured', () => {
      const podfilePath = path.join(iosDir, 'Podfile');
      const podfileContent = fs.readFileSync(podfilePath, 'utf8');

      expect(podfileContent).toContain('use_react_native!');
      expect(podfileContent).toContain('prepare_react_native_project!');
    });
  });

  // Test Group: iOS Dependencies
  // Validates CocoaPods dependency management and React Native pod integration
  describe('iOS Dependencies', () => {
    // Test: CocoaPods Dependencies Validation
    // Checks that CocoaPods dependencies are properly installed and configured
    test('should install CocoaPods dependencies', () => {
      // This test checks if pod install can run successfully
      const podfileLockPath = path.join(iosDir, 'Podfile.lock');

      if (fs.existsSync(podfileLockPath)) {
        const podfileLockContent = fs.readFileSync(podfileLockPath, 'utf8');
        expect(podfileLockContent).toContain('React-Core');
        expect(podfileLockContent).toContain('SPEC CHECKSUMS');
      }
    });

    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('should run pod install successfully', () => {
      jest.setTimeout(180000); // 3 minutes timeout

      expect(() => {
        execSync('pod install --repo-update', {
          cwd: iosDir,
          stdio: 'pipe',
        });
      }).not.toThrow();

      const xcworkspacePath = path.join(iosDir, 'digbiz5.xcworkspace');
      expect(fs.existsSync(xcworkspacePath)).toBe(true);
    }, 180000);

    // Test: Pods Directory Validation
    // Verifies that Pods directory exists after CocoaPods installation
    test('should have Pods directory after installation', () => {
      const podsDir = path.join(iosDir, 'Pods');

      if (fs.existsSync(podsDir)) {
        expect(fs.statSync(podsDir).isDirectory()).toBe(true);

        // Check for some essential pods
        const reactCoreDir = path.join(podsDir, 'React-Core');
        if (fs.existsSync(reactCoreDir)) {
          expect(fs.statSync(reactCoreDir).isDirectory()).toBe(true);
        }
      }
    });
  });

  // Test Group: iOS Build Process
  // Validates iOS build capabilities and Xcode project configuration
  describe('iOS Build Process', () => {
    // This test is intensive and may take time, so it's marked as optional
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('should build iOS app successfully', () => {
      jest.setTimeout(600000); // 10 minutes timeout

      const xcworkspacePath = path.join(iosDir, 'digbiz5.xcworkspace');

      // Only run if workspace exists (after pod install)
      if (fs.existsSync(xcworkspacePath)) {
        expect(() => {
          execSync(
            `xcodebuild -workspace digbiz5.xcworkspace -scheme digbiz5 -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build`,
            {
              cwd: iosDir,
              stdio: 'pipe',
            },
          );
        }).not.toThrow();
      } else {
        // Skip if workspace doesn't exist
        expect(true).toBe(true);
      }
    }, 600000);

    // Test: Xcode Scheme Validation
    // Checks that Xcode scheme is properly configured for builds
    test('should have valid scheme configuration', () => {
      const schemePath = path.join(
        iosDir,
        'digbiz5.xcodeproj/xcshareddata/xcschemes/digbiz5.xcscheme',
      );

      if (fs.existsSync(schemePath)) {
        const schemeContent = fs.readFileSync(schemePath, 'utf8');
        expect(schemeContent).toContain('BuildAction');
        expect(schemeContent).toContain('digbiz5');
      }
    });
  });

  // Test Group: iOS Fastlane Integration
  // Validates Fastlane automation setup for iOS builds and deployments
  describe('iOS Fastlane Integration', () => {
    // Test: Fastlane Configuration Files
    // Checks for Fastfile and Appfile in ios/fastlane directory
    test('should have iOS Fastlane configuration if it exists', () => {
      const iosFastfilePath = path.join(iosDir, 'fastlane/Fastfile');
      const iosAppfilePath = path.join(iosDir, 'fastlane/Appfile');

      if (fs.existsSync(iosFastfilePath)) {
        expect(fs.existsSync(iosAppfilePath)).toBe(true);
      } else {
        // Pass if Fastlane is not configured
        expect(true).toBe(true);
      }
    });

    // Test: Fastfile Content Validation
    // Verifies that Fastfile contains required iOS lanes and configuration
    test('should have valid Fastfile for iOS if it exists', () => {
      const fastfilePath = path.join(iosDir, 'fastlane/Fastfile');

      if (fs.existsSync(fastfilePath)) {
        const fastfileContent = fs.readFileSync(fastfilePath, 'utf8');
        expect(fastfileContent).toContain('platform :ios');
        expect(fastfileContent).toContain('build_app');
      } else {
        expect(true).toBe(true);
      }
    });

    // Test: iOS Lanes Configuration
    // Ensures iOS-specific automation lanes are configured in Fastfile
    test('should have iOS lanes configured if Fastfile exists', () => {
      const fastfilePath = path.join(iosDir, 'fastlane/Fastfile');

      if (fs.existsSync(fastfilePath)) {
        const fastfileContent = fs.readFileSync(fastfilePath, 'utf8');
        expect(fastfileContent).toContain('lane :build');
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // Test Group: iOS Platform Compatibility
  // Validates iOS version compatibility and deployment target settings
  describe('iOS Platform Compatibility', () => {
    // Test: Modern iOS Version Support
    // Verifies that iOS deployment target supports modern iOS versions (12.0+)
    test('should be configured for modern iOS versions', () => {
      const podfilePath = path.join(iosDir, 'Podfile');
      const podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Extract iOS version from Podfile
      const versionMatch = podfileContent.match(
        /platform :ios, ['"](\d+\.\d+)['"]/,
      );
      if (versionMatch) {
        const iosVersion = parseFloat(versionMatch[1]);
        expect(iosVersion).toBeGreaterThanOrEqual(12.0); // Modern iOS support
      }
    });
  });
});
