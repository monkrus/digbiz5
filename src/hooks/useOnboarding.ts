/**
 * Onboarding Hooks
 *
 * Custom React hooks for onboarding state management and actions.
 * Provides convenient access to onboarding state and dispatch functions.
 */

import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  loadOnboardingData,
  saveOnboardingData,
  completeOnboarding,
  resetOnboarding,
  checkOnboardingStatus,
  setUserType,
  setIndustry,
  setLocation,
  setTimezone,
  setLocationAndTimezone,
  setPermission,
  setPermissions,
  setCurrentStep,
  updateProgress,
  clearError,
  updateOnboardingData,
  selectOnboardingData,
  selectUserType,
  selectIndustry,
  selectLocation,
  selectTimezone,
  selectPermissions,
  selectOnboardingProgress,
  selectOnboardingLoading,
  selectOnboardingError,
  selectOnboardingCompletion,
  selectRequiredStepsCompleted,
  selectOnboardingValidation,
} from '../store/slices/onboardingSlice';
import {
  OnboardingData,
  UserType,
  Industry,
  Location,
  TimeZone,
  PermissionType,
} from '../types/onboarding';

/**
 * Main onboarding hook with all state and actions
 */
export const useOnboarding = () => {
  const dispatch = useDispatch<AppDispatch>();
  const onboardingData = useSelector(selectOnboardingData);
  const progress = useSelector(selectOnboardingProgress);
  const completion = useSelector(selectOnboardingCompletion);
  const validation = useSelector(selectOnboardingValidation);
  const isLoading = useSelector(selectOnboardingLoading);
  const error = useSelector(selectOnboardingError);

  // Action creators
  const actions = {
    setUserType: useCallback(
      (userType: UserType) => dispatch(setUserType(userType)),
      [dispatch],
    ),

    setIndustry: useCallback(
      (industry: Industry) => dispatch(setIndustry(industry)),
      [dispatch],
    ),

    setLocation: useCallback(
      (location: Location | null) => dispatch(setLocation(location)),
      [dispatch],
    ),

    setTimezone: useCallback(
      (timezone: TimeZone | null) => dispatch(setTimezone(timezone)),
      [dispatch],
    ),

    setLocationAndTimezone: useCallback(
      (location: Location | null, timezone: TimeZone | null) =>
        dispatch(setLocationAndTimezone({ location, timezone })),
      [dispatch],
    ),

    setPermission: useCallback(
      (type: PermissionType, granted: boolean) =>
        dispatch(setPermission({ type, granted })),
      [dispatch],
    ),

    setPermissions: useCallback(
      (permissions: Record<PermissionType, boolean>) =>
        dispatch(setPermissions(permissions)),
      [dispatch],
    ),

    setCurrentStep: useCallback(
      (step: number) => dispatch(setCurrentStep(step)),
      [dispatch],
    ),

    updateProgress: useCallback(
      (step: number) => dispatch(updateProgress(step)),
      [dispatch],
    ),

    updateData: useCallback(
      (data: Partial<OnboardingData>) => dispatch(updateOnboardingData(data)),
      [dispatch],
    ),

    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
  };

  // Async actions
  const asyncActions = {
    loadData: useCallback(() => dispatch(loadOnboardingData()), [dispatch]),

    saveData: useCallback(
      (data: OnboardingData) => dispatch(saveOnboardingData(data)),
      [dispatch],
    ),

    complete: useCallback(
      (data: OnboardingData) => dispatch(completeOnboarding(data)),
      [dispatch],
    ),

    reset: useCallback(() => dispatch(resetOnboarding()), [dispatch]),

    checkStatus: useCallback(
      () => dispatch(checkOnboardingStatus()),
      [dispatch],
    ),
  };

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (onboardingData.userType || onboardingData.industry) {
      asyncActions.saveData(onboardingData);
    }
  }, [onboardingData, asyncActions.saveData]);

  return {
    // State
    data: onboardingData,
    progress,
    completion,
    validation,
    isLoading,
    error,

    // Actions
    ...actions,

    // Async actions
    ...asyncActions,

    // Utilities
    autoSave,
  };
};

/**
 * Hook for onboarding state only (no actions)
 */
export const useOnboardingState = () => {
  return useSelector(selectOnboardingData);
};

/**
 * Hook for specific onboarding data
 */
export const useOnboardingData = () => {
  const userType = useSelector(selectUserType);
  const industry = useSelector(selectIndustry);
  const location = useSelector(selectLocation);
  const timezone = useSelector(selectTimezone);
  const permissions = useSelector(selectPermissions);

  return {
    userType,
    industry,
    location,
    timezone,
    permissions,
  };
};

/**
 * Hook for onboarding progress and validation
 */
export const useOnboardingProgress = () => {
  const progress = useSelector(selectOnboardingProgress);
  const completion = useSelector(selectOnboardingCompletion);
  const validation = useSelector(selectOnboardingValidation);
  const requiredCompleted = useSelector(selectRequiredStepsCompleted);

  return {
    ...progress,
    completion,
    validation,
    requiredCompleted,
  };
};

/**
 * Hook for onboarding navigation helpers
 */
export const useOnboardingNavigation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const progress = useSelector(selectOnboardingProgress);
  const validation = useSelector(selectOnboardingValidation);

  const canGoToStep = useCallback(
    (step: number) => {
      switch (step) {
        case 0: // Welcome
          return true;
        case 1: // User Type
          return true;
        case 2: // Industry
          return !!validation.hasUserType;
        case 3: // Location
          return validation.hasUserType && validation.hasIndustry;
        case 4: // Permissions
          return validation.hasUserType && validation.hasIndustry;
        case 5: // Complete
          return validation.canProceed;
        default:
          return false;
      }
    },
    [validation],
  );

  const goToStep = useCallback(
    (step: number) => {
      if (canGoToStep(step)) {
        dispatch(setCurrentStep(step));
      }
    },
    [dispatch, canGoToStep],
  );

  const goToNextStep = useCallback(() => {
    const nextStep = progress.currentStep + 1;
    if (canGoToStep(nextStep)) {
      goToStep(nextStep);
    }
  }, [progress.currentStep, canGoToStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const prevStep = progress.currentStep - 1;
    if (prevStep >= 0) {
      goToStep(prevStep);
    }
  }, [progress.currentStep, goToStep]);

  return {
    currentStep: progress.currentStep,
    canGoToStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
  };
};

/**
 * Hook for onboarding actions only
 */
export const useOnboardingActions = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    setUserType: useCallback(
      (userType: UserType) => dispatch(setUserType(userType)),
      [dispatch],
    ),
    setIndustry: useCallback(
      (industry: Industry) => dispatch(setIndustry(industry)),
      [dispatch],
    ),
    setLocation: useCallback(
      (location: Location | null) => dispatch(setLocation(location)),
      [dispatch],
    ),
    setTimezone: useCallback(
      (timezone: TimeZone | null) => dispatch(setTimezone(timezone)),
      [dispatch],
    ),
    setLocationAndTimezone: useCallback(
      (location: Location | null, timezone: TimeZone | null) =>
        dispatch(setLocationAndTimezone({ location, timezone })),
      [dispatch],
    ),
    setPermission: useCallback(
      (type: PermissionType, granted: boolean) =>
        dispatch(setPermission({ type, granted })),
      [dispatch],
    ),
    setPermissions: useCallback(
      (permissions: Record<PermissionType, boolean>) =>
        dispatch(setPermissions(permissions)),
      [dispatch],
    ),
    updateData: useCallback(
      (data: Partial<OnboardingData>) => dispatch(updateOnboardingData(data)),
      [dispatch],
    ),
    loadData: useCallback(() => dispatch(loadOnboardingData()), [dispatch]),
    saveData: useCallback(
      (data: OnboardingData) => dispatch(saveOnboardingData(data)),
      [dispatch],
    ),
    complete: useCallback(
      (data: OnboardingData) => dispatch(completeOnboarding(data)),
      [dispatch],
    ),
    reset: useCallback(() => dispatch(resetOnboarding()), [dispatch]),
    checkStatus: useCallback(
      () => dispatch(checkOnboardingStatus()),
      [dispatch],
    ),
  };
};

/**
 * Hook that automatically loads onboarding data on mount
 */
export const useOnboardingInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hasCompletedOnboarding = useSelector(
    (state: RootState) => state.onboarding.hasCompletedOnboarding,
  );
  const isLoading = useSelector(selectOnboardingLoading);

  useEffect(() => {
    dispatch(checkOnboardingStatus());
    dispatch(loadOnboardingData());
  }, [dispatch]);

  return {
    hasCompletedOnboarding,
    isLoading,
  };
};

/**
 * Hook for permission management
 */
export const useOnboardingPermissions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const permissions = useSelector(selectPermissions);

  const setPermission = useCallback(
    (type: PermissionType, granted: boolean) => {
      dispatch(setPermission({ type, granted }));
    },
    [dispatch],
  );

  const setAllPermissions = useCallback(
    (permissionStates: Record<PermissionType, boolean>) => {
      dispatch(setPermissions(permissionStates));
    },
    [dispatch],
  );

  const getPermissionStatus = useCallback(
    (type: PermissionType) => permissions[type],
    [permissions],
  );

  const getGrantedPermissions = useCallback(() => {
    return Object.entries(permissions)
      .filter(([_, granted]) => granted)
      .map(([type, _]) => type as PermissionType);
  }, [permissions]);

  const getPermissionCount = useCallback(() => {
    const granted = getGrantedPermissions().length;
    const total = Object.keys(permissions).length;
    return { granted, total };
  }, [permissions, getGrantedPermissions]);

  return {
    permissions,
    setPermission,
    setAllPermissions,
    getPermissionStatus,
    getGrantedPermissions,
    getPermissionCount,
  };
};
