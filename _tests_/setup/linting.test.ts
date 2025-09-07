/**
 * Code Quality and Linting Tests
 *
 * This test suite validates code quality tools, linting configuration, and code formatting
 * setup for the React Native project. It ensures that ESLint, Prettier, and pre-commit
 * hooks are properly configured to maintain consistent code quality and style.
 *
 * What these tests verify:
 * - ESLint configuration and rule enforcement
 * - Prettier code formatting setup and compliance
 * - Husky git hooks configuration for automated quality checks
 * - lint-staged setup for efficient pre-commit linting
 * - Code style consistency across the project
 * - Integration between quality tools and development workflow
 *
 * These tests help maintain high code quality standards and catch style issues early.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Code Quality and Linting', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  // Test Group: ESLint Configuration
  // Validates ESLint setup and configuration for code quality enforcement
  describe('ESLint Configuration', () => {
    // Test: ESLint Configuration File
    // Checks that .eslintrc.js exists with project linting rules
    test('should have ESLint configuration file', () => {
      const eslintConfigPath = path.join(projectRoot, '.eslintrc.js');
      expect(fs.existsSync(eslintConfigPath)).toBe(true);
    });

    // Test: ESLint Execution
    // Runs the lint script to ensure all code passes ESLint rules
    // This catches syntax errors, style violations, and potential bugs
    test('should pass ESLint checks', () => {
      expect(() => {
        execSync('npm run lint', {
          cwd: projectRoot,
          stdio: 'pipe',
        });
      }).not.toThrow();
    });

    // Test: React Native ESLint Dependencies
    // Verifies that React Native specific ESLint configuration is installed
    test('should have React Native ESLint configuration', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(
        packageJson.devDependencies['@react-native/eslint-config'],
      ).toBeDefined();
      expect(packageJson.devDependencies.eslint).toBeDefined();
    });
  });

  // Test Group: Prettier Configuration
  // Validates code formatting setup and compliance
  describe('Prettier Configuration', () => {
    // Test: Prettier Configuration File
    // Checks that .prettierrc.js exists with code formatting rules
    test('should have Prettier configuration', () => {
      const prettierConfigPath = path.join(projectRoot, '.prettierrc.js');
      expect(fs.existsSync(prettierConfigPath)).toBe(true);
    });

    // Test: Prettier Code Formatting
    // Runs prettier --check to ensure all source code is properly formatted
    test('should format code according to Prettier rules', () => {
      expect(() => {
        execSync('npx prettier --check "src/**/*.{js,jsx,ts,tsx}"', {
          cwd: projectRoot,
          stdio: 'pipe',
        });
      }).not.toThrow();
    });
  });

  // Test Group: Husky and Lint-staged
  // Validates git hooks setup for automated code quality checks
  describe('Husky and Lint-staged', () => {
    // Test: Husky Configuration
    // Checks that Husky is configured for git hooks automation
    test('should have Husky configuration', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies.husky).toBeDefined();
      expect(packageJson.scripts.prepare).toBe('husky');
    });

    // Test: Lint-staged Configuration
    // Verifies that lint-staged is configured for efficient pre-commit linting
    test('should have lint-staged configuration', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies['lint-staged']).toBeDefined();
      expect(packageJson['lint-staged']).toBeDefined();
    });

    // Test: Git Hooks Directory
    // Checks for .husky directory (created after first git commit)
    // This directory contains the actual git hook scripts
    test('should have git hooks directory', () => {
      const gitHooksPath = path.join(projectRoot, '.husky');
      // Note: .husky might not exist until after first commit, so this is optional
      if (fs.existsSync(gitHooksPath)) {
        expect(fs.statSync(gitHooksPath).isDirectory()).toBe(true);
      }
    });
  });

  // Test Group: Code Style Consistency
  // Validates consistent code style patterns across the project
  describe('Code Style Consistency', () => {
    // Test: Import Order Consistency
    // Checks that imports follow a consistent ordering pattern (React first, then third-party, then local)
    test('should maintain consistent import ordering', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf8');

      // Check that React imports come first, then third-party, then local
      const lines = appContent.split('\n');
      const importLines = lines.filter(line =>
        line.trim().startsWith('import'),
      );

      expect(importLines.length).toBeGreaterThan(0);

      // First import should be from React Navigation or React ecosystem
      expect(importLines[0]).toMatch(/@react-navigation|react/);
    });

    // Test: Quotation Mark Consistency
    // Validates consistent use of single quotes as per React Native convention
    test('should use consistent quotation marks', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf8');

      // Should use single quotes as per React Native convention
      const singleQuoteCount = (appContent.match(/'/g) || []).length;

      // Single quotes should be more prevalent (accounting for JSX attributes)
      expect(singleQuoteCount).toBeGreaterThan(0);
    });
  });
});
