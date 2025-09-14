/**
 * Location Setup Screen
 *
 * Allows users to set their location and timezone with search functionality
 * and automatic timezone detection based on location.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { COMMON_TIMEZONES } from '../../data/onboardingData';
import { Location, TimeZone, UserType, Industry } from '../../types/onboarding';

interface LocationSetupScreenProps {
  onLocationSelected?: (location: Location, timezone: TimeZone) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

interface RouteParams {
  userType: UserType;
  industry: Industry;
}

// Mock location data - in real app, this would come from a location API
const MOCK_LOCATIONS: Location[] = [
  {
    id: 'sf-ca-us',
    city: 'San Francisco',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
  },
  {
    id: 'ny-ny-us',
    city: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
    coordinates: { latitude: 40.7128, longitude: -74.006 },
  },
  {
    id: 'london-uk',
    city: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
  },
  {
    id: 'berlin-de',
    city: 'Berlin',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    coordinates: { latitude: 52.52, longitude: 13.405 },
  },
  {
    id: 'tokyo-jp',
    city: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
  },
  {
    id: 'singapore-sg',
    city: 'Singapore',
    country: 'Singapore',
    timezone: 'Asia/Singapore',
    coordinates: { latitude: 1.3521, longitude: 103.8198 },
  },
  {
    id: 'sydney-au',
    city: 'Sydney',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
  },
];

const LocationSetupScreen: React.FC<LocationSetupScreenProps> = ({
  onLocationSelected,
  onBack,
  onSkip,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userType, industry } = (route.params as RouteParams) || {};

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedTimezone, setSelectedTimezone] = useState<TimeZone | null>(
    null,
  );
  const [locationQuery, setLocationQuery] = useState('');
  const [timezoneQuery, setTimezoneQuery] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [step, setStep] = useState<'location' | 'timezone'>('location');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  // Filter locations based on search query
  const filteredLocations = locationQuery.trim()
    ? MOCK_LOCATIONS.filter(
        location =>
          location.city.toLowerCase().includes(locationQuery.toLowerCase()) ||
          location.country.toLowerCase().includes(locationQuery.toLowerCase()),
      )
    : MOCK_LOCATIONS;

  // Filter timezones based on search query
  const filteredTimezones = timezoneQuery.trim()
    ? COMMON_TIMEZONES.filter(
        timezone =>
          timezone.name.toLowerCase().includes(timezoneQuery.toLowerCase()) ||
          timezone.region.toLowerCase().includes(timezoneQuery.toLowerCase()),
      )
    : COMMON_TIMEZONES;

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);

    // Auto-select corresponding timezone
    const matchingTimezone = COMMON_TIMEZONES.find(
      tz =>
        location.timezone.includes(tz.id.toUpperCase()) ||
        tz.name.toLowerCase().includes(location.city.toLowerCase()),
    );

    if (matchingTimezone) {
      setSelectedTimezone(matchingTimezone);
      setStep('timezone');
    } else {
      setStep('timezone');
    }
  };

  const handleTimezoneSelect = (timezone: TimeZone) => {
    setSelectedTimezone(timezone);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);

    try {
      // Mock location detection - in real app, use geolocation
      setTimeout(() => {
        const detectedLocation = MOCK_LOCATIONS[0]; // Mock San Francisco
        const detectedTimezone = COMMON_TIMEZONES.find(tz => tz.id === 'pst');

        setSelectedLocation(detectedLocation);
        if (detectedTimezone) {
          setSelectedTimezone(detectedTimezone);
        }
        setStep('timezone');
        setIsDetectingLocation(false);
      }, 2000);
    } catch (error) {
      setIsDetectingLocation(false);
      Alert.alert(
        'Location Detection Failed',
        'Unable to detect your location. Please select manually.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleContinue = () => {
    if (!selectedLocation || !selectedTimezone) return;

    if (onLocationSelected) {
      onLocationSelected(selectedLocation, selectedTimezone);
    } else {
      navigation.navigate(
        'PermissionRequests' as never,
        {
          userType,
          industry,
          location: selectedLocation,
          timezone: selectedTimezone,
        } as never,
      );
    }
  };

  const handleBack = () => {
    if (step === 'timezone' && selectedLocation) {
      setStep('location');
      return;
    }

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
      navigation.navigate(
        'PermissionRequests' as never,
        {
          userType,
          industry,
          location: null,
          timezone: null,
        } as never,
      );
    }
  };

  const renderLocationStep = () => (
    <>
      {/* Auto-detect section */}
      <View style={styles.autoDetectSection}>
        <TouchableOpacity
          style={[
            styles.autoDetectButton,
            isDetectingLocation && styles.detectingButton,
          ]}
          onPress={handleDetectLocation}
          disabled={isDetectingLocation}
          activeOpacity={0.8}
        >
          <Icon
            name={isDetectingLocation ? 'hourglass-empty' : 'my-location'}
            size={20}
            color={isDetectingLocation ? '#6B7280' : '#3B82F6'}
          />
          <Text
            style={[
              styles.autoDetectText,
              isDetectingLocation && styles.detectingText,
            ]}
          >
            {isDetectingLocation
              ? 'Detecting location...'
              : 'Use my current location'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for your city..."
            value={locationQuery}
            onChangeText={setLocationQuery}
            placeholderTextColor="#9CA3AF"
          />
          {locationQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setLocationQuery('')}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Location list */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredLocations.map(location => (
          <TouchableOpacity
            key={location.id}
            style={[
              styles.listItem,
              selectedLocation?.id === location.id && styles.selectedListItem,
            ]}
            onPress={() => handleLocationSelect(location)}
            activeOpacity={0.7}
          >
            <View style={styles.listItemContent}>
              <Text
                style={[
                  styles.listItemTitle,
                  selectedLocation?.id === location.id &&
                    styles.selectedListItemTitle,
                ]}
              >
                {location.city}
              </Text>
              <Text
                style={[
                  styles.listItemSubtitle,
                  selectedLocation?.id === location.id &&
                    styles.selectedListItemSubtitle,
                ]}
              >
                {location.country}
              </Text>
            </View>

            {selectedLocation?.id === location.id && (
              <View style={styles.checkIcon}>
                <Icon name="check" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderTimezoneStep = () => (
    <>
      {/* Selected location summary */}
      {selectedLocation && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Selected Location</Text>
          <View style={styles.summaryItem}>
            <Icon name="location-on" size={20} color="#3B82F6" />
            <Text style={styles.summaryText}>
              {selectedLocation.city}, {selectedLocation.country}
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="schedule"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search timezones..."
            value={timezoneQuery}
            onChangeText={setTimezoneQuery}
            placeholderTextColor="#9CA3AF"
          />
          {timezoneQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setTimezoneQuery('')}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Timezone list */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredTimezones.map(timezone => (
          <TouchableOpacity
            key={timezone.id}
            style={[
              styles.listItem,
              selectedTimezone?.id === timezone.id && styles.selectedListItem,
            ]}
            onPress={() => handleTimezoneSelect(timezone)}
            activeOpacity={0.7}
          >
            <View style={styles.listItemContent}>
              <Text
                style={[
                  styles.listItemTitle,
                  selectedTimezone?.id === timezone.id &&
                    styles.selectedListItemTitle,
                ]}
              >
                {timezone.name}
              </Text>
              <Text
                style={[
                  styles.listItemSubtitle,
                  selectedTimezone?.id === timezone.id &&
                    styles.selectedListItemSubtitle,
                ]}
              >
                {timezone.offset} • {timezone.region}
              </Text>
            </View>

            {selectedTimezone?.id === timezone.id && (
              <View style={styles.checkIcon}>
                <Icon name="check" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const canContinue =
    step === 'location'
      ? selectedLocation
      : selectedLocation && selectedTimezone;

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
          <Text style={styles.headerTitle}>
            {step === 'location'
              ? 'Where are you located?'
              : 'Select your timezone'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {step === 'location'
              ? 'Help us show you local events and opportunities'
              : 'This helps us schedule meetings at the right time'}
          </Text>
        </View>

        <View style={styles.progressIndicator}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.activeDot]} />
        </View>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'location' ? renderLocationStep() : renderTimezoneStep()}
      </View>

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

        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.disabledButton]}
          onPress={
            step === 'location' ? () => setStep('timezone') : handleContinue
          }
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.continueText, !canContinue && styles.disabledText]}
          >
            {step === 'location' ? 'Next' : 'Continue'}
          </Text>
          <Icon
            name="arrow-forward"
            size={20}
            color={canContinue ? '#FFFFFF' : '#9CA3AF'}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  autoDetectSection: {
    marginBottom: 24,
  },
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  detectingButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  autoDetectText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 8,
  },
  detectingText: {
    color: '#6B7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#9CA3AF',
    paddingHorizontal: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  summarySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  selectedListItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedListItemTitle: {
    color: '#3B82F6',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedListItemSubtitle: {
    color: '#3B82F6',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 12,
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

export default LocationSetupScreen;
