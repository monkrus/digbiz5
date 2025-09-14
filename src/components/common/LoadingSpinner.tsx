/**
 * Loading Spinner Component
 *
 * Animated loading indicator
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: any;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#007bff',
  message,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default LoadingSpinner;