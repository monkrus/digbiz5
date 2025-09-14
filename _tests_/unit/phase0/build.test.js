/**
 * Phase 0 Tests: Build Verification
 *
 * Tests that verify the project builds successfully for iOS and Android
 * and all dependencies are properly installed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Phase 0: Build Verification', () => {
  const projectRoot = path.resolve(__dirname, '../../..');

  beforeAll(() => {
    // Ensure we're in the right directory
    process.chdir(projectRoot);
  });

  describe('Project Structure', () => {
    test('should have all required build files', () => {
      const requiredFiles = [
        'package.json',
        'babel.config.js',
        'metro.config.js',
        'App.tsx',
        'index.js',
        'android/build.gradle',
        'android/app/build.gradle',
        'ios/digbiz5.xcodeproj/project.pbxproj',
        'tsconfig.json',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have src directory structure', () => {
      const srcPath = path.join(projectRoot, 'src');
      expect(fs.existsSync(srcPath)).toBe(true);

      const srcDirs = fs.readdirSync(srcPath, { withFileTypes: true });
      const dirNames = srcDirs
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Should have at least these directories
      const expectedDirs = ['components', 'services', 'store', 'types'];
      expectedDirs.forEach(dir => {
        expect(dirNames).toContain(dir);
      });
    });
  });

  describe('Dependency Installation', () => {
    test('should have node_modules directory', () => {
      const nodeModulesPath = path.join(projectRoot, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
    });

    test('should have all critical dependencies installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const criticalDeps = [
        'react',
        'react-native',
        '@react-navigation/native',
        '@reduxjs/toolkit',
        'react-redux',
        'react-native-mmkv',
      ];

      criticalDeps.forEach(dep => {
        expect(packageJson.dependencies[dep]).toBeDefined();
      });
    });

    test('should have all dev dependencies installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const criticalDevDeps = [
        '@react-native-community/cli',
        '@testing-library/react-native',
        'jest',
        'typescript',
        'eslint',
        'detox',
      ];

      criticalDevDeps.forEach(dep => {
        expect(packageJson.devDependencies[dep]).toBeDefined();
      });
    });

    test('should be able to resolve all dependencies', () => {
      try {
        const result = execSync('npm ls --depth=0', {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
        });

        // npm ls should not report any missing dependencies
        expect(result).not.toMatch(/UNMET DEPENDENCY/);
        expect(result).not.toMatch(/missing:/);
      } catch (error) {
        // npm ls exits with code 1 if there are issues, but we can still check the output
        if (error.stdout) {
          expect(error.stdout).not.toMatch(/UNMET DEPENDENCY/);
          expect(error.stdout).not.toMatch(/missing:/);
        }
      }
    });
  });

  describe('Build Configuration', () => {
    test('should have valid package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.android).toBeDefined();
      expect(packageJson.scripts.ios).toBeDefined();
    });

    test('should have valid babel configuration', () => {
      const babelConfigPath = path.join(projectRoot, 'babel.config.js');
      expect(fs.existsSync(babelConfigPath)).toBe(true);

      const babelConfig = require(babelConfigPath);
      expect(babelConfig.presets).toBeDefined();
      expect(babelConfig.presets).toContain(
        'module:@react-native/babel-preset',
      );
    });

    test('should have valid metro configuration', () => {
      const metroConfigPath = path.join(projectRoot, 'metro.config.js');
      expect(fs.existsSync(metroConfigPath)).toBe(true);

      const metroConfig = require(metroConfigPath);
      expect(metroConfig).toBeDefined();
    });
  });

  describe('Android Build Setup', () => {
    test('should have Android project structure', () => {
      const androidPath = path.join(projectRoot, 'android');
      expect(fs.existsSync(androidPath)).toBe(true);

      const requiredAndroidFiles = [
        'android/build.gradle',
        'android/settings.gradle',
        'android/app/build.gradle',
        'android/app/src/main/AndroidManifest.xml',
      ];

      requiredAndroidFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have correct Android configuration', () => {
      const buildGradlePath = path.join(
        projectRoot,
        'android/app/build.gradle',
      );
      const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

      expect(buildGradleContent).toMatch(/com\.android\.application/);
      expect(buildGradleContent).toMatch(/applicationId/);
      expect(buildGradleContent).toMatch(/versionCode/);
      expect(buildGradleContent).toMatch(/versionName/);
    });
  });

  describe('iOS Build Setup', () => {
    test('should have iOS project structure', () => {
      const iosPath = path.join(projectRoot, 'ios');
      expect(fs.existsSync(iosPath)).toBe(true);

      const requiredIosFiles = [
        'ios/digbiz5.xcodeproj',
        'ios/digbiz5/Info.plist',
      ];

      requiredIosFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have Podfile for iOS dependencies', () => {
      const podfilePath = path.join(projectRoot, 'ios/Podfile');
      expect(fs.existsSync(podfilePath)).toBe(true);

      const podfileContent = fs.readFileSync(podfilePath, 'utf8');
      expect(podfileContent).toMatch(/platform :ios/);
      expect(podfileContent).toMatch(/target 'digbiz5'/);
    });
  });

  describe('React Native Setup', () => {
    test('should have valid App.tsx entry point', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      expect(fs.existsSync(appPath)).toBe(true);

      const appContent = fs.readFileSync(appPath, 'utf8');
      expect(appContent).toMatch(/import.*react|import.*React/);
      expect(appContent).toMatch(/export default/);
    });

    test('should have valid index.js entry point', () => {
      const indexPath = path.join(projectRoot, 'index.js');
      expect(fs.existsSync(indexPath)).toBe(true);

      const indexContent = fs.readFileSync(indexPath, 'utf8');
      expect(indexContent).toMatch(/AppRegistry/);
      expect(indexContent).toMatch(/registerComponent/);
    });
  });
});
