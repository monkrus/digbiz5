/**
 * Profile Form Component Tests
 *
 * Component tests for profile creation and editing forms,
 * including validation, image upload, and user interactions.
 */

import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import CreateProfileScreen from '../../../src/screens/profile/CreateProfileScreen';
import { imagePickerService } from '../../../src/services/imagePickerService';
import { useProfile } from '../../../src/hooks/useProfile';
import {
  renderWithProviders,
  mockUser,
  mockNavigation,
  mockRoute,
  setupMocks,
  teardownMocks,
} from '../../utils/testUtils';

// Mock dependencies
jest.mock('../../../src/services/imagePickerService');
jest.mock('../../../src/hooks/useProfile');

describe('CreateProfileScreen', () => {
  let mockImagePickerService: jest.Mocked<typeof imagePickerService>;
  let mockUseProfile: jest.MockedFunction<typeof useProfile>;
  let mockAlertSpy: jest.SpyInstance;

  const defaultProfileHook = {
    createProfile: jest.fn(),
    uploadProfilePhoto: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    setupMocks();

    mockImagePickerService = imagePickerService as jest.Mocked<
      typeof imagePickerService
    >;
    mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
    mockAlertSpy = Alert.alert as jest.Mock;

    // Setup default mock implementations
    mockUseProfile.mockReturnValue(defaultProfileHook);
    mockImagePickerService.pickImage.mockResolvedValue({
      success: true,
      image: {
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        name: 'test-image.jpg',
        size: 1024,
        width: 400,
        height: 400,
      },
    });
    mockImagePickerService.validateImage.mockReturnValue({ valid: true });
  });

  afterEach(() => {
    teardownMocks();
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render profile creation form', () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      expect(getByText('Create Your Profile')).toBeTruthy();
      expect(getByPlaceholderText('Full Name')).toBeTruthy();
      expect(getByPlaceholderText('Job Title')).toBeTruthy();
      expect(getByPlaceholderText('Company')).toBeTruthy();
    });

    it('should render step indicators', () => {
      const { getByText } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      expect(getByText('Step 1 of 5')).toBeTruthy();
    });

    it('should render progress indicator', () => {
      const { getByTestId } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      const progressIndicator = getByTestId('progress-indicator');
      expect(progressIndicator).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Validation Error',
          'Please complete all required fields correctly.',
        );
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Fill basic info
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Job Title'), 'Developer');
      fireEvent.changeText(getByPlaceholderText('Company'), 'Test Company');

      // Go to contact step
      fireEvent.press(getByText('Next'));
      fireEvent.press(getByText('Next')); // Skip photo

      // Enter invalid email
      fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');

      fireEvent.press(getByText('Next'));

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Validation Error',
          'Please complete all required fields correctly.',
        );
      });
    });

    it('should validate phone number format', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Fill required fields
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Job Title'), 'Developer');
      fireEvent.changeText(getByPlaceholderText('Company'), 'Test Company');

      // Navigate to contact step
      fireEvent.press(getByText('Next'));
      fireEvent.press(getByText('Next'));

      // Fill email and invalid phone
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Phone'), '123'); // Too short

      const phoneInput = getByPlaceholderText('Phone');
      expect(phoneInput.props.value).toBe('123');
    });

    it('should validate skills input', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Navigate to skills step
      const steps = ['Next', 'Next', 'Next', 'Next']; // Basic -> Photo -> Contact -> Social -> Skills
      for (const step of steps) {
        fireEvent.press(getByText(step));
      }

      // Try to continue without skills
      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Validation Error',
          'Please complete all required fields correctly.',
        );
      });
    });
  });

  describe('Form Navigation', () => {
    it('should navigate between form steps', () => {
      const { getByText, queryByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Should start on basic info step
      expect(getByText('Basic Info')).toBeTruthy();

      // Fill required fields for basic step
      const nameInput = getByText('Full Name');
      fireEvent.changeText(nameInput, 'Test User');

      // Navigate to next step
      fireEvent.press(getByText('Next'));
      expect(getByText('Photo')).toBeTruthy();

      // Navigate back
      fireEvent.press(getByText('Previous'));
      expect(getByText('Basic Info')).toBeTruthy();
    });

    it('should prevent navigation to next step without required data', () => {
      const { getByText } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      const nextButton = getByText('Next');

      // Button should be disabled without required fields
      fireEvent.press(nextButton);

      // Should still be on basic info step
      expect(getByText('Basic Info')).toBeTruthy();
    });

    it('should show correct step titles', () => {
      const { getByText } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      const stepTitles = [
        'Basic Info',
        'Photo',
        'Contact',
        'Social Links',
        'Skills',
      ];

      stepTitles.forEach((title, index) => {
        expect(getByText(title)).toBeTruthy();
        if (index < stepTitles.length - 1) {
          // Fill minimum required data and go to next step
          if (index === 0) {
            // Basic info step
            fireEvent.changeText(getByText('Full Name'), 'Test');
            fireEvent.changeText(getByText('Job Title'), 'Test');
            fireEvent.changeText(getByText('Company'), 'Test');
          }
          fireEvent.press(getByText('Next'));
        }
      });
    });
  });

  describe('Photo Upload', () => {
    it('should handle photo selection', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Navigate to photo step
      fireEvent.press(getByText('Next')); // Basic -> Photo

      const photoButton = getByTestId('photo-upload-button');
      fireEvent.press(photoButton);

      await waitFor(() => {
        expect(mockImagePickerService.pickImage).toHaveBeenCalledWith(
          'both',
          expect.objectContaining({
            quality: 0.8,
            maxWidth: 400,
            maxHeight: 400,
            cropping: true,
          }),
        );
      });
    });

    it('should handle photo validation failure', async () => {
      mockImagePickerService.validateImage.mockReturnValue({
        valid: false,
        error: 'Image file is too large',
      });

      const { getByText, getByTestId } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Navigate to photo step
      fireEvent.press(getByText('Next'));

      const photoButton = getByTestId('photo-upload-button');
      fireEvent.press(photoButton);

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Invalid Image',
          'Image file is too large',
        );
      });
    });

    it('should handle photo upload error', async () => {
      mockImagePickerService.pickImage.mockResolvedValue({
        success: false,
        error: 'Camera not available',
        cancelled: false,
      });

      const { getByText, getByTestId } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      fireEvent.press(getByText('Next'));

      const photoButton = getByTestId('photo-upload-button');
      fireEvent.press(photoButton);

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Error',
          'Camera not available',
        );
      });
    });

    it('should handle photo removal', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      // Navigate to photo step and add photo
      fireEvent.press(getByText('Next'));

      const photoButton = getByTestId('photo-upload-button');
      fireEvent.press(photoButton);

      await waitFor(() => {
        expect(mockImagePickerService.pickImage).toHaveBeenCalled();
      });

      // Remove photo
      const removeButton = getByTestId('photo-remove-button');
      fireEvent.press(removeButton);

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Remove Photo',
          'Are you sure you want to remove your profile photo?',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Remove' }),
          ]),
        );
      });
    });
  });

  describe('Form Submission', () => {
    const fillCompleteForm = (getByPlaceholderText: any, getByText: any) => {
      // Basic info
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(
        getByPlaceholderText('Job Title'),
        'Software Engineer',
      );
      fireEvent.changeText(getByPlaceholderText('Company'), 'Tech Corp');
      fireEvent.press(getByText('Next'));

      // Skip photo
      fireEvent.press(getByText('Next'));

      // Contact info
      fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
      fireEvent.press(getByText('Next'));

      // Skip social links
      fireEvent.press(getByText('Next'));

      // Add skills
      fireEvent.changeText(getByPlaceholderText('Add a skill'), 'React');
      fireEvent.press(getByText('Add'));
    };

    it('should handle successful profile creation', async () => {
      const mockCreateProfile = jest.fn().mockResolvedValue({
        success: true,
        profile: mockUser,
      });

      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        createProfile: mockCreateProfile,
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      fillCompleteForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockCreateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            title: 'Software Engineer',
            company: 'Tech Corp',
            email: 'john@example.com',
            skills: ['React'],
          }),
        );
      });

      await waitFor(() => {
        expect(getByText('Profile Created!')).toBeTruthy();
      });
    });

    it('should handle profile creation failure', async () => {
      const mockCreateProfile = jest.fn().mockResolvedValue({
        success: false,
        message: 'Failed to create profile',
      });

      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        createProfile: mockCreateProfile,
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      fillCompleteForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Error',
          'Failed to create profile. Please try again.',
        );
      });
    });

    it('should handle photo upload during submission', async () => {
      const mockUploadProfilePhoto = jest.fn().mockResolvedValue({
        success: true,
        photoUrl: 'https://example.com/photo.jpg',
      });

      const mockCreateProfile = jest.fn().mockResolvedValue({
        success: true,
        profile: mockUser,
      });

      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        createProfile: mockCreateProfile,
        uploadProfilePhoto: mockUploadProfilePhoto,
      });

      const { getByPlaceholderText, getByText, getByTestId } =
        renderWithProviders(<CreateProfileScreen />, { withNavigation: true });

      // Fill basic info
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(
        getByPlaceholderText('Job Title'),
        'Software Engineer',
      );
      fireEvent.changeText(getByPlaceholderText('Company'), 'Tech Corp');
      fireEvent.press(getByText('Next'));

      // Add photo
      const photoButton = getByTestId('photo-upload-button');
      fireEvent.press(photoButton);

      await waitFor(() => {
        expect(mockImagePickerService.pickImage).toHaveBeenCalled();
      });

      // Continue with form...
      fillCompleteForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockUploadProfilePhoto).toHaveBeenCalled();
        expect(mockCreateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            profilePhoto: 'https://example.com/photo.jpg',
          }),
        );
      });
    });

    it('should handle photo upload failure during submission', async () => {
      const mockUploadProfilePhoto = jest.fn().mockResolvedValue({
        success: false,
        message: 'Photo upload failed',
      });

      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        uploadProfilePhoto: mockUploadProfilePhoto,
      });

      const { getByPlaceholderText, getByText, getByTestId } =
        renderWithProviders(<CreateProfileScreen />, { withNavigation: true });

      // Add photo and fill form
      fireEvent.press(getByText('Next')); // Go to photo step
      fireEvent.press(getByTestId('photo-upload-button'));

      fillCompleteForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Upload Error',
          'Failed to upload profile photo. Please try again.',
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during submission', async () => {
      const mockCreateProfile = jest.fn(
        () => new Promise(resolve => setTimeout(resolve, 1000)),
      );

      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        createProfile: mockCreateProfile,
      });

      const { getByPlaceholderText, getByText, getByTestId } =
        renderWithProviders(<CreateProfileScreen />, { withNavigation: true });

      fillCompleteForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('Submit'));

      expect(getByTestId('loading-overlay')).toBeTruthy();
    });

    it('should disable submit button during loading', async () => {
      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        loading: true,
      });

      const { getByText } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      const submitButton = getByText('Submit');
      expect(submitButton.props.disabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        error: 'Network error occurred',
      });

      const { getByText } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      expect(getByText('Network error occurred')).toBeTruthy();
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockCreateProfile = jest
        .fn()
        .mockRejectedValue(new Error('Unexpected error'));

      mockUseProfile.mockReturnValue({
        ...defaultProfileHook,
        createProfile: mockCreateProfile,
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <CreateProfileScreen />,
        { withNavigation: true },
      );

      fillCompleteForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith(
          'Error',
          'An unexpected error occurred. Please try again.',
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      const { getByLabelText } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      expect(getByLabelText('Full Name')).toBeTruthy();
      expect(getByLabelText('Job Title')).toBeTruthy();
      expect(getByLabelText('Company')).toBeTruthy();
    });

    it('should have accessible form navigation', () => {
      const { getByRole } = renderWithProviders(<CreateProfileScreen />, {
        withNavigation: true,
      });

      const nextButton = getByRole('button', { name: 'Next' });
      expect(nextButton.props.accessibilityLabel).toBeTruthy();
    });
  });
});
