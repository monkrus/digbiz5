/**
 * Onboarding Redux Slice
 *
 * Manages onboarding state including user selections,
 * progress tracking, and persistence.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  OnboardingData,
  UserType,
  Industry,
  Location,
  TimeZone,
  PermissionType,
} from '../../types/onboarding';

// Storage key for persisting onboarding state
const ONBOARDING_STORAGE_KEY = 'onboarding_data';

// Initial state
const initialState: OnboardingData & {
  isLoading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  currentStep: number;
} = {
  userType: null,
  industry: null,
  location: null,
  timezone: null,
  permissions: {
    contacts: false,
    notifications: false,
    location: false,
    camera: false,
    microphone: false,
  },
  completedSteps: 0,
  isCompleted: false,
  isLoading: false,
  error: null,
  hasCompletedOnboarding: false,
  currentStep: 0,
};

// Async thunks
export const loadOnboardingData = createAsyncThunk(
  'onboarding/loadData',
  async (_, { rejectWithValue }) => {
    try {
      const storedData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData) as OnboardingData;
      }
      return null;
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      return rejectWithValue('Failed to load onboarding data');
    }
  },
);

export const saveOnboardingData = createAsyncThunk(
  'onboarding/saveData',
  async (data: OnboardingData, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      return rejectWithValue('Failed to save onboarding data');
    }
  },
);

export const completeOnboarding = createAsyncThunk(
  'onboarding/complete',
  async (data: OnboardingData, { rejectWithValue }) => {
    try {
      const completedData = {
        ...data,
        isCompleted: true,
        completedSteps: 5,
      };

      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify(completedData),
      );
      await AsyncStorage.setItem('has_completed_onboarding', 'true');

      return completedData;
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      return rejectWithValue('Failed to complete onboarding');
    }
  },
);

export const resetOnboarding = createAsyncThunk(
  'onboarding/reset',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      await AsyncStorage.removeItem('has_completed_onboarding');
      return;
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      return rejectWithValue('Failed to reset onboarding');
    }
  },
);

export const checkOnboardingStatus = createAsyncThunk(
  'onboarding/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const hasCompleted = await AsyncStorage.getItem(
        'has_completed_onboarding',
      );
      return hasCompleted === 'true';
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return rejectWithValue('Failed to check onboarding status');
    }
  },
);

// Slice
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setUserType: (state, action: PayloadAction<UserType>) => {
      state.userType = action.payload;
      state.completedSteps = Math.max(state.completedSteps, 1);
      state.currentStep = 1;
    },

    setIndustry: (state, action: PayloadAction<Industry>) => {
      state.industry = action.payload;
      state.completedSteps = Math.max(state.completedSteps, 2);
      state.currentStep = 2;
    },

    setLocation: (state, action: PayloadAction<Location | null>) => {
      state.location = action.payload;
      if (action.payload) {
        state.completedSteps = Math.max(state.completedSteps, 3);
      }
      state.currentStep = 3;
    },

    setTimezone: (state, action: PayloadAction<TimeZone | null>) => {
      state.timezone = action.payload;
      if (action.payload) {
        state.completedSteps = Math.max(state.completedSteps, 3);
      }
    },

    setLocationAndTimezone: (
      state,
      action: PayloadAction<{
        location: Location | null;
        timezone: TimeZone | null;
      }>,
    ) => {
      state.location = action.payload.location;
      state.timezone = action.payload.timezone;
      state.completedSteps = Math.max(state.completedSteps, 3);
      state.currentStep = 3;
    },

    setPermission: (
      state,
      action: PayloadAction<{
        type: PermissionType;
        granted: boolean;
      }>,
    ) => {
      state.permissions[action.payload.type] = action.payload.granted;
    },

    setPermissions: (
      state,
      action: PayloadAction<Record<PermissionType, boolean>>,
    ) => {
      state.permissions = action.payload;
      state.completedSteps = Math.max(state.completedSteps, 4);
      state.currentStep = 4;
    },

    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },

    updateProgress: (state, action: PayloadAction<number>) => {
      state.completedSteps = Math.max(state.completedSteps, action.payload);
    },

    clearError: state => {
      state.error = null;
    },

    // Helper to update multiple fields at once
    updateOnboardingData: (
      state,
      action: PayloadAction<Partial<OnboardingData>>,
    ) => {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: builder => {
    // Load onboarding data
    builder
      .addCase(loadOnboardingData.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOnboardingData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          Object.assign(state, action.payload);
        }
      })
      .addCase(loadOnboardingData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Save onboarding data
    builder
      .addCase(saveOnboardingData.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOnboardingData.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(saveOnboardingData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Complete onboarding
    builder
      .addCase(completeOnboarding.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        state.isLoading = false;
        Object.assign(state, action.payload);
        state.hasCompletedOnboarding = true;
        state.currentStep = 5;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset onboarding
    builder
      .addCase(resetOnboarding.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetOnboarding.fulfilled, state => {
        Object.assign(state, initialState);
      })
      .addCase(resetOnboarding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check onboarding status
    builder
      .addCase(checkOnboardingStatus.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkOnboardingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasCompletedOnboarding = action.payload;
      })
      .addCase(checkOnboardingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Action creators
export const {
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
} = onboardingSlice.actions;

// Selectors
export const selectOnboardingData = (state: {
  onboarding: typeof initialState;
}) => state.onboarding;
export const selectUserType = (state: { onboarding: typeof initialState }) =>
  state.onboarding.userType;
export const selectIndustry = (state: { onboarding: typeof initialState }) =>
  state.onboarding.industry;
export const selectLocation = (state: { onboarding: typeof initialState }) =>
  state.onboarding.location;
export const selectTimezone = (state: { onboarding: typeof initialState }) =>
  state.onboarding.timezone;
export const selectPermissions = (state: { onboarding: typeof initialState }) =>
  state.onboarding.permissions;
export const selectOnboardingProgress = (state: {
  onboarding: typeof initialState;
}) => ({
  currentStep: state.onboarding.currentStep,
  completedSteps: state.onboarding.completedSteps,
  isCompleted: state.onboarding.isCompleted,
  hasCompletedOnboarding: state.onboarding.hasCompletedOnboarding,
});
export const selectOnboardingLoading = (state: {
  onboarding: typeof initialState;
}) => state.onboarding.isLoading;
export const selectOnboardingError = (state: {
  onboarding: typeof initialState;
}) => state.onboarding.error;

// Computed selectors
export const selectOnboardingCompletion = (state: {
  onboarding: typeof initialState;
}) => {
  const onboarding = state.onboarding;
  const totalSteps = 5;
  const progressPercentage = (onboarding.completedSteps / totalSteps) * 100;

  return {
    percentage: Math.min(progressPercentage, 100),
    completedSteps: onboarding.completedSteps,
    totalSteps,
    isComplete: onboarding.isCompleted,
  };
};

export const selectRequiredStepsCompleted = (state: {
  onboarding: typeof initialState;
}) => {
  const onboarding = state.onboarding;
  return !!(onboarding.userType && onboarding.industry);
};

export const selectOnboardingValidation = (state: {
  onboarding: typeof initialState;
}) => {
  const onboarding = state.onboarding;

  const validations = {
    hasUserType: !!onboarding.userType,
    hasIndustry: !!onboarding.industry,
    hasLocation: !!onboarding.location,
    hasTimezone: !!onboarding.timezone,
    hasPermissions: Object.values(onboarding.permissions).some(Boolean),
  };

  const requiredValid = validations.hasUserType && validations.hasIndustry;
  const allValid = Object.values(validations).every(Boolean);

  return {
    ...validations,
    canProceed: requiredValid,
    isComplete: allValid,
  };
};

export default onboardingSlice.reducer;
