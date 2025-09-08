import React from 'react';
import { View, Text } from 'react-native';

interface ProfileFormHeaderProps {
  step?: number;
  totalSteps?: number;
  title?: string;
}

const ProfileFormHeader: React.FC<ProfileFormHeaderProps> = ({
  step,
  totalSteps,
  title,
}) => (
  <View>
    <Text>{title || 'Profile Form'}</Text>
    {step && totalSteps && (
      <Text>
        Step {step} of {totalSteps}
      </Text>
    )}
  </View>
);

export default ProfileFormHeader;
