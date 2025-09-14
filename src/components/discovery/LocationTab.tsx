/**
 * Location Tab Component
 *
 * Displays nearby users based on geographic location
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import { DiscoveredUser } from '../../types/discovery';
import UserCard from './UserCard';
import EmptyState from '../common/EmptyState';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

interface LocationTabProps {
  locationUsers: DiscoveredUser[];
  loading: boolean;
  error: string | null;
  currentLocation: { latitude: number; longitude: number } | null;
  onConnectRequest: (userId: string, message?: string) => void;
  onViewProfile: (userId: string) => void;
  onRefresh: () => void;
  onLocationSearch: (coordinates: { latitude: number; longitude: number }, radius: number) => void;
}

const RADIUS_OPTIONS = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '25km', value: 25 },
  { label: '50km', value: 50 },
  { label: '100km', value: 100 },
];

const LocationTab: React.FC<LocationTabProps> = ({
  locationUsers,
  loading,
  error,
  currentLocation,
  onConnectRequest,
  onViewProfile,
  onRefresh,
  onLocationSearch,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(50);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocationPermission(granted ? 'granted' : 'denied');
      } catch (err) {
        console.warn('Error checking location permission:', err);
        setLocationPermission('denied');
      }
    } else {
      // iOS permissions are handled differently
      setLocationPermission('granted');
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'DigBiz needs access to your location to find nearby users.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setLocationPermission(isGranted ? 'granted' : 'denied');
        return isGranted;
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        setLocationPermission('denied');
        return false;
      }
    }
    return true; // iOS permissions
  };

  const getCurrentLocation = async () => {
    const hasPermission = locationPermission === 'granted' || await requestLocationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permission in your device settings to discover nearby users.',
        [{ text: 'OK' }]
      );
      return;
    }

    setGettingLocation(true);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSearch({ latitude, longitude }, selectedRadius);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setGettingLocation(false);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please try again or check your location settings.',
          [{ text: 'OK' }]
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentLocation) {
      onLocationSearch(currentLocation, selectedRadius);
    } else {
      await getCurrentLocation();
    }
    onRefresh();
    setRefreshing(false);
  };

  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    if (currentLocation) {
      onLocationSearch(currentLocation, radius);
    }
  };

  const renderUserCard = ({ item }: { item: DiscoveredUser }) => (
    <UserCard
      user={item}
      onConnect={() => onConnectRequest(item.userId)}
      onViewProfile={() => onViewProfile(item.userId)}
      showDistance={true}
      showMutualConnections={true}
    />
  );

  const renderRadiusSelector = () => (
    <View style={styles.radiusContainer}>
      <Text style={styles.radiusLabel}>Search Radius:</Text>
      <View style={styles.radiusOptions}>
        {RADIUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.radiusOption,
              selectedRadius === option.value && styles.radiusOptionSelected,
            ]}
            onPress={() => handleRadiusChange(option.value)}
          >
            <Text style={[
              styles.radiusOptionText,
              selectedRadius === option.value && styles.radiusOptionTextSelected,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLocationHeader = () => (
    <View style={styles.locationHeader}>
      <View style={styles.locationInfo}>
        <Icon name="location-on" size={20} color="#007bff" />
        <Text style={styles.locationText}>
          {currentLocation
            ? `Showing users within ${selectedRadius}km`
            : 'Location not available'
          }
        </Text>
      </View>

      <TouchableOpacity
        onPress={getCurrentLocation}
        disabled={gettingLocation}
        style={styles.locationButton}
      >
        {gettingLocation ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <Icon name="my-location" size={16} color="#007bff" />
            <Text style={styles.locationButtonText}>Update Location</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!currentLocation) {
      return (
        <EmptyState
          icon="location-off"
          title="Location Required"
          message="Enable location access to discover nearby entrepreneurs and professionals."
          actionText="Enable Location"
          onActionPress={getCurrentLocation}
        />
      );
    }

    if (locationPermission === 'denied') {
      return (
        <EmptyState
          icon="location-disabled"
          title="Location Permission Denied"
          message="Please enable location permission in your device settings to find nearby users."
          actionText="Grant Permission"
          onActionPress={getCurrentLocation}
        />
      );
    }

    return (
      <EmptyState
        icon="location-searching"
        title="No Nearby Users"
        message={`No users found within ${selectedRadius}km of your location. Try increasing the search radius.`}
        actionText="Increase Radius"
        onActionPress={() => {
          const nextRadius = RADIUS_OPTIONS.find(option => option.value > selectedRadius);
          if (nextRadius) {
            handleRadiusChange(nextRadius.value);
          }
        }}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {renderLocationHeader()}
      {renderRadiusSelector()}

      {locationUsers.length > 0 && (
        <Text style={styles.resultsText}>
          {locationUsers.length} user{locationUsers.length !== 1 ? 's' : ''} found nearby
        </Text>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={locationUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007bff"
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          locationUsers.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 6,
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    gap: 4,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  radiusContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  radiusOptionSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radiusOptionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  radiusOptionTextSelected: {
    color: '#ffffff',
  },
  resultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
  separator: {
    height: 12,
  },
});

export default LocationTab;