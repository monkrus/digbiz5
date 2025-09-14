/**
 * Suggestions Tab Component
 *
 * Displays AI-powered suggested connections with reasons
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
import { SuggestedConnection } from '../../types/discovery';
import UserCard from './UserCard';
import EmptyState from '../common/EmptyState';
import ErrorMessage from '../common/ErrorMessage';

interface SuggestionsTabProps {
  suggestions: SuggestedConnection[];
  loading: boolean;
  error: string | null;
  onConnectRequest: (userId: string, message?: string) => void;
  onViewProfile: (userId: string) => void;
  onRefresh: () => void;
}

const SuggestionsTab: React.FC<SuggestionsTabProps> = ({
  suggestions,
  loading,
  error,
  onConnectRequest,
  onViewProfile,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'mutual'>('score');

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    setRefreshing(false);
  };

  const getSortedSuggestions = () => {
    const sorted = [...suggestions];

    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => b.suggestionScore - a.suggestionScore);
      case 'recent':
        return sorted.sort((a, b) => {
          if (a.isRecent && !b.isRecent) return -1;
          if (!a.isRecent && b.isRecent) return 1;
          return b.suggestionScore - a.suggestionScore;
        });
      case 'mutual':
        return sorted.sort((a, b) => (b.mutualConnections || 0) - (a.mutualConnections || 0));
      default:
        return sorted;
    }
  };

  const formatSuggestionReasons = (reasons: string[]) => {
    const reasonMap: { [key: string]: string } = {
      mutual_connections: 'Mutual connections',
      same_company: 'Same company',
      same_industry: 'Same industry',
      same_location: 'Same location',
      similar_skills: 'Similar skills',
      startup_stage: 'Same startup stage',
      recent_activity: 'Recent activity',
      profile_views: 'Profile interaction',
    };

    return reasons
      .slice(0, 2)
      .map(reason => reasonMap[reason] || reason)
      .join(', ');
  };

  const renderSuggestionCard = ({ item }: { item: SuggestedConnection }) => (
    <View style={styles.suggestionCard}>
      <UserCard
        user={item}
        onConnect={() => onConnectRequest(item.userId)}
        onViewProfile={() => onViewProfile(item.userId)}
        showDistance={true}
        showMutualConnections={true}
        showSuggestionReason={true}
        suggestionReasons={item.suggestionReason}
      />

      <View style={styles.suggestionDetails}>
        <View style={styles.suggestionScore}>
          <Icon name="stars" size={16} color="#ffc107" />
          <Text style={styles.scoreText}>
            {Math.round(item.suggestionScore)}% match
          </Text>
        </View>

        <View style={styles.suggestionReasons}>
          <Text style={styles.reasonsText}>
            {formatSuggestionReasons(item.suggestionReason)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <View style={styles.sortOptions}>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'score' && styles.sortOptionActive]}
          onPress={() => setSortBy('score')}
        >
          <Text style={[styles.sortOptionText, sortBy === 'score' && styles.sortOptionTextActive]}>
            Best Match
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'mutual' && styles.sortOptionActive]}
          onPress={() => setSortBy('mutual')}
        >
          <Text style={[styles.sortOptionText, sortBy === 'mutual' && styles.sortOptionTextActive]}>
            Mutual Connections
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'recent' && styles.sortOptionActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortOptionText, sortBy === 'recent' && styles.sortOptionTextActive]}>
            New Members
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerInfo}>
        <Icon name="auto-awesome" size={20} color="#007bff" />
        <Text style={styles.headerText}>
          Personalized suggestions based on your profile and activity
        </Text>
      </View>

      {suggestions.length > 0 && renderSortOptions()}

      {suggestions.length > 0 && (
        <Text style={styles.resultsText}>
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} for you
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="auto-awesome"
        title="No Suggestions Yet"
        message="Complete your profile and start connecting to get personalized suggestions for potential connections."
        actionText="Complete Profile"
        onActionPress={() => {
          // Navigate to profile completion
        }}
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
        data={getSortedSuggestions()}
        renderItem={renderSuggestionCard}
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
          suggestions.length === 0 && styles.emptyListContainer,
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
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
  },
  sortContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  sortOptionActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#ffffff',
  },
  resultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  suggestionScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
    marginLeft: 4,
  },
  suggestionReasons: {
    marginTop: 4,
  },
  reasonsText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  separator: {
    height: 16,
  },
});

export default SuggestionsTab;