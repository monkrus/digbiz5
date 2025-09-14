import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface ProfileContactFormProps {
  formData?: any;
  errors?: any;
  onFieldChange?: (field: string, value: any) => void;
  onFieldBlur?: (field: string) => void;
}

const ProfileContactForm: React.FC<ProfileContactFormProps> = ({
  formData,
  _errors,
  onFieldChange,
  onFieldBlur,
}) => (
  <View>
    <Text>Contact Information</Text>
    <TextInput
      placeholder="Email"
      value={formData?.email || ''}
      onChangeText={text => onFieldChange?.('email', text)}
      onBlur={() => onFieldBlur?.('email')}
    />
    <TextInput
      placeholder="Phone"
      value={formData?.phone || ''}
      onChangeText={text => onFieldChange?.('phone', text)}
      onBlur={() => onFieldBlur?.('phone')}
    />
  </View>
);

export default ProfileContactForm;
