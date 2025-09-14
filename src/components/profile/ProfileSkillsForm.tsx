import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface ProfileSkillsFormProps {
  formData?: any;
  errors?: any;
  onFieldChange?: (field: string, value: any) => void;
  onFieldBlur?: (field: string) => void;
}

const ProfileSkillsForm: React.FC<ProfileSkillsFormProps> = ({
  formData,
  _errors,
  onFieldChange,
  onFieldBlur,
}) => (
  <View>
    <Text>Skills</Text>
    <TextInput
      placeholder="Skills (comma separated)"
      value={formData?.skills?.join(', ') || ''}
      onChangeText={text => onFieldChange?.('skills', text.split(', '))}
      onBlur={() => onFieldBlur?.('skills')}
    />
  </View>
);

export default ProfileSkillsForm;
