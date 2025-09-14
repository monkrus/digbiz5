#!/usr/bin/env node

/**
 * Individual Test Runner
 *
 * Allows running individual Phase 2 test suites easily
 */

const { execSync } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Available test suites
const testSuites = {
  // Phase 1: Authentication & Profile Tests
  setup: {
    name: 'Project Setup Validation',
    file: '_tests_/setup/project-setup.test.ts',
  },
  typescript: {
    name: 'TypeScript Configuration',
    file: '_tests_/setup/typescript.test.ts',
  },
  linting: {
    name: 'Code Quality (Linting)',
    file: '_tests_/setup/linting.test.ts',
  },
  tokenUtils: {
    name: 'Token Utilities',
    file: '_tests_/unit/auth/tokenUtils.test.ts',
  },
  tokenStorage: {
    name: 'Token Storage',
    file: '_tests_/unit/tokenStorage.test.ts',
  },
  authService: {
    name: 'Authentication Service',
    file: '_tests_/unit/authService.test.ts',
  },
  googleAuth: {
    name: 'Google OAuth Service',
    file: '_tests_/unit/googleAuthService.test.ts',
  },
  linkedinAuth: {
    name: 'LinkedIn OAuth Service',
    file: '_tests_/unit/linkedinAuthService.test.ts',
  },
  profileValidation: {
    name: 'Profile Validation',
    file: '_tests_/unit/profile/profileValidation.test.ts',
  },
  profileService: {
    name: 'Profile Service',
    file: '_tests_/unit/profile/profileService.test.ts',
  },
  profileErrors: {
    name: 'Profile Error Handling',
    file: '_tests_/unit/profile/profileErrorHandling.test.ts',
  },
  profileHook: {
    name: 'Profile Hook (useProfile)',
    file: '_tests_/unit/profile/useProfile.test.ts',
  },
  authIntegration: {
    name: 'Authentication Integration',
    file: '_tests_/integration/auth.integration.test.ts',
  },
  profileScreens: {
    name: 'Profile Screens Integration',
    file: '_tests_/integration/profile/profileScreens.test.tsx',
  },

  // Phase 2: Digital Business Card Tests
  cardCreation: {
    name: 'Card Creation with All Field Types',
    file: '_tests_/unit/businessCard/cardCreation.test.ts',
  },
  qrCode: {
    name: 'QR Code Generation and Scanning',
    file: '_tests_/unit/businessCard/qrCodeGeneration.test.ts',
  },
  deepLink: {
    name: 'Deep Link Handling',
    file: '_tests_/unit/businessCard/deepLinking.test.ts',
  },
  preview: {
    name: 'Card Preview Rendering',
    file: '_tests_/unit/businessCard/cardPreview.test.tsx',
  },
  sharing: {
    name: 'Share Functionality',
    file: '_tests_/unit/businessCard/sharing.test.ts',
  },
  wallet: {
    name: 'Wallet Integration',
    file: '_tests_/unit/businessCard/walletIntegration.test.ts',
  },
  integration: {
    name: 'End-to-End Integration',
    file: '_tests_/integration/businessCard.integration.test.ts',
  },

  // Special cases
  phase1: {
    name: 'All Phase 1 Tests',
    file: null, // Special case - runs phase1 script
  },
  phase2: {
    name: 'All Phase 2 Tests',
    file: null, // Special case - runs phase2 script
  },
  all: {
    name: 'All Tests (Phase 1 + Phase 2)',
    file: null, // Special case - runs all tests
  },
};

/**
 * Show available test suites
 */
function showAvailable() {
  console.log(
    `${colors.bright}${colors.cyan}Available Test Suites:${colors.reset}\n`,
  );

  Object.keys(testSuites).forEach(key => {
    const suite = testSuites[key];
    console.log(`  ${colors.yellow}${key}${colors.reset} - ${suite.name}`);
  });

  console.log(`\n${colors.blue}Usage Examples:${colors.reset}`);
  console.log(`  node _tests_/scripts/runIndividualTest.js qrCode`);
  console.log(
    `  node _tests_/scripts/runIndividualTest.js cardCreation --verbose`,
  );
  console.log(`  node _tests_/scripts/runIndividualTest.js all --coverage`);
}

/**
 * Run a specific test suite
 */
function runTestSuite(suiteKey, options = {}) {
  const suite = testSuites[suiteKey];
  if (!suite) {
    console.log(
      `${colors.red}❌ Unknown test suite: ${suiteKey}${colors.reset}`,
    );
    showAvailable();
    return 1;
  }

  console.log(
    `${colors.bright}${colors.cyan}🧪 Running: ${suite.name}${colors.reset}\n`,
  );

  try {
    let command;

    if (suiteKey === 'phase1') {
      // Run all Phase 1 tests
      command = 'node _tests_/scripts/runPhase1Tests.js';
    } else if (suiteKey === 'phase2') {
      // Run all Phase 2 tests
      command = 'node _tests_/scripts/runPhase2Tests.js';
    } else if (suiteKey === 'all') {
      // Run both Phase 1 and Phase 2 tests
      console.log(
        `${colors.blue}Running Phase 1 tests first...${colors.reset}`,
      );
      execSync('node _tests_/scripts/runPhase1Tests.js', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log(`${colors.blue}Now running Phase 2 tests...${colors.reset}`);
      command = 'node _tests_/scripts/runPhase2Tests.js';
    } else {
      // Run specific test file
      command = `npx jest "${suite.file}"`;

      // Add options
      if (options.verbose) command += ' --verbose';
      if (options.coverage)
        command += ' --coverage --coverageDirectory=coverage/individual';
      if (options.watch) command += ' --watch';
      if (options.updateSnapshots) command += ' --updateSnapshot';
    }

    // Add common options for individual tests
    if (!['phase1', 'phase2', 'all'].includes(suiteKey)) {
      command += ' --testTimeout=30000';
    }

    if (options.verbose) {
      console.log(`${colors.blue}Command: ${command}${colors.reset}\n`);
    }

    const startTime = Date.now();

    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TZ: 'UTC',
      },
    });

    const duration = Date.now() - startTime;
    console.log(
      `\n${colors.green}✅ ${suite.name} completed successfully! (${duration}ms)${colors.reset}`,
    );

    return 0;
  } catch (error) {
    console.log(`\n${colors.red}❌ ${suite.name} failed${colors.reset}`);
    if (options.verbose) {
      console.log(`Error: ${error.message}`);
    }
    return 1;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(
      `${colors.bright}Individual Phase 2 Test Runner${colors.reset}\n`,
    );
    console.log('Run individual test suites easily.\n');
    showAvailable();
    console.log(`\n${colors.blue}Options:${colors.reset}`);
    console.log('  --verbose, -v     Verbose output');
    console.log('  --coverage, -c    Generate coverage report');
    console.log('  --watch, -w       Watch mode');
    console.log('  --updateSnapshots Update Jest snapshots');
    console.log('  --help, -h        Show this help');
    return { showHelp: true };
  }

  const suiteKey = args[0];
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    coverage: args.includes('--coverage') || args.includes('-c'),
    watch: args.includes('--watch') || args.includes('-w'),
    updateSnapshots: args.includes('--updateSnapshots'),
  };

  return { suiteKey, options };
}

/**
 * Main execution
 */
function main() {
  const { showHelp, suiteKey, options } = parseArgs();

  if (showHelp) {
    return 0;
  }

  return runTestSuite(suiteKey, options);
}

// Run if called directly
if (require.main === module) {
  process.exit(main());
}

module.exports = { runTestSuite, testSuites };
