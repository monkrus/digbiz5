/**
 * Search Tab Component
 *
 * Handles user search with filters and displays results
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
import { DiscoveredUser } from '../../types/discovery';
import SearchBar from './SearchBar';
import UserCard from './UserCard';
import EmptyState from '../common/EmptyState';
import ErrorMessage from '../common/ErrorMessage';

interface SearchTabProps {
  results: DiscoveredUser[];
  loading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  onFilterPress: () => void;
  onConnectRequest: (userId: string, message?: string) => void;
  onViewProfile: (userId: string) => void;
  currentQuery: string;
  hasFilters: boolean;
}

const SearchTab: React.FC<SearchTabProps> = ({
  results,
  loading,
  error,
  onSearch,
  onFilterPress,
  onConnectRequest,
  onViewProfile,
  currentQuery,
  hasFilters,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentQuery) {
      onSearch(currentQuery);
    }
    setRefreshing(false);
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

  const renderEmptyState = () => {
    if (loading) return null;

    if (!currentQuery && !hasFilters) {
      return (
        <EmptyState
          icon="search"
          title="Search for People"
          message="Use the search bar above to find entrepreneurs, founders, and professionals in your industry."
          actionText="Browse Suggestions"
          onActionPress={() => {
            // This would switch to suggestions tab
          }}
        />
      );
    }

    if (currentQuery || hasFilters) {
      return (
        <EmptyState
          icon="users"
          title="No Results Found"
          message="Try adjusting your search terms or filters to find more people."
          actionText="Clear Filters"
          onActionPress={onFilterPress}
        />
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <SearchBar
        value={currentQuery}
        onChangeText={onSearch}
        placeholder="Search by name, company, or industry"
        onFilterPress={onFilterPress}
        hasFilters={hasFilters}
      />

      {(currentQuery || hasFilters) && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {results.length} result{results.length !== 1 ? 's' : ''}
            {currentQuery && ` for "${currentQuery}"`}
          </Text>
          {hasFilters && (
            <TouchableOpacity onPress={onFilterPress} style={styles.filtersButton}>
              <Text style={styles.filtersButtonText}>Filters Applied</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          message={error}
          onRetry={() => onSearch(currentQuery)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
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
          results.length === 0 && styles.emptyListContainer,
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
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  resultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  filtersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  filtersButtonText: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '500',
  },
  separator: {
    height: 12,
  },
});

export default SearchTab;