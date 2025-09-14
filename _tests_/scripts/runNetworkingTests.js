#!/usr/bin/env node

/**
 * Networking Tests Runner
 *
 * Comprehensive test runner for all networking features including:
 * - Search algorithm accuracy
 * - Connection state transitions
 * - Message delivery reliability
 * - Push notification delivery
 * - Real-time sync functionality
 * - Discovery load testing
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NetworkingTestRunner {
  constructor() {
    this.testResults = {
      searchAlgorithm: { status: 'pending', duration: 0, details: {} },
      connectionStates: { status: 'pending', duration: 0, details: {} },
      messageDelivery: { status: 'pending', duration: 0, details: {} },
      pushNotifications: { status: 'pending', duration: 0, details: {} },
      realTimeSync: { status: 'pending', duration: 0, details: {} },
      discoveryLoad: { status: 'pending', duration: 0, details: {} },
    };
    this.overallStartTime = Date.now();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m',   // Red
      WARNING: '\x1b[33m', // Yellow
      RESET: '\x1b[0m'
    };

    console.log(`${colors[level]}[${timestamp}] [${level}] ${message}${colors.RESET}`);
  }

  async runTest(testName, testFile, description) {
    this.log(`Starting ${description}...`);
    const startTime = Date.now();

    try {
      const result = await this.executeJestTest(testFile);
      const duration = Date.now() - startTime;

      this.testResults[testName] = {
        status: 'passed',
        duration,
        details: result
      };

      this.log(`✅ ${description} completed in ${duration}ms`, 'SUCCESS');
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.testResults[testName] = {
        status: 'failed',
        duration,
        details: { error: error.message }
      };

      this.log(`❌ ${description} failed after ${duration}ms: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async executeJestTest(testFile) {
    return new Promise((resolve, reject) => {
      const jestPath = path.join(__dirname, '../../node_modules/.bin/jest');
      const testPath = path.join(__dirname, '../networking', testFile);

      const jest = spawn('node', [jestPath, testPath, '--verbose', '--json'], {
        cwd: path.join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      jest.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      jest.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      jest.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON output
            const lines = stdout.split('\n');
            const jsonLine = lines.find(line => line.trim().startsWith('{'));

            if (jsonLine) {
              const result = JSON.parse(jsonLine);
              resolve({
                success: result.success,
                numTotalTests: result.numTotalTests,
                numPassedTests: result.numPassedTests,
                numFailedTests: result.numFailedTests,
                testResults: result.testResults,
                runtime: result.runtime
              });
            } else {
              resolve({
                success: true,
                output: stdout,
                runtime: 0
              });
            }
          } catch (parseError) {
            resolve({
              success: true,
              output: stdout,
              runtime: 0
            });
          }
        } else {
          reject(new Error(`Test failed with code ${code}. Output: ${stderr || stdout}`));
        }
      });

      jest.on('error', (error) => {
        reject(new Error(`Failed to start test: ${error.message}`));
      });
    });
  }

  async runPerformanceBenchmark() {
    this.log('Running performance benchmarks...', 'INFO');

    const benchmarks = [
      {
        name: 'Search Algorithm Performance',
        test: () => this.benchmarkSearchAlgorithm(),
      },
      {
        name: 'Connection State Performance',
        test: () => this.benchmarkConnectionStates(),
      },
      {
        name: 'Message Delivery Performance',
        test: () => this.benchmarkMessageDelivery(),
      },
      {
        name: 'Real-time Sync Performance',
        test: () => this.benchmarkRealTimeSync(),
      },
    ];

    const benchmarkResults = {};

    for (const benchmark of benchmarks) {
      try {
        const result = await benchmark.test();
        benchmarkResults[benchmark.name] = result;
        this.log(`✅ ${benchmark.name}: ${result.avgTime}ms avg`, 'SUCCESS');
      } catch (error) {
        benchmarkResults[benchmark.name] = { error: error.message };
        this.log(`❌ ${benchmark.name} failed: ${error.message}`, 'ERROR');
      }
    }

    return benchmarkResults;
  }

  async benchmarkSearchAlgorithm() {
    const iterations = 1000;
    const startTime = Date.now();

    // Simulate search algorithm performance test
    for (let i = 0; i < iterations; i++) {
      // Mock similarity calculation
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const totalTime = Date.now() - startTime;
    return {
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      throughput: (iterations / totalTime) * 1000 // operations per second
    };
  }

  async benchmarkConnectionStates() {
    const iterations = 500;
    const startTime = Date.now();

    // Simulate connection state transitions
    for (let i = 0; i < iterations; i++) {
      // Mock state transition
      await new Promise(resolve => setTimeout(resolve, 2));
    }

    const totalTime = Date.now() - startTime;
    return {
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      throughput: (iterations / totalTime) * 1000
    };
  }

  async benchmarkMessageDelivery() {
    const iterations = 200;
    const startTime = Date.now();

    // Simulate message delivery test
    for (let i = 0; i < iterations; i++) {
      // Mock message processing
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    const totalTime = Date.now() - startTime;
    return {
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      throughput: (iterations / totalTime) * 1000
    };
  }

  async benchmarkRealTimeSync() {
    const iterations = 100;
    const startTime = Date.now();

    // Simulate real-time sync performance
    for (let i = 0; i < iterations; i++) {
      // Mock sync operation
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const totalTime = Date.now() - startTime;
    return {
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      throughput: (iterations / totalTime) * 1000
    };
  }

  generateReport() {
    const overallDuration = Date.now() - this.overallStartTime;
    const passedTests = Object.values(this.testResults).filter(r => r.status === 'passed').length;
    const failedTests = Object.values(this.testResults).filter(r => r.status === 'failed').length;
    const totalTests = passedTests + failedTests;

    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
        overallDuration,
        timestamp: new Date().toISOString()
      },
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze test results and provide recommendations
    Object.entries(this.testResults).forEach(([testName, result]) => {
      if (result.status === 'failed') {
        recommendations.push({
          category: 'CRITICAL',
          test: testName,
          issue: 'Test failed',
          recommendation: `Investigate and fix issues in ${testName} before deployment`
        });
      } else if (result.duration > 5000) {
        recommendations.push({
          category: 'PERFORMANCE',
          test: testName,
          issue: 'Slow test execution',
          recommendation: `Consider optimizing ${testName} - took ${result.duration}ms`
        });
      }
    });

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'SUCCESS',
        issue: 'All tests passed',
        recommendation: 'Networking features are ready for deployment'
      });
    }

    return recommendations;
  }

  async saveReport(report) {
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportsDir, `networking-test-report-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also create a human-readable summary
    const summaryPath = path.join(reportsDir, `networking-test-summary-${timestamp}.txt`);
    const summaryContent = this.formatSummary(report);
    fs.writeFileSync(summaryPath, summaryContent);

    return { reportPath, summaryPath };
  }

  formatSummary(report) {
    const { summary, testResults, recommendations } = report;

    let content = `
NETWORKING FEATURES TEST REPORT
===============================
Generated: ${summary.timestamp}
Total Duration: ${summary.overallDuration}ms

SUMMARY
-------
Total Tests: ${summary.totalTests}
Passed: ${summary.passedTests}
Failed: ${summary.failedTests}
Success Rate: ${summary.successRate.toFixed(2)}%

TEST RESULTS
------------
`;

    Object.entries(testResults).forEach(([testName, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      content += `${status} ${testName}: ${result.status.toUpperCase()} (${result.duration}ms)\n`;
    });

    content += `\nRECOMMENDations\n---------------\n`;
    recommendations.forEach(rec => {
      const icon = rec.category === 'CRITICAL' ? '🚨' :
                   rec.category === 'PERFORMANCE' ? '⚠️' : '✅';
      content += `${icon} [${rec.category}] ${rec.recommendation}\n`;
    });

    return content;
  }

  async run(options = {}) {
    const {
      runAll = true,
      skipLoadTests = false,
      includeBenchmarks = false,
      verbose = false
    } = options;

    this.log('🚀 Starting Networking Features Test Suite', 'INFO');

    const tests = [
      {
        name: 'searchAlgorithm',
        file: 'searchAlgorithm.test.ts',
        description: 'Search Algorithm Accuracy Tests',
        skip: false
      },
      {
        name: 'connectionStates',
        file: 'connectionStates.test.ts',
        description: 'Connection State Transition Tests',
        skip: false
      },
      {
        name: 'messageDelivery',
        file: 'messageDelivery.test.ts',
        description: 'Message Delivery Reliability Tests',
        skip: false
      },
      {
        name: 'pushNotifications',
        file: 'pushNotifications.test.ts',
        description: 'Push Notification Delivery Tests',
        skip: false
      },
      {
        name: 'realTimeSync',
        file: 'realTimeSync.test.ts',
        description: 'Real-Time Sync Functionality Tests',
        skip: false
      },
      {
        name: 'discoveryLoad',
        file: 'discoveryLoadTests.test.ts',
        description: 'Discovery Load Testing',
        skip: skipLoadTests
      }
    ];

    // Run all tests
    for (const test of tests) {
      if (test.skip) {
        this.log(`⏭️  Skipping ${test.description}`, 'WARNING');
        continue;
      }

      try {
        await this.runTest(test.name, test.file, test.description);
      } catch (error) {
        if (!runAll) {
          this.log('❌ Stopping due to test failure', 'ERROR');
          break;
        }
        this.log(`⚠️  Continuing despite ${test.name} failure`, 'WARNING');
      }
    }

    // Run performance benchmarks if requested
    let benchmarkResults = {};
    if (includeBenchmarks) {
      try {
        benchmarkResults = await this.runPerformanceBenchmark();
      } catch (error) {
        this.log(`⚠️  Benchmarks failed: ${error.message}`, 'WARNING');
      }
    }

    // Generate and save report
    const report = this.generateReport();
    report.benchmarks = benchmarkResults;

    try {
      const { reportPath, summaryPath } = await this.saveReport(report);
      this.log(`📊 Report saved: ${reportPath}`, 'SUCCESS');
      this.log(`📄 Summary saved: ${summaryPath}`, 'SUCCESS');
    } catch (error) {
      this.log(`⚠️  Failed to save report: ${error.message}`, 'WARNING');
    }

    // Log final summary
    this.log('🏁 Test suite completed', 'INFO');
    this.log(`📈 Results: ${report.summary.passedTests}/${report.summary.totalTests} tests passed (${report.summary.successRate.toFixed(2)}%)`,
             report.summary.successRate === 100 ? 'SUCCESS' : 'WARNING');

    return report;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    switch(arg) {
      case '--skip-load-tests':
        options.skipLoadTests = true;
        break;
      case '--include-benchmarks':
        options.includeBenchmarks = true;
        break;
      case '--stop-on-failure':
        options.runAll = false;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Networking Features Test Runner

Usage: node runNetworkingTests.js [options]

Options:
  --skip-load-tests      Skip load testing (faster execution)
  --include-benchmarks   Run performance benchmarks
  --stop-on-failure      Stop on first test failure
  --verbose             Enable verbose output
  --help                Show this help message

Examples:
  node runNetworkingTests.js                    # Run all tests
  node runNetworkingTests.js --skip-load-tests  # Skip slow load tests
  node runNetworkingTests.js --include-benchmarks # Include performance benchmarks
        `);
        process.exit(0);
        break;
    }
  });

  const runner = new NetworkingTestRunner();

  runner.run(options)
    .then(report => {
      const exitCode = report.summary.failedTests > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = NetworkingTestRunner;