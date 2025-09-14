import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface ProfileFormFooterProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

const ProfileFormFooter: React.FC<ProfileFormFooterProps> = ({
  onPrevious,
  onNext,
  onSave,
  isFirstStep,
  isLastStep,
  isLoading,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    }}
  >
    {!isFirstStep && (
      <TouchableOpacity onPress={onPrevious} disabled={isLoading}>
        <Text>Previous</Text>
      </TouchableOpacity>
    )}
    {isLastStep ? (
      <TouchableOpacity onPress={onSave} disabled={isLoading}>
        <Text>{isLoading ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity onPress={onNext} disabled={isLoading}>
        <Text>Next</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ProfileFormFooter;
