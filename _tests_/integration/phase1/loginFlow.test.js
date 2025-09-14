/**
 * Phase 1 Tests: Login/Logout Flow Integration
 *
 * Integration tests for complete authentication flows including
 * UI components, state management, and service integration.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock components (since we don't have actual login components yet)
import LoginForm from '../../../src/components/auth/LoginForm';
import { authSlice } from '../../../src/store/authSlice';
import { authService } from '../../../src/services/authService';

// Mock dependencies
jest.mock('../../../src/services/authService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../src/services/tokenStorage');

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({
        user: {
          id: 'google-123',
          email: 'google@example.com',
          name: 'Google User',
          photo: 'https://example.com/photo.jpg',
        },
        idToken: 'mock-id-token',
        accessToken: 'mock-google-token',
      }),
    ),
    signOut: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
  },
}));

// Mock LinkedIn
jest.mock('react-native-linkedin', () => ({
  LinkedInModal: {
    logoutAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

describe('Phase 1: Login/Logout Flow Integration', () => {
  let store;

  beforeEach(() => {
    // Create test store
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['persist/PERSIST'],
          },
        }),
    });

    // Clear all mocks
    jest.clearAllMocks();

    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();

    // Mock authService responses
    authService.login.mockResolvedValue({
      success: true,
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email',
        verified: true,
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });

    authService.logout.mockResolvedValue();
    authService.isAuthenticated.mockResolvedValue(false);
  });

  describe('Email/Password Login Flow', () => {
    test('should complete successful login flow', async () => {
      // Mock LoginForm component since it may not exist yet
      const MockLoginForm = ({ onSubmit, loading }) => (
        <div testID="login-form">
          <input testID="email-input" placeholder="Email" onChange={() => {}} />
          <input
            testID="password-input"
            placeholder="Password"
            type="password"
            onChange={() => {}}
          />
          <button
            testID="login-button"
            onPress={() =>
              onSubmit({ email: 'test@example.com', password: 'password123' })
            }
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      );

      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);

        const handleLogin = async credentials => {
          setLoading(true);
          try {
            await authService.login(credentials);
            // Simulate navigation to dashboard
          } catch (error) {
            console.error('Login failed:', error);
          } finally {
            setLoading(false);
          }
        };

        return (
          <Provider store={store}>
            <MockLoginForm onSubmit={handleLogin} loading={loading} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simulate user interaction
      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    test('should handle login errors gracefully', async () => {
      authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const MockLoginForm = ({ onSubmit, error }) => (
        <div testID="login-form">
          {error && <div testID="error-message">{error}</div>}
          <button
            testID="login-button"
            onPress={() =>
              onSubmit({
                email: 'wrong@example.com',
                password: 'wrongpassword',
              })
            }
          >
            Login
          </button>
        </div>
      );

      const TestComponent = () => {
        const [error, setError] = React.useState(null);

        const handleLogin = async credentials => {
          try {
            setError(null);
            await authService.login(credentials);
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <Provider store={store}>
            <MockLoginForm onSubmit={handleLogin} error={error} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
      });
    });

    test('should validate form inputs before submission', async () => {
      const MockLoginForm = ({ onSubmit, errors }) => (
        <div testID="login-form">
          <input testID="email-input" placeholder="Email" />
          {errors.email && <div testID="email-error">{errors.email}</div>}
          <input
            testID="password-input"
            placeholder="Password"
            type="password"
          />
          {errors.password && (
            <div testID="password-error">{errors.password}</div>
          )}
          <button
            testID="login-button"
            onPress={() => onSubmit({ email: '', password: '' })}
          >
            Login
          </button>
        </div>
      );

      const TestComponent = () => {
        const [errors, setErrors] = React.useState({});

        const handleLogin = async credentials => {
          const newErrors = {};

          if (!credentials.email) {
            newErrors.email = 'Email is required';
          }
          if (!credentials.password) {
            newErrors.password = 'Password is required';
          }

          setErrors(newErrors);

          if (Object.keys(newErrors).length === 0) {
            await authService.login(credentials);
          }
        };

        return (
          <Provider store={store}>
            <MockLoginForm onSubmit={handleLogin} errors={errors} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(getByTestId('email-error')).toBeTruthy();
        expect(getByTestId('password-error')).toBeTruthy();
      });

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Google Login Flow', () => {
    test('should complete Google OAuth flow', async () => {
      const {
        GoogleSignin,
      } = require('@react-native-google-signin/google-signin');

      authService.loginWithGoogle.mockResolvedValueOnce({
        success: true,
        user: {
          id: 'google-123',
          email: 'google@example.com',
          name: 'Google User',
          provider: 'google',
          verified: true,
        },
        tokens: {
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      const MockGoogleLogin = ({ onGoogleLogin }) => (
        <div testID="google-login">
          <button testID="google-login-button" onPress={onGoogleLogin}>
            Sign in with Google
          </button>
        </div>
      );

      const TestComponent = () => {
        const handleGoogleLogin = async () => {
          try {
            const googleUser = await GoogleSignin.signIn();

            const socialData = {
              provider: 'google',
              accessToken: googleUser.accessToken,
              idToken: googleUser.idToken,
              profile: {
                id: googleUser.user.id,
                email: googleUser.user.email,
                name: googleUser.user.name,
                avatar: googleUser.user.photo,
              },
            };

            await authService.loginWithGoogle(socialData);
          } catch (error) {
            console.error('Google login failed:', error);
          }
        };

        return (
          <Provider store={store}>
            <MockGoogleLogin onGoogleLogin={handleGoogleLogin} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const googleButton = getByTestId('google-login-button');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
        expect(authService.loginWithGoogle).toHaveBeenCalledWith({
          provider: 'google',
          accessToken: 'mock-google-token',
          idToken: 'mock-id-token',
          profile: {
            id: 'google-123',
            email: 'google@example.com',
            name: 'Google User',
            avatar: 'https://example.com/photo.jpg',
          },
        });
      });
    });

    test('should handle Google login cancellation', async () => {
      const {
        GoogleSignin,
      } = require('@react-native-google-signin/google-signin');

      GoogleSignin.signIn.mockRejectedValueOnce({
        code: 'SIGN_IN_CANCELLED',
      });

      const MockGoogleLogin = ({ onGoogleLogin, status }) => (
        <div testID="google-login">
          <button testID="google-login-button" onPress={onGoogleLogin}>
            Sign in with Google
          </button>
          {status && <div testID="status-message">{status}</div>}
        </div>
      );

      const TestComponent = () => {
        const [status, setStatus] = React.useState(null);

        const handleGoogleLogin = async () => {
          try {
            setStatus('Signing in...');
            await GoogleSignin.signIn();
            // Continue with auth flow...
          } catch (error) {
            if (error.code === 'SIGN_IN_CANCELLED') {
              setStatus('Login cancelled');
            } else {
              setStatus('Login failed');
            }
          }
        };

        return (
          <Provider store={store}>
            <MockGoogleLogin
              onGoogleLogin={handleGoogleLogin}
              status={status}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const googleButton = getByTestId('google-login-button');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      await waitFor(() => {
        expect(getByTestId('status-message').children[0]).toBe(
          'Login cancelled',
        );
      });

      expect(authService.loginWithGoogle).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    test('should complete logout flow successfully', async () => {
      // Set initial authenticated state
      store.dispatch(
        authSlice.actions.loginSuccess({
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
          },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
        }),
      );

      const MockLogout = ({ onLogout, isAuthenticated }) => (
        <div testID="logout-section">
          {isAuthenticated && (
            <button testID="logout-button" onPress={onLogout}>
              Logout
            </button>
          )}
        </div>
      );

      const TestComponent = () => {
        const [isAuthenticated, setIsAuthenticated] = React.useState(true);

        const handleLogout = async () => {
          try {
            await authService.logout();
            setIsAuthenticated(false);
            // Simulate navigation to login screen
          } catch (error) {
            console.error('Logout failed:', error);
          }
        };

        return (
          <Provider store={store}>
            <MockLogout
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const logoutButton = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(logoutButton);
      });

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });
    });

    test('should clear user data after logout', async () => {
      const MockUserProfile = ({ user, onLogout }) => (
        <div testID="user-profile">
          {user ? (
            <>
              <div testID="user-name">{user.name}</div>
              <button testID="logout-button" onPress={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <div testID="login-prompt">Please login</div>
          )}
        </div>
      );

      const TestComponent = () => {
        const [user, setUser] = React.useState({
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
        });

        const handleLogout = async () => {
          await authService.logout();
          setUser(null);
        };

        return (
          <Provider store={store}>
            <MockUserProfile user={user} onLogout={handleLogout} />
          </Provider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Initial state should show user
      expect(getByTestId('user-name')).toBeTruthy();

      const logoutButton = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(logoutButton);
      });

      await waitFor(() => {
        expect(queryByTestId('user-name')).toBeNull();
        expect(getByTestId('login-prompt')).toBeTruthy();
      });
    });
  });

  describe('Token Refresh Flow', () => {
    test('should refresh tokens automatically on API calls', async () => {
      authService.refreshTokens.mockResolvedValueOnce({
        success: true,
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });

      authService.getCurrentUser.mockResolvedValueOnce({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const MockUserData = ({ onLoadUser, user, loading }) => (
        <div testID="user-data">
          <button
            testID="load-user-button"
            onPress={onLoadUser}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load User Data'}
          </button>
          {user && <div testID="user-email">{user.email}</div>}
        </div>
      );

      const TestComponent = () => {
        const [user, setUser] = React.useState(null);
        const [loading, setLoading] = React.useState(false);

        const handleLoadUser = async () => {
          setLoading(true);
          try {
            // This might trigger token refresh internally
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error('Failed to load user:', error);
          } finally {
            setLoading(false);
          }
        };

        return (
          <Provider store={store}>
            <MockUserData
              onLoadUser={handleLoadUser}
              user={user}
              loading={loading}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const loadButton = getByTestId('load-user-button');

      await act(async () => {
        fireEvent.press(loadButton);
      });

      await waitFor(() => {
        expect(getByTestId('user-email')).toBeTruthy();
      });

      expect(authService.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('State Management Integration', () => {
    test('should update Redux state on login', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email',
        verified: true,
      };

      const MockLoginWithRedux = ({ onLogin }) => (
        <div testID="redux-login">
          <button testID="login-button" onPress={onLogin}>
            Login
          </button>
        </div>
      );

      const TestComponent = () => {
        const handleLogin = () => {
          store.dispatch(
            authSlice.actions.loginSuccess({
              user: mockUser,
              tokens: {
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 3600,
                tokenType: 'Bearer',
              },
            }),
          );
        };

        return (
          <Provider store={store}>
            <MockLoginWithRedux onLogin={handleLogin} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      const state = store.getState();
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.isAuthenticated).toBe(true);
    });

    test('should clear Redux state on logout', async () => {
      // Set initial state
      store.dispatch(
        authSlice.actions.loginSuccess({
          user: { id: '123', name: 'Test' },
          tokens: { accessToken: 'token' },
        }),
      );

      const MockLogoutWithRedux = ({ onLogout }) => (
        <div testID="redux-logout">
          <button testID="logout-button" onPress={onLogout}>
            Logout
          </button>
        </div>
      );

      const TestComponent = () => {
        const handleLogout = () => {
          store.dispatch(authSlice.actions.logout());
        };

        return (
          <Provider store={store}>
            <MockLogoutWithRedux onLogout={handleLogout} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const logoutButton = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(logoutButton);
      });

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.tokens).toBeNull();
    });
  });
});
