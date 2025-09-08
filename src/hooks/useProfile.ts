/**
 * Profile Hook
 * 
 * This hook provides a clean interface to profile functionality including
 * profile CRUD operations, photo uploads, search, and state management.
 */

import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import {
  createProfile,
  updateProfile,
  uploadProfilePhoto,
  fetchProfile,
  searchProfiles,
  fetchProfileStats,
  fetchProfileActivities,
  fetchConnectionRequests,
  clearError,
  clearUploadError,
  clearSearchError,
  setSearchQuery,
  setSearchFilters,
  clearSearchResults,
  cacheProfile,
  setUnsavedChanges,
  setActiveSection,
  updateProfileCompletion,
  addActivity,
  updateConnectionRequestStatus,
} from '../store/profileSlice';
import {
  UserProfile,
  ProfileFormData,
  ProfileUpdateData,
  ProfilePhotoData,
  ProfileSearchParams,
  ProfileCompletionStatus,
  ProfileActivity,
} from '../types/profile';
import { AppDispatch } from '../store/store';

interface UseProfileReturn {
  // State
  currentProfile: UserProfile | null;
  profiles: Record<string, UserProfile>;
  loading: boolean;
  uploadingPhoto: boolean;
  searchLoading: boolean;
  error: string | null;
  uploadError: string | null;
  searchError: string | null;
  searchResults: UserProfile[];
  searchQuery: string;
  searchFilters: ProfileSearchParams;
  stats: any;
  completion: ProfileCompletionStatus | null;
  activities: ProfileActivity[];
  connectionRequests: any[];
  pendingRequests: any[];
  hasUnsavedChanges: boolean;
  activeSection: string | null;
  lastUpdated: string | null;

  // Actions
  createUserProfile: (profileData: ProfileFormData) => Promise<{ success: boolean; message?: string; profile?: UserProfile }>;
  updateUserProfile: (profileId: string, updateData: ProfileUpdateData) => Promise<{ success: boolean; message?: string; profile?: UserProfile }>;
  uploadPhoto: (profileId: string, photo: ProfilePhotoData) => Promise<{ success: boolean; photoUrl?: string; message?: string }>;
  getProfile: (profileId: string) => Promise<UserProfile | null>;
  searchUserProfiles: (params: ProfileSearchParams) => Promise<UserProfile[]>;
  getProfileStats: () => Promise<void>;
  getProfileActivities: (profileId: string) => Promise<void>;
  getConnectionRequests: () => Promise<void>;
  
  // Error handling
  clearProfileError: () => void;
  clearPhotoUploadError: () => void;
  clearProfileSearchError: () => void;
  
  // Search functionality
  updateSearchQuery: (query: string) => void;
  updateSearchFilters: (filters: ProfileSearchParams) => void;
  clearProfileSearchResults: () => void;
  
  // Cache management
  cacheProfileData: (profile: UserProfile) => void;
  getCachedProfile: (profileId: string) => UserProfile | null;
  
  // UI state management
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setProfileActiveSection: (section: string | null) => void;
  
  // Profile completion
  updateCompletion: (completion: ProfileCompletionStatus) => void;
  
  // Activities
  addProfileActivity: (activity: ProfileActivity) => void;
  
  // Connection requests
  respondToConnectionRequest: (requestId: string, accept: boolean) => void;
}

export const useProfile = (): UseProfileReturn => {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    currentProfile,
    profiles,
    loading,
    uploadingPhoto,
    searchLoading,
    error,
    uploadError,
    searchError,
    searchResults,
    searchQuery,
    searchFilters,
    stats,
    completion,
    activities,
    connectionRequests,
    pendingRequests,
    hasUnsavedChanges,
    activeSection,
    lastUpdated,
  } = useSelector((state: RootState) => state.profile);

  // Profile CRUD operations
  const createUserProfile = useCallback(async (profileData: ProfileFormData) => {
    try {
      const result = await dispatch(createProfile(profileData)).unwrap();
      return {
        success: true,
        profile: result.profile,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error as string,
      };
    }
  }, [dispatch]);

  const updateUserProfile = useCallback(async (profileId: string, updateData: ProfileUpdateData) => {
    try {
      const result = await dispatch(updateProfile({ profileId, updateData })).unwrap();
      return {
        success: true,
        profile: result.profile,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error as string,
      };
    }
  }, [dispatch]);

  const uploadPhoto = useCallback(async (profileId: string, photo: ProfilePhotoData) => {
    try {
      const result = await dispatch(uploadProfilePhoto({ profileId, photo })).unwrap();
      return {
        success: true,
        photoUrl: result.photoUrl,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error as string,
      };
    }
  }, [dispatch]);

  const getProfile = useCallback(async (profileId: string): Promise<UserProfile | null> => {
    try {
      // Check cache first
      if (profiles[profileId]) {
        return profiles[profileId];
      }

      const result = await dispatch(fetchProfile(profileId)).unwrap();
      return result.profile;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  }, [dispatch, profiles]);

  const searchUserProfiles = useCallback(async (params: ProfileSearchParams): Promise<UserProfile[]> => {
    try {
      const result = await dispatch(searchProfiles(params)).unwrap();
      return result.profiles;
    } catch (error) {
      console.error('Profile search failed:', error);
      return [];
    }
  }, [dispatch]);

  const getProfileStats = useCallback(async () => {
    try {
      await dispatch(fetchProfileStats());
    } catch (error) {
      console.error('Failed to fetch profile stats:', error);
    }
  }, [dispatch]);

  const getProfileActivities = useCallback(async (profileId: string) => {
    try {
      await dispatch(fetchProfileActivities(profileId));
    } catch (error) {
      console.error('Failed to fetch profile activities:', error);
    }
  }, [dispatch]);

  const getConnectionRequests = useCallback(async () => {
    try {
      await dispatch(fetchConnectionRequests());
    } catch (error) {
      console.error('Failed to fetch connection requests:', error);
    }
  }, [dispatch]);

  // Error handling
  const clearProfileError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearPhotoUploadError = useCallback(() => {
    dispatch(clearUploadError());
  }, [dispatch]);

  const clearProfileSearchError = useCallback(() => {
    dispatch(clearSearchError());
  }, [dispatch]);

  // Search functionality
  const updateSearchQuery = useCallback((query: string) => {
    dispatch(setSearchQuery(query));
  }, [dispatch]);

  const updateSearchFilters = useCallback((filters: ProfileSearchParams) => {
    dispatch(setSearchFilters(filters));
  }, [dispatch]);

  const clearProfileSearchResults = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  // Cache management
  const cacheProfileData = useCallback((profile: UserProfile) => {
    dispatch(cacheProfile(profile));
  }, [dispatch]);

  const getCachedProfile = useCallback((profileId: string): UserProfile | null => {
    return profiles[profileId] || null;
  }, [profiles]);

  // UI state management
  const setHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    dispatch(setUnsavedChanges(hasChanges));
  }, [dispatch]);

  const setProfileActiveSection = useCallback((section: string | null) => {
    dispatch(setActiveSection(section));
  }, [dispatch]);

  // Profile completion
  const updateCompletion = useCallback((completionStatus: ProfileCompletionStatus) => {
    dispatch(updateProfileCompletion(completionStatus));
  }, [dispatch]);

  // Activities
  const addProfileActivity = useCallback((activity: ProfileActivity) => {
    dispatch(addActivity(activity));
  }, [dispatch]);

  // Connection requests
  const respondToConnectionRequest = useCallback((requestId: string, accept: boolean) => {
    const status = accept ? 'accepted' : 'rejected';
    dispatch(updateConnectionRequestStatus({ requestId, status }));
  }, [dispatch]);

  // Helper functions
  const isProfileComplete = useCallback((profile: UserProfile | null): boolean => {
    if (!profile) return false;
    
    const requiredFields = [
      profile.name,
      profile.title,
      profile.company,
      profile.bio,
      profile.email,
    ];
    
    return requiredFields.every(field => field && field.trim().length > 0);
  }, []);

  const getProfileCompletionPercentage = useCallback((profile: UserProfile | null): number => {
    if (!profile) return 0;
    
    const fields = [
      profile.name,
      profile.title,
      profile.company,
      profile.bio,
      profile.email,
      profile.phone,
      profile.location,
      profile.website,
      profile.profilePhoto,
      profile.skills.length > 0,
      Object.values(profile.socialLinks).some(link => link),
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }, []);

  const canEditProfile = useCallback((profile: UserProfile | null): boolean => {
    if (!profile || !currentProfile) return false;
    return profile.userId === currentProfile.userId;
  }, [currentProfile]);

  const formatProfileForDisplay = useCallback((profile: UserProfile) => {
    return {
      ...profile,
      displayName: profile.name || 'Unknown User',
      displayTitle: profile.title || 'No title',
      displayCompany: profile.company || 'No company',
      hasProfilePhoto: !!profile.profilePhoto,
      skillsCount: profile.skills.length,
      socialLinksCount: Object.values(profile.socialLinks).filter(Boolean).length,
      isComplete: isProfileComplete(profile),
      completionPercentage: getProfileCompletionPercentage(profile),
    };
  }, [isProfileComplete, getProfileCompletionPercentage]);

  return {
    // State
    currentProfile,
    profiles,
    loading,
    uploadingPhoto,
    searchLoading,
    error,
    uploadError,
    searchError,
    searchResults,
    searchQuery,
    searchFilters,
    stats,
    completion,
    activities,
    connectionRequests,
    pendingRequests,
    hasUnsavedChanges,
    activeSection,
    lastUpdated,

    // Actions
    createUserProfile,
    updateUserProfile,
    uploadPhoto,
    getProfile,
    searchUserProfiles,
    getProfileStats,
    getProfileActivities,
    getConnectionRequests,

    // Error handling
    clearProfileError,
    clearPhotoUploadError,
    clearProfileSearchError,

    // Search functionality
    updateSearchQuery,
    updateSearchFilters,
    clearProfileSearchResults,

    // Cache management
    cacheProfileData,
    getCachedProfile,

    // UI state management
    setHasUnsavedChanges,
    setProfileActiveSection,

    // Profile completion
    updateCompletion,

    // Activities
    addProfileActivity,

    // Connection requests
    respondToConnectionRequest,

    // Helper functions (additional)
    isProfileComplete,
    getProfileCompletionPercentage,
    canEditProfile,
    formatProfileForDisplay,
  };
};