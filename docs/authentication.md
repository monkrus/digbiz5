# Authentication System Documentation

## Overview

The authentication system is a comprehensive solution for React Native applications that provides secure user authentication with multiple login methods, JWT token management, and automatic token refresh capabilities.

## Architecture

### Core Components

1. **AuthenticationService** - Main service handling all authentication operations
2. **TokenStorage** - Secure token storage using MMKV encryption
3. **Google/LinkedIn OAuth Services** - Social login integrations
4. **Redux Store** - Global authentication state management
5. **useAuth Hook** - React hook for authentication operations

### Key Features

- Email/password authentication
- Google OAuth integration
- LinkedIn OAuth integration
- Secure JWT token storage with encryption
- Automatic token refresh
- Password reset functionality
- User profile management
- Redux state management
- Comprehensive error handling

## Services

### AuthenticationService

The main authentication service that handles all authentication operations.

#### Key Methods

```typescript
// Email/password authentication
async login(credentials: LoginCredentials): Promise<AuthResponse>
async register(data: RegisterData): Promise<AuthResponse>

// Social authentication
async loginWithGoogle(data: SocialLoginData): Promise<AuthResponse>
async loginWithLinkedIn(data: SocialLoginData): Promise<AuthResponse>

// Token management
async refreshTokens(): Promise<RefreshTokenResponse>
async validateToken(token: string): Promise<boolean>

// User management
async getCurrentUser(): Promise<User | null>
async updateProfile(data: Partial<User>): Promise<User>

// Password management
async requestPasswordReset(data: PasswordResetData): Promise<{success: boolean; message: string}>
async updatePassword(data: PasswordUpdateData): Promise<{success: boolean; message: string}>

// Session management
async logout(): Promise<void>
async isAuthenticated(): Promise<boolean>
```

### TokenStorage

Secure storage service for JWT tokens using MMKV with AES encryption.

#### Features

- AES encryption for all stored tokens
- Automatic encryption key generation and management
- Token validation with expiration checking
- Secure token retrieval and storage
- Error handling with fallback mechanisms

#### Key Methods

```typescript
async setTokens(tokens: JWTTokens): Promise<void>
async getTokens(): Promise<JWTTokens | null>
async removeTokens(): Promise<void>
async hasValidTokens(): Promise<boolean>
async getAccessToken(): Promise<string | null>
async getRefreshToken(): Promise<string | null>
async isRefreshTokenValid(): Promise<boolean>
async clearAllData(): Promise<void>
```

### Google OAuth Service

Integration with Google Sign-In for React Native.

#### Configuration

```typescript
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});
```

#### Key Methods

```typescript
async initialize(): Promise<void>
async signIn(): Promise<SocialLoginData>
async signInSilently(): Promise<SocialLoginData | null>
async signOut(): Promise<void>
async revokeAccess(): Promise<void>
async isSignedIn(): Promise<boolean>
async getCurrentUser(): Promise<SocialLoginData | null>
```

### LinkedIn OAuth Service

Custom LinkedIn OAuth implementation using WebView.

#### Key Methods

```typescript
getAuthorizationUrl(): string
async exchangeCodeForToken(code: string, state: string): Promise<LinkedInTokenResponse>
async getUserProfile(accessToken: string): Promise<LinkedInProfile>
async authenticate(code: string, state: string): Promise<SocialLoginData>
```

## Redux Store

### Auth Slice

The authentication Redux slice manages global authentication state.

#### State Structure

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  tokens: JWTTokens | null;
}
```

#### Actions

- `loginStart()` - Set loading state for login
- `loginSuccess(payload)` - Handle successful login
- `loginFailure(error)` - Handle login error
- `logout()` - Clear authentication state
- `refreshTokensStart()` - Set loading state for token refresh
- `refreshTokensSuccess(tokens)` - Handle successful token refresh
- `refreshTokensFailure(error)` - Handle token refresh error
- `updateUser(user)` - Update user profile
- `clearError()` - Clear error state

## Hooks

### useAuth Hook

React hook providing authentication functionality.

#### Available Methods

```typescript
const {
  // State
  isAuthenticated,
  user,
  loading,
  error,
  
  // Actions
  login,
  register,
  logout,
  refreshTokens,
  loginWithGoogle,
  loginWithLinkedIn,
  updateProfile,
  requestPasswordReset,
  updatePassword,
  initializeAuth,
  clearError
} = useAuth();
```

## Types

### Core Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SocialLoginData {
  accessToken: string;
  idToken?: string;
  profile: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
  };
}
```

## Configuration

### Environment Variables

```typescript
// API Configuration
API_URL=https://your-api.com
API_TIMEOUT=10000

// Google OAuth
GOOGLE_WEB_CLIENT_ID=your-google-client-id

// LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=your-app://auth/linkedin/callback
```

### App Configuration

```typescript
export const AppConfig = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  apiTimeout: parseInt(process.env.API_TIMEOUT || '10000'),
  googleClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  linkedinRedirectUri: process.env.LINKEDIN_REDIRECT_URI,
};
```

## Usage Examples

### Basic Login

```typescript
import { useAuth } from '../hooks/useAuth';

const LoginScreen = () => {
  const { login, loading, error } = useAuth();
  
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
      // Navigation to authenticated screens
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    // Login form UI
  );
};
```

### Google OAuth

```typescript
import { GoogleAuthService } from '../services/googleAuthService';
import { useAuth } from '../hooks/useAuth';

const GoogleLoginButton = () => {
  const { loginWithGoogle } = useAuth();
  const googleAuth = new GoogleAuthService();
  
  const handleGoogleLogin = async () => {
    try {
      await googleAuth.initialize();
      const loginData = await googleAuth.signIn();
      await loginWithGoogle(loginData);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
  
  return (
    <TouchableOpacity onPress={handleGoogleLogin}>
      <Text>Sign in with Google</Text>
    </TouchableOpacity>
  );
};
```

### Auto-Refresh Token

```typescript
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const App = () => {
  const { initializeAuth, refreshTokens } = useAuth();
  
  useEffect(() => {
    // Initialize auth state on app start
    initializeAuth();
    
    // Set up auto-refresh interval
    const refreshInterval = setInterval(async () => {
      try {
        await refreshTokens();
      } catch (error) {
        // Handle refresh failure (user will be logged out)
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  return <AppContent />;
};
```

## Security Considerations

### Token Storage

- All tokens are encrypted using AES encryption before storage
- Encryption keys are generated using crypto-secure random methods
- MMKV provides secure storage with encryption support
- Tokens are automatically cleared on app uninstall

### Token Management

- Access tokens have short expiration times (1 hour recommended)
- Refresh tokens have longer expiration times (7 days recommended)
- Automatic token refresh prevents session interruption
- Failed refresh attempts clear all authentication state

### Network Security

- All API requests use HTTPS
- Bearer token authentication for protected endpoints
- Request timeouts prevent hanging requests
- Error responses don't expose sensitive information

### Input Validation

- Email format validation
- Password strength requirements
- CSRF protection via state parameters for OAuth
- Input sanitization for all user data

## Error Handling

### Authentication Errors

```typescript
try {
  await login(credentials);
} catch (error) {
  switch (error.message) {
    case 'Invalid credentials':
      // Handle invalid login
      break;
    case 'Account locked':
      // Handle account lockout
      break;
    case 'Network error':
      // Handle network issues
      break;
    default:
      // Handle unknown errors
  }
}
```

### Token Refresh Errors

```typescript
try {
  await refreshTokens();
} catch (error) {
  if (error.message === 'Session expired. Please login again.') {
    // Redirect to login screen
    // Clear any cached user data
  }
}
```

## Testing

### Unit Tests

The authentication system includes comprehensive unit tests:

- `authService.test.ts` - Authentication service tests
- `tokenStorage.test.ts` - Token storage tests
- `googleAuthService.test.ts` - Google OAuth tests
- `linkedinAuthService.test.ts` - LinkedIn OAuth tests
- `tokenUtils.test.ts` - JWT utility tests

### Integration Tests

- `auth.integration.test.ts` - Full authentication flow tests

### Running Tests

```bash
npm test -- --testPathPattern="unit.*auth"
npm test -- --testPathPattern="integration.*auth"
```

## Troubleshooting

### Common Issues

1. **Google Sign-In fails**
   - Verify Google Client ID configuration
   - Check Google Play Services availability
   - Ensure SHA-1 fingerprints are configured

2. **LinkedIn OAuth fails**
   - Verify client ID and secret configuration
   - Check redirect URI matches exactly
   - Ensure proper URL encoding

3. **Token refresh fails**
   - Check token expiration times
   - Verify API endpoints are correct
   - Check network connectivity

4. **Storage errors**
   - Clear app data and reinstall
   - Check device storage availability
   - Verify MMKV initialization

### Debug Logging

Enable debug logging for authentication:

```typescript
// Enable in development only
if (__DEV__) {
  console.log('Auth state:', authState);
  console.log('Token info:', tokenInfo);
}
```

## API Endpoints

The authentication system expects the following API endpoints:

### Authentication

- `POST /auth/login` - Email/password login
- `POST /auth/register` - User registration  
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `POST /auth/validate` - Token validation
- `GET /auth/me` - Get current user

### OAuth

- `POST /auth/oauth/google` - Google OAuth login
- `POST /auth/oauth/linkedin` - LinkedIn OAuth login

### Password Management

- `POST /auth/password/reset-request` - Request password reset
- `POST /auth/password/reset-confirm` - Confirm password reset

### Profile Management

- `PUT /auth/profile` - Update user profile

## Performance Considerations

### Token Management

- Tokens are cached in memory after first retrieval
- Encryption/decryption operations are performed asynchronously
- Token validation uses local checks before server validation

### Network Optimization

- Request deduplication for token refresh
- Retry logic with exponential backoff
- Connection pooling for API requests

### Memory Management

- Sensitive data is cleared from memory after use
- WeakRefs used for callback references
- Proper cleanup in useEffect hooks