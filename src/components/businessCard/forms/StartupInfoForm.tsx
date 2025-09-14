/**
 * Startup Info Form - Form for entering startup-specific business card information
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

import {
  StartupInfo,
  BusinessCardValidationErrors,
} from '../../../types/businessCard';
import { validateStartupInfo } from '../../../utils/businessCardValidation';
import ValidationMessage from '../common/ValidationMessage';

interface StartupInfoFormProps {
  data: Partial<StartupInfo>;
  onUpdate: (data: Partial<StartupInfo>) => void;
  errors?: Partial<BusinessCardValidationErrors['startupInfo']>;
  isOptional?: boolean;
}

const FUNDING_STAGES = [
  {
    key: 'idea',
    label: 'Idea Stage',
    description: 'Early concept development',
  },
  {
    key: 'pre-seed',
    label: 'Pre-Seed',
    description: 'Prototype and validation',
  },
  { key: 'seed', label: 'Seed', description: 'Initial funding round' },
  { key: 'series-a', label: 'Series A', description: 'Scaling the business' },
  { key: 'series-b', label: 'Series B', description: 'Market expansion' },
  { key: 'series-c+', label: 'Series C+', description: 'Late stage growth' },
  { key: 'exit', label: 'Exit', description: 'IPO or acquisition' },
] as const;

const TEAM_SIZES = [
  { key: 'solo', label: 'Solo Founder', description: '1 person' },
  { key: 'small', label: 'Small Team', description: '2-5 people' },
  { key: 'medium', label: 'Medium Team', description: '6-20 people' },
  { key: 'large', label: 'Large Team', description: '21-50 people' },
  { key: 'enterprise', label: 'Enterprise', description: '50+ people' },
] as const;

const BUSINESS_MODELS = [
  { key: 'b2b', label: 'B2B', description: 'Business to Business' },
  { key: 'b2c', label: 'B2C', description: 'Business to Consumer' },
  {
    key: 'b2b2c',
    label: 'B2B2C',
    description: 'Business to Business to Consumer',
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    description: 'Platform connecting buyers and sellers',
  },
  { key: 'saas', label: 'SaaS', description: 'Software as a Service' },
  { key: 'ecommerce', label: 'E-commerce', description: 'Online retail' },
  { key: 'fintech', label: 'FinTech', description: 'Financial technology' },
  {
    key: 'healthtech',
    label: 'HealthTech',
    description: 'Healthcare technology',
  },
  { key: 'edtech', label: 'EdTech', description: 'Education technology' },
  { key: 'other', label: 'Other', description: 'Custom business model' },
] as const;

const REVENUE_STAGES = [
  {
    key: 'pre-revenue',
    label: 'Pre-Revenue',
    description: 'Building the product',
  },
  {
    key: 'early-revenue',
    label: 'Early Revenue',
    description: 'First customers',
  },
  { key: 'growing', label: 'Growing', description: 'Scaling revenue' },
  { key: 'profitable', label: 'Profitable', description: 'Positive cash flow' },
] as const;

const INDUSTRIES = [
  'AI/Machine Learning',
  'Blockchain/Crypto',
  'Climate Tech',
  'Consumer Tech',
  'Cybersecurity',
  'Data & Analytics',
  'Developer Tools',
  'E-commerce',
  'Education',
  'Energy',
  'Entertainment',
  'Fashion',
  'Finance',
  'Food & Beverage',
  'Gaming',
  'Government',
  'Hardware',
  'Healthcare',
  'HR & Recruiting',
  'Insurance',
  'IoT',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Media',
  'Mobile',
  'Real Estate',
  'Retail',
  'Robotics',
  'Sales',
  'Social Impact',
  'Sports',
  'Transportation',
  'Travel',
  'VR/AR',
];

const StartupInfoForm: React.FC<StartupInfoFormProps> = ({
  data,
  onUpdate,
  errors,
  isOptional = true,
}) => {
  const [localData, setLocalData] = useState<Partial<StartupInfo>>(data);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof StartupInfo, value: any) => {
      const updatedData = { ...localData, [field]: value };
      setLocalData(updatedData);
      onUpdate(updatedData);

      // Real-time validation for specific field
      const validation = validateStartupInfo(updatedData);
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

  const toggleIndustry = useCallback(
    (industry: string) => {
      const currentIndustries = localData.industry || [];
      const isSelected = currentIndustries.includes(industry);

      const newIndustries = isSelected
        ? currentIndustries.filter(i => i !== industry)
        : [...currentIndustries, industry];

      updateField('industry', newIndustries);
    },
    [localData.industry, updateField],
  );

  const getFieldError = (field: keyof StartupInfo) => {
    return fieldErrors[field] || errors?.[field];
  };

  const renderSelector = (
    field: keyof StartupInfo,
    options: readonly { key: string; label: string; description: string }[],
    title: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.optionGrid}>
        {options.map(option => {
          const isSelected = localData[field] === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
              onPress={() => updateField(field, option.key)}
            >
              <Text
                style={[
                  styles.optionTitle,
                  isSelected && styles.optionTitleSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  isSelected && styles.optionDescriptionSelected,
                ]}
              >
                {option.description}
              </Text>
              {isSelected && (
                <View style={styles.selectionIndicator}>
                  <Text style={styles.selectionCheck}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {getFieldError(field) && (
        <ValidationMessage message={getFieldError(field)!} type="error" />
      )}
    </View>
  );

  const renderIndustrySelector = () => (
    <View style={styles.field}>
      <Text style={styles.label}>Industry Focus</Text>
      <Text style={styles.fieldHint}>
        Select all that apply to your startup
      </Text>
      <View style={styles.industryGrid}>
        {INDUSTRIES.map(industry => {
          const isSelected = (localData.industry || []).includes(industry);
          return (
            <TouchableOpacity
              key={industry}
              style={[
                styles.industryTag,
                isSelected && styles.industryTagSelected,
              ]}
              onPress={() => toggleIndustry(industry)}
            >
              <Text
                style={[
                  styles.industryTagText,
                  isSelected && styles.industryTagTextSelected,
                ]}
              >
                {industry}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.selectionCount}>
        {(localData.industry || []).length} selected
      </Text>
    </View>
  );

  const renderSwitchField = (
    field: keyof StartupInfo,
    title: string,
    description: string,
  ) => (
    <View style={styles.switchField}>
      <View style={styles.switchContent}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        value={Boolean(localData[field])}
        onValueChange={value => updateField(field, value)}
        trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
        thumbColor={localData[field] ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Startup Information</Text>
        <Text style={styles.sectionDescription}>
          Share details about your startup to connect with the right people in
          the ecosystem.
        </Text>
      </View>

      {/* Funding Stage */}
      {renderSelector('fundingStage', FUNDING_STAGES, 'Funding Stage')}

      {/* Team Size */}
      {renderSelector('teamSize', TEAM_SIZES, 'Team Size')}

      {/* Business Model */}
      {renderSelector('businessModel', BUSINESS_MODELS, 'Business Model')}

      {/* Revenue Stage */}
      {renderSelector('revenue', REVENUE_STAGES, 'Revenue Stage')}

      {/* Industry Focus */}
      {renderIndustrySelector()}

      {/* What You're Seeking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Are You Looking For?</Text>
        <Text style={styles.sectionDescription}>
          Let others know what kind of connections would be valuable for your
          startup.
        </Text>
      </View>

      {renderSwitchField(
        'seekingFunding',
        'Seeking Funding',
        'Looking for investors or funding opportunities',
      )}

      {renderSwitchField(
        'seekingTalent',
        'Seeking Talent',
        'Hiring team members or looking for co-founders',
      )}

      {renderSwitchField(
        'seekingPartners',
        'Seeking Partners',
        'Looking for business partnerships or collaborations',
      )}

      {renderSwitchField(
        'seekingMentors',
        'Seeking Mentors',
        'Looking for experienced advisors or mentors',
      )}

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Startup Networking Tips</Text>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Be specific about your industry and stage
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Clearly state what you're looking for
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Update your stage as your startup grows
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            • Use this info to find relevant connections
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
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  fieldHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  optionGrid: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#1e40af',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionDescriptionSelected: {
    color: '#3730a3',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  industryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  industryTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  industryTagSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  industryTagText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  industryTagTextSelected: {
    color: '#ffffff',
  },
  selectionCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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

export default StartupInfoForm;
