/**
 * Discovery Screen
 *
 * Main screen for user discovery featuring tabs for search, suggestions,
 * recent joins, and location-based discovery.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  searchUsers,
  getSuggestedConnections,
  getRecentJoins,
  discoverByLocation,
  setActiveTab,
  clearSearchResults,
  setSearchQuery,
  setSearchFilters,
  getCurrentLocation,
} from '../store/slices/discoverySlice';
import { sendConnectionRequest, getConnectionStatus } from '../store/slices/connectionSlice';

// Components
import SearchTab from '../components/discovery/SearchTab';
import SuggestionsTab from '../components/discovery/SuggestionsTab';
import RecentJoinsTab from '../components/discovery/RecentJoinsTab';
import LocationTab from '../components/discovery/LocationTab';
import UserCard from '../components/discovery/UserCard';
import FilterModal from '../components/discovery/FilterModal';
import SearchHeader from '../components/discovery/SearchHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';

const { width } = Dimensions.get('window');

const DiscoveryScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    activeTab,
    searchResults,
    searchLoading,
    searchError,
    suggestedConnections,
    suggestionsLoading,
    suggestionsError,
    recentJoins,
    recentJoinsLoading,
    recentJoinsError,
    locationResults,
    locationLoading,
    locationError,
    searchQuery,
    searchFilters,
    currentLocation,
  } = useSelector((state: RootState) => state.discovery);

  const { sendingRequest } = useSelector((state: RootState) => state.connections);

  useEffect(() => {
    // Load initial data based on active tab
    loadTabData();
  }, [activeTab]);

  useEffect(() => {
    // Get current location on mount
    dispatch(getCurrentLocation());
  }, [dispatch]);

  const loadTabData = useCallback(() => {
    switch (activeTab) {
      case 'search':
        if (searchQuery || Object.keys(searchFilters).length > 0) {
          dispatch(searchUsers({
            query: searchQuery,
            filters: searchFilters,
            page: 1,
            limit: 20,
          }));
        }
        break;
      case 'suggestions':
        dispatch(getSuggestedConnections({ limit: 20, page: 1 }));
        break;
      case 'recent':
        dispatch(getRecentJoins({ days: 7, limit: 20, page: 1 }));
        break;
      case 'location':
        if (currentLocation) {
          dispatch(discoverByLocation({
            coordinates: currentLocation,
            radius: 50, // 50km radius
          }));
        }
        break;
    }
  }, [activeTab, searchQuery, searchFilters, currentLocation, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTabData();
    setRefreshing(false);
  }, [loadTabData]);

  const handleTabPress = (tab: 'search' | 'suggestions' | 'recent' | 'location') => {
    dispatch(setActiveTab(tab));
  };

  const handleSearch = useCallback((query: string) => {
    dispatch(setSearchQuery(query));
    if (query.trim() || Object.keys(searchFilters).length > 0) {
      dispatch(searchUsers({
        query: query.trim(),
        filters: searchFilters,
        page: 1,
        limit: 20,
      }));
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchFilters, dispatch]);

  const handleFilterApply = useCallback((filters: any) => {
    dispatch(setSearchFilters(filters));
    if (searchQuery || Object.keys(filters).length > 0) {
      dispatch(searchUsers({
        query: searchQuery,
        filters,
        page: 1,
        limit: 20,
      }));
    }
    setShowFilters(false);
  }, [searchQuery, dispatch]);

  const handleConnectRequest = async (userId: string, message?: string) => {
    try {
      await dispatch(sendConnectionRequest({ toUserId: userId, message })).unwrap();
      Alert.alert('Success', 'Connection request sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send connection request');
    }
  };

  const handleViewProfile = (userId: string) => {
    // Navigate to profile screen
    // This would use navigation
    console.log('View profile:', userId);
  };

  const renderTabButton = (
    tab: 'search' | 'suggestions' | 'recent' | 'location',
    title: string,
    count?: number
  ) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => handleTabPress(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <SearchTab
            results={searchResults}
            loading={searchLoading}
            error={searchError}
            onSearch={handleSearch}
            onFilterPress={() => setShowFilters(true)}
            onConnectRequest={handleConnectRequest}
            onViewProfile={handleViewProfile}
            currentQuery={searchQuery}
            hasFilters={Object.keys(searchFilters).length > 0}
          />
        );

      case 'suggestions':
        return (
          <SuggestionsTab
            suggestions={suggestedConnections}
            loading={suggestionsLoading}
            error={suggestionsError}
            onConnectRequest={handleConnectRequest}
            onViewProfile={handleViewProfile}
            onRefresh={handleRefresh}
          />
        );

      case 'recent':
        return (
          <RecentJoinsTab
            recentUsers={recentJoins}
            loading={recentJoinsLoading}
            error={recentJoinsError}
            onConnectRequest={handleConnectRequest}
            onViewProfile={handleViewProfile}
            onRefresh={handleRefresh}
          />
        );

      case 'location':
        return (
          <LocationTab
            locationUsers={locationResults}
            loading={locationLoading}
            error={locationError}
            currentLocation={currentLocation}
            onConnectRequest={handleConnectRequest}
            onViewProfile={handleViewProfile}
            onRefresh={handleRefresh}
            onLocationSearch={(coordinates, radius) => {
              dispatch(discoverByLocation({ coordinates, radius }));
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        {renderTabButton('search', 'Search')}
        {renderTabButton('suggestions', 'Suggestions', suggestedConnections.length)}
        {renderTabButton('recent', 'New Members', recentJoins.length)}
        {renderTabButton('location', 'Nearby')}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Filter Modal */}
      {showFilters && (
        <FilterModal
          visible={showFilters}
          currentFilters={searchFilters}
          onApply={handleFilterApply}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Loading Overlay */}
      {sendingRequest && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Sending connection request...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeTabButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default DiscoveryScreen;