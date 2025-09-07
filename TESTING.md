# Testing Guide

## 📊 Test Suite Overview

This project includes a comprehensive test suite with **6 test files** containing **59 total tests** (55 passing, 4 appropriately skipped).

### 🗂️ Test Structure

```
_tests_/
├── setup.js                    # Jest setup and mocks
├── integration/                # Integration tests (3 files)
│   ├── App.test.tsx            # Main app component testing
│   ├── android-build.test.ts   # Android project validation
│   └── ios-build.test.ts       # iOS project validation
└── setup/                      # Setup validation tests (3 files)
    ├── linting.test.ts         # Code quality and ESLint validation
    ├── project-setup.test.ts   # Dependencies and file structure
    └── typescript.test.ts      # TypeScript configuration validation
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
