/**
 * User Type Selection Screen
 *
 * Allows users to select their role (Founder, Investor, Professional)
 * with detailed descriptions and benefits for each type.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { USER_TYPE_OPTIONS } from '../../data/onboardingData';
import { UserType, UserTypeOption } from '../../types/onboarding';

const { width } = Dimensions.get('window');

interface UserTypeSelectionScreenProps {
  onUserTypeSelected?: (userType: UserType) => void;
  onBack?: () => void;
}

const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({
  onUserTypeSelected,
  onBack,
}) => {
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [expandedCard, setExpandedCard] = useState<UserType | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef(
    USER_TYPE_OPTIONS.reduce((acc, option) => {
      acc[option.id] = new Animated.Value(0);
      return acc;
    }, {} as Record<UserType, Animated.Value>),
  ).current;

  useEffect(() => {
    // Animate header
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate cards with stagger
    const cardAnimations = USER_TYPE_OPTIONS.map((option, index) =>
      Animated.timing(cardAnims[option.id], {
        toValue: 1,
        duration: 500,
        delay: 150 + index * 100,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, cardAnimations).start();
  }, []);

  const handleUserTypeSelect = (userType: UserType) => {
    setSelectedType(userType);

    // Animate selection
    Animated.spring(cardAnims[userType], {
      toValue: 1.05,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(cardAnims[userType], {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContinue = () => {
    if (!selectedType) return;

    if (onUserTypeSelected) {
      onUserTypeSelected(selectedType);
    } else {
      navigation.navigate(
        'IndustrySelection' as never,
        { userType: selectedType } as never,
      );
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const toggleCardExpansion = (userType: UserType) => {
    setExpandedCard(expandedCard === userType ? null : userType);
  };

  const renderUserTypeCard = (option: UserTypeOption) => {
    const isSelected = selectedType === option.id;
    const isExpanded = expandedCard === option.id;

    const cardStyle = {
      opacity: cardAnims[option.id],
      transform: [
        {
          translateY: cardAnims[option.id].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        },
        {
          scale: isSelected ? 1.02 : 1,
        },
      ],
    };

    return (
      <Animated.View key={option.id} style={[styles.cardContainer, cardStyle]}>
        <TouchableOpacity
          style={[styles.userTypeCard, isSelected && styles.selectedCard]}
          onPress={() => handleUserTypeSelect(option.id)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconContainer,
                isSelected && styles.selectedIconContainer,
              ]}
            >
              <Icon
                name={option.icon}
                size={32}
                color={isSelected ? '#FFFFFF' : '#3B82F6'}
              />
            </View>

            <View style={styles.cardTitleContainer}>
              <Text
                style={[styles.cardTitle, isSelected && styles.selectedTitle]}
              >
                {option.title}
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  isSelected && styles.selectedDescription,
                ]}
              >
                {option.description}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleCardExpansion(option.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={24}
                color={isSelected ? '#FFFFFF' : '#6B7280'}
              />
            </TouchableOpacity>

            {isSelected && (
              <View style={styles.checkmark}>
                <Icon name="check" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>

          {isExpanded && (
            <View style={styles.benefitsSection}>
              <Text
                style={[
                  styles.benefitsTitle,
                  isSelected && styles.selectedBenefitsTitle,
                ]}
              >
                What you'll get:
              </Text>
              {option.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Icon
                    name="check-circle"
                    size={16}
                    color={isSelected ? '#FFFFFF' : '#10B981'}
                  />
                  <Text
                    style={[
                      styles.benefitText,
                      isSelected && styles.selectedBenefitText,
                    ]}
                  >
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>What describes you best?</Text>
          <Text style={styles.headerSubtitle}>
            Choose your role to get personalized recommendations
          </Text>
        </View>

        <View style={styles.progressIndicator}>
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </Animated.View>

      {/* User Type Options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {USER_TYPE_OPTIONS.map(option => renderUserTypeCard(option))}
      </ScrollView>

      {/* Continue Button */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.continueText, !selectedType && styles.disabledText]}
          >
            Continue
          </Text>
          <Icon
            name="arrow-forward"
            size={20}
            color={selectedType ? '#FFFFFF' : '#9CA3AF'}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  userTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedTitle: {
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectedBenefitsTitle: {
    color: '#FFFFFF',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  selectedBenefitText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
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
  disabledButton: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default UserTypeSelectionScreen;
