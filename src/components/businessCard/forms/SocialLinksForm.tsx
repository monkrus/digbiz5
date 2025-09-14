/**
 * Social Links Form - Form for entering social media and professional links
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';

import {
  SocialLinks,
  BusinessCardValidationErrors,
} from '../../../types/businessCard';
import { validateSocialLinks } from '../../../utils/businessCardValidation';
import ValidationMessage from '../common/ValidationMessage';

interface SocialLinksFormProps {
  data: Partial<SocialLinks>;
  onUpdate: (data: Partial<SocialLinks>) => void;
  errors?: Partial<BusinessCardValidationErrors['socialLinks']>;
  isOptional?: boolean;
}

interface SocialPlatform {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
  icon: string;
  description: string;
  urlPrefix: string;
  color: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/yourprofile',
    icon: '💼',
    description: 'Professional networking',
    urlPrefix: 'https://linkedin.com/in/',
    color: '#0077b5',
  },
  {
    key: 'twitter',
    label: 'Twitter / X',
    placeholder: 'https://twitter.com/yourusername',
    icon: '🐦',
    description: 'Social updates and thoughts',
    urlPrefix: 'https://twitter.com/',
    color: '#1da1f2',
  },
  {
    key: 'website',
    label: 'Website',
    placeholder: 'https://yourwebsite.com',
    icon: '🌐',
    description: 'Personal or company website',
    urlPrefix: 'https://',
    color: '#6b7280',
  },
  {
    key: 'github',
    label: 'GitHub',
    placeholder: 'https://github.com/yourusername',
    icon: '💻',
    description: 'Code repositories',
    urlPrefix: 'https://github.com/',
    color: '#333333',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourusername',
    icon: '📸',
    description: 'Visual content',
    urlPrefix: 'https://instagram.com/',
    color: '#e4405f',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourprofile',
    icon: '📘',
    description: 'Social networking',
    urlPrefix: 'https://facebook.com/',
    color: '#1877f2',
  },
];

const SocialLinksForm: React.FC<SocialLinksFormProps> = ({
  data,
  onUpdate,
  errors,
  isOptional = true,
}) => {
  const [localData, setLocalData] = useState<Partial<SocialLinks>>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof SocialLinks, value: string) => {
      const updatedData = { ...localData, [field]: value };
      setLocalData(updatedData);
      onUpdate(updatedData);

      // Real-time validation for specific field
      const validation = validateSocialLinks(updatedData);
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

  const getFieldError = (field: keyof SocialLinks) => {
    return fieldErrors[field] || errors?.[field];
  };

  const handleTestLink = async (platform: SocialPlatform) => {
    const url = localData[platform.key];
    if (!url) {
      Alert.alert('No URL', `Please enter your ${platform.label} URL first.`);
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Invalid URL',
          `Cannot open ${platform.label} URL. Please check the format.`,
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${platform.label} URL.`);
    }
  };

  const suggestUsername = (platform: SocialPlatform) => {
    const currentValue = localData[platform.key] || '';
    if (currentValue) return;

    // Try to extract username from other platforms
    const linkedinUrl = localData.linkedin;
    if (linkedinUrl && platform.key !== 'linkedin') {
      const match = linkedinUrl.match(/linkedin\.com\/in\/([^/?]+)/);
      if (match) {
        const username = match[1];
        updateField(platform.key, platform.urlPrefix + username);
      }
    }
  };

  const getCompletionPercentage = () => {
    const filledFields = SOCIAL_PLATFORMS.filter(
      platform =>
        localData[platform.key] && localData[platform.key]!.trim() !== '',
    ).length;
    return Math.round((filledFields / SOCIAL_PLATFORMS.length) * 100);
  };

  const renderSocialField = (platform: SocialPlatform) => {
    const hasValue =
      localData[platform.key] && localData[platform.key]!.trim() !== '';
    const hasError = getFieldError(platform.key);

    return (
      <View key={platform.key} style={styles.socialField}>
        <View style={styles.socialHeader}>
          <View style={styles.socialLabelContainer}>
            <Text style={styles.socialIcon}>{platform.icon}</Text>
            <View style={styles.socialLabelContent}>
              <Text style={styles.socialLabel}>{platform.label}</Text>
              <Text style={styles.socialDescription}>
                {platform.description}
              </Text>
            </View>
          </View>
          {hasValue && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestLink(platform)}
            >
              <Text style={styles.testButtonText}>Test</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={[
            styles.socialInput,
            hasError && styles.inputError,
            hasValue && styles.inputFilled,
          ]}
          value={localData[platform.key] || ''}
          onChangeText={text => updateField(platform.key, text)}
          placeholder={platform.placeholder}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          autoCompleteType="off"
        />

        {hasError && <ValidationMessage message={hasError} type="error" />}

        {!hasValue && platform.key !== 'website' && (
          <TouchableOpacity
            style={styles.suggestButton}
            onPress={() => suggestUsername(platform)}
          >
            <Text style={styles.suggestButtonText}>
              Auto-fill from LinkedIn
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Links</Text>
        <Text style={styles.sectionDescription}>
          Add your social media and professional profiles to help people connect
          with you online.
        </Text>
      </View>

      {/* Completion Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Profile Completion</Text>
          <Text style={styles.progressPercentage}>
            {getCompletionPercentage()}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getCompletionPercentage()}%` },
            ]}
          />
        </View>
        <Text style={styles.progressHint}>
          Adding more links helps people find and connect with you
        </Text>
      </View>

      {/* Social Platform Fields */}
      {SOCIAL_PLATFORMS.map(renderSocialField)}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            SOCIAL_PLATFORMS.forEach(platform => {
              if (!localData[platform.key]) {
                updateField(platform.key, '');
              }
            });
          }}
        >
          <Text style={styles.actionButtonText}>Clear All Fields</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryActionButton]}
          onPress={() => {
            // Auto-fill common patterns
            if (localData.linkedin) {
              const match = localData.linkedin.match(
                /linkedin\.com\/in\/([^/?]+)/,
              );
              if (match) {
                const username = match[1];
                if (!localData.twitter) {
                  updateField('twitter', `https://twitter.com/${username}`);
                }
                if (!localData.github) {
                  updateField('github', `https://github.com/${username}`);
                }
              }
            }
          }}
        >
          <Text style={styles.primaryActionButtonText}>
            Auto-Fill from LinkedIn
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Social Media Tips</Text>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Use your LinkedIn for professional networking
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Include your website to showcase your work
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • GitHub is great for developers and tech professionals
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Keep usernames consistent across platforms
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Only include active, professional profiles
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
  progressSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  socialField: {
    marginBottom: 20,
  },
  socialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  socialLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  socialLabelContent: {
    flex: 1,
  },
  socialLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  socialDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  socialInput: {
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
  inputFilled: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  suggestButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  suggestButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  quickActions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  primaryActionButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
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

export default SocialLinksForm;
