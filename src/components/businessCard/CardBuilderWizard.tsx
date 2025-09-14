/**
 * Card Builder Wizard - Multi-step business card creation interface
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BusinessCardFormData,
  BusinessCardValidationErrors,
  BasicInfo,
  StartupInfo,
  SocialLinks,
  CustomField,
} from '../../types/businessCard';
import { validateBusinessCardForm } from '../../utils/businessCardValidation';
import { DEFAULT_THEME, DEFAULT_TEMPLATE } from '../../data/cardThemes';

import StepIndicator from './common/StepIndicator';
import BasicInfoForm from './forms/BasicInfoForm';
import StartupInfoForm from './forms/StartupInfoForm';
import SocialLinksForm from './forms/SocialLinksForm';
import CustomFieldsForm from './forms/CustomFieldsForm';
import TemplateSelector from './selectors/TemplateSelector';
import ThemeSelector from './selectors/ThemeSelector';
import CardPreview from './preview/CardPreview';
import LoadingSpinner from './common/LoadingSpinner';

const { width, height } = Dimensions.get('window');

interface CardBuilderWizardProps {
  initialData?: Partial<BusinessCardFormData>;
  onSave: (cardData: BusinessCardFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

interface WizardStep {
  key: string;
  title: string;
  component: React.ComponentType<any>;
  isOptional: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    key: 'template',
    title: 'Choose Template',
    component: TemplateSelector,
    isOptional: false,
  },
  {
    key: 'theme',
    title: 'Select Theme',
    component: ThemeSelector,
    isOptional: false,
  },
  {
    key: 'basicInfo',
    title: 'Basic Information',
    component: BasicInfoForm,
    isOptional: false,
  },
  {
    key: 'startupInfo',
    title: 'Startup Details',
    component: StartupInfoForm,
    isOptional: true,
  },
  {
    key: 'socialLinks',
    title: 'Social Links',
    component: SocialLinksForm,
    isOptional: true,
  },
  {
    key: 'customFields',
    title: 'Custom Fields',
    component: CustomFieldsForm,
    isOptional: true,
  },
];

const CardBuilderWizard: React.FC<CardBuilderWizardProps> = ({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  isEditing = false,
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<BusinessCardValidationErrors>({});

  // Form data state
  const [formData, setFormData] = useState<BusinessCardFormData>({
    basicInfo: {
      name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      profilePhoto: '',
      companyLogo: '',
      ...initialData?.basicInfo,
    },
    startupInfo: {
      fundingStage: 'idea',
      teamSize: 'solo',
      industry: [],
      businessModel: 'b2b',
      revenue: 'pre-revenue',
      seekingFunding: false,
      seekingTalent: false,
      seekingPartners: false,
      seekingMentors: false,
      ...initialData?.startupInfo,
    },
    socialLinks: {
      linkedin: '',
      twitter: '',
      website: '',
      github: '',
      instagram: '',
      facebook: '',
      ...initialData?.socialLinks,
    },
    customFields: initialData?.customFields || [],
    themeId: initialData?.themeId || DEFAULT_THEME.id,
    templateId: initialData?.templateId || DEFAULT_TEMPLATE.id,
    isDefault: initialData?.isDefault || false,
    isPublic: initialData?.isPublic || true,
  });

  // Validate form on data change
  useEffect(() => {
    const validationErrors = validateBusinessCardForm(formData);
    setErrors(validationErrors);
  }, [formData]);

  const updateFormData = useCallback(
    (section: keyof BusinessCardFormData, data: any) => {
      setFormData(prev => ({
        ...prev,
        [section]: data,
      }));
    },
    [],
  );

  const handleNext = useCallback(() => {
    const currentStepKey = WIZARD_STEPS[currentStep].key;
    const stepErrors =
      errors[currentStepKey as keyof BusinessCardValidationErrors];

    // Check if current step has validation errors (only for required steps)
    if (!WIZARD_STEPS[currentStep].isOptional && stepErrors) {
      Alert.alert(
        'Validation Error',
        'Please fix the errors before proceeding to the next step.',
      );
      return;
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  }, [currentStep, errors, formData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSave = useCallback(async () => {
    try {
      const validationErrors = validateBusinessCardForm(formData);

      // Check for critical errors
      const hasErrors = Object.keys(validationErrors).some(key => {
        const stepIndex = WIZARD_STEPS.findIndex(step => step.key === key);
        return stepIndex !== -1 && !WIZARD_STEPS[stepIndex].isOptional;
      });

      if (hasErrors) {
        Alert.alert(
          'Validation Error',
          'Please fix all required fields before saving.',
        );
        return;
      }

      await onSave(formData);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'Save Error',
        'Failed to save business card. Please try again.',
      );
    }
  }, [formData, onSave]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Creation',
      'Are you sure you want to cancel? All changes will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Discard Changes', style: 'destructive', onPress: onCancel },
      ],
    );
  }, [onCancel]);

  const renderCurrentStep = () => {
    const step = WIZARD_STEPS[currentStep];
    const StepComponent = step.component;

    const commonProps = {
      data: formData[step.key as keyof BusinessCardFormData],
      onUpdate: (data: any) =>
        updateFormData(step.key as keyof BusinessCardFormData, data),
      errors: errors[step.key as keyof BusinessCardValidationErrors],
      isOptional: step.isOptional,
    };

    switch (step.key) {
      case 'template':
        return (
          <StepComponent
            selectedTemplateId={formData.templateId}
            onSelect={(templateId: string) =>
              updateFormData('templateId', templateId)
            }
            {...commonProps}
          />
        );
      case 'theme':
        return (
          <StepComponent
            selectedThemeId={formData.themeId}
            onSelect={(themeId: string) => updateFormData('themeId', themeId)}
            {...commonProps}
          />
        );
      default:
        return <StepComponent {...commonProps} />;
    }
  };

  const canProceed = () => {
    const currentStepKey = WIZARD_STEPS[currentStep].key;
    const stepErrors =
      errors[currentStepKey as keyof BusinessCardValidationErrors];
    return WIZARD_STEPS[currentStep].isOptional || !stepErrors;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Saving your business card..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with step indicator */}
      <View style={styles.header}>
        <StepIndicator
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          steps={WIZARD_STEPS.map(step => step.title)}
        />
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {showPreview ? (
          <View style={styles.previewContainer}>
            <CardPreview
              formData={formData}
              onClose={() => setShowPreview(false)}
              onEdit={() => setShowPreview(false)}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.formContainer}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {renderCurrentStep()}
          </ScrollView>
        )}
      </View>

      {/* Navigation footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={currentStep === 0 ? handleCancel : handlePrevious}
          >
            <Text style={styles.secondaryButtonText}>
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.previewButton]}
            onPress={() => setShowPreview(!showPreview)}
          >
            <Text style={styles.previewButtonText}>
              {showPreview ? 'Edit' : 'Preview'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              !canProceed() &&
                !WIZARD_STEPS[currentStep].isOptional &&
                styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!canProceed() && !WIZARD_STEPS[currentStep].isOptional}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === WIZARD_STEPS.length - 1 ? 'Save Card' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 100, // Extra space for navigation
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  previewButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CardBuilderWizard;
