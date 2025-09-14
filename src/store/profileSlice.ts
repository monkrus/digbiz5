/**
 * Profile Redux Slice
 *
 * This slice manages the global state for user profiles including
 * profile data, loading states, errors, and cache management.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  UserProfile,
  ProfileFormData,
  ProfileUpdateData,
  ProfilePhotoData,
  ProfileResponse,
  ProfileListResponse,
  ProfilePhotoUploadResponse,
  ProfileSearchParams,
  ProfileStats,
  ProfileCompletionStatus,
  ProfileActivity,
  ProfileConnectionRequest,
} from '../types/profile';

export interface ProfileState {
  // Current user's profile
  currentProfile: UserProfile | null;

  // Profile cache for other users
  profiles: Record<string, UserProfile>;

  // Loading states
  loading: boolean;
  uploadingPhoto: boolean;
  searchLoading: boolean;

  // Error states
  error: string | null;
  uploadError: string | null;
  searchError: string | null;

  // Search and discovery
  searchResults: UserProfile[];
  searchQuery: string;
  searchFilters: ProfileSearchParams;

  // Profile statistics
  stats: ProfileStats | null;

  // Profile completion
  completion: ProfileCompletionStatus | null;

  // Recent activities
  activities: ProfileActivity[];

  // Connection requests
  connectionRequests: ProfileConnectionRequest[];
  pendingRequests: ProfileConnectionRequest[];

  // UI state
  lastUpdated: string | null;
  hasUnsavedChanges: boolean;
  activeSection: string | null;
}

const initialState: ProfileState = {
  currentProfile: null,
  profiles: {},
  loading: false,
  uploadingPhoto: false,
  searchLoading: false,
  error: null,
  uploadError: null,
  searchError: null,
  searchResults: [],
  searchQuery: '',
  searchFilters: {},
  stats: null,
  completion: null,
  activities: [],
  connectionRequests: [],
  pendingRequests: [],
  lastUpdated: null,
  hasUnsavedChanges: false,
  activeSection: null,
};

// Async thunks
export const createProfile = createAsyncThunk(
  'profile/create',
  async (profileData: ProfileFormData, { rejectWithValue }) => {
    try {
      // This would call your profile service
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to create profile');
      }

      const data = (await response.json()) as ProfileResponse;
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (
    {
      profileId,
      updateData,
    }: { profileId: string; updateData: ProfileUpdateData },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to update profile');
      }

      const data = (await response.json()) as ProfileResponse;
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const uploadProfilePhoto = createAsyncThunk(
  'profile/uploadPhoto',
  async (
    { profileId, photo }: { profileId: string; photo: ProfilePhotoData },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      } as any);

      const response = await fetch(`/api/profiles/${profileId}/photo`, {
        method: 'POST',
        body: formData as any, // FormData typing issue in React Native
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to upload photo');
      }

      const data = (await response.json()) as ProfilePhotoUploadResponse;
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (profileId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}`);

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to fetch profile');
      }

      const data = (await response.json()) as ProfileResponse;
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const searchProfiles = createAsyncThunk(
  'profile/search',
  async (params: ProfileSearchParams, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();

      if (params.query) searchParams.append('query', params.query);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(`filters[${key}]`, v));
            } else {
              searchParams.append(`filters[${key}]`, value.toString());
            }
          }
        });
      }

      const response = await fetch(
        `/api/profiles/search?${searchParams.toString()}`,
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to search profiles');
      }

      const data = (await response.json()) as ProfileListResponse;
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const fetchProfileStats = createAsyncThunk(
  'profile/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/profiles/stats');

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to fetch stats');
      }

      const data = (await response.json()) as ProfileStats;
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const fetchProfileActivities = createAsyncThunk(
  'profile/fetchActivities',
  async (profileId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/activities`);

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(error.message || 'Failed to fetch activities');
      }

      const data = (await response.json()) as ProfileActivity[];
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

export const fetchConnectionRequests = createAsyncThunk(
  'profile/fetchConnectionRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/profiles/connection-requests');

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        return rejectWithValue(
          error.message || 'Failed to fetch connection requests',
        );
      }

      const data = (await response.json()) as ProfileConnectionRequest[];
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Clear errors
    clearError: state => {
      state.error = null;
    },
    clearUploadError: state => {
      state.uploadError = null;
    },
    clearSearchError: state => {
      state.searchError = null;
    },

    // Update search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Update search filters
    setSearchFilters: (state, action: PayloadAction<ProfileSearchParams>) => {
      state.searchFilters = action.payload;
    },

    // Clear search results
    clearSearchResults: state => {
      state.searchResults = [];
      state.searchQuery = '';
      state.searchFilters = {};
      state.searchError = null;
    },

    // Cache profile data
    cacheProfile: (state, action: PayloadAction<UserProfile>) => {
      const profile = action.payload;
      state.profiles[profile.id] = profile;
    },

    // Remove profile from cache
    removeCachedProfile: (state, action: PayloadAction<string>) => {
      delete state.profiles[action.payload];
    },

    // Clear all cached profiles
    clearProfileCache: state => {
      state.profiles = {};
    },

    // Set unsaved changes flag
    setUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },

    // Set active section
    setActiveSection: (state, action: PayloadAction<string | null>) => {
      state.activeSection = action.payload;
    },

    // Update profile completion
    updateProfileCompletion: (
      state,
      action: PayloadAction<ProfileCompletionStatus>,
    ) => {
      state.completion = action.payload;
    },

    // Add activity
    addActivity: (state, action: PayloadAction<ProfileActivity>) => {
      state.activities.unshift(action.payload);
      // Keep only the latest 20 activities
      if (state.activities.length > 20) {
        state.activities = state.activities.slice(0, 20);
      }
    },

    // Update connection request status
    updateConnectionRequestStatus: (
      state,
      action: PayloadAction<{
        requestId: string;
        status: 'accepted' | 'rejected';
      }>,
    ) => {
      const { requestId, status } = action.payload;

      // Update in connection requests
      const request = state.connectionRequests.find(
        req => req.id === requestId,
      );
      if (request) {
        request.status = status;
        request.respondedAt = new Date().toISOString();
      }

      // Remove from pending requests
      state.pendingRequests = state.pendingRequests.filter(
        req => req.id !== requestId,
      );
    },

    // Reset profile state
    resetProfileState: () => initialState,
  },
  extraReducers: builder => {
    // Create profile
    builder
      .addCase(createProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProfile = action.payload.profile;
        state.lastUpdated = new Date().toISOString();
        state.hasUnsavedChanges = false;
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProfile = action.payload.profile;

        // Update current profile if it's the user's own profile
        if (state.currentProfile?.id === updatedProfile.id) {
          state.currentProfile = updatedProfile;
        }

        // Update cached profile
        state.profiles[updatedProfile.id] = updatedProfile;
        state.lastUpdated = new Date().toISOString();
        state.hasUnsavedChanges = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upload profile photo
    builder
      .addCase(uploadProfilePhoto.pending, state => {
        state.uploadingPhoto = true;
        state.uploadError = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.uploadingPhoto = false;

        // Update current profile photo if available
        if (state.currentProfile) {
          state.currentProfile.profilePhoto = action.payload.photoUrl;
          state.currentProfile.updatedAt = new Date().toISOString();
        }

        state.lastUpdated = new Date().toISOString();
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.uploadingPhoto = false;
        state.uploadError = action.payload as string;
      });

    // Fetch profile
    builder
      .addCase(fetchProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        const profile = action.payload.profile;

        // Cache the profile
        state.profiles[profile.id] = profile;

        // Set as current profile if it's the user's own profile
        // (You'd determine this based on your auth state)
        // if (profile.userId === currentUser.id) {
        //   state.currentProfile = profile;
        // }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search profiles
    builder
      .addCase(searchProfiles.pending, state => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProfiles.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.profiles;

        // Cache searched profiles
        action.payload.profiles.forEach(profile => {
          state.profiles[profile.id] = profile;
        });
      })
      .addCase(searchProfiles.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });

    // Fetch profile stats
    builder.addCase(fetchProfileStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    // Fetch profile activities
    builder.addCase(fetchProfileActivities.fulfilled, (state, action) => {
      state.activities = action.payload;
    });

    // Fetch connection requests
    builder.addCase(fetchConnectionRequests.fulfilled, (state, action) => {
      state.connectionRequests = action.payload;
      state.pendingRequests = action.payload.filter(
        req => req.status === 'pending',
      );
    });
  },
});

export const {
  clearError,
  clearUploadError,
  clearSearchError,
  setSearchQuery,
  setSearchFilters,
  clearSearchResults,
  cacheProfile,
  removeCachedProfile,
  clearProfileCache,
  setUnsavedChanges,
  setActiveSection,
  updateProfileCompletion,
  addActivity,
  updateConnectionRequestStatus,
  resetProfileState,
} = profileSlice.actions;

export default profileSlice.reducer;
