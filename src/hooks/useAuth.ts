/**
 * Authentication Hooks
 *
 * Custom React hooks for authentication state management and actions.
 * Provides convenient access to auth state and dispatch functions.
 */

import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  loginWithEmail,
  registerUser,
  loginWithGoogle,
  loginWithLinkedIn,
  logoutUser,
  initializeAuth,
  refreshTokens,
  requestPasswordReset,
  updatePassword,
  updateProfile,
  clearError,
  setLoading,
} from '../store/authSlice';
import {
  LoginCredentials,
  RegisterData,
  PasswordResetData,
  PasswordUpdateData,
  User,
} from '../types/auth';

/**
 * Main authentication hook
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);

  // Action creators
  const login = useCallback(
    (credentials: LoginCredentials) => dispatch(loginWithEmail(credentials)),
    [dispatch],
  );

  const register = useCallback(
    (userData: RegisterData) => dispatch(registerUser(userData)),
    [dispatch],
  );

  const loginGoogle = useCallback(
    () => dispatch(loginWithGoogle()),
    [dispatch],
  );

  const loginLinkedIn = useCallback(
    (code: string, state: string) =>
      dispatch(loginWithLinkedIn({ code, state })),
    [dispatch],
  );

  const logout = useCallback(() => dispatch(logoutUser()), [dispatch]);

  const initialize = useCallback(() => dispatch(initializeAuth()), [dispatch]);

  const refresh = useCallback(() => dispatch(refreshTokens()), [dispatch]);

  const resetPassword = useCallback(
    (data: PasswordResetData) => dispatch(requestPasswordReset(data)),
    [dispatch],
  );

  const changePassword = useCallback(
    (data: PasswordUpdateData) => dispatch(updatePassword(data)),
    [dispatch],
  );

  const updateUserProfile = useCallback(
    (data: Partial<User>) => dispatch(updateProfile(data)),
    [dispatch],
  );

  const clearAuthError = useCallback(() => dispatch(clearError()), [dispatch]);

  const setAuthLoading = useCallback(
    (loading: boolean) => dispatch(setLoading(loading)),
    [dispatch],
  );

  return {
    // State
    ...authState,

    // Actions
    login,
    register,
    loginGoogle,
    loginLinkedIn,
    logout,
    initialize,
    refresh,
    resetPassword,
    changePassword,
    updateUserProfile,
    clearError: clearAuthError,
    setLoading: setAuthLoading,
  };
};

/**
 * Hook for authentication state only (no actions)
 */
export const useAuthState = () => {
  return useSelector((state: RootState) => state.auth);
};

/**
 * Hook for current user data
 */
export const useCurrentUser = () => {
  return useSelector((state: RootState) => state.auth.user);
};

/**
 * Hook for authentication status
 */
export const useIsAuthenticated = () => {
  return useSelector((state: RootState) => state.auth.isAuthenticated);
};

/**
 * Hook for authentication loading state
 */
export const useAuthLoading = () => {
  return useSelector((state: RootState) => state.auth.isLoading);
};

/**
 * Hook for authentication error
 */
export const useAuthError = () => {
  return useSelector((state: RootState) => state.auth.error);
};

/**
 * Hook for JWT tokens
 */
export const useAuthTokens = () => {
  return useSelector((state: RootState) => state.auth.tokens);
};

/**
 * Hook for authentication actions only
 */
export const useAuthActions = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    login: useCallback(
      (credentials: LoginCredentials) => dispatch(loginWithEmail(credentials)),
      [dispatch],
    ),
    register: useCallback(
      (userData: RegisterData) => dispatch(registerUser(userData)),
      [dispatch],
    ),
    loginGoogle: useCallback(() => dispatch(loginWithGoogle()), [dispatch]),
    loginLinkedIn: useCallback(
      (code: string, state: string) =>
        dispatch(loginWithLinkedIn({ code, state })),
      [dispatch],
    ),
    logout: useCallback(() => dispatch(logoutUser()), [dispatch]),
    initialize: useCallback(() => dispatch(initializeAuth()), [dispatch]),
    refresh: useCallback(() => dispatch(refreshTokens()), [dispatch]),
    resetPassword: useCallback(
      (data: PasswordResetData) => dispatch(requestPasswordReset(data)),
      [dispatch],
    ),
    changePassword: useCallback(
      (data: PasswordUpdateData) => dispatch(updatePassword(data)),
      [dispatch],
    ),
    updateProfile: useCallback(
      (data: Partial<User>) => dispatch(updateProfile(data)),
      [dispatch],
    ),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
    setLoading: useCallback(
      (loading: boolean) => dispatch(setLoading(loading)),
      [dispatch],
    ),
  };
};
