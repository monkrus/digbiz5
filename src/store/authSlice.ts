/**
 * Authentication Redux Slice
 *
 * Redux Toolkit slice for managing authentication state, actions, and reducers.
 * Handles login, logout, registration, social auth, and token management.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AuthState,
  User,
  JWTTokens,
  LoginCredentials,
  RegisterData,
  PasswordResetData,
  PasswordUpdateData,
} from '../types/auth';
import { authService } from '../services/authService';
import { googleAuthService } from '../services/googleAuthService';
import { linkedInAuthService } from '../services/linkedinAuthService';
import { tokenRefreshService } from '../services/tokenRefreshService';

// Initial authentication state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for authentication actions

/**
 * Login with email and password
 */
export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }

      // Start token refresh service
      await tokenRefreshService.start();

      return { user: response.user, tokens: response.tokens };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed',
      );
    }
  },
);

/**
 * Register new user
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);

      if (!response.success) {
        return rejectWithValue(response.message || 'Registration failed');
      }

      // Start token refresh service
      await tokenRefreshService.start();

      return { user: response.user, tokens: response.tokens };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed',
      );
    }
  },
);

/**
 * Login with Google
 */
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await googleAuthService.signIn();

      if (!response.success) {
        return rejectWithValue(response.message || 'Google login failed');
      }

      // Start token refresh service
      await tokenRefreshService.start();

      return { user: response.user, tokens: response.tokens };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Google login failed',
      );
    }
  },
);

/**
 * Login with LinkedIn
 */
export const loginWithLinkedIn = createAsyncThunk(
  'auth/loginWithLinkedIn',
  async (
    { code, state }: { code: string; state: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await linkedInAuthService.signInWithCode(code, state);

      if (!response.success) {
        return rejectWithValue(response.message || 'LinkedIn login failed');
      }

      // Start token refresh service
      await tokenRefreshService.start();

      return { user: response.user, tokens: response.tokens };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'LinkedIn login failed',
      );
    }
  },
);

/**
 * Refresh authentication tokens
 */
export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refreshTokens();

      if (!response.success) {
        return rejectWithValue('Token refresh failed');
      }

      return response.tokens;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token refresh failed',
      );
    }
  },
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();

      // Stop token refresh service
      tokenRefreshService.stop();

      // Sign out from Google if signed in
      try {
        if (await googleAuthService.isSignedIn()) {
          await googleAuthService.signOut();
        }
      } catch (error) {
        console.warn('Google sign out failed:', error);
      }

      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Logout failed',
      );
    }
  },
);

/**
 * Initialize authentication from stored tokens
 */
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (!isAuthenticated) {
        return null;
      }

      const [user, tokens] = await Promise.all([
        authService.getCurrentUser(),
        authService.getStoredTokens(),
      ]);

      if (user && tokens) {
        // Start token refresh service
        await tokenRefreshService.start();
        return { user, tokens };
      }

      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Auth initialization failed',
      );
    }
  },
);

/**
 * Request password reset
 */
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (data: PasswordResetData, { rejectWithValue }) => {
    try {
      const response = await authService.requestPasswordReset(data);
      return response.message;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Password reset request failed',
      );
    }
  },
);

/**
 * Update password with reset token
 */
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (data: PasswordUpdateData, { rejectWithValue }) => {
    try {
      const response = await authService.updatePassword(data);
      return response.message;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password update failed',
      );
    }
  },
);

/**
 * Update user profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Profile update failed',
      );
    }
  },
);

// Authentication slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear authentication error
    clearError: state => {
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set user data
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },

    // Set tokens
    setTokens: (state, action: PayloadAction<JWTTokens | null>) => {
      state.tokens = action.payload;
    },

    // Update authentication state
    updateAuthState: (
      state,
      action: PayloadAction<{ user?: User; tokens?: JWTTokens }>,
    ) => {
      if (action.payload.user) {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
      if (action.payload.tokens) {
        state.tokens = action.payload.tokens;
      }
    },
  },
  extraReducers: builder => {
    // Login with email
    builder
      .addCase(loginWithEmail.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register user
    builder
      .addCase(registerUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Google login
    builder
      .addCase(loginWithGoogle.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // LinkedIn login
    builder
      .addCase(loginWithLinkedIn.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithLinkedIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithLinkedIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Token refresh
    builder
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.tokens = action.payload;
        state.error = null;
      })
      .addCase(refreshTokens.rejected, (state, action) => {
        state.error = action.payload as string;
        // Don't clear auth state on refresh failure - let token service handle it
      });

    // Logout
    builder
      .addCase(logoutUser.pending, state => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Still clear auth state even if logout API call fails
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    // Initialize auth
    builder
      .addCase(initializeAuth.pending, state => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.tokens = action.payload.tokens;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.tokens = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, setLoading, setUser, setTokens, updateAuthState } =
  authSlice.actions;

// Export slice
export { authSlice };

// Export reducer
export default authSlice.reducer;
