/**
 * Recent Joins Tab Component
 *
 * Displays recently joined users with welcome messaging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DiscoveredUser } from '../../types/discovery';
import UserCard from './UserCard';
import EmptyState from '../common/EmptyState';
import ErrorMessage from '../common/ErrorMessage';

interface RecentJoinsTabProps {
  recentUsers: DiscoveredUser[];
  loading: boolean;
  error: string | null;
  onConnectRequest: (userId: string, message?: string) => void;
  onViewProfile: (userId: string) => void;
  onRefresh: () => void;
}

const TIME_FILTER_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 30 days', value: 30 },
];

const RecentJoinsTab: React.FC<RecentJoinsTabProps> = ({
  recentUsers,
  loading,
  error,
  onConnectRequest,
  onViewProfile,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(7);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    setRefreshing(false);
  };

  const handleConnectWithWelcome = (userId: string) => {
    const welcomeMessage = "Welcome to DigBiz! I'd love to connect and learn more about your venture.";
    onConnectRequest(userId, welcomeMessage);
  };

  const getFilteredUsers = () => {
    // In a real implementation, this would filter based on join date
    // For now, we'll just return all recent users
    return recentUsers;
  };

  const renderUserCard = ({ item }: { item: DiscoveredUser }) => (
    <View style={styles.userCardContainer}>
      <View style={styles.newMemberBadge}>
        <Icon name="fiber-new" size={16} color="#28a745" />
        <Text style={styles.newMemberText}>New Member</Text>
      </View>

      <UserCard
        user={item}
        onConnect={() => handleConnectWithWelcome(item.userId)}
        onViewProfile={() => onViewProfile(item.userId)}
        showDistance={false}
        showMutualConnections={true}
      />

      <View style={styles.welcomeActions}>
        <TouchableOpacity
          style={styles.welcomeButton}
          onPress={() => handleConnectWithWelcome(item.userId)}
        >
          <Icon name="waving-hand" size={16} color="#007bff" />
          <Text style={styles.welcomeButtonText}>Send Welcome</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => onViewProfile(item.userId)}
        >
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimeFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersLabel}>Show members who joined:</Text>
      <View style={styles.filterOptions}>
        {TIME_FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterOption,
              selectedTimeFilter === option.value && styles.filterOptionSelected,
            ]}
            onPress={() => setSelectedTimeFilter(option.value)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedTimeFilter === option.value && styles.filterOptionTextSelected,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerInfo}>
        <Icon name="people" size={20} color="#28a745" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Welcome New Members</Text>
          <Text style={styles.headerSubtitle}>
            Be the first to welcome entrepreneurs who just joined our community
          </Text>
        </View>
      </View>

      {renderTimeFilters()}

      {recentUsers.length > 0 && (
        <Text style={styles.resultsText}>
          {getFilteredUsers().length} new member{getFilteredUsers().length !== 1 ? 's' : ''}
          {selectedTimeFilter === 7 ? ' this week' :
           selectedTimeFilter === 14 ? ' in the last 2 weeks' :
           ' this month'}
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="people-outline"
        title="No New Members"
        message={`No one has joined in the last ${selectedTimeFilter} days. Check back later or try a longer time period.`}
        actionText="Extend to 30 days"
        onActionPress={() => setSelectedTimeFilter(30)}
      />
    );
  };

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
        data={getFilteredUsers()}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#28a745"
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          recentUsers.length === 0 && styles.emptyListContainer,
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 18,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  filterOptionSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#ffffff',
  },
  resultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
  userCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  newMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  newMemberText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginLeft: 4,
  },
  welcomeActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    gap: 12,
  },
  welcomeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    gap: 6,
  },
  welcomeButtonText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  viewProfileButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  viewProfileButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
    textAlign: 'center',
  },
  separator: {
    height: 16,
  },
});

export default RecentJoinsTab;