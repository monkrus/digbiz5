# 🧪 Testing Guide - Phase 1 & Phase 2

Complete testing suite for the DigBiz mobile application with organized test execution commands.

## 🚀 Quick Start

### Run Everything

```bash
# Run all tests (Phase 1 + Phase 2)
npm run test:all-phases
```

### Run by Phase

```bash
# Phase 1: Authentication & Profile
npm run test:phase1

# Phase 2: Digital Business Card
npm run test:phase2
```

## 📋 Phase 1: Authentication & Profile Tests

### Complete Phase 1 Suite

```bash
npm run test:phase1              # Basic execution
npm run test:phase1:verbose      # Detailed output
npm run test:phase1:coverage     # With coverage report
```

### Individual Phase 1 Tests

```bash
# Project Setup
npm run test:setup               # Project configuration validation
npm run test:typescript          # TypeScript configuration
npm run test:linting             # Code quality and linting

# Authentication
npm run test:auth                # Core authentication service
npm run test:google-auth         # Google OAuth integration
npm run test:linkedin-auth       # LinkedIn OAuth integration
npm run test:tokens              # Token utilities and storage

# Profile Management
npm run test:profile             # Profile CRUD operations
npm run test:profile-validation  # Profile data validation
```

## 🃏 Phase 2: Digital Business Card Tests

### Complete Phase 2 Suite

```bash
npm run test:phase2              # Basic execution
npm run test:phase2:verbose      # Detailed output
npm run test:phase2:coverage     # With coverage report
```

### Individual Phase 2 Tests

```bash
# Core Features
npm run test:card-creation       # Card creation with all field types
npm run test:qr-code            # QR code generation and scanning
npm run test:deep-link          # Deep link handling
npm run test:card-preview       # Card preview rendering

# Advanced Features
npm run test:sharing            # Share functionality (iOS/Android)
npm run test:wallet             # Wallet integration (Apple/Google)
npm run test:businesscard-integration # End-to-end integration
```

## 🔧 Advanced Test Options

### Individual Test Runner

```bash
# Run any individual test with options
node _tests_/scripts/runIndividualTest.js <test-name> [options]

# Examples:
node _tests_/scripts/runIndividualTest.js qrCode --verbose
node _tests_/scripts/runIndividualTest.js cardCreation --coverage
node _tests_/scripts/runIndividualTest.js authService --watch

# See all available tests:
node _tests_/scripts/runIndividualTest.js --help
```

### Available Test Names

**Phase 1:**

- `setup`, `typescript`, `linting`
- `tokenUtils`, `tokenStorage`, `authService`
- `googleAuth`, `linkedinAuth`
- `profileValidation`, `profileService`, `profileErrors`, `profileHook`
- `authIntegration`, `profileScreens`

**Phase 2:**

- `cardCreation`, `qrCode`, `deepLink`, `preview`
- `sharing`, `wallet`, `integration`

**Special:**

- `phase1` - All Phase 1 tests
- `phase2` - All Phase 2 tests
- `all` - Both phases sequentially

## 🗂️ Test Structure

```
_tests_/
├── setup/                       # Project setup validation
│   ├── project-setup.test.ts    # Project configuration and dependencies
│   ├── typescript.test.ts       # TypeScript configuration
│   └── linting.test.ts          # Code quality and linting
├── unit/
│   ├── auth/                    # Authentication unit tests
│   │   └── tokenUtils.test.ts   # JWT token utilities
│   ├── profile/                 # Profile management tests
│   │   ├── profileValidation.test.ts    # Profile data validation
│   │   ├── profileService.test.ts       # Profile CRUD operations
│   │   ├── profileErrorHandling.test.ts # Error handling
│   │   └── useProfile.test.ts           # React hook tests
│   ├── businessCard/            # Business card unit tests
│   │   ├── cardCreation.test.ts         # Card creation with all field types
│   │   ├── qrCodeGeneration.test.ts     # QR code generation and scanning
│   │   ├── deepLinking.test.ts          # Deep link handling
│   │   ├── cardPreview.test.tsx         # Card preview rendering
│   │   ├── sharing.test.ts              # Share functionality (iOS/Android)
│   │   └── walletIntegration.test.ts    # Wallet integration
│   ├── authService.test.ts      # Core authentication service
│   ├── googleAuthService.test.ts # Google OAuth integration
│   ├── linkedinAuthService.test.ts # LinkedIn OAuth integration
│   └── tokenStorage.test.ts     # Secure token storage
├── integration/                 # Integration tests
│   ├── auth.integration.test.ts # Authentication workflows
│   ├── businessCard.integration.test.ts # Business card workflows
│   └── profile/
│       └── profileScreens.test.tsx # Profile UI integration
└── scripts/                     # Test runners
    ├── runPhase1Tests.js        # Complete Phase 1 test suite
    ├── runPhase2Tests.js        # Complete Phase 2 test suite
    └── runIndividualTest.js     # Individual/combined test runner
```

## ▶️ Running Tests

### Local Testing

```bash
# Run all tests
npm test

# Run specific test files
npm test App.test
npm test android-build
npm test ios-build
npm test linting
npm test project-setup
npm test typescript

# Run test folders
npm test _tests_/integration
npm test _tests_/setup

# Run with coverage
npm test -- --coverage
```

### VS Code Integration

- Install Jest extension for VS Code
- Click ▶️ buttons next to individual tests
- Use Test Explorer panel (Ctrl+Shift+T)
- Debug tests with 🐛 button

## 🤖 Automated Testing

### GitHub Actions

- **Daily Tests**: Run automatically at 8:00 AM UTC
- **Push/PR Tests**: Run on code changes (CI workflow)
- **Coverage Reports**: Generated and uploaded as artifacts

### Build Tests Timeline

#### 🤖 **Current Phase: Development Focus**

- ✅ **Code Quality Tests**: Active (linting, type checking, unit tests)
- ⏸️ **Android/iOS Build Tests**: Disabled (manual trigger only)

#### 🏗️ **When to Re-enable Build Tests**

**Android Build Tests** - Re-enable when:

- ✅ Android project fully configured (gradle, SDK, dependencies)
- ✅ MainActivity and AndroidManifest.xml properly set up
- ✅ Local build works: `cd android && ./gradlew assembleDebug`
- 🎯 **Timeline**: Alpha/Beta phase or when adding native Android features

**iOS Build Tests** - Re-enable when:

- ✅ iOS project fully configured (Xcode, Info.plist, provisioning)
- ✅ CocoaPods resolved: `cd ios && pod install`
- ✅ Local build works: Xcode or command line builds
- 🎯 **Timeline**: Alpha/Beta phase or when adding native iOS features

#### 🚀 **Re-enabling Process**

Change workflow triggers from `workflow_dispatch` back to:

```yaml
on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]
```

## 🧪 Test Categories

### ✅ Always Active Tests

- **App Component**: Main app rendering validation
- **Linting**: ESLint, Prettier, code quality
- **Project Setup**: Dependencies, file structure, configuration
- **TypeScript**: Type definitions and configuration

### ⏸️ Conditionally Skipped Tests

- **TypeScript Compilation**: Resource-intensive (manual trigger)
- **Android APK Build**: Full build process (weekly/manual)
- **iOS App Build**: Full build process (weekly/manual)
- **Pod Install**: CocoaPods dependency installation

## 📈 Coverage Reports

Coverage reports are generated automatically and include:

- Line coverage for all source files
- Function and branch coverage metrics
- HTML reports available as GitHub Actions artifacts
- Daily coverage tracking via automated workflows

## 🎯 Best Practices

1. **Keep fast tests active** - Unit tests, linting, type checking
2. **Defer heavy tests** - Full builds, integration tests with external deps
3. **Use skipped tests** - Keep resource-intensive tests available but disabled
4. **Manual triggers** - Build tests available when needed
5. **Progressive enablement** - Re-enable build tests as project matures

This approach ensures fast feedback during development while maintaining comprehensive validation capabilities.
