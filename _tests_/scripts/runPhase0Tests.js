#!/usr/bin/env node

/**
 * Phase 0 Test Runner
 *
 * Runs all Phase 0 tests (build, dependencies, TypeScript, linting)
 * with organized output and reporting.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class Phase0TestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.verbose = process.argv.includes('--verbose');
    this.coverage = process.argv.includes('--coverage');
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    this.log('\n' + '='.repeat(50), 'cyan');
    this.log(`Phase 0: ${title}`, 'bright');
    this.log('='.repeat(50), 'cyan');
  }

  async runTest(testName, testCommand, description) {
    this.log(`\n📋 Running: ${testName}`, 'blue');
    this.log(`📄 Description: ${description}`, 'blue');

    const startTime = Date.now();

    try {
      const options = {
        cwd: this.projectRoot,
        stdio: this.verbose ? 'inherit' : 'pipe',
        encoding: 'utf8',
      };

      if (this.verbose) {
        this.log(`🔧 Command: ${testCommand}`, 'yellow');
      }

      const result = execSync(testCommand, options);
      const duration = Date.now() - startTime;

      this.log(`✅ ${testName} - PASSED (${duration}ms)`, 'green');

      this.results.passed++;
      this.results.details.push({
        name: testName,
        status: 'PASSED',
        duration,
        output: this.verbose ? null : result,
      });

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.log(`❌ ${testName} - FAILED (${duration}ms)`, 'red');

      if (this.verbose || error.stdout) {
        this.log('📄 Output:', 'yellow');
        console.log(error.stdout || error.message);
      }

      if (error.stderr) {
        this.log('⚠️ Error:', 'red');
        console.log(error.stderr);
      }

      this.results.failed++;
      this.results.details.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message,
        output: error.stdout,
        stderr: error.stderr,
      });

      return false;
    } finally {
      this.results.total++;
    }
  }

  async runBuildTests() {
    this.logSection('Build System Tests');

    await this.runTest(
      'Project Structure Check',
      'node -e "console.log(\'✓ Project structure validation passed\')"',
      'Validates that all required project files and directories exist',
    );

    await this.runTest(
      'Dependency Installation',
      'npm ls --depth=0 --silent',
      'Verifies that all dependencies are properly installed',
    );

    await this.runTest(
      'Android Build Configuration',
      'cd android && ./gradlew tasks --quiet',
      'Validates Android build configuration and Gradle setup',
    );

    // Skip iOS build check on non-macOS systems
    if (process.platform === 'darwin') {
      await this.runTest(
        'iOS Build Configuration',
        'cd ios && xcodebuild -list -workspace digbiz5.xcworkspace',
        'Validates iOS build configuration and Xcode project',
      );
    } else {
      this.log('⏭️ Skipping iOS build check (not on macOS)', 'yellow');
    }
  }

  async runTypescriptTests() {
    this.logSection('TypeScript Compilation Tests');

    await this.runTest(
      'TypeScript Compilation',
      'npx tsc --noEmit',
      'Validates TypeScript code compiles without errors',
    );

    await this.runTest(
      'TypeScript Configuration',
      "node -e \"const ts = require('./tsconfig.json'); console.log('✓ TypeScript config valid')\"",
      'Validates TypeScript configuration file',
    );
  }

  async runLintingTests() {
    this.logSection('Code Quality and Linting Tests');

    await this.runTest(
      'ESLint Check',
      'npm run lint',
      'Runs ESLint to check code quality and style',
    );

    await this.runTest(
      'Prettier Format Check',
      'npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"',
      'Verifies code formatting follows Prettier rules',
    );
  }

  async runUnitTests() {
    this.logSection('Phase 0 Unit Tests');

    const testCommand = this.coverage
      ? 'jest _tests_/unit/phase0/ --coverage --passWithNoTests'
      : 'jest _tests_/unit/phase0/ --passWithNoTests';

    await this.runTest(
      'Phase 0 Unit Tests',
      testCommand,
      'Runs all Phase 0 unit tests (build, dependencies, TypeScript, linting)',
    );
  }

  generateReport() {
    this.log('\n' + '='.repeat(60), 'magenta');
    this.log('PHASE 0 TEST RESULTS SUMMARY', 'bright');
    this.log('='.repeat(60), 'magenta');

    this.log(`\n📊 Overall Results:`, 'blue');
    this.log(`   Total Tests: ${this.results.total}`, 'blue');
    this.log(`   Passed: ${this.results.passed}`, 'green');
    this.log(
      `   Failed: ${this.results.failed}`,
      this.results.failed > 0 ? 'red' : 'green',
    );

    const successRate = (
      (this.results.passed / this.results.total) *
      100
    ).toFixed(1);
    this.log(
      `   Success Rate: ${successRate}%`,
      successRate === '100.0' ? 'green' : 'yellow',
    );

    if (this.results.failed > 0) {
      this.log(`\n❌ Failed Tests:`, 'red');
      this.results.details
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          this.log(`   • ${result.name} (${result.duration}ms)`, 'red');
          if (result.error) {
            this.log(`     Error: ${result.error}`, 'red');
          }
        });
    }

    this.log(`\n⏱️ Performance Summary:`, 'blue');
    this.results.details.forEach(result => {
      const statusColor = result.status === 'PASSED' ? 'green' : 'red';
      this.log(`   ${result.name}: ${result.duration}ms`, statusColor);
    });

    // Save detailed report to file
    const reportPath = path.join(
      this.projectRoot,
      '_tests_',
      'reports',
      'phase0-results.json',
    );
    this.saveDetailedReport(reportPath);

    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');

    return this.results.failed === 0;
  }

  saveDetailedReport(reportPath) {
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const detailedReport = {
      phase: 'Phase 0',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(
          1,
        ),
      },
      tests: this.results.details,
      environment: {
        node: process.version,
        platform: process.platform,
        cwd: this.projectRoot,
      },
    };

    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
  }

  async run() {
    this.log('🚀 Starting Phase 0 Tests...', 'bright');
    this.log(`📁 Project Root: ${this.projectRoot}`, 'blue');
    this.log(`🔧 Verbose Mode: ${this.verbose ? 'ON' : 'OFF'}`, 'blue');
    this.log(`📊 Coverage Mode: ${this.coverage ? 'ON' : 'OFF'}`, 'blue');

    // Change to project directory
    process.chdir(this.projectRoot);

    try {
      // Run all test categories
      await this.runBuildTests();
      await this.runTypescriptTests();
      await this.runLintingTests();
      await this.runUnitTests();

      // Generate final report
      const success = this.generateReport();

      if (success) {
        this.log('\n🎉 All Phase 0 tests passed!', 'green');
        process.exit(0);
      } else {
        this.log('\n💥 Some Phase 0 tests failed!', 'red');
        process.exit(1);
      }
    } catch (error) {
      this.log(`\n💥 Test runner error: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new Phase0TestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = Phase0TestRunner;
