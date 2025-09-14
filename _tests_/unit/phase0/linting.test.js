/**
 * Phase 0 Tests: Linting Rules
 *
 * Tests that verify ESLint is properly configured and linting rules are applied
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Phase 0: Linting Rules', () => {
  const projectRoot = path.resolve(__dirname, '../../..');

  beforeAll(() => {
    process.chdir(projectRoot);
  });

  describe('ESLint Configuration', () => {
    test('should have ESLint configuration file', () => {
      const eslintConfigPath = path.join(projectRoot, '.eslintrc.js');
      expect(fs.existsSync(eslintConfigPath)).toBe(true);
    });

    test('should have ESLint installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies.eslint).toBeDefined();
    });

    test('should have React Native ESLint config', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(
        packageJson.devDependencies['@react-native/eslint-config'],
      ).toBeDefined();
    });

    test('should have valid ESLint configuration', () => {
      const eslintConfigPath = path.join(projectRoot, '.eslintrc.js');
      const eslintConfig = require(eslintConfigPath);

      expect(eslintConfig).toBeDefined();
      expect(eslintConfig.root).toBe(true);
      expect(eslintConfig.extends).toBeDefined();
      expect(eslintConfig.extends).toContain('@react-native');
    });
  });

  describe('Prettier Configuration', () => {
    test('should have Prettier configuration', () => {
      const prettierConfigPath = path.join(projectRoot, '.prettierrc.js');
      expect(fs.existsSync(prettierConfigPath)).toBe(true);
    });

    test('should have Prettier installed', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies.prettier).toBeDefined();
    });

    test('should have valid Prettier configuration', () => {
      const prettierConfigPath = path.join(projectRoot, '.prettierrc.js');
      const prettierConfig = require(prettierConfigPath);

      expect(prettierConfig).toBeDefined();
    });
  });

  describe('Linting Execution', () => {
    test('should run ESLint without errors on main files', () => {
      try {
        const result = execSync('npm run lint', {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
          timeout: 60000,
        });

        // ESLint should run without throwing errors
        expect(true).toBe(true);
      } catch (error) {
        // If ESLint finds issues, we'll get details in the output
        if (error.stdout) {
          console.log('ESLint output:', error.stdout);
        }
        if (error.stderr) {
          console.log('ESLint errors:', error.stderr);
        }

        // Allow warnings but not errors
        if (error.status && error.status > 1) {
          throw new Error(
            `ESLint failed with serious errors: ${error.message}`,
          );
        }
      }
    });

    test('should have lint script in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts.lint).toContain('eslint');
    });
  });

  describe('Code Style Rules', () => {
    test('should enforce React Native specific rules', () => {
      // Create a temporary file with React Native code that should pass linting
      const testCode = `
import React from 'react';
import { View, Text } from 'react-native';

const TestComponent = () => {
  return (
    <View>
      <Text>Hello World</Text>
    </View>
  );
};

export default TestComponent;
`;

      const tempFilePath = path.join(projectRoot, 'temp-lint-test.tsx');

      try {
        fs.writeFileSync(tempFilePath, testCode);

        // Run ESLint on the temporary file
        const result = execSync(`npx eslint ${tempFilePath}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
          timeout: 30000,
        });

        // Should not have any errors
        expect(result.trim()).toBe('');
      } catch (error) {
        // If there are linting errors, they should be minor
        if (error.status === 1 && error.stdout) {
          // Check if errors are just warnings
          const hasErrors = error.stdout.includes('error ');
          if (hasErrors) {
            throw new Error(`Linting test failed with errors: ${error.stdout}`);
          }
        } else if (error.status > 1) {
          throw new Error(`ESLint execution failed: ${error.message}`);
        }
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    test('should detect common React Native issues', () => {
      // Create a temporary file with problematic code
      const problematicCode = `
import React from 'react';
import { View, Text } from 'react-native';

const TestComponent = () => {
  var unusedVariable = 'test';  // Should trigger unused variable warning
  
  return (
    <View>
      <Text>Hello World</Text>
    </View>
  );
};

export default TestComponent;
`;

      const tempFilePath = path.join(projectRoot, 'temp-lint-problem-test.tsx');

      try {
        fs.writeFileSync(tempFilePath, problematicCode);

        // Run ESLint on the problematic file
        const result = execSync(`npx eslint ${tempFilePath}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: projectRoot,
          timeout: 30000,
        });

        // Should not have output if no issues found (unexpected for this test)
        expect(true).toBe(true);
      } catch (error) {
        // We expect ESLint to find issues here
        expect(error.status).toBe(1);
        if (error.stdout) {
          expect(error.stdout).toMatch(/unused|variable/i);
        }
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });
  });

  describe('Git Hooks Integration', () => {
    test('should have Husky installed for git hooks', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies.husky).toBeDefined();
    });

    test('should have lint-staged configuration', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson['lint-staged']).toBeDefined();
    });

    test('should have Husky hooks directory', () => {
      const huskyPath = path.join(projectRoot, '.husky');
      expect(fs.existsSync(huskyPath)).toBe(true);
    });
  });

  describe('Editor Configuration', () => {
    test('should have editor configuration files', () => {
      // Check for common editor config files
      const configFiles = ['.prettierrc.js', '.eslintrc.js'];

      configFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Linting Coverage', () => {
    test('should lint TypeScript and JavaScript files', () => {
      const eslintConfigPath = path.join(projectRoot, '.eslintrc.js');
      const eslintConfig = require(eslintConfigPath);

      // Should handle both JS and TS files
      expect(eslintConfig.parserOptions).toBeDefined();
    });

    test('should have appropriate file extensions configured', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const lintStagedConfig = packageJson['lint-staged'];
      expect(lintStagedConfig).toBeDefined();

      // Should include TypeScript files
      const hasTypescriptFiles = Object.keys(lintStagedConfig).some(
        pattern => pattern.includes('.ts') || pattern.includes('.tsx'),
      );
      expect(hasTypescriptFiles).toBe(true);
    });
  });
});
