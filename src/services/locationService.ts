/**
 * Location Service
 *
 * Comprehensive location management including background tracking, geofencing, and privacy controls
 */

import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { LocationUpdate, EventGeofence } from '../types/eventNetworking';

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
}

interface GeofenceOptions {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  onEnter?: () => void;
  onExit?: () => void;
  onDwell?: (dwellTime: number) => void;
}

interface LocationPermissionStatus {
  granted: boolean;
  backgroundGranted: boolean;
  preciseLocationGranted: boolean;
}

class LocationService {
  private watchId: number | null = null;
  private backgroundWatchId: number | null = null;
  private geofences: Map<string, GeofenceOptions> = new Map();
  private currentLocation: any | null = null;
  private locationHistory: LocationUpdate[] = [];
  private isBackgroundTrackingEnabled = false;
  private privacySettings = {
    shareLocation: true,
    shareWithNearbyUsers: true,
    backgroundTracking: false,
    dataRetentionDays: 30,
  };

  // Permission Management
  async requestLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const locationGranted =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;

        let backgroundGranted = false;
        let preciseLocationGranted = false;

        if (locationGranted) {
          // Request background location permission
          if (Platform.Version >= 29) {
            const backgroundPermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
              {
                title: 'Background Location Permission',
                message:
                  'This app needs background location access to provide event notifications and networking features when the app is closed.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            backgroundGranted =
              backgroundPermission === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            backgroundGranted = true; // Background location is included in regular permission on older versions
          }

          preciseLocationGranted =
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;
        }

        return {
          granted: locationGranted,
          backgroundGranted,
          preciseLocationGranted,
        };
      } else {
        // iOS permission handling would go here
        // For now, assume permissions are granted
        return {
          granted: true,
          backgroundGranted: true,
          preciseLocationGranted: true,
        };
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return {
        granted: false,
        backgroundGranted: false,
        preciseLocationGranted: false,
      };
    }
  }

  async checkLocationPermissions(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'android') {
      const fineLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const coarseLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );

      let backgroundGranted = false;
      if (Platform.Version >= 29) {
        backgroundGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );
      } else {
        backgroundGranted = fineLocationGranted || coarseLocationGranted;
      }

      return {
        granted: fineLocationGranted || coarseLocationGranted,
        backgroundGranted,
        preciseLocationGranted: fineLocationGranted,
      };
    }

    // iOS implementation would go here
    return {
      granted: true,
      backgroundGranted: true,
      preciseLocationGranted: true,
    };
  }

  // Location Tracking
  async startLocationTracking(options: LocationOptions = {}): Promise<void> {
    const permissions = await this.checkLocationPermissions();
    if (!permissions.granted) {
      const newPermissions = await this.requestLocationPermissions();
      if (!newPermissions.granted) {
        throw new Error('Location permission denied');
      }
    }

    const defaultOptions: LocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      distanceFilter: 10,
      ...options,
    };

    return new Promise((resolve, reject) => {
      this.watchId = (navigator as any).geolocation.watchPosition(
        position => {
          this.currentLocation = position;
          this.addToLocationHistory(position);
          this.checkGeofences(position);
          resolve();
        },
        error => {
          console.error('Location tracking error:', error);
          reject(error);
        },
        defaultOptions,
      );
    });
  }

  stopLocationTracking(): void {
    if (this.watchId !== null) {
      (navigator as any).geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async startBackgroundTracking(): Promise<void> {
    const permissions = await this.checkLocationPermissions();
    if (!permissions.backgroundGranted) {
      Alert.alert(
        'Background Location Required',
        'To receive event notifications and enable automatic networking features, please allow background location access.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settings',
            onPress: () => {
              // Open app settings
              if (Platform.OS === 'android') {
                // Open Android settings
              } else {
                // Open iOS settings
              }
            },
          },
        ],
      );
      return;
    }

    this.isBackgroundTrackingEnabled = true;

    // In a real implementation, this would use a background service
    // For React Native, you'd typically use libraries like:
    // - @react-native-async-storage/async-storage
    // - react-native-background-job
    // - react-native-background-fetch

    console.log('Background location tracking enabled');
  }

  stopBackgroundTracking(): void {
    this.isBackgroundTrackingEnabled = false;
    if (this.backgroundWatchId !== null) {
      (navigator as any).geolocation.clearWatch(this.backgroundWatchId);
      this.backgroundWatchId = null;
    }
    console.log('Background location tracking disabled');
  }

  getCurrentLocation(options: LocationOptions = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      (navigator as any).geolocation.getCurrentPosition(
        position => {
          this.currentLocation = position;
          resolve(position);
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
          ...options,
        },
      );
    });
  }

  // Geofencing
  addGeofence(options: GeofenceOptions): void {
    this.geofences.set(options.id, options);
    console.log(
      `Geofence added: ${options.id} at ${options.latitude}, ${options.longitude} with radius ${options.radius}m`,
    );
  }

  removeGeofence(id: string): void {
    this.geofences.delete(id);
    console.log(`Geofence removed: ${id}`);
  }

  clearAllGeofences(): void {
    this.geofences.clear();
    console.log('All geofences cleared');
  }

  private checkGeofences(position: any): void {
    this.geofences.forEach((geofence, id) => {
      const distance = this.calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        geofence.latitude,
        geofence.longitude,
      );

      if (distance <= geofence.radius) {
        console.log(`Entered geofence: ${id}`);
        geofence.onEnter?.();
      } else {
        console.log(`Outside geofence: ${id} (${Math.round(distance)}m away)`);
        geofence.onExit?.();
      }
    });
  }

  // Distance Calculations
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360; // Convert to degrees
  }

  isWithinRadius(
    centerLat: number,
    centerLon: number,
    targetLat: number,
    targetLon: number,
    radius: number,
  ): boolean {
    const distance = this.calculateDistance(
      centerLat,
      centerLon,
      targetLat,
      targetLon,
    );
    return distance <= radius;
  }

  // Privacy and Settings
  updatePrivacySettings(settings: Partial<typeof this.privacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };
    console.log('Privacy settings updated:', this.privacySettings);

    // Apply privacy settings
    if (!settings.backgroundTracking && this.isBackgroundTrackingEnabled) {
      this.stopBackgroundTracking();
    }

    if (!settings.shareLocation) {
      // Stop sharing location with other users
      this.stopLocationSharing();
    }
  }

  getPrivacySettings() {
    return { ...this.privacySettings };
  }

  private stopLocationSharing(): void {
    // Implementation to stop sharing location with the server/other users
    console.log('Location sharing disabled');
  }

  // Location History Management
  private addToLocationHistory(position: any): void {
    const locationUpdate: LocationUpdate = {
      userId: 'current_user', // Would be actual user ID
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      isBackground: this.isBackgroundTrackingEnabled,
    };

    this.locationHistory.push(locationUpdate);

    // Limit history size and respect privacy settings
    const maxHistoryDays = this.privacySettings.dataRetentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxHistoryDays);

    this.locationHistory = this.locationHistory.filter(
      location => new Date(location.timestamp) > cutoffDate,
    );
  }

  getLocationHistory(days: number = 7): LocationUpdate[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.locationHistory.filter(
      location => new Date(location.timestamp) > cutoffDate,
    );
  }

  clearLocationHistory(): void {
    this.locationHistory = [];
    console.log('Location history cleared');
  }

  // Utility Methods
  formatLocation(lat: number, lon: number, precision: number = 6): string {
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    // In a real implementation, this would use a geocoding service
    // For now, return a placeholder
    return `Location: ${this.formatLocation(lat, lon)}`;
  }

  getLocationAccuracyDescription(accuracy: number): string {
    if (accuracy <= 5) return 'Very High';
    if (accuracy <= 10) return 'High';
    if (accuracy <= 20) return 'Medium';
    if (accuracy <= 50) return 'Low';
    return 'Very Low';
  }

  // Event Integration
  async createEventGeofence(
    eventId: string,
    lat: number,
    lon: number,
    radius: number,
  ): Promise<void> {
    const geofenceOptions: GeofenceOptions = {
      id: `event_${eventId}`,
      latitude: lat,
      longitude: lon,
      radius,
      onEnter: () => {
        console.log(`Entered event geofence: ${eventId}`);
        // Trigger check-in notification or automatic check-in
      },
      onExit: () => {
        console.log(`Exited event geofence: ${eventId}`);
        // End networking session or show follow-up prompts
      },
    };

    this.addGeofence(geofenceOptions);
  }

  removeEventGeofence(eventId: string): void {
    this.removeGeofence(`event_${eventId}`);
  }

  // Health and Battery Optimization
  getTrackingStats(): {
    isTracking: boolean;
    isBackgroundTracking: boolean;
    geofenceCount: number;
    lastLocationUpdate: string | null;
    accuracyLevel: string;
  } {
    return {
      isTracking: this.watchId !== null,
      isBackgroundTracking: this.isBackgroundTrackingEnabled,
      geofenceCount: this.geofences.size,
      lastLocationUpdate: this.currentLocation
        ? new Date(this.currentLocation.timestamp).toISOString()
        : null,
      accuracyLevel: this.currentLocation
        ? this.getLocationAccuracyDescription(
            this.currentLocation.coords.accuracy,
          )
        : 'Unknown',
    };
  }

  optimizeForBatteryLife(): void {
    // Reduce update frequency and accuracy for battery optimization
    this.stopLocationTracking();
    this.startLocationTracking({
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000,
      distanceFilter: 50,
    });
    console.log('Location tracking optimized for battery life');
  }

  optimizeForAccuracy(): void {
    // Increase update frequency and accuracy
    this.stopLocationTracking();
    this.startLocationTracking({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      distanceFilter: 5,
    });
    console.log('Location tracking optimized for accuracy');
  }
}

export const locationService = new LocationService();
export default locationService;
