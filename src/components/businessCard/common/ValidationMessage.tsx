import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface ValidationMessageProps {
  message?: string;
  error?: string;
  success?: string;
  visible?: boolean;
  style?: any;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  error,
  success,
  visible = true,
  style,
}) => {
  if (!visible || (!message && !error && !success)) {
    return null;
  }

  const displayMessage = error || success || message;
  const messageStyle = error
    ? styles.errorText
    : success
    ? styles.successText
    : styles.messageText;

  return (
    <View style={[styles.container, style]}>
      <Text style={messageStyle}>{displayMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
  },
  successText: {
    fontSize: 12,
    color: '#2e7d32',
  },
});

export default ValidationMessage;
