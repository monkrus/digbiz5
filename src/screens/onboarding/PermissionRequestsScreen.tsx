/**
 * Permission Requests Screen
 *
 * Requests necessary permissions from users with clear explanations
 * of why each permission is needed and what benefits it provides.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  Permission,
  PermissionStatus,
} from 'react-native-permissions';

import { PERMISSION_REQUESTS } from '../../data/onboardingData';
import {
  PermissionRequest,
  PermissionType,
  UserType,
  Industry,
  Location,
  TimeZone,
} from '../../types/onboarding';

interface PermissionRequestsScreenProps {
  onPermissionsGranted?: (permissions: Record<PermissionType, boolean>) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

interface RouteParams {
  userType: UserType;
  industry: Industry;
  location: Location | null;
  timezone: TimeZone | null;
}

// Map permission types to react-native-permissions
const PERMISSION_MAP: Record<PermissionType, Permission> = {
  contacts: Platform.select({
    ios: PERMISSIONS.IOS.CONTACTS,
    android: PERMISSIONS.ANDROID.READ_CONTACTS,
  }) as Permission,
  notifications: Platform.select({
    ios: PERMISSIONS.IOS.NOTIFICATIONS,
    android: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
  }) as Permission,
  location: Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }) as Permission,
  camera: Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  }) as Permission,
  microphone: Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  }) as Permission,
};

const PermissionRequestsScreen: React.FC<PermissionRequestsScreenProps> = ({
  onPermissionsGranted,
  onBack,
  onSkip,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userType, industry, location, timezone } =
    (route.params as RouteParams) || {};

  const [permissionStates, setPermissionStates] = useState<
    Record<PermissionType, boolean>
  >({
    contacts: false,
    notifications: false,
    location: false,
    camera: false,
    microphone: false,
  });

  const [requestingPermissions, setRequestingPermissions] = useState<
    Set<PermissionType>
  >(new Set());
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef(
    PERMISSION_REQUESTS.reduce((acc, permission) => {
      acc[permission.type] = new Animated.Value(0);
      return acc;
    }, {} as Record<PermissionType, Animated.Value>),
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

    // Animate permission cards with stagger
    const cardAnimations = PERMISSION_REQUESTS.map((permission, index) =>
      Animated.timing(cardAnims[permission.type], {
        toValue: 1,
        duration: 500,
        delay: 150 + index * 100,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, cardAnimations).start();

    // Check existing permissions
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    try {
      const permissions = Object.keys(PERMISSION_MAP) as PermissionType[];
      const results: Record<PermissionType, boolean> = {
        contacts: false,
        notifications: false,
        location: false,
        camera: false,
        microphone: false,
      };

      for (const permissionType of permissions) {
        try {
          const permission = PERMISSION_MAP[permissionType];
          if (permission) {
            const result = await request(permission);
            results[permissionType] = result === RESULTS.GRANTED;
          }
        } catch (error) {
          console.log(`Permission check failed for ${permissionType}:`, error);
        }
      }

      setPermissionStates(results);
    } catch (error) {
      console.error('Failed to check existing permissions:', error);
    }
  };

  const requestSinglePermission = async (permissionType: PermissionType) => {
    if (requestingPermissions.has(permissionType)) return;

    setRequestingPermissions(prev => new Set(prev).add(permissionType));

    try {
      const permission = PERMISSION_MAP[permissionType];
      if (!permission) {
        throw new Error(`Permission not mapped for ${permissionType}`);
      }

      const result = await request(permission);
      const granted = result === RESULTS.GRANTED;

      setPermissionStates(prev => ({
        ...prev,
        [permissionType]: granted,
      }));

      if (!granted && result === RESULTS.DENIED) {
        Alert.alert(
          'Permission Denied',
          `${
            PERMISSION_REQUESTS.find(p => p.type === permissionType)?.title
          } permission was denied. You can enable it later in Settings.`,
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error(`Failed to request ${permissionType} permission:`, error);
      Alert.alert(
        'Permission Error',
        'Failed to request permission. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setRequestingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(permissionType);
        return newSet;
      });
    }
  };

  const requestAllPermissions = async () => {
    setIsRequestingAll(true);

    try {
      const permissionsToRequest = Object.entries(PERMISSION_MAP).reduce(
        (acc, [type, permission]) => {
          if (permission && !permissionStates[type as PermissionType]) {
            acc[permission] = permission;
          }
          return acc;
        },
        {} as Record<Permission, Permission>,
      );

      if (Object.keys(permissionsToRequest).length === 0) {
        handleContinue();
        return;
      }

      const results = await requestMultiple(
        Object.values(permissionsToRequest),
      );

      const newPermissionStates = { ...permissionStates };
      Object.entries(PERMISSION_MAP).forEach(([type, permission]) => {
        if (permission && results[permission]) {
          newPermissionStates[type as PermissionType] =
            results[permission] === RESULTS.GRANTED;
        }
      });

      setPermissionStates(newPermissionStates);
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert(
        'Permissions Error',
        'Failed to request permissions. You can enable them later in Settings.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsRequestingAll(false);
    }
  };

  const handleContinue = () => {
    if (onPermissionsGranted) {
      onPermissionsGranted(permissionStates);
    } else {
      navigation.navigate(
        'OnboardingComplete' as never,
        {
          onboardingData: {
            userType,
            industry,
            location,
            timezone,
            permissions: permissionStates,
            completedSteps: 4,
            isCompleted: true,
          },
        } as never,
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

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleContinue();
    }
  };

  const renderPermissionCard = (permission: PermissionRequest) => {
    const isGranted = permissionStates[permission.type];
    const isRequesting = requestingPermissions.has(permission.type);

    const cardStyle = {
      opacity: cardAnims[permission.type],
      transform: [
        {
          translateY: cardAnims[permission.type].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View
        key={permission.type}
        style={[styles.permissionCard, cardStyle]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              isGranted && styles.grantedIconContainer,
            ]}
          >
            <Icon
              name={isGranted ? 'check' : permission.icon}
              size={24}
              color={isGranted ? '#FFFFFF' : '#3B82F6'}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.permissionTitle}>{permission.title}</Text>
            <Text style={styles.permissionDescription}>
              {permission.description}
            </Text>

            {permission.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.permissionButton,
              isGranted && styles.grantedButton,
              isRequesting && styles.requestingButton,
            ]}
            onPress={() => requestSinglePermission(permission.type)}
            disabled={isGranted || isRequesting}
            activeOpacity={0.7}
          >
            {isRequesting ? (
              <Icon name="hourglass-empty" size={20} color="#6B7280" />
            ) : isGranted ? (
              <Icon name="check" size={20} color="#10B981" />
            ) : (
              <Text style={styles.buttonText}>Allow</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const grantedCount = Object.values(permissionStates).filter(Boolean).length;
  const totalCount = PERMISSION_REQUESTS.length;

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
          <Text style={styles.headerTitle}>Enable permissions</Text>
          <Text style={styles.headerSubtitle}>
            Allow DigBiz to access these features for the best experience
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressIndicator}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.activeDot]} />
          </View>

          <Text style={styles.progressText}>
            {grantedCount} of {totalCount} permissions granted
          </Text>
        </View>
      </Animated.View>

      {/* Permission Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PERMISSION_REQUESTS.map(permission =>
          renderPermissionCard(permission),
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>
            Why we need these permissions
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Icon name="security" size={20} color="#10B981" />
              <Text style={styles.benefitText}>
                Your privacy is protected - we only use permissions for their
                intended purpose
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="tune" size={20} color="#10B981" />
              <Text style={styles.benefitText}>
                You can change these permissions anytime in your device settings
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="offline-bolt" size={20} color="#10B981" />
              <Text style={styles.benefitText}>
                All permissions are optional - the app works without them
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.6}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {grantedCount === totalCount ? (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Icon
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.allowAllButton,
              isRequestingAll && styles.requestingButton,
            ]}
            onPress={requestAllPermissions}
            disabled={isRequestingAll}
            activeOpacity={0.8}
          >
            {isRequestingAll ? (
              <>
                <Icon name="hourglass-empty" size={20} color="#6B7280" />
                <Text style={styles.requestingText}>Requesting...</Text>
              </>
            ) : (
              <>
                <Text style={styles.allowAllText}>Allow All</Text>
                <Icon
                  name="check-circle"
                  size={20}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
              </>
            )}
          </TouchableOpacity>
        )}
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
    paddingBottom: 16,
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
  progressSection: {
    alignItems: 'center',
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  grantedIconContainer: {
    backgroundColor: '#10B981',
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  requiredText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  grantedButton: {
    backgroundColor: '#F0FDF4',
  },
  requestingButton: {
    backgroundColor: '#F9FAFB',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benefitsSection: {
    marginTop: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  continueButton: {
    flex: 2,
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
  allowAllButton: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
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
  allowAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default PermissionRequestsScreen;
