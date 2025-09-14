/**
 * Welcome Screen
 *
 * First screen in the onboarding flow that introduces the app
 * and showcases its main benefits to new users.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { APP_BENEFITS } from '../../data/onboardingData';
import { AppBenefit } from '../../types/onboarding';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onSkip?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onSkip,
}) => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const benefitsAnim = useRef(
    APP_BENEFITS.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Animate main content
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
    ]).start();

    // Animate benefits with stagger
    const benefitAnimations = benefitsAnim.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, benefitAnimations).start();
  }, []);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigation.navigate('UserTypeSelection' as never);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      navigation.navigate('Home' as never);
    }
  };

  const renderBenefit = (benefit: AppBenefit, index: number) => {
    const animatedStyle = {
      opacity: benefitsAnim[index],
      transform: [
        {
          translateY: benefitsAnim[index].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View
        key={benefit.id}
        style={[styles.benefitCard, animatedStyle]}
      >
        <View
          style={[
            styles.benefitIcon,
            { backgroundColor: benefit.color + '20' },
          ]}
        >
          <Icon name={benefit.icon} size={32} color={benefit.color} />
        </View>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>{benefit.title}</Text>
          <Text style={styles.benefitDescription}>{benefit.description}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo/App Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="business" size={48} color="#3B82F6" />
            </View>
          </View>

          <Text style={styles.appName}>DigBiz</Text>
          <Text style={styles.tagline}>Your Business Network Hub</Text>
        </Animated.View>

        {/* Welcome Message */}
        <Animated.View
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.welcomeTitle}>
            Welcome to the Future of Business Networking
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Connect with the right people, discover opportunities, and grow your
            business network intelligently.
          </Text>
        </Animated.View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What You'll Get</Text>
          {APP_BENEFITS.map((benefit, index) => renderBenefit(benefit, index))}
        </View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Industries</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Icon
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.6}
        >
          <Text style={styles.skipText}>Skip for now</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  benefitsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  actionSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  getStartedButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default WelcomeScreen;
