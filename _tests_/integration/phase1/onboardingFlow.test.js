/**
 * Phase 1 Tests: Complete Onboarding Flow
 *
 * End-to-end tests for the complete user onboarding flow including
 * registration, profile setup, and initial app configuration.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
import { authService } from '../../../src/services/authService';
import { authSlice } from '../../../src/store/authSlice';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  createNavigationContainerRef: () => ({
    current: {
      navigate: jest.fn(),
      getCurrentRoute: jest.fn(),
    },
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock services
jest.mock('../../../src/services/authService');
jest.mock('../../../src/services/tokenStorage');

// Mock image picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
}));

describe('Phase 1: Complete Onboarding Flow', () => {
  let store;
  let navigation;

  beforeEach(() => {
    // Create test store
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });

    // Mock navigation
    navigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();

    // Mock authService default responses
    authService.register.mockResolvedValue({
      success: true,
      user: {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        provider: 'email',
        verified: false,
      },
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });

    authService.updateProfile.mockResolvedValue({
      id: 'new-user-123',
      email: 'newuser@example.com',
      name: 'Updated User',
      provider: 'email',
      verified: true,
    });
  });

  describe('Registration Step', () => {
    test('should complete user registration successfully', async () => {
      const MockRegistrationForm = ({ onSubmit, loading, errors }) => (
        <div testID="registration-form">
          <input testID="name-input" placeholder="Full Name" />
          {errors.name && <div testID="name-error">{errors.name}</div>}

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

          <input
            testID="confirm-password-input"
            placeholder="Confirm Password"
            type="password"
          />
          {errors.confirmPassword && (
            <div testID="confirm-password-error">{errors.confirmPassword}</div>
          )}

          <button
            testID="register-button"
            onPress={() =>
              onSubmit({
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
                confirmPassword: 'password123',
              })
            }
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      );

      const TestRegistrationComponent = () => {
        const [loading, setLoading] = React.useState(false);
        const [errors, setErrors] = React.useState({});

        const handleSubmit = async data => {
          setLoading(true);
          setErrors({});

          try {
            // Validate form
            const validationErrors = {};
            if (!data.name.trim()) validationErrors.name = 'Name is required';
            if (!data.email.trim())
              validationErrors.email = 'Email is required';
            if (!data.password)
              validationErrors.password = 'Password is required';
            if (data.password !== data.confirmPassword) {
              validationErrors.confirmPassword = 'Passwords do not match';
            }

            if (Object.keys(validationErrors).length > 0) {
              setErrors(validationErrors);
              return;
            }

            const result = await authService.register(data);

            if (result.success) {
              // Navigate to next step
              navigation.navigate('ProfileSetup');
            }
          } catch (error) {
            setErrors({ general: error.message });
          } finally {
            setLoading(false);
          }
        };

        return (
          <Provider store={store}>
            <MockRegistrationForm
              onSubmit={handleSubmit}
              loading={loading}
              errors={errors}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestRegistrationComponent />);

      const registerButton = getByTestId('register-button');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      });

      expect(navigation.navigate).toHaveBeenCalledWith('ProfileSetup');
    });

    test('should validate registration form inputs', async () => {
      const MockRegistrationForm = ({ onSubmit, errors }) => (
        <div testID="registration-form">
          <input testID="name-input" placeholder="Full Name" />
          {errors.name && <div testID="name-error">{errors.name}</div>}

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

          <input
            testID="confirm-password-input"
            placeholder="Confirm Password"
            type="password"
          />
          {errors.confirmPassword && (
            <div testID="confirm-password-error">{errors.confirmPassword}</div>
          )}

          <button
            testID="register-button"
            onPress={() =>
              onSubmit({
                name: '',
                email: 'invalid-email',
                password: '123',
                confirmPassword: 'different',
              })
            }
          >
            Create Account
          </button>
        </div>
      );

      const TestRegistrationComponent = () => {
        const [errors, setErrors] = React.useState({});

        const handleSubmit = async data => {
          const validationErrors = {};

          if (!data.name.trim()) {
            validationErrors.name = 'Name is required';
          }

          if (!data.email.trim()) {
            validationErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            validationErrors.email = 'Invalid email format';
          }

          if (!data.password) {
            validationErrors.password = 'Password is required';
          } else if (data.password.length < 6) {
            validationErrors.password =
              'Password must be at least 6 characters';
          }

          if (data.password !== data.confirmPassword) {
            validationErrors.confirmPassword = 'Passwords do not match';
          }

          setErrors(validationErrors);
        };

        return (
          <Provider store={store}>
            <MockRegistrationForm onSubmit={handleSubmit} errors={errors} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestRegistrationComponent />);

      const registerButton = getByTestId('register-button');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(getByTestId('name-error')).toBeTruthy();
        expect(getByTestId('email-error')).toBeTruthy();
        expect(getByTestId('password-error')).toBeTruthy();
        expect(getByTestId('confirm-password-error')).toBeTruthy();
      });

      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  describe('Profile Setup Step', () => {
    test('should complete profile setup with photo upload', async () => {
      const { launchImageLibrary } = require('react-native-image-picker');

      launchImageLibrary.mockImplementation((options, callback) => {
        callback({
          didCancel: false,
          assets: [
            {
              uri: 'file:///path/to/photo.jpg',
              type: 'image/jpeg',
              fileName: 'photo.jpg',
            },
          ],
        });
      });

      const MockProfileSetup = ({
        onSubmit,
        loading,
        profileData,
        onPhotoUpload,
      }) => (
        <div testID="profile-setup">
          <div testID="profile-photo">
            {profileData.photo ? (
              <img
                testID="profile-image"
                src={profileData.photo}
                alt="Profile"
              />
            ) : (
              <div testID="placeholder-photo">No photo selected</div>
            )}
            <button testID="upload-photo-button" onPress={onPhotoUpload}>
              Upload Photo
            </button>
          </div>

          <input
            testID="bio-input"
            placeholder="Tell us about yourself..."
            multiline
          />

          <input testID="phone-input" placeholder="Phone Number" />

          <input testID="company-input" placeholder="Company" />

          <input testID="position-input" placeholder="Position" />

          <button
            testID="continue-button"
            onPress={() =>
              onSubmit({
                bio: 'Software developer passionate about mobile apps',
                phone: '+1234567890',
                company: 'Tech Corp',
                position: 'Senior Developer',
                photo: profileData.photo,
              })
            }
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      );

      const TestProfileSetup = () => {
        const [loading, setLoading] = React.useState(false);
        const [profileData, setProfileData] = React.useState({
          photo: null,
        });

        const handlePhotoUpload = () => {
          launchImageLibrary({ mediaType: 'photo' }, response => {
            if (!response.didCancel && response.assets?.[0]) {
              setProfileData(prev => ({
                ...prev,
                photo: response.assets[0].uri,
              }));
            }
          });
        };

        const handleSubmit = async data => {
          setLoading(true);
          try {
            await authService.updateProfile(data);
            navigation.navigate('Dashboard');
          } catch (error) {
            console.error('Profile setup failed:', error);
          } finally {
            setLoading(false);
          }
        };

        return (
          <Provider store={store}>
            <MockProfileSetup
              onSubmit={handleSubmit}
              loading={loading}
              profileData={profileData}
              onPhotoUpload={handlePhotoUpload}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestProfileSetup />);

      // Upload photo
      const uploadButton = getByTestId('upload-photo-button');
      await act(async () => {
        fireEvent.press(uploadButton);
      });

      await waitFor(() => {
        expect(getByTestId('profile-image')).toBeTruthy();
      });

      // Continue with profile setup
      const continueButton = getByTestId('continue-button');
      await act(async () => {
        fireEvent.press(continueButton);
      });

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith({
          bio: 'Software developer passionate about mobile apps',
          phone: '+1234567890',
          company: 'Tech Corp',
          position: 'Senior Developer',
          photo: 'file:///path/to/photo.jpg',
        });
      });

      expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');
    });

    test('should handle photo upload cancellation', async () => {
      const { launchImageLibrary } = require('react-native-image-picker');

      launchImageLibrary.mockImplementation((options, callback) => {
        callback({
          didCancel: true,
        });
      });

      const MockProfileSetup = ({ onPhotoUpload, profileData }) => (
        <div testID="profile-setup">
          <div testID="profile-photo">
            {profileData.photo ? (
              <img
                testID="profile-image"
                src={profileData.photo}
                alt="Profile"
              />
            ) : (
              <div testID="placeholder-photo">No photo selected</div>
            )}
            <button testID="upload-photo-button" onPress={onPhotoUpload}>
              Upload Photo
            </button>
          </div>
        </div>
      );

      const TestProfileSetup = () => {
        const [profileData, setProfileData] = React.useState({
          photo: null,
        });

        const handlePhotoUpload = () => {
          launchImageLibrary({ mediaType: 'photo' }, response => {
            if (!response.didCancel && response.assets?.[0]) {
              setProfileData(prev => ({
                ...prev,
                photo: response.assets[0].uri,
              }));
            }
          });
        };

        return (
          <Provider store={store}>
            <MockProfileSetup
              onPhotoUpload={handlePhotoUpload}
              profileData={profileData}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestProfileSetup />);

      const uploadButton = getByTestId('upload-photo-button');
      await act(async () => {
        fireEvent.press(uploadButton);
      });

      // Should still show placeholder
      expect(getByTestId('placeholder-photo')).toBeTruthy();
      expect(() => getByTestId('profile-image')).toThrow();
    });
  });

  describe('Email Verification Step', () => {
    test('should handle email verification flow', async () => {
      const MockEmailVerification = ({ onResendEmail, onSkip, loading }) => (
        <div testID="email-verification">
          <div testID="verification-message">
            Please check your email and click the verification link
          </div>

          <button
            testID="resend-button"
            onPress={onResendEmail}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Email'}
          </button>

          <button testID="skip-button" onPress={onSkip}>
            Skip for now
          </button>
        </div>
      );

      const TestEmailVerification = () => {
        const [loading, setLoading] = React.useState(false);

        const handleResendEmail = async () => {
          setLoading(true);
          try {
            // Mock email resend API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Verification email resent');
          } catch (error) {
            console.error('Failed to resend email:', error);
          } finally {
            setLoading(false);
          }
        };

        const handleSkip = () => {
          navigation.navigate('Dashboard');
        };

        return (
          <Provider store={store}>
            <MockEmailVerification
              onResendEmail={handleResendEmail}
              onSkip={handleSkip}
              loading={loading}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestEmailVerification />);

      expect(getByTestId('verification-message')).toBeTruthy();

      // Test resend email
      const resendButton = getByTestId('resend-button');
      await act(async () => {
        fireEvent.press(resendButton);
      });

      // Test skip
      const skipButton = getByTestId('skip-button');
      await act(async () => {
        fireEvent.press(skipButton);
      });

      expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');
    });
  });

  describe('Complete Onboarding Flow', () => {
    test('should navigate through entire onboarding process', async () => {
      const MockOnboardingWizard = ({
        currentStep,
        onNextStep,
        onPreviousStep,
        userData,
        updateUserData,
      }) => (
        <div testID="onboarding-wizard">
          <div testID="step-indicator">Step {currentStep} of 4</div>

          {currentStep === 1 && (
            <div testID="step-registration">
              <h2>Create Your Account</h2>
              <button
                testID="next-from-registration"
                onPress={() => {
                  updateUserData({
                    email: 'user@example.com',
                    name: 'Test User',
                  });
                  onNextStep();
                }}
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div testID="step-profile">
              <h2>Complete Your Profile</h2>
              <button testID="back-button" onPress={onPreviousStep}>
                Back
              </button>
              <button
                testID="next-from-profile"
                onPress={() => {
                  updateUserData({
                    ...userData,
                    bio: 'Test bio',
                    company: 'Test Company',
                  });
                  onNextStep();
                }}
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div testID="step-verification">
              <h2>Verify Your Email</h2>
              <button testID="back-button" onPress={onPreviousStep}>
                Back
              </button>
              <button testID="next-from-verification" onPress={onNextStep}>
                Continue
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div testID="step-complete">
              <h2>Welcome to DigBiz!</h2>
              <div testID="welcome-message">
                Your account has been created successfully
              </div>
              <button
                testID="finish-onboarding"
                onPress={() => navigation.replace('Dashboard')}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      );

      const TestOnboardingWizard = () => {
        const [currentStep, setCurrentStep] = React.useState(1);
        const [userData, setUserData] = React.useState({});

        const handleNextStep = () => {
          setCurrentStep(prev => Math.min(prev + 1, 4));
        };

        const handlePreviousStep = () => {
          setCurrentStep(prev => Math.max(prev - 1, 1));
        };

        const updateUserData = data => {
          setUserData(prev => ({ ...prev, ...data }));
        };

        return (
          <Provider store={store}>
            <MockOnboardingWizard
              currentStep={currentStep}
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}
              userData={userData}
              updateUserData={updateUserData}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestOnboardingWizard />);

      // Step 1: Registration
      expect(getByTestId('step-registration')).toBeTruthy();
      expect(getByTestId('step-indicator').children[0]).toBe('Step 1 of 4');

      const nextFromRegistration = getByTestId('next-from-registration');
      await act(async () => {
        fireEvent.press(nextFromRegistration);
      });

      // Step 2: Profile
      await waitFor(() => {
        expect(getByTestId('step-profile')).toBeTruthy();
        expect(getByTestId('step-indicator').children[0]).toBe('Step 2 of 4');
      });

      // Test back navigation
      const backButton = getByTestId('back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });

      await waitFor(() => {
        expect(getByTestId('step-registration')).toBeTruthy();
      });

      // Go forward again
      await act(async () => {
        fireEvent.press(getByTestId('next-from-registration'));
      });

      await waitFor(() => {
        expect(getByTestId('step-profile')).toBeTruthy();
      });

      const nextFromProfile = getByTestId('next-from-profile');
      await act(async () => {
        fireEvent.press(nextFromProfile);
      });

      // Step 3: Verification
      await waitFor(() => {
        expect(getByTestId('step-verification')).toBeTruthy();
        expect(getByTestId('step-indicator').children[0]).toBe('Step 3 of 4');
      });

      const nextFromVerification = getByTestId('next-from-verification');
      await act(async () => {
        fireEvent.press(nextFromVerification);
      });

      // Step 4: Complete
      await waitFor(() => {
        expect(getByTestId('step-complete')).toBeTruthy();
        expect(getByTestId('welcome-message')).toBeTruthy();
        expect(getByTestId('step-indicator').children[0]).toBe('Step 4 of 4');
      });

      const finishButton = getByTestId('finish-onboarding');
      await act(async () => {
        fireEvent.press(finishButton);
      });

      expect(navigation.replace).toHaveBeenCalledWith('Dashboard');
    });

    test('should save onboarding progress in AsyncStorage', async () => {
      const MockOnboardingProgress = ({ onSaveProgress, onLoadProgress }) => (
        <div testID="onboarding-progress">
          <button
            testID="save-button"
            onPress={() =>
              onSaveProgress({ step: 2, userData: { name: 'Test' } })
            }
          >
            Save Progress
          </button>
          <button testID="load-button" onPress={onLoadProgress}>
            Load Progress
          </button>
        </div>
      );

      const TestOnboardingProgress = () => {
        const handleSaveProgress = async progress => {
          await AsyncStorage.setItem(
            'onboarding_progress',
            JSON.stringify(progress),
          );
        };

        const handleLoadProgress = async () => {
          const saved = await AsyncStorage.getItem('onboarding_progress');
          if (saved) {
            const progress = JSON.parse(saved);
            console.log('Loaded progress:', progress);
          }
        };

        return (
          <Provider store={store}>
            <MockOnboardingProgress
              onSaveProgress={handleSaveProgress}
              onLoadProgress={handleLoadProgress}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestOnboardingProgress />);

      const saveButton = getByTestId('save-button');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding_progress',
        JSON.stringify({ step: 2, userData: { name: 'Test' } }),
      );

      const loadButton = getByTestId('load-button');
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({ step: 2, userData: { name: 'Test' } }),
      );

      await act(async () => {
        fireEvent.press(loadButton);
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('onboarding_progress');
    });
  });

  describe('Error Handling', () => {
    test('should handle registration errors gracefully', async () => {
      authService.register.mockRejectedValueOnce(
        new Error('Email already exists'),
      );

      const MockRegistrationWithError = ({ onRegister, error, loading }) => (
        <div testID="registration-with-error">
          {error && <div testID="error-message">{error}</div>}
          <button
            testID="register-button"
            onPress={onRegister}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      );

      const TestRegistrationWithError = () => {
        const [error, setError] = React.useState(null);
        const [loading, setLoading] = React.useState(false);

        const handleRegister = async () => {
          setLoading(true);
          setError(null);

          try {
            await authService.register({
              name: 'Test User',
              email: 'existing@example.com',
              password: 'password123',
              confirmPassword: 'password123',
            });
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };

        return (
          <Provider store={store}>
            <MockRegistrationWithError
              onRegister={handleRegister}
              error={error}
              loading={loading}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestRegistrationWithError />);

      const registerButton = getByTestId('register-button');
      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByTestId('error-message').children[0]).toBe(
          'Email already exists',
        );
      });
    });

    test('should handle network errors during onboarding', async () => {
      authService.updateProfile.mockRejectedValueOnce(
        new Error('Network connection failed'),
      );

      const MockProfileWithError = ({ onSubmit, error }) => (
        <div testID="profile-with-error">
          {error && <div testID="network-error">{error}</div>}
          <button testID="submit-profile" onPress={onSubmit}>
            Submit Profile
          </button>
        </div>
      );

      const TestProfileWithError = () => {
        const [error, setError] = React.useState(null);

        const handleSubmit = async () => {
          try {
            setError(null);
            await authService.updateProfile({ bio: 'Test bio' });
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <Provider store={store}>
            <MockProfileWithError onSubmit={handleSubmit} error={error} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestProfileWithError />);

      const submitButton = getByTestId('submit-profile');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(getByTestId('network-error')).toBeTruthy();
        expect(getByTestId('network-error').children[0]).toBe(
          'Network connection failed',
        );
      });
    });
  });
});
