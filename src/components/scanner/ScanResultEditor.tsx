/**
 * Scan Result Editor Component
 *
 * Manual correction interface for OCR scanning results
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Switch,
} from 'react-native';
import { ParsedCardData } from '../../services/ocrScannerService';
import { Contact, ContactField } from '../../types/contacts';
import { validateEmail, validatePhone } from '../../utils/validation';

interface ScanResultEditorProps {
  scanResults: ParsedCardData[];
  onSave: (contacts: Contact[]) => void;
  onCancel: () => void;
  onRescan?: () => void;
}

interface EditableField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'phone' | 'url';
  isValid: boolean;
  confidence: number;
  isEdited: boolean;
}

export const ScanResultEditor: React.FC<ScanResultEditorProps> = ({
  scanResults,
  onSave,
  onCancel,
  onRescan,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editableFields, setEditableFields] = useState<EditableField[]>([]);
  const [showRawText, setShowRawText] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (scanResults.length > 0) {
      loadFieldsForCurrentCard();
    }
  }, [currentIndex, scanResults]);

  const loadFieldsForCurrentCard = () => {
    const currentResult = scanResults[currentIndex];
    if (!currentResult) return;

    const fields: EditableField[] = [];

    // Define field mappings with validation
    const fieldMappings = [
      { key: 'name', label: 'Name', type: 'text' as const },
      { key: 'company', label: 'Company', type: 'text' as const },
      { key: 'title', label: 'Title', type: 'text' as const },
      { key: 'email', label: 'Email', type: 'email' as const },
      { key: 'phone', label: 'Phone', type: 'phone' as const },
      { key: 'mobile', label: 'Mobile', type: 'phone' as const },
      { key: 'website', label: 'Website', type: 'url' as const },
      { key: 'address', label: 'Address', type: 'text' as const },
      { key: 'fax', label: 'Fax', type: 'phone' as const },
    ];

    fieldMappings.forEach(mapping => {
      const value =
        (currentResult[mapping.key as keyof ParsedCardData] as string) || '';
      fields.push({
        key: mapping.key,
        label: mapping.label,
        value,
        type: mapping.type,
        isValid: validateField(value, mapping.type),
        confidence: currentResult.confidence || 0.7,
        isEdited: false,
      });
    });

    setEditableFields(fields);
    setHasChanges(false);
  };

  const validateField = (value: string, type: string): boolean => {
    if (!value) return true; // Empty is valid (optional)

    switch (type) {
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'url':
        return (
          /^https?:\/\//.test(value) ||
          /^www\./.test(value) ||
          /\.[a-z]{2,}/.test(value)
        );
      default:
        return true;
    }
  };

  const updateField = (key: string, value: string) => {
    setEditableFields(prev =>
      prev.map(field =>
        field.key === key
          ? {
              ...field,
              value,
              isValid: validateField(value, field.type),
              isEdited: true,
            }
          : field,
      ),
    );
    setHasChanges(true);
  };

  const nextCard = () => {
    if (currentIndex < scanResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const saveAllContacts = () => {
    const contacts: Contact[] = scanResults.map((result, index) => {
      const fields =
        index === currentIndex ? editableFields : getFieldsForResult(result);

      const contactFields: ContactField[] = fields
        .filter(field => field.value.trim() !== '')
        .map((field, order) => ({
          id: `field_${order}`,
          type: field.key,
          label: field.label,
          value: field.value.trim(),
          isEditable: true,
          confidence: field.confidence,
        }));

      return {
        id: `contact_${Date.now()}_${index}`,
        fields: contactFields,
        source: 'ocr_scan',
        confidence: result.confidence || 0.7,
        rawText: result.rawText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['scanned'],
        isVerified: false,
        needsReview: result.confidence < 0.8,
      };
    });

    onSave(contacts);
  };

  const getFieldsForResult = (result: ParsedCardData): EditableField[] => {
    return [
      {
        key: 'name',
        label: 'Name',
        value: result.name || '',
        type: 'text',
        isValid: true,
        confidence: result.confidence,
        isEdited: false,
      },
      {
        key: 'company',
        label: 'Company',
        value: result.company || '',
        type: 'text',
        isValid: true,
        confidence: result.confidence,
        isEdited: false,
      },
      {
        key: 'title',
        label: 'Title',
        value: result.title || '',
        type: 'text',
        isValid: true,
        confidence: result.confidence,
        isEdited: false,
      },
      {
        key: 'email',
        label: 'Email',
        value: result.email || '',
        type: 'email',
        isValid: validateField(result.email || '', 'email'),
        confidence: result.confidence,
        isEdited: false,
      },
      {
        key: 'phone',
        label: 'Phone',
        value: result.phone || '',
        type: 'phone',
        isValid: validateField(result.phone || '', 'phone'),
        confidence: result.confidence,
        isEdited: false,
      },
      {
        key: 'website',
        label: 'Website',
        value: result.website || '',
        type: 'url',
        isValid: validateField(result.website || '', 'url'),
        confidence: result.confidence,
        isEdited: false,
      },
      {
        key: 'address',
        label: 'Address',
        value: result.address || '',
        type: 'text',
        isValid: true,
        confidence: result.confidence,
        isEdited: false,
      },
    ];
  };

  const discardChanges = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', onPress: onCancel },
        ],
      );
    } else {
      onCancel();
    }
  };

  const currentResult = scanResults[currentIndex];
  const hasInvalidFields = editableFields.some(
    field => !field.isValid && field.value !== '',
  );

  if (!currentResult) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No scan results to edit</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={discardChanges}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Contact</Text>
          {scanResults.length > 1 && (
            <Text style={styles.cardCounter}>
              {currentIndex + 1} of {scanResults.length}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={saveAllContacts} disabled={hasInvalidFields}>
          <Text
            style={[
              styles.headerButton,
              hasInvalidFields && styles.headerButtonDisabled,
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Confidence indicator */}
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Scan Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${currentResult.confidence * 100}%`,
                  backgroundColor:
                    currentResult.confidence > 0.8
                      ? '#4CAF50'
                      : currentResult.confidence > 0.6
                      ? '#FF9800'
                      : '#F44336',
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>
            {Math.round(currentResult.confidence * 100)}%
          </Text>
        </View>

        {/* Editable fields */}
        <View style={styles.fieldsContainer}>
          {editableFields.map(field => (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {field.label}
                {field.isEdited && (
                  <Text style={styles.editedIndicator}> (edited)</Text>
                )}
              </Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  !field.isValid &&
                    field.value !== '' &&
                    styles.fieldInputError,
                ]}
                value={field.value}
                onChangeText={value => updateField(field.key, value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                keyboardType={
                  field.type === 'email'
                    ? 'email-address'
                    : field.type === 'phone'
                    ? 'phone-pad'
                    : 'default'
                }
                autoCapitalize={field.type === 'email' ? 'none' : 'words'}
                multiline={field.key === 'address'}
                numberOfLines={field.key === 'address' ? 3 : 1}
              />
              {!field.isValid && field.value !== '' && (
                <Text style={styles.fieldError}>
                  Please enter a valid {field.label.toLowerCase()}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Raw text toggle */}
        <View style={styles.rawTextContainer}>
          <View style={styles.rawTextHeader}>
            <Text style={styles.rawTextLabel}>Show Raw Text</Text>
            <Switch value={showRawText} onValueChange={setShowRawText} />
          </View>
          {showRawText && (
            <View style={styles.rawTextContent}>
              <Text style={styles.rawText}>{currentResult.rawText}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionContainer}>
          {onRescan && (
            <TouchableOpacity style={styles.actionButton} onPress={onRescan}>
              <Text style={styles.actionButtonText}>Rescan Card</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Navigation for multiple cards */}
      {scanResults.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={previousCard}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.navIndicator}>
            {currentIndex + 1} / {scanResults.length}
          </Text>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === scanResults.length - 1 &&
                styles.navButtonDisabled,
            ]}
            onPress={nextCard}
            disabled={currentIndex === scanResults.length - 1}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerButtonDisabled: {
    color: '#C0C0C0',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cardCounter: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 12,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  fieldsContainer: {
    paddingVertical: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  editedIndicator: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '400',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  fieldInputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  fieldError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  rawTextContainer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  rawTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rawTextLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  rawTextContent: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  rawText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionContainer: {
    paddingVertical: 16,
  },
  actionButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  navButtonDisabled: {
    backgroundColor: '#C0C0C0',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  navIndicator: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanResultEditor;
