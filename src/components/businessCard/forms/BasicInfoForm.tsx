/**
 * Basic Info Form - Form for entering basic business card information
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {
  BasicInfo,
  BusinessCardValidationErrors,
} from '../../../types/businessCard';
import { validateBasicInfo } from '../../../utils/businessCardValidation';
import ValidationMessage from '../common/ValidationMessage';
import ImageUploader from '../upload/ImageUploader';

interface BasicInfoFormProps {
  data: Partial<BasicInfo>;
  onUpdate: (data: Partial<BasicInfo>) => void;
  errors?: Partial<BusinessCardValidationErrors['basicInfo']>;
  isOptional?: boolean;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  data,
  onUpdate,
  errors,
  isOptional = false,
}) => {
  const [localData, setLocalData] = useState<Partial<BasicInfo>>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof BasicInfo, value: string) => {
      const updatedData = { ...localData, [field]: value };
      setLocalData(updatedData);
      onUpdate(updatedData);

      // Real-time validation for specific field
      const validation = validateBasicInfo(updatedData);
      if (validation[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: validation[field]! }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [localData, onUpdate],
  );

  const handleImageUpload = useCallback(
    (field: 'profilePhoto' | 'companyLogo', uri: string) => {
      updateField(field, uri);
    },
    [updateField],
  );

  const getFieldError = (field: keyof BasicInfo) => {
    return fieldErrors[field] || errors?.[field];
  };

  const renderRequiredLabel = (label: string, required: boolean = true) => (
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Text style={styles.sectionDescription}>
          Enter your essential contact information that will appear on your
          business card.
        </Text>
      </View>

      {/* Profile Photo */}
      <View style={styles.field}>
        <Text style={styles.label}>Profile Photo</Text>
        <ImageUploader
          onImageSelect={uri => handleImageUpload('profilePhoto', uri)}
          placeholder="Add your profile photo"
          style={styles.imageUploader}
        />
      </View>

      {/* Name */}
      <View style={styles.field}>
        {renderRequiredLabel('Full Name')}
        <TextInput
          style={[styles.input, getFieldError('name') && styles.inputError]}
          value={localData.name || ''}
          onChangeText={text => updateField('name', text)}
          placeholder="Enter your full name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={50}
        />
        {getFieldError('name') && (
          <ValidationMessage error={getFieldError('name')!} />
        )}
      </View>

      {/* Title */}
      <View style={styles.field}>
        {renderRequiredLabel('Job Title')}
        <TextInput
          style={[styles.input, getFieldError('title') && styles.inputError]}
          value={localData.title || ''}
          onChangeText={text => updateField('title', text)}
          placeholder="e.g., Software Engineer, CEO, Marketing Manager"
          autoCapitalize="words"
          maxLength={100}
        />
        {getFieldError('title') && (
          <ValidationMessage error={getFieldError('title')!} type="error" />
        )}
      </View>

      {/* Company */}
      <View style={styles.field}>
        {renderRequiredLabel('Company')}
        <TextInput
          style={[styles.input, getFieldError('company') && styles.inputError]}
          value={localData.company || ''}
          onChangeText={text => updateField('company', text)}
          placeholder="Enter your company name"
          autoCapitalize="words"
          maxLength={100}
        />
        {getFieldError('company') && (
          <ValidationMessage error={getFieldError('company')!} type="error" />
        )}
      </View>

      {/* Company Logo */}
      <View style={styles.field}>
        <Text style={styles.label}>Company Logo</Text>
        <ImageUploader
          onImageSelect={uri => handleImageUpload('companyLogo', uri)}
          placeholder="Add your company logo"
          style={styles.imageUploader}
        />
      </View>

      {/* Email */}
      <View style={styles.field}>
        {renderRequiredLabel('Email Address')}
        <TextInput
          style={[styles.input, getFieldError('email') && styles.inputError]}
          value={localData.email || ''}
          onChangeText={text => updateField('email', text.toLowerCase())}
          placeholder="your.email@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
        {getFieldError('email') && (
          <ValidationMessage error={getFieldError('email')!} type="error" />
        )}
      </View>

      {/* Phone */}
      <View style={styles.field}>
        {renderRequiredLabel('Phone Number', false)}
        <TextInput
          style={[styles.input, getFieldError('phone') && styles.inputError]}
          value={localData.phone || ''}
          onChangeText={text => updateField('phone', text)}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        {getFieldError('phone') && (
          <ValidationMessage error={getFieldError('phone')!} type="error" />
        )}
      </View>

      {/* Location */}
      <View style={styles.field}>
        {renderRequiredLabel('Location', false)}
        <TextInput
          style={[styles.input, getFieldError('location') && styles.inputError]}
          value={localData.location || ''}
          onChangeText={text => updateField('location', text)}
          placeholder="San Francisco, CA"
          autoCapitalize="words"
          maxLength={100}
        />
        <Text style={styles.fieldHint}>
          City, State or City, Country format works best
        </Text>
      </View>

      {/* Bio */}
      <View style={styles.field}>
        {renderRequiredLabel('Professional Bio', false)}
        <TextInput
          style={[styles.textArea, getFieldError('bio') && styles.inputError]}
          value={localData.bio || ''}
          onChangeText={text => updateField('bio', text)}
          placeholder="Write a brief description about yourself or your role..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {(localData.bio || '').length}/500 characters
        </Text>
        <Text style={styles.fieldHint}>
          A good bio helps people understand what you do and why they should
          connect with you
        </Text>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips for a Great Business Card</Text>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Use a professional profile photo with good lighting
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Keep your title clear and specific
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Write a bio that highlights your unique value
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Use consistent branding with your company logo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  fieldHint: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  imageUploader: {
    marginTop: 8,
  },
  tipsSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  tip: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default BasicInfoForm;
