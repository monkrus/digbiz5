import React from 'react';
import { View, Text } from 'react-native';

interface SuccessMessageProps {
  message?: string;
  visible?: boolean;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  visible = true,
}) => {
  if (!visible || !message) return null;

  return (
    <View
      style={{
        padding: 8,
        backgroundColor: '#e6f7e6',
        borderRadius: 4,
        margin: 4,
      }}
    >
      <Text style={{ color: '#006600', textAlign: 'center' }}>{message}</Text>
    </View>
  );
};

export default SuccessMessage;
