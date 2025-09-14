/**
 * Phase 0 Tests: TypeScript Compilation
 *
 * Tests that verify TypeScript compilation works correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Phase 0: TypeScript Compilation', () => {
  const projectRoot = path.resolve(__dirname, '../../..');

  beforeAll(() => {
    process.chdir(projectRoot);
  });

  describe('TypeScript Configuration', () => {
    test('should have valid tsconfig.json', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBeDefined();
      expect(tsconfig.compilerOptions.module).toBeDefined();
    });

    test('should have TypeScript installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    test('should have React Native TypeScript config', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(
        packageJson.devDependencies['@react-native/typescript-config'],
      ).toBeDefined();
    });
  });

  describe('TypeScript Compilation', () => {
    test('should compile without errors using tsc --noEmit', () => {
      try {
        const result = execSync('npx tsc --noEmit', {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
          timeout: 60000,
        });

        expect(true).toBe(true); // If we get here, compilation succeeded
      } catch (error) {
        // If there are TypeScript errors, show them for debugging
        if (error.stdout) {
          console.log('TypeScript compilation output:', error.stdout);
        }
        if (error.stderr) {
          console.log('TypeScript compilation errors:', error.stderr);
        }

        // Fail the test with the error message
        throw new Error(`TypeScript compilation failed: ${error.message}`);
      }
    });

    test('should have correct TypeScript types for React Native', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const requiredTypes = [
        '@types/react',
        '@types/react-test-renderer',
        '@types/jest',
      ];

      requiredTypes.forEach(type => {
        expect(packageJson.devDependencies[type]).toBeDefined();
      });
    });
  });

  describe('TypeScript Files Structure', () => {
    test('should have TypeScript files in src directory', () => {
      const srcPath = path.join(projectRoot, 'src');

      if (fs.existsSync(srcPath)) {
        const findTsFiles = dir => {
          const files = fs.readdirSync(dir, { withFileTypes: true });
          let tsFiles = [];

          for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
              tsFiles = tsFiles.concat(findTsFiles(fullPath));
            } else if (
              file.name.endsWith('.ts') ||
              file.name.endsWith('.tsx')
            ) {
              tsFiles.push(fullPath);
            }
          }

          return tsFiles;
        };

        const tsFiles = findTsFiles(srcPath);
        expect(tsFiles.length).toBeGreaterThan(0);
      }
    });

    test('should have proper TypeScript extensions in main files', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      expect(fs.existsSync(appPath)).toBe(true);

      const appContent = fs.readFileSync(appPath, 'utf8');
      expect(appContent).toMatch(/import.*React/);
    });
  });

  describe('Type Definitions', () => {
    test('should have proper module declarations for React Native', () => {
      // Check if we can compile a simple React Native component
      const testTsContent = `
        import React from 'react';
        import { View, Text } from 'react-native';

        const TestComponent: React.FC = () => {
          return (
            <View>
              <Text>Test</Text>
            </View>
          );
        };

        export default TestComponent;
      `;

      const tempFilePath = path.join(projectRoot, 'temp-test-component.tsx');

      try {
        fs.writeFileSync(tempFilePath, testTsContent);

        // Try to compile the temporary file
        execSync(`npx tsc --noEmit ${tempFilePath}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
          timeout: 30000,
        });

        expect(true).toBe(true); // Compilation succeeded
      } catch (error) {
        throw new Error(
          `TypeScript type definitions test failed: ${error.message}`,
        );
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    test('should support React Native navigation types', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check if navigation libraries are installed
      expect(
        packageJson.dependencies['@react-navigation/native'],
      ).toBeDefined();
      expect(packageJson.dependencies['@react-navigation/stack']).toBeDefined();
    });

    test('should support Redux Toolkit types', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.dependencies['@reduxjs/toolkit']).toBeDefined();
      expect(packageJson.dependencies['react-redux']).toBeDefined();
    });
  });

  describe('TypeScript Build Scripts', () => {
    test('should have typecheck script in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts.typecheck).toBeDefined();
      expect(packageJson.scripts.typecheck).toContain('tsc');
    });

    test('should run typecheck script successfully', () => {
      try {
        execSync('npm run typecheck', {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
          timeout: 60000,
        });

        expect(true).toBe(true); // If we get here, typecheck succeeded
      } catch (error) {
        throw new Error(`npm run typecheck failed: ${error.message}`);
      }
    });
  });
});
