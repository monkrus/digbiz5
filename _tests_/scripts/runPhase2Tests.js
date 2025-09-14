#!/usr/bin/env node

/**
 * Phase 2 Digital Business Card Test Runner
 *
 * Comprehensive test runner for all Phase 2 functionality including:
 * - Card creation with all field types
 * - QR code generation and scanning
 * - Deep link handling
 * - Card preview rendering
 * - Share functionality on iOS/Android
 * - Wallet integration tests
 */

const { execSync } = require('child_process');
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

// Test suites to run
const testSuites = [
  {
    name: 'Card Creation with All Field Types',
    file: '_tests_/unit/businessCard/cardCreation.test.ts',
    description:
      'Tests business card creation, validation, and form handling with all field types',
  },
  {
    name: 'QR Code Generation and Scanning',
    file: '_tests_/unit/businessCard/qrCodeGeneration.test.ts',
    description:
      'Tests QR code generation, parsing, vCard creation, and scanning functionality',
  },
  {
    name: 'Deep Link Handling',
    file: '_tests_/unit/businessCard/deepLinking.test.ts',
    description:
      'Tests deep link parsing, navigation, universal links, and URL handling',
  },
  {
    name: 'Card Preview Rendering',
    file: '_tests_/unit/businessCard/cardPreview.test.tsx',
    description:
      'Tests card preview rendering, themes, templates, and visual components',
  },
  {
    name: 'Share Functionality (iOS/Android)',
    file: '_tests_/unit/businessCard/sharing.test.ts',
    description:
      'Tests sharing across platforms, native share sheets, and social media integration',
  },
  {
    name: 'Wallet Integration',
    file: '_tests_/unit/businessCard/walletIntegration.test.ts',
    description:
      'Tests Apple Wallet and Google Wallet integration, pass generation, and saving',
  },
  {
    name: 'End-to-End Integration',
    file: '_tests_/integration/businessCard.integration.test.ts',
    description:
      'Integration tests covering complete workflows and cross-feature functionality',
  },
];

// Configuration
const config = {
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  coverage: process.argv.includes('--coverage') || process.argv.includes('-c'),
  watch: process.argv.includes('--watch') || process.argv.includes('-w'),
  updateSnapshots:
    process.argv.includes('--updateSnapshots') || process.argv.includes('-u'),
  bail: process.argv.includes('--bail'),
  parallel: !process.argv.includes('--serial'),
  timeout: parseInt(
    process.argv.find(arg => arg.startsWith('--timeout='))?.split('=')[1] ||
      '30000',
  ),
};

console.log(
  `${colors.bright}${colors.cyan}🚀 Running Phase 2: Digital Business Card Tests${colors.reset}\n`,
);

// Display configuration
if (config.verbose) {
  console.log(`${colors.blue}Configuration:${colors.reset}`);
  console.log(`  Verbose: ${config.verbose}`);
  console.log(`  Coverage: ${config.coverage}`);
  console.log(`  Watch: ${config.watch}`);
  console.log(`  Update Snapshots: ${config.updateSnapshots}`);
  console.log(`  Bail on Error: ${config.bail}`);
  console.log(`  Parallel: ${config.parallel}`);
  console.log(`  Timeout: ${config.timeout}ms`);
  console.log('');
}

// Display test suites
console.log(`${colors.yellow}Test Suites to Run:${colors.reset}`);
testSuites.forEach((suite, index) => {
  console.log(`  ${index + 1}. ${colors.bright}${suite.name}${colors.reset}`);
  if (config.verbose) {
    console.log(`     ${colors.cyan}${suite.description}${colors.reset}`);
    console.log(`     ${colors.magenta}File: ${suite.file}${colors.reset}`);
  }
});
console.log('');

/**
 * Check if all test files exist
 */
function checkTestFiles() {
  console.log(`${colors.blue}Checking test files...${colors.reset}`);
  let allFilesExist = true;

  testSuites.forEach(suite => {
    const filePath = path.join(process.cwd(), suite.file);
    if (!fs.existsSync(filePath)) {
      console.log(
        `${colors.red}❌ Missing test file: ${suite.file}${colors.reset}`,
      );
      allFilesExist = false;
    } else if (config.verbose) {
      console.log(`${colors.green}✅ Found: ${suite.file}${colors.reset}`);
    }
  });

  if (!allFilesExist) {
    console.log(
      `${colors.red}\n❌ Some test files are missing. Please create all test files first.${colors.reset}`,
    );
    process.exit(1);
  }

  console.log(`${colors.green}✅ All test files found${colors.reset}\n`);
}

/**
 * Run a single test suite
 */
function runTestSuite(suite) {
  console.log(`${colors.bright}Running: ${suite.name}${colors.reset}`);

  try {
    let jestCommand = 'npx jest';

    // Add file pattern
    jestCommand += ` "${suite.file}"`;

    // Add configuration flags
    if (config.verbose) jestCommand += ' --verbose';
    if (config.coverage)
      jestCommand += ' --coverage --coverageDirectory=coverage/phase2';
    if (config.updateSnapshots) jestCommand += ' --updateSnapshot';
    if (config.bail) jestCommand += ' --bail';
    if (!config.parallel) jestCommand += ' --runInBand';

    // Set timeout
    jestCommand += ` --testTimeout=${config.timeout}`;

    // Environment variables for React Native testing
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      TZ: 'UTC',
    };

    const startTime = Date.now();

    execSync(jestCommand, {
      stdio: config.verbose ? 'inherit' : 'pipe',
      cwd: process.cwd(),
      env,
    });

    const duration = Date.now() - startTime;
    console.log(
      `${colors.green}✅ ${suite.name} - Passed (${duration}ms)${colors.reset}\n`,
    );

    return { success: true, duration, name: suite.name };
  } catch (error) {
    console.log(`${colors.red}❌ ${suite.name} - Failed${colors.reset}`);
    if (config.verbose) {
      console.log(`Error: ${error.message}`);
    }
    console.log('');

    return {
      success: false,
      duration: 0,
      name: suite.name,
      error: error.message,
    };
  }
}

/**
 * Run all test suites
 */
async function runAllTests() {
  const results = [];
  const startTime = Date.now();

  console.log(
    `${colors.bright}${colors.blue}Starting Phase 2 Test Execution...${colors.reset}\n`,
  );

  for (const suite of testSuites) {
    const result = runTestSuite(suite);
    results.push(result);

    // If bail is enabled and test failed, stop execution
    if (config.bail && !result.success) {
      console.log(
        `${colors.red}Stopping execution due to test failure (--bail flag)${colors.reset}`,
      );
      break;
    }
  }

  const totalDuration = Date.now() - startTime;

  // Display summary
  console.log(`${colors.bright}${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Test Suites: ${testSuites.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(
    `Total Time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`,
  );
  console.log('');

  // Display individual results
  results.forEach(result => {
    const status = result.success
      ? `${colors.green}✅ PASS${colors.reset}`
      : `${colors.red}❌ FAIL${colors.reset}`;
    const duration = result.duration ? `${result.duration}ms` : '0ms';

    console.log(`${status} ${result.name} (${duration})`);

    if (!result.success && result.error && config.verbose) {
      console.log(`      ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  });

  console.log('');

  // Final status
  if (failed === 0) {
    console.log(
      `${colors.bright}${colors.green}🎉 All Phase 2 tests passed! 🎉${colors.reset}`,
    );
    console.log(
      `${colors.green}Digital business card functionality is working correctly.${colors.reset}`,
    );
    return 0;
  } else {
    console.log(
      `${colors.bright}${colors.red}❌ ${failed} test suite(s) failed${colors.reset}`,
    );
    console.log(
      `${colors.red}Please review the failing tests and fix issues before proceeding.${colors.reset}`,
    );
    return 1;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(
    `${colors.bright}Phase 2 Digital Business Card Test Runner${colors.reset}`,
  );
  console.log('');
  console.log('Usage:');
  console.log('  node _tests_/scripts/runPhase2Tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  -v, --verbose           Verbose output');
  console.log('  -c, --coverage          Generate code coverage report');
  console.log('  -w, --watch            Watch mode (not recommended for CI)');
  console.log('  -u, --updateSnapshots   Update Jest snapshots');
  console.log('  --bail                  Stop on first test failure');
  console.log('  --serial                Run tests in series (not parallel)');
  console.log('  --timeout=<ms>          Set test timeout (default: 30000)');
  console.log('  --help                  Show this help message');
  console.log('');
  console.log('Test Coverage:');
  console.log('  ✅ Card creation with all field types');
  console.log('  ✅ QR code generation and scanning');
  console.log('  ✅ Deep link handling');
  console.log('  ✅ Card preview rendering');
  console.log('  ✅ Share functionality on iOS/Android');
  console.log('  ✅ Wallet integration tests');
  console.log('  ✅ End-to-end integration tests');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  // Handle help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    return 0;
  }

  try {
    // Check test files exist
    checkTestFiles();

    // Run all tests
    const exitCode = await runAllTests();

    // Generate coverage report message
    if (config.coverage) {
      console.log(
        `${colors.cyan}📋 Coverage report generated in: coverage/phase2/${colors.reset}`,
      );
      console.log(
        `${colors.cyan}Open coverage/phase2/lcov-report/index.html in your browser to view detailed coverage.${colors.reset}`,
      );
      console.log('');
    }

    process.exit(exitCode);
  } catch (error) {
    console.error(
      `${colors.red}❌ Test runner error: ${error.message}${colors.reset}`,
    );
    process.exit(1);
  }
}

// Handle watch mode
if (config.watch) {
  console.log(
    `${colors.yellow}⚠️  Watch mode is not implemented in this script.${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Use 'npx jest --watch' directly for watch mode.${colors.reset}`,
  );
  console.log('');
}

// Run the tests
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
