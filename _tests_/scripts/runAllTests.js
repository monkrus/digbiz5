#!/usr/bin/env node

/**
 * Master Test Runner
 *
 * Runs all test phases (Phase 0, Phase 1, Phase 2) in sequence
 * with comprehensive reporting and error handling.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
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

class MasterTestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.verbose = process.argv.includes('--verbose');
    this.coverage = process.argv.includes('--coverage');
    this.skipPhase0 = process.argv.includes('--skip-phase0');
    this.skipPhase1 = process.argv.includes('--skip-phase1');
    this.skipPhase2 = process.argv.includes('--skip-phase2');
    this.results = {
      phases: [],
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      startTime: Date.now(),
      endTime: null,
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader() {
    this.log('╔' + '═'.repeat(70) + '╗', 'cyan');
    this.log(
      '║' +
        ' '.repeat(15) +
        '🧪 COMPREHENSIVE TEST SUITE' +
        ' '.repeat(15) +
        '║',
      'bright',
    );
    this.log(
      '║' + ' '.repeat(18) + 'DigBiz5 Mobile App Tests' + ' '.repeat(18) + '║',
      'cyan',
    );
    this.log('╚' + '═'.repeat(70) + '╝', 'cyan');
    this.log('');
  }

  async runPhase(phaseName, scriptPath, description) {
    this.log(`\n${'═'.repeat(60)}`, 'magenta');
    this.log(`🚀 STARTING ${phaseName.toUpperCase()}`, 'bright');
    this.log(`📋 ${description}`, 'blue');
    this.log(`${'═'.repeat(60)}`, 'magenta');

    const startTime = Date.now();

    return new Promise(resolve => {
      const args = [];
      if (this.verbose) args.push('--verbose');
      if (this.coverage) args.push('--coverage');

      const child = spawn('node', [scriptPath, ...args], {
        cwd: this.projectRoot,
        stdio: 'inherit',
      });

      child.on('close', code => {
        const duration = Date.now() - startTime;
        const success = code === 0;

        const result = {
          phase: phaseName,
          success,
          duration,
          exitCode: code,
        };

        this.results.phases.push(result);

        if (success) {
          this.log(
            `\n✅ ${phaseName.toUpperCase()} COMPLETED SUCCESSFULLY`,
            'green',
          );
        } else {
          this.log(`\n❌ ${phaseName.toUpperCase()} FAILED`, 'red');
        }

        this.log(
          `⏱️ Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
          'blue',
        );

        resolve(result);
      });

      child.on('error', error => {
        this.log(`💥 Error running ${phaseName}: ${error.message}`, 'red');
        resolve({
          phase: phaseName,
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
        });
      });
    });
  }

  generateFinalReport() {
    this.results.endTime = Date.now();
    const totalDuration = this.results.endTime - this.results.startTime;

    this.log('\n' + '═'.repeat(80), 'cyan');
    this.log('🏁 FINAL TEST RESULTS SUMMARY', 'bright');
    this.log('═'.repeat(80), 'cyan');

    // Phase results
    this.log('\n📊 Phase Results:', 'blue');
    this.results.phases.forEach(phase => {
      const status = phase.success
        ? `${colors.green}✅ PASS${colors.reset}`
        : `${colors.red}❌ FAIL${colors.reset}`;
      const duration = `${phase.duration}ms (${(phase.duration / 1000).toFixed(
        2,
      )}s)`;

      this.log(`   ${status} ${phase.phase} - ${duration}`, 'reset');

      if (!phase.success && phase.error) {
        this.log(`     Error: ${phase.error}`, 'red');
      }
    });

    // Overall statistics
    const passedPhases = this.results.phases.filter(p => p.success).length;
    const failedPhases = this.results.phases.filter(p => !p.success).length;
    const totalPhases = this.results.phases.length;

    this.log('\n📈 Overall Statistics:', 'blue');
    this.log(`   Total Phases: ${totalPhases}`, 'blue');
    this.log(`   Passed: ${passedPhases}`, 'green');
    this.log(`   Failed: ${failedPhases}`, failedPhases > 0 ? 'red' : 'green');
    this.log(
      `   Success Rate: ${((passedPhases / totalPhases) * 100).toFixed(1)}%`,
      failedPhases === 0 ? 'green' : 'yellow',
    );
    this.log(
      `   Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(
        2,
      )}s)`,
      'blue',
    );

    // Test coverage summary
    this.log('\n🎯 Test Coverage Areas:', 'blue');
    this.log(
      '   ✅ Phase 0: Build System, Dependencies, TypeScript, Linting',
      'blue',
    );
    this.log(
      '   ✅ Phase 1: Authentication, User Profiles, Onboarding Flows',
      'blue',
    );
    this.log(
      '   ✅ Phase 2: Digital Cards, QR Codes, Sharing Features',
      'blue',
    );

    // Save comprehensive report
    this.saveComprehensiveReport();

    // Final status
    if (failedPhases === 0) {
      this.log('\n🎉 ALL TESTS PASSED! 🎉', 'green');
      this.log('✨ The DigBiz5 mobile app is ready for deployment!', 'green');
      return true;
    } else {
      this.log('\n💥 SOME TESTS FAILED!', 'red');
      this.log(
        '🔧 Please review the failed tests and fix issues before deployment.',
        'yellow',
      );

      // Show failed phases
      const failedPhasesList = this.results.phases
        .filter(p => !p.success)
        .map(p => p.phase)
        .join(', ');
      this.log(`❌ Failed phases: ${failedPhasesList}`, 'red');

      return false;
    }
  }

  saveComprehensiveReport() {
    const reportDir = path.join(this.projectRoot, '_tests_', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const comprehensiveReport = {
      testSuite: 'DigBiz5 Mobile App - Comprehensive Test Suite',
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        cwd: this.projectRoot,
        testRunner: 'Custom Jest-based test runner',
      },
      configuration: {
        verbose: this.verbose,
        coverage: this.coverage,
        skipPhase0: this.skipPhase0,
        skipPhase1: this.skipPhase1,
        skipPhase2: this.skipPhase2,
      },
      summary: {
        totalPhases: this.results.phases.length,
        passedPhases: this.results.phases.filter(p => p.success).length,
        failedPhases: this.results.phases.filter(p => !p.success).length,
        totalDuration: this.results.endTime - this.results.startTime,
        successRate:
          (
            (this.results.phases.filter(p => p.success).length /
              this.results.phases.length) *
            100
          ).toFixed(1) + '%',
      },
      phases: this.results.phases.map(phase => ({
        ...phase,
        durationSeconds: (phase.duration / 1000).toFixed(2),
      })),
      testCoverage: {
        'Phase 0':
          'Build System, Dependencies, TypeScript compilation, Code quality and linting',
        'Phase 1':
          'Authentication services, User profile management, Onboarding workflows, Token management',
        'Phase 2':
          'Digital business cards, QR code generation/scanning, Sharing functionality, Wallet integration',
      },
    };

    const reportPath = path.join(reportDir, 'comprehensive-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));

    this.log(`\n📄 Comprehensive report saved to: ${reportPath}`, 'blue');

    // Also create a simple HTML report
    this.createHtmlReport(comprehensiveReport, reportDir);
  }

  createHtmlReport(report, reportDir) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DigBiz5 Test Results</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .phase { margin: 15px 0; padding: 15px; border-radius: 8px; }
        .phase.success { background: #d4edda; border-left: 4px solid #28a745; }
        .phase.failure { background: #f8d7da; border-left: 4px solid #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 DigBiz5 Test Results</h1>
        <p>Comprehensive Mobile App Test Suite</p>
        <p class="timestamp">Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <h3>Total Phases</h3>
            <h2>${report.summary.totalPhases}</h2>
        </div>
        <div class="stat-card">
            <h3>Passed</h3>
            <h2 style="color: #28a745;">${report.summary.passedPhases}</h2>
        </div>
        <div class="stat-card">
            <h3>Failed</h3>
            <h2 style="color: #dc3545;">${report.summary.failedPhases}</h2>
        </div>
        <div class="stat-card">
            <h3>Success Rate</h3>
            <h2>${report.summary.successRate}</h2>
        </div>
    </div>

    <h2>📊 Phase Results</h2>
    ${report.phases
      .map(
        phase => `
        <div class="phase ${phase.success ? 'success' : 'failure'}">
            <h3>${phase.success ? '✅' : '❌'} ${phase.phase}</h3>
            <p><strong>Duration:</strong> ${phase.durationSeconds}s</p>
            ${
              phase.error ? `<p><strong>Error:</strong> ${phase.error}</p>` : ''
            }
        </div>
    `,
      )
      .join('')}

    <h2>🎯 Test Coverage</h2>
    <ul>
        <li><strong>Phase 0:</strong> ${report.testCoverage['Phase 0']}</li>
        <li><strong>Phase 1:</strong> ${report.testCoverage['Phase 1']}</li>
        <li><strong>Phase 2:</strong> ${report.testCoverage['Phase 2']}</li>
    </ul>

    <div style="margin-top: 40px; padding: 20px; background: #e9ecef; border-radius: 8px;">
        <p><strong>Test Runner:</strong> ${report.environment.testRunner}</p>
        <p><strong>Node Version:</strong> ${report.environment.node}</p>
        <p><strong>Platform:</strong> ${report.environment.platform}</p>
    </div>
</body>
</html>`;

    const htmlPath = path.join(reportDir, 'test-results.html');
    fs.writeFileSync(htmlPath, htmlContent);
    this.log(`📄 HTML report saved to: ${htmlPath}`, 'blue');
  }

  async run() {
    this.logHeader();

    this.log('⚙️ Configuration:', 'blue');
    this.log(`   Verbose Mode: ${this.verbose ? 'ON' : 'OFF'}`, 'blue');
    this.log(`   Coverage Mode: ${this.coverage ? 'ON' : 'OFF'}`, 'blue');
    this.log(`   Skip Phase 0: ${this.skipPhase0 ? 'YES' : 'NO'}`, 'blue');
    this.log(`   Skip Phase 1: ${this.skipPhase1 ? 'YES' : 'NO'}`, 'blue');
    this.log(`   Skip Phase 2: ${this.skipPhase2 ? 'YES' : 'NO'}`, 'blue');

    process.chdir(this.projectRoot);

    try {
      // Run Phase 0 (if not skipped)
      if (!this.skipPhase0) {
        await this.runPhase(
          'Phase 0',
          path.join(__dirname, 'runPhase0Tests.js'),
          'Build System, Dependencies, TypeScript, and Linting Tests',
        );
      }

      // Run Phase 1 (if not skipped)
      if (!this.skipPhase1) {
        await this.runPhase(
          'Phase 1',
          path.join(__dirname, 'runPhase1Tests.js'),
          'Authentication, Profile Management, and Onboarding Tests',
        );
      }

      // Run Phase 2 (if not skipped)
      if (!this.skipPhase2) {
        await this.runPhase(
          'Phase 2',
          path.join(__dirname, 'runPhase2Tests.js'),
          'Digital Cards, QR Codes, and Sharing Functionality Tests',
        );
      }

      // Generate final report
      const allPassed = this.generateFinalReport();

      // Exit with appropriate code
      process.exit(allPassed ? 0 : 1);
    } catch (error) {
      this.log(`💥 Master test runner error: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  showHelp() {
    this.log('🧪 DigBiz5 Comprehensive Test Suite Runner', 'bright');
    this.log('');
    this.log('Usage:');
    this.log('  node _tests_/scripts/runAllTests.js [options]', 'blue');
    this.log('');
    this.log('Options:');
    this.log(
      '  --verbose            Enable verbose output for all test phases',
      'yellow',
    );
    this.log('  --coverage           Generate code coverage reports', 'yellow');
    this.log(
      '  --skip-phase0        Skip Phase 0 (Build & Setup) tests',
      'yellow',
    );
    this.log(
      '  --skip-phase1        Skip Phase 1 (Auth & Profile) tests',
      'yellow',
    );
    this.log(
      '  --skip-phase2        Skip Phase 2 (Cards & Sharing) tests',
      'yellow',
    );
    this.log('  --help               Show this help message', 'yellow');
    this.log('');
    this.log('Test Phases:', 'green');
    this.log(
      '  Phase 0: Build validation, dependencies, TypeScript, linting',
      'blue',
    );
    this.log(
      '  Phase 1: Authentication, user profiles, onboarding flows',
      'blue',
    );
    this.log(
      '  Phase 2: Digital cards, QR codes, sharing functionality',
      'blue',
    );
    this.log('');
  }
}

// Handle help command
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  const runner = new MasterTestRunner();
  runner.showHelp();
  process.exit(0);
}

// Run the master test suite
const runner = new MasterTestRunner();
runner.run().catch(error => {
  console.error('Master test runner failed:', error);
  process.exit(1);
});
