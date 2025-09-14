/**
 * Filter Modal Component
 *
 * Advanced filtering interface for user discovery with multiple filter categories
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { UserDiscoveryFilters, StartupStage } from '../../types/discovery';

interface FilterModalProps {
  visible: boolean;
  currentFilters: UserDiscoveryFilters;
  onApply: (filters: UserDiscoveryFilters) => void;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const STARTUP_STAGES: { label: string; value: StartupStage }[] = [
  { label: 'Idea Stage', value: 'idea' },
  { label: 'MVP', value: 'mvp' },
  { label: 'Early Stage', value: 'early-stage' },
  { label: 'Growth', value: 'growth' },
  { label: 'Scale-up', value: 'scale-up' },
  { label: 'Mature', value: 'mature' },
  { label: 'Exit', value: 'exit' },
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Real Estate',
  'Food & Beverage',
  'Entertainment',
  'Manufacturing',
  'Consulting',
  'Marketing',
  'Non-profit',
];

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  currentFilters,
  onApply,
  onClose,
}) => {
  const [filters, setFilters] = useState<UserDiscoveryFilters>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    company: false,
    location: false,
    stage: false,
    industry: false,
    options: false,
  });

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilter = (field: keyof UserDiscoveryFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateLocationFilter = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.name) count++;
    if (filters.company) count++;
    if (filters.industry) count++;
    if (filters.startupStage) count++;
    if (filters.location?.city) count++;
    if (filters.location?.radius) count++;
    if (filters.isRecent) count++;
    if (filters.isVerified) count++;
    return count;
  };

  const renderFilterSection = (
    title: string,
    sectionKey: string,
    content: React.ReactNode,
    hasContent: boolean = true
  ) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Icon
          name={expandedSections[sectionKey] ? 'expand-less' : 'expand-more'}
          size={24}
          color="#6c757d"
        />
      </TouchableOpacity>

      {expandedSections[sectionKey] && hasContent && (
        <View style={styles.sectionContent}>
          {content}
        </View>
      )}
    </View>
  );

  const renderCompanySection = () => (
    <View>
      <Text style={styles.fieldLabel}>Company Name</Text>
      <TextInput
        style={styles.textInput}
        value={filters.company || ''}
        onChangeText={(text) => updateFilter('company', text)}
        placeholder="e.g. Google, Apple, Startup Inc."
        placeholderTextColor="#9ca3af"
      />
    </View>
  );

  const renderLocationSection = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>City</Text>
        <TextInput
          style={styles.textInput}
          value={filters.location?.city || ''}
          onChangeText={(text) => updateLocationFilter('city', text)}
          placeholder="e.g. San Francisco, New York"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>Country</Text>
        <TextInput
          style={styles.textInput}
          value={filters.location?.country || ''}
          onChangeText={(text) => updateLocationFilter('country', text)}
          placeholder="e.g. United States, Canada"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>Radius (km)</Text>
        <TextInput
          style={styles.textInput}
          value={filters.location?.radius ? filters.location.radius.toString() : ''}
          onChangeText={(text) => updateLocationFilter('radius', text ? parseInt(text) : undefined)}
          placeholder="e.g. 50"
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />
      </View>
    </View>
  );

  const renderStartupStageSection = () => (
    <View style={styles.optionsGrid}>
      {STARTUP_STAGES.map((stage) => (
        <TouchableOpacity
          key={stage.value}
          style={[
            styles.optionChip,
            filters.startupStage === stage.value && styles.optionChipSelected,
          ]}
          onPress={() => updateFilter('startupStage',
            filters.startupStage === stage.value ? undefined : stage.value
          )}
        >
          <Text style={[
            styles.optionChipText,
            filters.startupStage === stage.value && styles.optionChipTextSelected,
          ]}>
            {stage.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderIndustrySection = () => (
    <View style={styles.optionsGrid}>
      {INDUSTRIES.map((industry) => (
        <TouchableOpacity
          key={industry}
          style={[
            styles.optionChip,
            filters.industry === industry && styles.optionChipSelected,
          ]}
          onPress={() => updateFilter('industry',
            filters.industry === industry ? undefined : industry
          )}
        >
          <Text style={[
            styles.optionChipText,
            filters.industry === industry && styles.optionChipTextSelected,
          ]}>
            {industry}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOptionsSection = () => (
    <View>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateFilter('isRecent', !filters.isRecent)}
      >
        <View style={[styles.checkbox, filters.isRecent && styles.checkboxChecked]}>
          {filters.isRecent && <Icon name="check" size={16} color="#ffffff" />}
        </View>
        <Text style={styles.checkboxLabel}>Recently joined (last 30 days)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateFilter('isVerified', !filters.isVerified)}
      >
        <View style={[styles.checkbox, filters.isVerified && styles.checkboxChecked]}>
          {filters.isVerified && <Icon name="check" size={16} color="#ffffff" />}
        </View>
        <Text style={styles.checkboxLabel}>Verified profiles only</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateFilter('isPublic', !filters.isPublic)}
      >
        <View style={[styles.checkbox, filters.isPublic && styles.checkboxChecked]}>
          {filters.isPublic && <Icon name="check" size={16} color="#ffffff" />}
        </View>
        <Text style={styles.checkboxLabel}>Public profiles only</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {getActiveFiltersCount() > 0 && (
            <Text style={styles.activeFiltersText}>
              {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
            </Text>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderFilterSection('Company', 'company', renderCompanySection())}
          {renderFilterSection('Location', 'location', renderLocationSection())}
          {renderFilterSection('Startup Stage', 'stage', renderStartupStageSection())}
          {renderFilterSection('Industry', 'industry', renderIndustrySection())}
          {renderFilterSection('Options', 'options', renderOptionsSection())}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>
              Apply Filters
              {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 8,
    marginRight: -8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionContent: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  optionChipSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  optionChipText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: '#ffffff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  applyButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default FilterModal;