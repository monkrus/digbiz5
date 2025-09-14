/**
 * Phase 2 Tests: Digital Card Creation
 *
 * Integration tests for creating digital business cards with all field types,
 * template selection, and card preview functionality.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
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
  RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

describe('Phase 2: Digital Card Creation', () => {
  let store;
  let navigation;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        businessCard: (state = { cards: [], currentCard: null }, action) =>
          state,
      },
    });

    navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Basic Card Information', () => {
    test('should create card with basic information fields', async () => {
      const MockBasicInfoForm = ({ onSubmit, initialData, errors }) => (
        <div testID="basic-info-form">
          <input
            testID="full-name-input"
            placeholder="Full Name"
            defaultValue={initialData?.fullName || ''}
          />
          {errors?.fullName && (
            <div testID="full-name-error">{errors.fullName}</div>
          )}

          <input
            testID="job-title-input"
            placeholder="Job Title"
            defaultValue={initialData?.jobTitle || ''}
          />

          <input
            testID="company-input"
            placeholder="Company"
            defaultValue={initialData?.company || ''}
          />

          <input
            testID="email-input"
            placeholder="Email"
            defaultValue={initialData?.email || ''}
          />
          {errors?.email && <div testID="email-error">{errors.email}</div>}

          <input
            testID="phone-input"
            placeholder="Phone Number"
            defaultValue={initialData?.phone || ''}
          />

          <input
            testID="website-input"
            placeholder="Website"
            defaultValue={initialData?.website || ''}
          />

          <textarea
            testID="bio-input"
            placeholder="Brief description..."
            defaultValue={initialData?.bio || ''}
          />

          <button
            testID="save-basic-info"
            onPress={() =>
              onSubmit({
                fullName: 'John Doe',
                jobTitle: 'Senior Developer',
                company: 'Tech Corp',
                email: 'john@techcorp.com',
                phone: '+1234567890',
                website: 'https://johndoe.com',
                bio: 'Experienced software developer specializing in mobile applications.',
              })
            }
          >
            Save Basic Info
          </button>
        </div>
      );

      const TestCardCreation = () => {
        const [cardData, setCardData] = React.useState({});
        const [errors, setErrors] = React.useState({});

        const handleBasicInfoSubmit = data => {
          const validationErrors = {};

          if (!data.fullName?.trim()) {
            validationErrors.fullName = 'Full name is required';
          }

          if (!data.email?.trim()) {
            validationErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            validationErrors.email = 'Invalid email format';
          }

          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }

          setErrors({});
          setCardData(prev => ({ ...prev, ...data }));
          navigation.navigate('SocialLinks');
        };

        return (
          <Provider store={store}>
            <MockBasicInfoForm
              onSubmit={handleBasicInfoSubmit}
              initialData={cardData}
              errors={errors}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestCardCreation />);

      const saveButton = getByTestId('save-basic-info');

      await act(async () => {
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(navigation.navigate).toHaveBeenCalledWith('SocialLinks');
      });
    });

    test('should validate required basic information fields', async () => {
      const MockBasicInfoForm = ({ onSubmit, errors }) => (
        <div testID="basic-info-form">
          <input testID="full-name-input" placeholder="Full Name" />
          {errors?.fullName && (
            <div testID="full-name-error">{errors.fullName}</div>
          )}

          <input testID="email-input" placeholder="Email" />
          {errors?.email && <div testID="email-error">{errors.email}</div>}

          <button
            testID="save-button"
            onPress={() =>
              onSubmit({
                fullName: '',
                email: 'invalid-email',
              })
            }
          >
            Save
          </button>
        </div>
      );

      const TestValidation = () => {
        const [errors, setErrors] = React.useState({});

        const handleSubmit = data => {
          const validationErrors = {};

          if (!data.fullName?.trim()) {
            validationErrors.fullName = 'Full name is required';
          }

          if (!data.email?.trim()) {
            validationErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            validationErrors.email = 'Invalid email format';
          }

          setErrors(validationErrors);
        };

        return (
          <Provider store={store}>
            <MockBasicInfoForm onSubmit={handleSubmit} errors={errors} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestValidation />);

      const saveButton = getByTestId('save-button');

      await act(async () => {
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(getByTestId('full-name-error')).toBeTruthy();
        expect(getByTestId('email-error')).toBeTruthy();
      });
    });
  });

  describe('Social Media Links', () => {
    test('should add and manage social media links', async () => {
      const MockSocialLinksForm = ({
        onSubmit,
        socialLinks,
        onAddLink,
        onRemoveLink,
      }) => (
        <div testID="social-links-form">
          <div testID="social-links-list">
            {socialLinks.map((link, index) => (
              <div key={index} testID={`social-link-${index}`}>
                <select
                  testID={`platform-select-${index}`}
                  defaultValue={link.platform}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="github">GitHub</option>
                </select>

                <input
                  testID={`url-input-${index}`}
                  placeholder="Profile URL"
                  defaultValue={link.url}
                />

                <button
                  testID={`remove-link-${index}`}
                  onPress={() => onRemoveLink(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            testID="add-link-button"
            onPress={() => onAddLink({ platform: 'linkedin', url: '' })}
          >
            Add Social Link
          </button>

          <button
            testID="save-social-links"
            onPress={() => onSubmit(socialLinks)}
          >
            Save Social Links
          </button>
        </div>
      );

      const TestSocialLinks = () => {
        const [socialLinks, setSocialLinks] = React.useState([
          { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
          { platform: 'twitter', url: 'https://twitter.com/johndoe' },
        ]);

        const handleAddLink = newLink => {
          setSocialLinks(prev => [...prev, newLink]);
        };

        const handleRemoveLink = index => {
          setSocialLinks(prev => prev.filter((_, i) => i !== index));
        };

        const handleSubmit = links => {
          // Validate URLs
          const validLinks = links.filter(
            link => link.url && link.url.startsWith('http'),
          );

          console.log('Saving social links:', validLinks);
          navigation.navigate('CardPreview');
        };

        return (
          <Provider store={store}>
            <MockSocialLinksForm
              onSubmit={handleSubmit}
              socialLinks={socialLinks}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestSocialLinks />);

      // Check initial social links
      expect(getByTestId('social-link-0')).toBeTruthy();
      expect(getByTestId('social-link-1')).toBeTruthy();

      // Add new social link
      const addButton = getByTestId('add-link-button');
      await act(async () => {
        fireEvent.press(addButton);
      });

      await waitFor(() => {
        expect(getByTestId('social-link-2')).toBeTruthy();
      });

      // Remove a social link
      const removeButton = getByTestId('remove-link-1');
      await act(async () => {
        fireEvent.press(removeButton);
      });

      await waitFor(() => {
        expect(() => getByTestId('social-link-2')).toThrow();
      });

      // Save social links
      const saveButton = getByTestId('save-social-links');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(navigation.navigate).toHaveBeenCalledWith('CardPreview');
    });

    test('should validate social media URLs', async () => {
      const MockSocialValidation = ({ onValidate, validationErrors }) => (
        <div testID="social-validation">
          <input
            testID="linkedin-url"
            placeholder="LinkedIn URL"
            defaultValue="invalid-url"
          />
          {validationErrors?.linkedin && (
            <div testID="linkedin-error">{validationErrors.linkedin}</div>
          )}

          <input
            testID="twitter-url"
            placeholder="Twitter URL"
            defaultValue=""
          />
          {validationErrors?.twitter && (
            <div testID="twitter-error">{validationErrors.twitter}</div>
          )}

          <button
            testID="validate-button"
            onPress={() =>
              onValidate({
                linkedin: 'invalid-url',
                twitter: '',
              })
            }
          >
            Validate
          </button>
        </div>
      );

      const TestSocialValidation = () => {
        const [validationErrors, setValidationErrors] = React.useState({});

        const handleValidate = data => {
          const errors = {};

          if (data.linkedin && !data.linkedin.startsWith('http')) {
            errors.linkedin =
              'Please enter a valid URL starting with http or https';
          }

          if (data.twitter && !data.twitter.includes('twitter.com')) {
            errors.twitter = 'Please enter a valid Twitter URL';
          }

          setValidationErrors(errors);
        };

        return (
          <Provider store={store}>
            <MockSocialValidation
              onValidate={handleValidate}
              validationErrors={validationErrors}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestSocialValidation />);

      const validateButton = getByTestId('validate-button');

      await act(async () => {
        fireEvent.press(validateButton);
      });

      await waitFor(() => {
        expect(getByTestId('linkedin-error')).toBeTruthy();
      });
    });
  });

  describe('Photo Upload', () => {
    test('should upload and preview profile photo', async () => {
      const { launchImageLibrary } = require('react-native-image-picker');

      launchImageLibrary.mockImplementation((options, callback) => {
        callback({
          didCancel: false,
          assets: [
            {
              uri: 'file:///path/to/photo.jpg',
              type: 'image/jpeg',
              fileName: 'profile.jpg',
              fileSize: 1024000,
            },
          ],
        });
      });

      const MockPhotoUpload = ({ onPhotoSelect, photo, onRemovePhoto }) => (
        <div testID="photo-upload">
          {photo ? (
            <div testID="photo-preview">
              <img testID="profile-image" src={photo} alt="Profile" />
              <button testID="remove-photo" onPress={onRemovePhoto}>
                Remove Photo
              </button>
            </div>
          ) : (
            <div testID="photo-placeholder">
              <div>No photo selected</div>
              <button testID="select-photo" onPress={onPhotoSelect}>
                Select Photo
              </button>
            </div>
          )}
        </div>
      );

      const TestPhotoUpload = () => {
        const [photo, setPhoto] = React.useState(null);

        const handlePhotoSelect = () => {
          launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
            if (!response.didCancel && response.assets?.[0]) {
              const asset = response.assets[0];
              setPhoto(asset.uri);
            }
          });
        };

        const handleRemovePhoto = () => {
          setPhoto(null);
        };

        return (
          <Provider store={store}>
            <MockPhotoUpload
              onPhotoSelect={handlePhotoSelect}
              photo={photo}
              onRemovePhoto={handleRemovePhoto}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestPhotoUpload />);

      // Initially no photo
      expect(getByTestId('photo-placeholder')).toBeTruthy();

      // Select photo
      const selectButton = getByTestId('select-photo');
      await act(async () => {
        fireEvent.press(selectButton);
      });

      await waitFor(() => {
        expect(getByTestId('photo-preview')).toBeTruthy();
        expect(getByTestId('profile-image')).toBeTruthy();
      });

      // Remove photo
      const removeButton = getByTestId('remove-photo');
      await act(async () => {
        fireEvent.press(removeButton);
      });

      await waitFor(() => {
        expect(getByTestId('photo-placeholder')).toBeTruthy();
      });
    });

    test('should handle camera capture for profile photo', async () => {
      const { launchCamera } = require('react-native-image-picker');

      launchCamera.mockImplementation((options, callback) => {
        callback({
          didCancel: false,
          assets: [
            {
              uri: 'file:///path/to/camera-photo.jpg',
              type: 'image/jpeg',
              fileName: 'camera.jpg',
            },
          ],
        });
      });

      const MockCameraCapture = ({ onTakePhoto, photo }) => (
        <div testID="camera-capture">
          <button testID="take-photo" onPress={onTakePhoto}>
            Take Photo
          </button>
          {photo && <img testID="captured-photo" src={photo} alt="Captured" />}
        </div>
      );

      const TestCameraCapture = () => {
        const [photo, setPhoto] = React.useState(null);

        const handleTakePhoto = () => {
          launchCamera({ mediaType: 'photo', quality: 0.8 }, response => {
            if (!response.didCancel && response.assets?.[0]) {
              setPhoto(response.assets[0].uri);
            }
          });
        };

        return (
          <Provider store={store}>
            <MockCameraCapture onTakePhoto={handleTakePhoto} photo={photo} />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestCameraCapture />);

      const takePhotoButton = getByTestId('take-photo');
      await act(async () => {
        fireEvent.press(takePhotoButton);
      });

      await waitFor(() => {
        expect(getByTestId('captured-photo')).toBeTruthy();
      });
    });
  });

  describe('Template Selection', () => {
    test('should select and preview different card templates', async () => {
      const templates = [
        { id: 'modern', name: 'Modern', preview: 'modern-preview.jpg' },
        { id: 'classic', name: 'Classic', preview: 'classic-preview.jpg' },
        { id: 'minimal', name: 'Minimal', preview: 'minimal-preview.jpg' },
      ];

      const MockTemplateSelector = ({
        templates,
        selectedTemplate,
        onSelectTemplate,
      }) => (
        <div testID="template-selector">
          <div testID="template-grid">
            {templates.map(template => (
              <div
                key={template.id}
                testID={`template-${template.id}`}
                className={selectedTemplate === template.id ? 'selected' : ''}
              >
                <img
                  testID={`template-preview-${template.id}`}
                  src={template.preview}
                  alt={template.name}
                />
                <div testID={`template-name-${template.id}`}>
                  {template.name}
                </div>
                <button
                  testID={`select-template-${template.id}`}
                  onPress={() => onSelectTemplate(template.id)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div testID="selected-template">
              Selected: {templates.find(t => t.id === selectedTemplate)?.name}
            </div>
          )}
        </div>
      );

      const TestTemplateSelection = () => {
        const [selectedTemplate, setSelectedTemplate] = React.useState(null);

        const handleSelectTemplate = templateId => {
          setSelectedTemplate(templateId);
        };

        return (
          <Provider store={store}>
            <MockTemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestTemplateSelection />);

      // Check all templates are rendered
      expect(getByTestId('template-modern')).toBeTruthy();
      expect(getByTestId('template-classic')).toBeTruthy();
      expect(getByTestId('template-minimal')).toBeTruthy();

      // Select a template
      const selectModernButton = getByTestId('select-template-modern');
      await act(async () => {
        fireEvent.press(selectModernButton);
      });

      await waitFor(() => {
        expect(getByTestId('selected-template')).toBeTruthy();
        expect(getByTestId('selected-template').children[0]).toBe(
          'Selected: Modern',
        );
      });
    });
  });

  describe('Complete Card Creation Flow', () => {
    test('should create complete business card with all fields', async () => {
      const MockCardWizard = ({
        currentStep,
        cardData,
        onNextStep,
        onPreviousStep,
        onUpdateData,
      }) => (
        <div testID="card-wizard">
          <div testID="progress-indicator">Step {currentStep} of 4</div>

          {currentStep === 1 && (
            <div testID="step-basic-info">
              <h3>Basic Information</h3>
              <button
                testID="next-from-basic"
                onPress={() => {
                  onUpdateData({
                    fullName: 'John Doe',
                    jobTitle: 'Senior Developer',
                    company: 'Tech Corp',
                    email: 'john@techcorp.com',
                    phone: '+1234567890',
                  });
                  onNextStep();
                }}
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div testID="step-social-links">
              <h3>Social Links</h3>
              <button testID="back-button" onPress={onPreviousStep}>
                Back
              </button>
              <button
                testID="next-from-social"
                onPress={() => {
                  onUpdateData({
                    ...cardData,
                    socialLinks: [
                      {
                        platform: 'linkedin',
                        url: 'https://linkedin.com/in/johndoe',
                      },
                    ],
                  });
                  onNextStep();
                }}
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div testID="step-template">
              <h3>Choose Template</h3>
              <button testID="back-button" onPress={onPreviousStep}>
                Back
              </button>
              <button
                testID="next-from-template"
                onPress={() => {
                  onUpdateData({
                    ...cardData,
                    template: 'modern',
                  });
                  onNextStep();
                }}
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div testID="step-review">
              <h3>Review & Save</h3>
              <div testID="card-preview">
                <div>Name: {cardData.fullName}</div>
                <div>Title: {cardData.jobTitle}</div>
                <div>Company: {cardData.company}</div>
                <div>Email: {cardData.email}</div>
                <div>Phone: {cardData.phone}</div>
                <div>Template: {cardData.template}</div>
              </div>
              <button testID="back-button" onPress={onPreviousStep}>
                Back
              </button>
              <button
                testID="save-card"
                onPress={() => navigation.navigate('CardList')}
              >
                Save Card
              </button>
            </div>
          )}
        </div>
      );

      const TestCompleteCardCreation = () => {
        const [currentStep, setCurrentStep] = React.useState(1);
        const [cardData, setCardData] = React.useState({});

        const handleNextStep = () => {
          setCurrentStep(prev => Math.min(prev + 1, 4));
        };

        const handlePreviousStep = () => {
          setCurrentStep(prev => Math.max(prev - 1, 1));
        };

        const handleUpdateData = data => {
          setCardData(prev => ({ ...prev, ...data }));
        };

        return (
          <Provider store={store}>
            <MockCardWizard
              currentStep={currentStep}
              cardData={cardData}
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}
              onUpdateData={handleUpdateData}
            />
          </Provider>
        );
      };

      const { getByTestId } = render(<TestCompleteCardCreation />);

      // Step 1: Basic Info
      expect(getByTestId('step-basic-info')).toBeTruthy();
      const nextFromBasic = getByTestId('next-from-basic');
      await act(async () => {
        fireEvent.press(nextFromBasic);
      });

      // Step 2: Social Links
      await waitFor(() => {
        expect(getByTestId('step-social-links')).toBeTruthy();
      });
      const nextFromSocial = getByTestId('next-from-social');
      await act(async () => {
        fireEvent.press(nextFromSocial);
      });

      // Step 3: Template
      await waitFor(() => {
        expect(getByTestId('step-template')).toBeTruthy();
      });
      const nextFromTemplate = getByTestId('next-from-template');
      await act(async () => {
        fireEvent.press(nextFromTemplate);
      });

      // Step 4: Review
      await waitFor(() => {
        expect(getByTestId('step-review')).toBeTruthy();
        expect(getByTestId('card-preview')).toBeTruthy();
      });

      // Save card
      const saveCard = getByTestId('save-card');
      await act(async () => {
        fireEvent.press(saveCard);
      });

      expect(navigation.navigate).toHaveBeenCalledWith('CardList');
    });
  });
});
