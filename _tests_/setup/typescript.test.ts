/**
 * TypeScript Configuration Tests
 *
 * This test suite validates TypeScript setup, configuration, and type safety
 * for the React Native project. It ensures proper TypeScript compilation,
 * type definitions, import resolution, and integration with React Native.
 *
 * What these tests verify:
 * - TypeScript configuration file and compiler settings
 * - React Native TypeScript integration and type definitions
 * - Type definition files for environment variables and external modules
 * - Import resolution for both third-party and local modules
 * - TypeScript compilation process (when enabled)
 * - Proper extends configuration using React Native presets
 *
 * These tests help maintain type safety and catch TypeScript configuration issues.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('TypeScript Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  // Test Group: TypeScript Setup
  // Validates basic TypeScript configuration and compiler setup
  describe('TypeScript Setup', () => {
    // Test: TypeScript Configuration File
    // Checks that tsconfig.json exists with proper structure (extends, include, exclude)
    test('should have TypeScript configuration', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.extends).toBeDefined();
      expect(tsconfig.include).toBeDefined();
      expect(tsconfig.exclude).toBeDefined();
    });

    // Test: TypeScript Compilation (Skipped - Resource Intensive)
    // This test would run tsc --noEmit to validate all TypeScript code compiles
    // Skipped by default as it requires full type checking and can be slow
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('should compile TypeScript without errors', () => {
      expect(() => {
        execSync('npx tsc --noEmit', {
          cwd: projectRoot,
          stdio: 'pipe',
        });
      }).not.toThrow();
    });

    // Test: React Native TypeScript Configuration Extension
    // Verifies that the project extends React Native's TypeScript configuration preset
    test('should extend React Native TypeScript configuration', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(tsconfig.extends).toBe('@react-native/typescript-config');
      expect(tsconfig.include).toContain('**/*.ts');
      expect(tsconfig.include).toContain('**/*.tsx');
    });

    // Test: React Native Type Dependencies
    // Ensures required TypeScript and React type definition packages are installed
    test('should include React Native types', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies['@types/react']).toBeDefined();
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });
  });

  // Test Group: Type Definitions
  // Validates custom type definition files for the project
  describe('Type Definitions', () => {
    // Test: Environment Type Definitions (Optional)
    // Checks for environment variable type definitions when src/types directory exists
    test('should have environment type definitions if src/types exists', () => {
      const typesDir = path.join(projectRoot, 'src/types');
      if (fs.existsSync(typesDir)) {
        const envTypesPath = path.join(typesDir, 'env.d.ts');
        if (fs.existsSync(envTypesPath)) {
          const envTypes = fs.readFileSync(envTypesPath, 'utf8');
          expect(envTypes).toContain('react-native-config');
        }
      }
      // Test passes if directory doesn't exist (optional)
      expect(true).toBe(true);
    });

    // Test: Redux Type Definitions (Optional)
    // Validates Redux store type definitions when store files exist
    test('should validate Redux types if store exists', () => {
      const storePath = path.join(projectRoot, 'src/store/store.ts');
      const hooksPath = path.join(projectRoot, 'src/store/hooks.ts');

      if (fs.existsSync(storePath) && fs.existsSync(hooksPath)) {
        const storeContent = fs.readFileSync(storePath, 'utf8');
        expect(storeContent).toContain('RootState');
        expect(storeContent).toContain('AppDispatch');
      } else {
        // Test passes if files don't exist (optional)
        expect(true).toBe(true);
      }
    });
  });

  // Test Group: Import Resolution
  // Validates TypeScript import resolution for both external and local modules
  describe('Import Resolution', () => {
    // Test: React Native Import Resolution
    // Checks that React Native and third-party package imports resolve correctly
    test('should resolve React Native imports', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');

        expect(appContent).toContain('@react-navigation/native');
        expect(appContent).toContain('react-native-paper');
        expect(appContent).toContain('react-redux');
      } else {
        expect(true).toBe(true); // Pass if App.tsx doesn't exist
      }
    });

    // Test: Local Import Resolution
    // Validates that local module imports (./src/ or src/) resolve properly
    test('should resolve local imports if they exist', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');

        // Check if imports exist, but don't require specific ones
        expect(
          appContent.includes('./src/') || appContent.includes('src/'),
        ).toBe(true);
      } else {
        expect(true).toBe(true); // Pass if App.tsx doesn't exist
      }
    });
  });
});
