import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface ProfileBasicInfoFormProps {
  formData?: any;
  errors?: any;
  onFieldChange?: (field: string, value: any) => void;
  onFieldBlur?: (field: string) => void;
}

const ProfileBasicInfoForm: React.FC<ProfileBasicInfoFormProps> = ({
  formData,
  _errors,
  onFieldChange,
  onFieldBlur,
}) => (
  <View>
    <Text>Basic Information</Text>
    <TextInput
      placeholder="Name"
      value={formData?.name || ''}
      onChangeText={text => onFieldChange?.('name', text)}
      onBlur={() => onFieldBlur?.('name')}
    />
    <TextInput
      placeholder="Title"
      value={formData?.title || ''}
      onChangeText={text => onFieldChange?.('title', text)}
      onBlur={() => onFieldBlur?.('title')}
    />
  </View>
);

export default ProfileBasicInfoForm;
