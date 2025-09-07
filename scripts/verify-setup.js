#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 DigBiz5 Project Setup Verification\n');

const checks = [
  {
    name: 'Dependencies Installation',
    command: 'npm list --depth=0',
    description: 'Checking if all dependencies are properly installed',
  },
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit',
    description: 'Verifying TypeScript compilation without errors',
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    description: 'Running ESLint to check code quality',
  },
  {
    name: 'Setup Tests',
    command: 'npm run test:setup',
    description: 'Running setup verification tests',
  },
];

let passedChecks = 0;
let totalChecks = checks.length;

console.log(`Running ${totalChecks} verification checks...\n`);

checks.forEach((check, index) => {
  try {
    console.log(`${index + 1}. ${check.description}...`);

    execSync(check.command, {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    console.log(`   ✅ ${check.name} - PASSED\n`);
    passedChecks++;
  } catch (error) {
    console.log(`   ❌ ${check.name} - FAILED`);
    console.log(`   Error: ${error.message}\n`);
  }
});

// Additional manual checks
console.log('📋 Additional Setup Verification:\n');

const manualChecks = [
  {
    name: 'iOS Project Structure',
    check: () =>
      fs.existsSync(path.join(process.cwd(), 'ios', 'digbiz5.xcodeproj')),
    description: 'iOS Xcode project exists',
  },
  {
    name: 'Android Project Structure',
    check: () =>
      fs.existsSync(path.join(process.cwd(), 'android', 'app', 'build.gradle')),
    description: 'Android Gradle project exists',
  },
  {
    name: 'Environment Configuration',
    check: () => fs.existsSync(path.join(process.cwd(), '.env')),
    description: 'Environment variables file exists',
  },
  {
    name: 'CI/CD Workflows',
    check: () =>
      fs.existsSync(path.join(process.cwd(), '.github', 'workflows')),
    description: 'GitHub Actions workflows configured',
  },
  {
    name: 'Fastlane Configuration',
    check: () => {
      const iosFastlane = fs.existsSync(
        path.join(process.cwd(), 'ios', 'fastlane', 'Fastfile'),
      );
      const androidFastlane = fs.existsSync(
        path.join(process.cwd(), 'android', 'fastlane', 'Fastfile'),
      );
      return iosFastlane && androidFastlane;
    },
    description: 'Fastlane configured for both platforms',
  },
];

manualChecks.forEach((check, index) => {
  const result = check.check();
  const status = result ? '✅ PASSED' : '❌ FAILED';
  console.log(`${index + 1}. ${check.description}: ${status}`);
  if (result) passedChecks++;
});

totalChecks += manualChecks.length;

console.log(`\n📊 Verification Summary:`);
console.log(`${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log(
    '\n🎉 All verification checks passed! Your project setup is complete.',
  );
  console.log('\n🚀 Ready for development! You can now:');
  console.log('   • Run iOS: npm run ios');
  console.log('   • Run Android: npm run android');
  console.log('   • Start Metro: npm start');
  console.log('   • Run tests: npm test');
} else {
  console.log(
    '\n⚠️  Some checks failed. Please review the errors above and fix them.',
  );
  process.exit(1);
}
