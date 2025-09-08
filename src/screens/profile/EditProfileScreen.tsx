/**
 * Edit Profile Screen
 * 
 * This screen allows users to edit their existing profile with real-time validation,
 * unsaved changes detection, and section-based editing.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { isEqual } from 'lodash';

import { 
  UserProfile, 
  ProfileFormData, 
  ProfileValidationErrors, 
  ProfilePhotoData,
  ProfileUpdateData 
} from '../../types/profile';
import { validateProfileForm, getProfileCompletionPercentage } from '../../utils/profileValidation';
import { imagePickerService } from '../../services/imagePickerService';
import { useProfile } from '../../hooks/useProfile';

// Components (these would be created separately)
import ProfileEditHeader from '../../components/profile/ProfileEditHeader';
import ProfilePhotoEdit from '../../components/profile/ProfilePhotoEdit';
import ProfileBasicInfoForm from '../../components/profile/ProfileBasicInfoForm';
import ProfileContactForm from '../../components/profile/ProfileContactForm';
import ProfileSocialLinksForm from '../../components/profile/ProfileSocialLinksForm';
import ProfileSkillsForm from '../../components/profile/ProfileSkillsForm';
import ProfilePrivacySettings from '../../components/profile/ProfilePrivacySettings';
import CollapsibleSection from '../../components/common/CollapsibleSection';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';
import UnsavedChangesModal from '../../components/common/UnsavedChangesModal';

interface EditProfileScreenProps {
  route: {
    params: {
      profile: UserProfile;
      section?: 'basic' | 'contact' | 'social' | 'skills' | 'privacy';
    };
  };
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { updateProfile, uploadProfilePhoto, loading, error, clearError } = useProfile();
  const scrollViewRef = useRef<ScrollView>(null);

  const { profile: initialProfile, section: initialSection } = route.params;

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialProfile.name,
    title: initialProfile.title,
    company: initialProfile.company,
    bio: initialProfile.bio,
    email: initialProfile.email,
    phone: initialProfile.phone || '',
    location: initialProfile.location || '',
    website: initialProfile.website || '',
    socialLinks: initialProfile.socialLinks,
    skills: initialProfile.skills,
    isPublic: initialProfile.isPublic,
  });

  const [originalFormData] = useState<ProfileFormData>(formData);
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoData | null>(null);
  const [validationErrors, setValidationErrors] = useState<ProfileValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: initialSection === 'basic' || !initialSection,
    contact: initialSection === 'contact',
    social: initialSection === 'social',
    skills: initialSection === 'skills',
    privacy: initialSection === 'privacy',
  });
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<() => void | null>(null);

  const hasUnsavedChanges = !isEqual(formData, originalFormData) || profilePhoto !== null;
  const completionPercentage = getProfileCompletionPercentage(formData);

  useEffect(() => {
    // Validate form whenever data changes
    const errors = validateProfileForm(formData);
    setValidationErrors(errors);
  }, [formData]);

  useEffect(() => {
    // Clear success message after delay
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Handle back button on Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          handleBackPress();
          return true; // Prevent default behavior
        }
        return false; // Allow default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [hasUnsavedChanges, handleBackPress])
  );

  const handleFormChange = useCallback((field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    clearError(); // Clear any existing errors
  }, [clearError]);

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
          onPress: () => {
            setProfilePhoto({ uri: '', type: '', name: '', size: 0 }); // Mark for deletion
          },
        },
      ]
    );
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Validate form
      const errors = validateProfileForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        Alert.alert('Validation Error', 'Please fix all errors before saving.');
        return;
      }

      let profilePhotoUrl: string | null = initialProfile.profilePhoto;

      // Handle photo upload/deletion
      if (profilePhoto) {
        if (profilePhoto.uri === '') {
          // Photo marked for deletion
          profilePhotoUrl = null;
        } else {
          // New photo to upload
          const uploadResult = await uploadProfilePhoto(profilePhoto);
          if (uploadResult.success) {
            profilePhotoUrl = uploadResult.photoUrl;
          } else {
            Alert.alert('Upload Error', 'Failed to upload profile photo. Please try again.');
            return;
          }
        }
      }

      // Prepare update data
      const updateData: ProfileUpdateData = {
        ...formData,
        profilePhoto: profilePhotoUrl,
      };

      // Update profile
      const result = await updateProfile(initialProfile.id, updateData);
      
      if (result.success) {
        setShowSuccess(true);
        setProfilePhoto(null); // Reset photo state
        
        // Update original form data
        const newOriginalData = { ...formData };
        Object.assign(originalFormData, newOriginalData);
        
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to reset all changes? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setFormData(originalFormData);
            setProfilePhoto(null);
            clearError();
          },
        },
      ]
    );
  };

  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedChanges(true);
      setPendingNavigation(() => () => navigation.goBack());
    } else {
      navigation.goBack();
    }
  }, [hasUnsavedChanges, navigation]);

  const handleUnsavedChangesDecision = (save: boolean, discard: boolean) => {
    setShowUnsavedChanges(false);
    
    if (save) {
      handleSave().then(() => {
        if (pendingNavigation) {
          pendingNavigation();
          setPendingNavigation(null);
        }
      });
    } else if (discard) {
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    }
  };

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <SuccessMessage
            title="Profile Updated!"
            message="Your profile changes have been saved successfully."
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
        <ProfileEditHeader
          title="Edit Profile"
          completion={completionPercentage}
          hasUnsavedChanges={hasUnsavedChanges}
          onBack={handleBackPress}
          onSave={handleSave}
          onReset={hasUnsavedChanges ? handleReset : undefined}
          loading={isSubmitting}
        />

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={clearError}
            style={styles.errorMessage}
          />
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <CollapsibleSection
            title="Profile Photo"
            isExpanded={true}
            onToggle={() => {}}
            showToggle={false}
          >
            <ProfilePhotoEdit
              currentPhoto={initialProfile.profilePhoto}
              newPhoto={profilePhoto}
              onPhotoSelect={handlePhotoSelect}
              onPhotoRemove={handleRemovePhoto}
              loading={loading}
            />
          </CollapsibleSection>

          {/* Basic Information Section */}
          <CollapsibleSection
            title="Basic Information"
            isExpanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
            showBadge={Object.keys(validationErrors).some(key => 
              ['name', 'title', 'company', 'bio'].includes(key)
            )}
          >
            <ProfileBasicInfoForm
              formData={formData}
              errors={validationErrors}
              onFieldChange={handleFormChange}
            />
          </CollapsibleSection>

          {/* Contact Information Section */}
          <CollapsibleSection
            title="Contact Information"
            isExpanded={expandedSections.contact}
            onToggle={() => toggleSection('contact')}
            showBadge={Object.keys(validationErrors).some(key => 
              ['email', 'phone', 'location', 'website'].includes(key)
            )}
          >
            <ProfileContactForm
              formData={formData}
              errors={validationErrors}
              onFieldChange={handleFormChange}
            />
          </CollapsibleSection>

          {/* Social Links Section */}
          <CollapsibleSection
            title="Social Links"
            isExpanded={expandedSections.social}
            onToggle={() => toggleSection('social')}
            showBadge={validationErrors.socialLinks !== undefined}
          >
            <ProfileSocialLinksForm
              socialLinks={formData.socialLinks}
              errors={validationErrors.socialLinks}
              onFieldChange={handleFormChange}
            />
          </CollapsibleSection>

          {/* Skills Section */}
          <CollapsibleSection
            title="Skills"
            isExpanded={expandedSections.skills}
            onToggle={() => toggleSection('skills')}
            showBadge={validationErrors.skills !== undefined}
          >
            <ProfileSkillsForm
              skills={formData.skills}
              error={validationErrors.skills}
              onSkillsChange={(skills) => handleFormChange('skills', skills)}
            />
          </CollapsibleSection>

          {/* Privacy Settings Section */}
          <CollapsibleSection
            title="Privacy Settings"
            isExpanded={expandedSections.privacy}
            onToggle={() => toggleSection('privacy')}
          >
            <ProfilePrivacySettings
              isPublic={formData.isPublic}
              onPrivacyChange={(isPublic) => handleFormChange('isPublic', isPublic)}
            />
          </CollapsibleSection>
        </ScrollView>

        {(loading || isSubmitting) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        <UnsavedChangesModal
          visible={showUnsavedChanges}
          onSave={() => handleUnsavedChangesDecision(true, false)}
          onDiscard={() => handleUnsavedChangesDecision(false, true)}
          onCancel={() => handleUnsavedChangesDecision(false, false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default EditProfileScreen;