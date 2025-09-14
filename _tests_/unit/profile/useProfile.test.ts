/**
 * Profile Hook Unit Tests
 *
 * This test suite validates the useProfile hook including state management,
 * CRUD operations, error handling, and helper functions.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

import { useProfile } from '../../../src/hooks/useProfile';
import { profileSlice } from '../../../src/store/profileSlice';
import {
  UserProfile,
  ProfileFormData,
  ProfilePhotoData,
} from '../../../src/types/profile';

// Mock the profile service
jest.mock('../../../src/services/profileService', () => ({
  profileService: {
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    getProfile: jest.fn(),
    uploadProfilePhoto: jest.fn(),
    searchProfiles: jest.fn(),
    getProfileStats: jest.fn(),
    getProfileActivities: jest.fn(),
    getConnectionRequests: jest.fn(),
  },
}));

const mockProfile: UserProfile = {
  id: 'profile-123',
  userId: 'user-123',
  name: 'John Doe',
  title: 'Software Engineer',
  company: 'Tech Company',
  bio: 'Experienced developer',
  profilePhoto: null,
  email: 'john@example.com',
  phone: '+1234567890',
  location: 'San Francisco, CA',
  website: 'https://johndoe.com',
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: null,
    github: null,
    instagram: null,
    facebook: null,
  },
  skills: ['JavaScript', 'React', 'Node.js'],
  experience: [],
  education: [],
  isPublic: true,
  isVerified: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      profile: profileSlice.reducer,
    },
    preloadedState: {
      profile: {
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
        hasUnsavedChanges: false,
        activeSection: null,
        lastUpdated: null,
        ...initialState,
      },
    },
  });
};

const createWrapper = (store: any) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
};

describe('useProfile Hook', () => {
  let store: any;
  let wrapper: any;

  beforeEach(() => {
    store = createMockStore();
    wrapper = createWrapper(store);
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useProfile(), { wrapper });

      expect(result.current.currentProfile).toBeNull();
      expect(result.current.profiles).toEqual({});
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Profile CRUD Operations', () => {
    describe('createUserProfile', () => {
      it('should create profile successfully', async () => {
        const profileData: ProfileFormData = {
          name: 'John Doe',
          title: 'Engineer',
          company: 'Tech Co',
          bio: 'Bio',
          email: 'john@example.com',
          phone: '+1234567890',
          location: 'SF',
          website: 'https://example.com',
          socialLinks: {
            linkedin: null,
            twitter: null,
            github: null,
            instagram: null,
            facebook: null,
          },
          skills: ['JavaScript'],
          isPublic: true,
        };

        // Mock successful dispatch
        const mockDispatch = jest.fn().mockResolvedValue({
          unwrap: () =>
            Promise.resolve({
              success: true,
              profile: mockProfile,
              message: 'Profile created successfully',
            }),
        });

        store.dispatch = mockDispatch;

        const { result } = renderHook(() => useProfile(), { wrapper });

        let createResult: any;
        await act(async () => {
          createResult = await result.current.createUserProfile(profileData);
        });

        expect(createResult.success).toBe(true);
        expect(createResult.profile).toEqual(mockProfile);
        expect(createResult.message).toBe('Profile created successfully');
      });

      it('should handle create profile failure', async () => {
        const profileData: ProfileFormData = {
          name: '',
          title: '',
          company: '',
          bio: '',
          email: '',
          phone: '',
          location: '',
          website: '',
          socialLinks: {
            linkedin: null,
            twitter: null,
            github: null,
            instagram: null,
            facebook: null,
          },
          skills: [],
          isPublic: false,
        };

        const mockDispatch = jest.fn().mockRejectedValue('Validation failed');
        store.dispatch = mockDispatch;

        const { result } = renderHook(() => useProfile(), { wrapper });

        let createResult: any;
        await act(async () => {
          createResult = await result.current.createUserProfile(profileData);
        });

        expect(createResult.success).toBe(false);
        expect(createResult.message).toBe('Validation failed');
      });
    });

    describe('updateUserProfile', () => {
      it('should update profile successfully', async () => {
        const updateData = { name: 'Jane Doe', title: 'Senior Engineer' };

        const mockDispatch = jest.fn().mockResolvedValue({
          unwrap: () =>
            Promise.resolve({
              success: true,
              profile: { ...mockProfile, ...updateData },
              message: 'Profile updated successfully',
            }),
        });

        store.dispatch = mockDispatch;

        const { result } = renderHook(() => useProfile(), { wrapper });

        let updateResult: any;
        await act(async () => {
          updateResult = await result.current.updateUserProfile(
            'profile-123',
            updateData,
          );
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.profile.name).toBe('Jane Doe');
        expect(updateResult.profile.title).toBe('Senior Engineer');
      });
    });

    describe('getProfile', () => {
      it('should return cached profile if available', async () => {
        store = createMockStore({
          profiles: { 'profile-123': mockProfile },
        });
        wrapper = createWrapper(store);

        const { result } = renderHook(() => useProfile(), { wrapper });

        let profile: any;
        await act(async () => {
          profile = await result.current.getProfile('profile-123');
        });

        expect(profile).toEqual(mockProfile);
        // Should not dispatch since profile was cached
        expect(store.dispatch).not.toHaveBeenCalled();
      });

      it('should fetch profile if not cached', async () => {
        const mockDispatch = jest.fn().mockResolvedValue({
          unwrap: () =>
            Promise.resolve({
              profile: mockProfile,
            }),
        });

        store.dispatch = mockDispatch;

        const { result } = renderHook(() => useProfile(), { wrapper });

        let profile: any;
        await act(async () => {
          profile = await result.current.getProfile('profile-123');
        });

        expect(profile).toEqual(mockProfile);
        expect(mockDispatch).toHaveBeenCalled();
      });

      it('should handle fetch profile failure', async () => {
        const mockDispatch = jest
          .fn()
          .mockRejectedValue(new Error('Profile not found'));
        store.dispatch = mockDispatch;

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const { result } = renderHook(() => useProfile(), { wrapper });

        let profile: any;
        await act(async () => {
          profile = await result.current.getProfile('profile-123');
        });

        expect(profile).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch profile:',
          expect.any(Error),
        );

        consoleSpy.mockRestore();
      });
    });

    describe('uploadPhoto', () => {
      it('should upload photo successfully', async () => {
        const photoData: ProfilePhotoData = {
          uri: 'file://photo.jpg',
          name: 'photo.jpg',
          type: 'image/jpeg',
          size: 1024000,
        };

        const mockDispatch = jest.fn().mockResolvedValue({
          unwrap: () =>
            Promise.resolve({
              success: true,
              photoUrl: 'https://example.com/photo.jpg',
              message: 'Photo uploaded successfully',
            }),
        });

        store.dispatch = mockDispatch;

        const { result } = renderHook(() => useProfile(), { wrapper });

        let uploadResult: any;
        await act(async () => {
          uploadResult = await result.current.uploadPhoto(
            'profile-123',
            photoData,
          );
        });

        expect(uploadResult.success).toBe(true);
        expect(uploadResult.photoUrl).toBe('https://example.com/photo.jpg');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search profiles successfully', async () => {
      const searchParams = {
        query: 'software engineer',
        limit: 10,
      };

      const mockDispatch = jest.fn().mockResolvedValue({
        unwrap: () =>
          Promise.resolve({
            profiles: [mockProfile],
          }),
      });

      store.dispatch = mockDispatch;

      const { result } = renderHook(() => useProfile(), { wrapper });

      let searchResult: any;
      await act(async () => {
        searchResult = await result.current.searchUserProfiles(searchParams);
      });

      expect(searchResult).toEqual([mockProfile]);
    });

    it('should handle search failure', async () => {
      const mockDispatch = jest
        .fn()
        .mockRejectedValue(new Error('Search failed'));
      store.dispatch = mockDispatch;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useProfile(), { wrapper });

      let searchResult: any;
      await act(async () => {
        searchResult = await result.current.searchUserProfiles({});
      });

      expect(searchResult).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Profile search failed:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should update search query', () => {
      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.updateSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });

    it('should clear search results', () => {
      store = createMockStore({
        searchResults: [mockProfile],
      });
      wrapper = createWrapper(store);

      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.clearProfileSearchResults();
      });

      expect(result.current.searchResults).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should clear profile error', () => {
      store = createMockStore({
        error: 'Some error',
      });
      wrapper = createWrapper(store);

      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.clearProfileError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear photo upload error', () => {
      store = createMockStore({
        uploadError: 'Upload failed',
      });
      wrapper = createWrapper(store);

      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.clearPhotoUploadError();
      });

      expect(result.current.uploadError).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should cache profile data', () => {
      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.cacheProfileData(mockProfile);
      });

      expect(result.current.profiles['profile-123']).toEqual(mockProfile);
    });

    it('should get cached profile', () => {
      store = createMockStore({
        profiles: { 'profile-123': mockProfile },
      });
      wrapper = createWrapper(store);

      const { result } = renderHook(() => useProfile(), { wrapper });

      const cachedProfile = result.current.getCachedProfile('profile-123');
      expect(cachedProfile).toEqual(mockProfile);

      const notCachedProfile = result.current.getCachedProfile('profile-456');
      expect(notCachedProfile).toBeNull();
    });
  });

  describe('UI State Management', () => {
    it('should set unsaved changes', () => {
      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.setHasUnsavedChanges(true);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should set active section', () => {
      const { result } = renderHook(() => useProfile(), { wrapper });

      act(() => {
        result.current.setProfileActiveSection('basic');
      });

      expect(result.current.activeSection).toBe('basic');
    });
  });

  describe('Helper Functions', () => {
    describe('isProfileComplete', () => {
      it('should return true for complete profile', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        const isComplete = result.current.isProfileComplete(mockProfile);
        expect(isComplete).toBe(true);
      });

      it('should return false for incomplete profile', () => {
        const incompleteProfile = { ...mockProfile, bio: '' };
        const { result } = renderHook(() => useProfile(), { wrapper });

        const isComplete = result.current.isProfileComplete(incompleteProfile);
        expect(isComplete).toBe(false);
      });

      it('should return false for null profile', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        const isComplete = result.current.isProfileComplete(null);
        expect(isComplete).toBe(false);
      });
    });

    describe('getProfileCompletionPercentage', () => {
      it('should calculate correct percentage for complete profile', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        const percentage =
          result.current.getProfileCompletionPercentage(mockProfile);
        expect(percentage).toBe(100);
      });

      it('should calculate correct percentage for partial profile', () => {
        const partialProfile = {
          ...mockProfile,
          bio: '',
          phone: null,
          location: null,
          website: null,
          profilePhoto: null,
          skills: [],
          socialLinks: {
            linkedin: null,
            twitter: null,
            github: null,
            instagram: null,
            facebook: null,
          },
        };

        const { result } = renderHook(() => useProfile(), { wrapper });

        const percentage =
          result.current.getProfileCompletionPercentage(partialProfile);
        // Only name, title, company, email completed = 4 out of 11 fields = ~36%
        expect(percentage).toBe(36);
      });

      it('should return 0 for null profile', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        const percentage = result.current.getProfileCompletionPercentage(null);
        expect(percentage).toBe(0);
      });
    });

    describe('canEditProfile', () => {
      it('should return true for own profile', () => {
        store = createMockStore({
          currentProfile: mockProfile,
        });
        wrapper = createWrapper(store);

        const { result } = renderHook(() => useProfile(), { wrapper });

        const canEdit = result.current.canEditProfile(mockProfile);
        expect(canEdit).toBe(true);
      });

      it('should return false for other user profile', () => {
        const otherProfile = { ...mockProfile, userId: 'other-user' };
        store = createMockStore({
          currentProfile: mockProfile,
        });
        wrapper = createWrapper(store);

        const { result } = renderHook(() => useProfile(), { wrapper });

        const canEdit = result.current.canEditProfile(otherProfile);
        expect(canEdit).toBe(false);
      });

      it('should return false when no current profile', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        const canEdit = result.current.canEditProfile(mockProfile);
        expect(canEdit).toBe(false);
      });
    });

    describe('formatProfileForDisplay', () => {
      it('should format profile with all display properties', () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        const formatted = result.current.formatProfileForDisplay(mockProfile);

        expect(formatted).toMatchObject({
          ...mockProfile,
          displayName: 'John Doe',
          displayTitle: 'Software Engineer',
          displayCompany: 'Tech Company',
          hasProfilePhoto: false,
          skillsCount: 3,
          socialLinksCount: 1, // Only LinkedIn
          isComplete: true,
          completionPercentage: 100,
        });
      });

      it('should handle missing profile data', () => {
        const incompleteProfile = {
          ...mockProfile,
          name: '',
          title: '',
          company: '',
          profilePhoto: null,
          skills: [],
          socialLinks: {
            linkedin: null,
            twitter: null,
            github: null,
            instagram: null,
            facebook: null,
          },
        };

        const { result } = renderHook(() => useProfile(), { wrapper });

        const formatted =
          result.current.formatProfileForDisplay(incompleteProfile);

        expect(formatted.displayName).toBe('Unknown User');
        expect(formatted.displayTitle).toBe('No title');
        expect(formatted.displayCompany).toBe('No company');
        expect(formatted.hasProfilePhoto).toBe(false);
        expect(formatted.skillsCount).toBe(0);
        expect(formatted.socialLinksCount).toBe(0);
        expect(formatted.isComplete).toBe(false);
      });
    });
  });

  describe('Activities and Stats', () => {
    it('should fetch profile stats', async () => {
      const mockDispatch = jest
        .fn()
        .mockResolvedValue({ unwrap: () => Promise.resolve() });
      store.dispatch = mockDispatch;

      const { result } = renderHook(() => useProfile(), { wrapper });

      await act(async () => {
        await result.current.getProfileStats();
      });

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should fetch profile activities', async () => {
      const mockDispatch = jest
        .fn()
        .mockResolvedValue({ unwrap: () => Promise.resolve() });
      store.dispatch = mockDispatch;

      const { result } = renderHook(() => useProfile(), { wrapper });

      await act(async () => {
        await result.current.getProfileActivities('profile-123');
      });

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle stats fetch failure', async () => {
      const mockDispatch = jest
        .fn()
        .mockRejectedValue(new Error('Stats fetch failed'));
      store.dispatch = mockDispatch;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useProfile(), { wrapper });

      await act(async () => {
        await result.current.getProfileStats();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch profile stats:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
