# CI/CD Workflows

This project uses GitHub Actions for continuous integration and deployment with Fastlane for automated builds and deployments.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:** Push/PR to `master` or `main` branches

**Actions:**

- Runs ESLint for code quality
- Performs TypeScript type checking
- Executes test suite with coverage
- Uploads coverage reports to Codecov

### 2. Android Build (`android-build.yml`)

**Triggers:** Push/PR to `master` or `main` branches

**Actions:**

- Sets up Android SDK and Java 17
- Builds debug APK
- Uploads APK artifacts for 30 days

### 3. iOS Build (`ios-build.yml`)

**Triggers:** Push/PR to `master` or `main` branches

**Actions:**

- Sets up iOS build environment on macOS
- Installs CocoaPods dependencies
- Builds iOS app for simulator
- Archives build artifacts

### 4. Deployment (`deploy.yml`)

**Triggers:**

- Git tags (v\*)
- Manual workflow dispatch

**Actions:**

- Deploys to TestFlight (iOS) or Google Play (Android)
- Supports beta and production tracks
- Can deploy single platform or both

## Required Secrets

### Android Deployment

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Google Play Console service account JSON

### iOS Deployment

- `IOS_DISTRIBUTION_CERTIFICATE_P12`: iOS distribution certificate (base64 encoded)
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`: Certificate password
- `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`: App-specific password
- `FASTLANE_SESSION`: Fastlane session cookie
- `MATCH_PASSWORD`: Match encryption password (if using match)

### Coverage (Optional)

- `CODECOV_TOKEN`: Codecov upload token

## Fastlane Setup

### iOS Configuration

1. Update `ios/fastlane/Appfile` with your Apple Developer account details
2. Configure your app identifier and team ID
3. Set up code signing (certificates and provisioning profiles)

### Android Configuration

1. Update `android/fastlane/Appfile` with your app package name
2. Place Google Play service account JSON file in the project
3. Configure signing keys for release builds

## Usage

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Choose platform and track
5. Click "Run workflow"

### Automatic Deployment

Create a git tag to trigger automatic deployment:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Local Development

Run Fastlane locally:

```bash
# iOS
cd ios
bundle exec fastlane build

# Android
cd android
bundle exec fastlane build
```
