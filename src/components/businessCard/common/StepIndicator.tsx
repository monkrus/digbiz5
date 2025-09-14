/**
 * Step Indicator - Shows progress through multi-step forms
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  activeColor?: string;
  inactiveColor?: string;
  completedColor?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
  activeColor = '#3b82f6',
  inactiveColor = '#d1d5db',
  completedColor = '#10b981',
}) => {
  const renderStep = (index: number) => {
    const isActive = index === currentStep;
    const isCompleted = index < currentStep;
    const isLast = index === totalSteps - 1;

    const stepColor = isCompleted
      ? completedColor
      : isActive
      ? activeColor
      : inactiveColor;
    const textColor = isCompleted || isActive ? '#ffffff' : '#6b7280';

    return (
      <View key={index} style={styles.stepContainer}>
        {/* Step circle */}
        <View style={[styles.stepCircle, { backgroundColor: stepColor }]}>
          {isCompleted ? (
            <Text style={[styles.stepText, { color: textColor }]}>✓</Text>
          ) : (
            <Text style={[styles.stepText, { color: textColor }]}>
              {index + 1}
            </Text>
          )}
        </View>

        {/* Step label */}
        <Text
          style={[
            styles.stepLabel,
            { color: isActive ? activeColor : '#6b7280' },
          ]}
        >
          {steps[index]}
        </Text>

        {/* Connector line */}
        {!isLast && (
          <View
            style={[
              styles.connector,
              { backgroundColor: isCompleted ? completedColor : inactiveColor },
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
              backgroundColor: activeColor,
            },
          ]}
        />
      </View>

      {/* Step circles and labels */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => renderStep(index))}
      </View>

      {/* Current step info */}
      <View style={styles.stepInfo}>
        <Text style={styles.stepInfoText}>
          Step {currentStep + 1} of {totalSteps}: {steps[currentStep]}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressBarContainer: {
    height: 4,
    marginBottom: 16,
    position: 'relative',
  },
  progressBarBackground: {
    height: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
  connector: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    zIndex: -1,
  },
  stepInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  stepInfoText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default StepIndicator;
