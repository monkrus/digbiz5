import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface ProfileSocialLinksFormProps {
  formData?: any;
  errors?: any;
  onFieldChange?: (field: string, value: any) => void;
  onFieldBlur?: (field: string) => void;
}

const ProfileSocialLinksForm: React.FC<ProfileSocialLinksFormProps> = ({
  formData,
  _errors,
  onFieldChange,
  onFieldBlur,
}) => (
  <View>
    <Text>Social Links</Text>
    <TextInput
      placeholder="LinkedIn"
      value={formData?.socialLinks?.linkedin || ''}
      onChangeText={text => onFieldChange?.('socialLinks.linkedin', text)}
      onBlur={() => onFieldBlur?.('socialLinks.linkedin')}
    />
    <TextInput
      placeholder="Twitter"
      value={formData?.socialLinks?.twitter || ''}
      onChangeText={text => onFieldChange?.('socialLinks.twitter', text)}
      onBlur={() => onFieldBlur?.('socialLinks.twitter')}
    />
  </View>
);

export default ProfileSocialLinksForm;
