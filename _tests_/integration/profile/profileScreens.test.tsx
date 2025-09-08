/**
 * Profile Screens Integration Tests
 * 
 * This test suite validates the integration between profile screens,
 * services, and state management including user interactions and workflows.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

import { CreateProfileScreen } from '../../../src/screens/profile/CreateProfileScreen';
import { EditProfileScreen } from '../../../src/screens/profile/EditProfileScreen';
import { ProfilePreview } from '../../../src/components/profile/ProfilePreview';
import { profileSlice } from '../../../src/store/profileSlice';
import { UserProfile } from '../../../src/types/profile';

// Mock dependencies
jest.mock('../../../src/services/profileService');
jest.mock('../../../src/services/imagePickerService');
jest.mock('react-native-mmkv', () => ({
  MMKV: {
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
  useFocusEffect: jest.fn(),
}));

// Mock image picker
jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(),
  openCamera: jest.fn(),
}));

// Mock permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  check: jest.fn(),
  PERMISSIONS: {
    ANDROID: { CAMERA: 'android.permission.CAMERA' },
    IOS: { CAMERA: 'ios.permission.CAMERA' },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

const mockProfile: UserProfile = {
  id: 'profile-123',
  userId: 'user-123',
  name: 'John Doe',
  title: 'Software Engineer',
  company: 'Tech Company',
  bio: 'Experienced developer with expertise in React Native',
  profilePhoto: null,
  email: 'john@example.com',
  phone: '+1234567890',
  location: 'San Francisco, CA',
  website: 'https://johndoe.com',
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
    github: 'https://github.com/johndoe',
    instagram: null,
    facebook: null,
  },
  skills: ['JavaScript', 'React Native', 'Node.js'],
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

const renderWithProvider = (component: React.ReactElement, store: any) => {
  return render(
    React.createElement(Provider, { store },
      React.createElement(NavigationContainer, null, component)
    )
  );
};

describe('Profile Screens Integration', () => {
  let store: any;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  describe('CreateProfileScreen', () => {
    const mockRoute = {
      params: {
        skipOnboarding: false,
      },
    };

    it('should render create profile form', () => {
      renderWithProvider(
        React.createElement(CreateProfileScreen, { route: mockRoute }),
        store
      );

      expect(screen.getByText('Create Your Profile')).toBeTruthy();
      expect(screen.getByPlaceholderText('Full Name')).toBeTruthy();
      expect(screen.getByPlaceholderText('Job Title')).toBeTruthy();
      expect(screen.getByPlaceholderText('Company')).toBeTruthy();
    });

    it('should show validation errors for empty required fields', async () => {
      renderWithProvider(
        React.createElement(CreateProfileScreen, { route: mockRoute }),
        store
      );

      const nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
        expect(screen.getByText('Title is required')).toBeTruthy();
        expect(screen.getByText('Company is required')).toBeTruthy();
      });
    });

    it('should progress through form steps with valid data', async () => {
      renderWithProvider(
        React.createElement(CreateProfileScreen, { route: mockRoute }),
        store
      );

      // Fill basic info
      const nameInput = screen.getByPlaceholderText('Full Name');
      const titleInput = screen.getByPlaceholderText('Job Title');
      const companyInput = screen.getByPlaceholderText('Company');

      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(titleInput, 'Software Engineer');
      fireEvent.changeText(companyInput, 'Tech Company');

      const nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        // Should progress to next step
        expect(screen.getByPlaceholderText('Email Address')).toBeTruthy();
      });
    });

    it('should handle profile creation success', async () => {
      // Mock successful profile creation
      const mockDispatch = jest.fn().mockResolvedValue({
        unwrap: () => Promise.resolve({
          success: true,
          profile: mockProfile,
          message: 'Profile created successfully',
        }),
      });
      store.dispatch = mockDispatch;

      renderWithProvider(
        React.createElement(CreateProfileScreen, { route: mockRoute }),
        store
      );

      // Fill out complete form
      fireEvent.changeText(screen.getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(screen.getByPlaceholderText('Job Title'), 'Engineer');
      fireEvent.changeText(screen.getByPlaceholderText('Company'), 'Tech Co');

      // Navigate through steps and submit
      fireEvent.press(screen.getByText('Next')); // Basic info -> Contact
      await waitFor(() => screen.getByPlaceholderText('Email Address'));

      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'john@example.com');
      fireEvent.press(screen.getByText('Next')); // Contact -> Skills

      await waitFor(() => screen.getByPlaceholderText('Add skills...'));
      fireEvent.changeText(screen.getByPlaceholderText('Add skills...'), 'JavaScript');
      fireEvent.press(screen.getByText('Add'));

      fireEvent.press(screen.getByText('Create Profile'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProfileComplete');
      });
    });

    it('should handle photo upload in creation flow', async () => {
      const mockImagePicker = require('react-native-image-crop-picker');
      mockImagePicker.openPicker.mockResolvedValue({
        path: 'file://photo.jpg',
        mime: 'image/jpeg',
        size: 1024000,
      });

      renderWithProvider(
        React.createElement(CreateProfileScreen, { route: mockRoute }),
        store
      );

      // Navigate to photo step
      fireEvent.changeText(screen.getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(screen.getByPlaceholderText('Job Title'), 'Engineer');
      fireEvent.changeText(screen.getByPlaceholderText('Company'), 'Tech Co');
      fireEvent.press(screen.getByText('Next'));

      await waitFor(() => screen.getByPlaceholderText('Email Address'));
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'john@example.com');
      fireEvent.press(screen.getByText('Next'));

      await waitFor(() => screen.getByText('Add Photo'));
      fireEvent.press(screen.getByText('Choose from Gallery'));

      await waitFor(() => {
        expect(mockImagePicker.openPicker).toHaveBeenCalled();
      });
    });
  });

  describe('EditProfileScreen', () => {
    const mockRoute = {
      params: {
        profile: mockProfile,
      },
    };

    it('should render edit profile form with existing data', () => {
      store = createMockStore({
        currentProfile: mockProfile,
      });

      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      expect(screen.getByText('Edit Profile')).toBeTruthy();
      expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
      expect(screen.getByDisplayValue('Software Engineer')).toBeTruthy();
      expect(screen.getByDisplayValue('Tech Company')).toBeTruthy();
    });

    it('should show collapsible sections', () => {
      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      expect(screen.getByText('Basic Information')).toBeTruthy();
      expect(screen.getByText('Contact Information')).toBeTruthy();
      expect(screen.getByText('Social Links')).toBeTruthy();
      expect(screen.getByText('Skills')).toBeTruthy();
    });

    it('should toggle section visibility', async () => {
      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      const contactSection = screen.getByText('Contact Information');
      fireEvent.press(contactSection);

      // Section content should become visible/hidden
      await waitFor(() => {
        const phoneInput = screen.queryByPlaceholderText('Phone Number');
        expect(phoneInput).toBeTruthy();
      });
    });

    it('should detect unsaved changes', async () => {
      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.changeText(nameInput, 'Jane Doe');

      // Should show unsaved changes indicator
      await waitFor(() => {
        expect(store.getState().profile.hasUnsavedChanges).toBe(true);
      });
    });

    it('should save profile changes', async () => {
      const mockDispatch = jest.fn().mockResolvedValue({
        unwrap: () => Promise.resolve({
          success: true,
          profile: { ...mockProfile, name: 'Jane Doe' },
          message: 'Profile updated successfully',
        }),
      });
      store.dispatch = mockDispatch;

      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.changeText(nameInput, 'Jane Doe');

      const saveButton = screen.getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('should show confirmation modal for unsaved changes on back', async () => {
      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      // Make changes
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.changeText(nameInput, 'Jane Doe');

      // Try to go back
      fireEvent.press(screen.getByText('Back')); // Assuming back button exists

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeTruthy();
        expect(screen.getByText('You have unsaved changes. Are you sure you want to leave?')).toBeTruthy();
      });
    });

    it('should handle photo replacement', async () => {
      const mockImagePicker = require('react-native-image-crop-picker');
      mockImagePicker.openPicker.mockResolvedValue({
        path: 'file://new-photo.jpg',
        mime: 'image/jpeg',
        size: 2048000,
      });

      renderWithProvider(
        React.createElement(EditProfileScreen, { route: mockRoute }),
        store
      );

      const changePhotoButton = screen.getByText('Change Photo');
      fireEvent.press(changePhotoButton);
      fireEvent.press(screen.getByText('Choose from Gallery'));

      await waitFor(() => {
        expect(mockImagePicker.openPicker).toHaveBeenCalled();
      });
    });
  });

  describe('ProfilePreview Component', () => {
    it('should render profile in card variant', () => {
      render(
        React.createElement(ProfilePreview, {
          profile: mockProfile,
          variant: 'card',
          showActions: true,
        })
      );

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Software Engineer')).toBeTruthy();
      expect(screen.getByText('Tech Company')).toBeTruthy();
    });

    it('should render profile in detailed variant', () => {
      render(
        React.createElement(ProfilePreview, {
          profile: mockProfile,
          variant: 'detailed',
          showSkills: true,
          showSocialLinks: true,
        })
      );

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('JavaScript')).toBeTruthy();
      expect(screen.getByText('React Native')).toBeTruthy();
      expect(screen.getByText('Node.js')).toBeTruthy();
    });

    it('should show action buttons when enabled', () => {
      const mockOnEdit = jest.fn();
      const mockOnShare = jest.fn();

      render(
        React.createElement(ProfilePreview, {
          profile: mockProfile,
          variant: 'card',
          showActions: true,
          editable: true,
          onEdit: mockOnEdit,
          onShare: mockOnShare,
        })
      );

      const editButton = screen.getByText('Edit');
      const shareButton = screen.getByText('Share');

      expect(editButton).toBeTruthy();
      expect(shareButton).toBeTruthy();

      fireEvent.press(editButton);
      fireEvent.press(shareButton);

      expect(mockOnEdit).toHaveBeenCalled();
      expect(mockOnShare).toHaveBeenCalled();
    });

    it('should handle missing profile data gracefully', () => {
      const incompleteProfile = {
        ...mockProfile,
        profilePhoto: null,
        bio: '',
        skills: [],
        socialLinks: {
          linkedin: null,
          twitter: null,
          github: null,
          instagram: null,
          facebook: null,
        },
      };

      render(
        React.createElement(ProfilePreview, {
          profile: incompleteProfile,
          variant: 'detailed',
          showSkills: true,
        })
      );

      expect(screen.getByText('John Doe')).toBeTruthy();
      // Should not crash with missing data
    });

    it('should render compact variant for list views', () => {
      render(
        React.createElement(ProfilePreview, {
          profile: mockProfile,
          variant: 'compact',
          showActions: false,
        })
      );

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Software Engineer at Tech Company')).toBeTruthy();
    });

    it('should handle profile interaction callbacks', () => {
      const mockOnConnect = jest.fn();
      const mockOnView = jest.fn();

      render(
        React.createElement(ProfilePreview, {
          profile: mockProfile,
          variant: 'card',
          onConnect: mockOnConnect,
          onView: mockOnView,
        })
      );

      // Simulate profile tap
      fireEvent.press(screen.getByText('John Doe'));

      expect(mockOnView).toHaveBeenCalledWith(mockProfile);
    });
  });

  describe('Profile Integration Workflows', () => {
    it('should complete create -> view -> edit workflow', async () => {
      // Create profile
      const createRoute = { params: { skipOnboarding: false } };
      const { rerender } = renderWithProvider(
        React.createElement(CreateProfileScreen, { route: createRoute }),
        store
      );

      // Fill form and create
      fireEvent.changeText(screen.getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(screen.getByPlaceholderText('Job Title'), 'Engineer');
      fireEvent.changeText(screen.getByPlaceholderText('Company'), 'Tech Co');
      fireEvent.press(screen.getByText('Next'));

      await waitFor(() => screen.getByPlaceholderText('Email Address'));
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'john@example.com');
      
      // Mock successful creation and update store
      store = createMockStore({
        currentProfile: mockProfile,
        profiles: { 'profile-123': mockProfile },
      });

      // View profile
      rerender(
        React.createElement(Provider, { store },
          React.createElement(ProfilePreview, {
            profile: mockProfile,
            variant: 'detailed',
            showActions: true,
            editable: true,
            onEdit: () => mockNavigate('EditProfile', { profile: mockProfile }),
          })
        )
      );

      expect(screen.getByText('John Doe')).toBeTruthy();

      // Edit profile
      const editButton = screen.getByText('Edit');
      fireEvent.press(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('EditProfile', { profile: mockProfile });
    });

    it('should handle profile search and selection', async () => {
      store = createMockStore({
        searchResults: [mockProfile],
        searchLoading: false,
      });

      render(
        React.createElement(Provider, { store },
          React.createElement(ProfilePreview, {
            profile: mockProfile,
            variant: 'compact',
            onView: (profile: UserProfile) => mockNavigate('ProfileDetail', { profile }),
          })
        )
      );

      fireEvent.press(screen.getByText('John Doe'));

      expect(mockNavigate).toHaveBeenCalledWith('ProfileDetail', { profile: mockProfile });
    });

    it('should handle error states across screens', async () => {
      store = createMockStore({
        error: 'Failed to create profile',
        loading: false,
      });

      renderWithProvider(
        React.createElement(CreateProfileScreen, { route: { params: {} } }),
        store
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to create profile')).toBeTruthy();
      });
    });
  });
});