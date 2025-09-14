/**
 * Create Profile Screen
 *
 * This screen allows users to create their initial profile with form validation,
 * image upload, and step-by-step guidance.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import {
  ProfileFormData,
  ProfileValidationErrors,
  ProfilePhotoData,
} from '../../types/profile';
import {
  validateProfileForm,
  getProfileCompletionPercentage,
} from '../../utils/profileValidation';
import { imagePickerService } from '../../services/imagePickerService';
import { useProfile } from '../../hooks/useProfile';

// Components (these would be created separately)
import ProfileFormHeader from '../../components/profile/ProfileFormHeader';
import ProfilePhotoUpload from '../../components/profile/ProfilePhotoUpload';
import ProfileBasicInfoForm from '../../components/profile/ProfileBasicInfoForm';
import ProfileContactForm from '../../components/profile/ProfileContactForm';
import ProfileSocialLinksForm from '../../components/profile/ProfileSocialLinksForm';
import ProfileSkillsForm from '../../components/profile/ProfileSkillsForm';
import ProfileFormFooter from '../../components/profile/ProfileFormFooter';
import ProgressIndicator from '../../components/common/ProgressIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';

interface CreateProfileScreenProps {
  route?: {
    params?: {
      skipOnboarding?: boolean;
    };
  };
}

const CreateProfileScreen: React.FC<CreateProfileScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { createProfile, uploadProfilePhoto, loading, error } = useProfile();
  const scrollViewRef = useRef<ScrollView>(null);

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
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
    isPublic: true,
  });

  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoData | null>(
    null,
  );
  const [validationErrors, setValidationErrors] =
    useState<ProfileValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form steps
  const formSteps = [
    { title: 'Basic Info', component: 'basic' },
    { title: 'Photo', component: 'photo' },
    { title: 'Contact', component: 'contact' },
    { title: 'Social Links', component: 'social' },
    { title: 'Skills', component: 'skills' },
  ];

  const totalSteps = formSteps.length;
  const completionPercentage = getProfileCompletionPercentage(formData);

  useEffect(() => {
    // Validate form whenever data changes
    const errors = validateProfileForm(formData);
    setValidationErrors(errors);
  }, [formData]);

  const handleFormChange = useCallback(
    (field: keyof ProfileFormData, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handlePhotoSelect = useCallback(async () => {
    try {
      const result = await imagePickerService.pickImage('both', {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        cropping: true,
      });

      if (result.success && result.image) {
        const validation = imagePickerService.validateImage(result.image);
        if (!validation.valid) {
          Alert.alert('Invalid Image', validation.error);
          return;
        }
        setProfilePhoto(result.image);
      } else if (result.error && !result.cancelled) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Photo selection error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setProfilePhoto(null),
        },
      ],
    );
  }, []);

  const validateCurrentStep = (): boolean => {
    const stepRequiredFields: Record<number, (keyof ProfileFormData)[]> = {
      0: ['name', 'title', 'company'], // Basic info
      1: [], // Photo - optional
      2: ['email'], // Contact
      3: [], // Social links - optional
      4: ['skills'], // Skills
    };

    const requiredFields = stepRequiredFields[currentStep] || [];
    const hasRequiredFields = requiredFields.every(field => {
      const value = formData[field];
      if (field === 'skills') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim().length > 0;
    });

    const stepErrors = Object.keys(validationErrors).filter(field =>
      requiredFields.includes(field as keyof ProfileFormData),
    );

    return hasRequiredFields && stepErrors.length === 0;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      Alert.alert(
        'Validation Error',
        'Please complete all required fields correctly.',
      );
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Final validation
      const errors = validateProfileForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        Alert.alert(
          'Validation Error',
          'Please fix all errors before submitting.',
        );
        return;
      }

      // Upload photo first if present
      let profilePhotoUrl: string | null = null;
      if (profilePhoto) {
        const uploadResult = await uploadProfilePhoto(profilePhoto);
        if (uploadResult.success) {
          profilePhotoUrl = uploadResult.photoUrl;
        } else {
          Alert.alert(
            'Upload Error',
            'Failed to upload profile photo. Please try again.',
          );
          return;
        }
      }

      // Create profile
      const profileData = {
        ...formData,
        profilePhoto: profilePhotoUrl,
      };

      const result = await createProfile(profileData);

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          if (route?.params?.skipOnboarding) {
            navigation.navigate('Profile' as never);
          } else {
            navigation.navigate('OnboardingComplete' as never);
          }
        }, 2000);
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to create profile. Please try again.',
        );
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Creation',
      'You can complete your profile later in settings. Continue without a profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('Home' as never),
        },
      ],
    );
  };

  const renderCurrentStep = () => {
    const step = formSteps[currentStep];

    switch (step.component) {
      case 'basic':
        return (
          <ProfileBasicInfoForm
            formData={formData}
            errors={validationErrors}
            onFieldChange={handleFormChange}
          />
        );
      case 'photo':
        return (
          <ProfilePhotoUpload
            photo={profilePhoto}
            onPhotoSelect={handlePhotoSelect}
            onPhotoRemove={handleRemovePhoto}
            loading={loading}
          />
        );
      case 'contact':
        return (
          <ProfileContactForm
            formData={formData}
            errors={validationErrors}
            onFieldChange={handleFormChange}
          />
        );
      case 'social':
        return (
          <ProfileSocialLinksForm
            socialLinks={formData.socialLinks}
            errors={validationErrors.socialLinks}
            onFieldChange={handleFormChange}
          />
        );
      case 'skills':
        return (
          <ProfileSkillsForm
            skills={formData.skills}
            error={validationErrors.skills}
            onSkillsChange={skills => handleFormChange('skills', skills)}
          />
        );
      default:
        return null;
    }
  };

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <SuccessMessage
            title="Profile Created!"
            message="Your profile has been created successfully. Welcome to the community!"
            showIcon
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ProfileFormHeader
          title="Create Your Profile"
          subtitle={`Step ${currentStep + 1} of ${totalSteps}`}
          onSkip={currentStep === 0 ? handleSkip : undefined}
        />

        <ProgressIndicator
          progress={(currentStep + 1) / totalSteps}
          showPercentage={false}
          height={4}
        />

        {error && <ErrorMessage message={error} style={styles.errorMessage} />}

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepContainer}>
            <ProfileFormHeader
              title={formSteps[currentStep].title}
              subtitle={`Complete this step to continue`}
              showProgress
              progress={completionPercentage}
            />

            {renderCurrentStep()}
          </View>
        </ScrollView>

        <ProfileFormFooter
          currentStep={currentStep}
          totalSteps={totalSteps}
          canGoNext={validateCurrentStep()}
          canGoPrevious={currentStep > 0}
          onNext={handleNextStep}
          onPrevious={handlePreviousStep}
          onSubmit={handleSubmit}
          loading={isSubmitting}
        />

        {(loading || isSubmitting) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  errorMessage: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default CreateProfileScreen;
