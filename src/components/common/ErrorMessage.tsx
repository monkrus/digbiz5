import React from 'react';
import { View, Text } from 'react-native';

interface ErrorMessageProps {
  message?: string;
  visible?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible = true,
}) => {
  if (!visible || !message) return null;

  return (
    <View
      style={{
        padding: 8,
        backgroundColor: '#ffe6e6',
        borderRadius: 4,
        margin: 4,
      }}
    >
      <Text style={{ color: '#cc0000', textAlign: 'center' }}>{message}</Text>
    </View>
  );
};

export default ErrorMessage;
