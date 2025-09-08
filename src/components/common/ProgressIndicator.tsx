import React from 'react';
import { View, Text } from 'react-native';

interface ProgressIndicatorProps {
  progress?: number;
  total?: number;
  showPercentage?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress = 0,
  total = 100,
  showPercentage = true,
}) => {
  const percentage = Math.round((progress / total) * 100);

  return (
    <View>
      <View style={{ backgroundColor: '#f0f0f0', height: 8, borderRadius: 4 }}>
        <View
          style={{
            backgroundColor: '#007bff',
            height: 8,
            borderRadius: 4,
            width: `${percentage}%`,
          }}
        />
      </View>
      {showPercentage && (
        <Text style={{ textAlign: 'center', marginTop: 4 }}>{percentage}%</Text>
      )}
    </View>
  );
};

export default ProgressIndicator;
