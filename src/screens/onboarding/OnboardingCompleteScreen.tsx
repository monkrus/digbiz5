/**
 * Onboarding Complete Screen
 *
 * Final screen in the onboarding flow that celebrates completion
 * and provides a smooth transition to the main app.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OnboardingData } from '../../types/onboarding';

const { width, height } = Dimensions.get('window');

interface OnboardingCompleteScreenProps {
  onComplete?: (data: OnboardingData) => void;
}

interface RouteParams {
  onboardingData: OnboardingData;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({
  onComplete,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onboardingData } = (route.params as RouteParams) || {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkmarkAnim, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (onComplete && onboardingData) {
      onComplete(onboardingData);
    } else {
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as never }],
      });
    }
  };

  const getPersonalizedMessage = () => {
    if (!onboardingData) return 'Welcome to DigBiz!';

    const { userType, industry } = onboardingData;

    if (userType === 'founder') {
      return `Welcome, founder! Ready to build connections in ${
        industry?.name || 'your industry'
      }?`;
    } else if (userType === 'investor') {
      return `Welcome, investor! Discover opportunities in ${
        industry?.name || 'your space'
      }.`;
    } else {
      return `Welcome! Connect with professionals in ${
        industry?.name || 'your field'
      }.`;
    }
  };

  const getNextSteps = () => {
    if (!onboardingData) return [];

    const { userType } = onboardingData;

    if (userType === 'founder') {
      return [
        'Create your company profile',
        'Connect with potential investors',
        'Join founder communities',
        'Share your startup journey',
      ];
    } else if (userType === 'investor') {
      return [
        'Explore startup opportunities',
        'Connect with other investors',
        'Set your investment criteria',
        'Follow industry trends',
      ];
    } else {
      return [
        'Complete your professional profile',
        'Connect with industry peers',
        'Explore job opportunities',
        'Join relevant communities',
      ];
    }
  };

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Icon name="check-circle" size={80} color="#10B981" />
          </Animated.View>
        </View>

        {/* Success Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.personalizedMessage}>
            {getPersonalizedMessage()}
          </Text>
        </View>

        {/* Onboarding Summary */}
        {onboardingData && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Your Profile Summary</Text>

            <View style={styles.summaryGrid}>
              {onboardingData.userType && (
                <View style={styles.summaryItem}>
                  <Icon name="person" size={20} color="#3B82F6" />
                  <Text style={styles.summaryLabel}>Role</Text>
                  <Text style={styles.summaryValue}>
                    {onboardingData.userType.charAt(0).toUpperCase() +
                      onboardingData.userType.slice(1)}
                  </Text>
                </View>
              )}

              {onboardingData.industry && (
                <View style={styles.summaryItem}>
                  <Icon name="business" size={20} color="#3B82F6" />
                  <Text style={styles.summaryLabel}>Industry</Text>
                  <Text style={styles.summaryValue}>
                    {onboardingData.industry.name}
                  </Text>
                </View>
              )}

              {onboardingData.location && (
                <View style={styles.summaryItem}>
                  <Icon name="location-on" size={20} color="#3B82F6" />
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>
                    {onboardingData.location.city},{' '}
                    {onboardingData.location.country}
                  </Text>
                </View>
              )}

              {onboardingData.timezone && (
                <View style={styles.summaryItem}>
                  <Icon name="schedule" size={20} color="#3B82F6" />
                  <Text style={styles.summaryLabel}>Timezone</Text>
                  <Text style={styles.summaryValue}>
                    {onboardingData.timezone.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>What's next?</Text>
          <View style={styles.stepsList}>
            {getNextSteps().map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Action Button */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Start Networking</Text>
          <Icon
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  personalizedMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  summarySection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 12,
    minWidth: 70,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  nextStepsSection: {
    width: '100%',
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OnboardingCompleteScreen;
