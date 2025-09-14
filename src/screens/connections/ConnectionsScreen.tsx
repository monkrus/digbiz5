/**
 * Connections Screen
 *
 * Comprehensive connection management interface with tabs for connections,
 * pending requests, sent requests, and blocked users.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import {
  getConnections,
  getConnectionRequests,
  handleConnectionRequest,
  removeConnection,
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchConnections,
  exportConnections,
  getConnectionStats,
} from '../../store/slices/connectionSlice';
import { Connection, ConnectionRequest } from '../../types/connections';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

const { width } = Dimensions.get('window');

type TabType = 'connections' | 'received' | 'sent' | 'blocked';

const ConnectionsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<TabType>('connections');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);

  const {
    connections,
    receivedRequests,
    sentRequests,
    blockedUsers,
    connectionsLoading,
    requestsLoading,
    connectionStats,
    error,
  } = useSelector((state: RootState) => state.connections);

  useEffect(() => {
    loadTabData();
    loadStats();
  }, [activeTab]);

  const loadTabData = useCallback(async () => {
    try {
      switch (activeTab) {
        case 'connections':
          await dispatch(getConnections({
            search: searchQuery || undefined,
            limit: 50,
            sortBy: 'connectedAt',
            sortOrder: 'desc',
          })).unwrap();
          break;

        case 'received':
          await dispatch(getConnectionRequests({
            type: 'received',
            status: 'pending',
            limit: 50,
          })).unwrap();
          break;

        case 'sent':
          await dispatch(getConnectionRequests({
            type: 'sent',
            status: 'pending',
            limit: 50,
          })).unwrap();
          break;

        case 'blocked':
          await dispatch(getBlockedUsers(1, 50)).unwrap();
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    }
  }, [dispatch, activeTab, searchQuery]);

  const loadStats = useCallback(async () => {
    try {
      await dispatch(getConnectionStats()).unwrap();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTabData();
    await loadStats();
    setRefreshing(false);
  }, [loadTabData, loadStats]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (activeTab === 'connections') {
      if (query.trim()) {
        await dispatch(searchConnections({
          query: query.trim(),
          limit: 50,
        })).unwrap();
      } else {
        await loadTabData();
      }
    }
  }, [dispatch, activeTab, loadTabData]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await dispatch(handleConnectionRequest({
        requestId,
        action: 'accept',
      })).unwrap();
      Alert.alert('Success', 'Connection request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept connection request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await dispatch(handleConnectionRequest({
        requestId,
        action: 'reject',
      })).unwrap();
      Alert.alert('Success', 'Connection request rejected');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject connection request');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await dispatch(handleConnectionRequest({
        requestId,
        action: 'cancel',
      })).unwrap();
      Alert.alert('Success', 'Connection request canceled');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel connection request');
    }
  };

  const handleRemoveConnection = (connection: Connection) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${connection.connectedUser.displayName} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeConnection({
                connectionId: connection.id,
                reason: 'user_removed',
                blockUser: false,
              })).unwrap();
              Alert.alert('Success', 'Connection removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove connection');
            }
          },
        },
        {
          text: 'Remove & Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeConnection({
                connectionId: connection.id,
                reason: 'user_removed',
                blockUser: true,
              })).unwrap();
              Alert.alert('Success', 'Connection removed and user blocked');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove and block connection');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (userId: string, displayName: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(blockUser({
                userId,
                reason: 'user_blocked',
              })).unwrap();
              Alert.alert('Success', 'User blocked');
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async (userId: string, displayName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await dispatch(unblockUser({ userId })).unwrap();
              Alert.alert('Success', 'User unblocked');
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const handleExportConnections = async () => {
    Alert.alert(
      'Export Connections',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CSV',
          onPress: async () => {
            try {
              await dispatch(exportConnections({
                format: 'csv',
                includeNotes: true,
                includeTags: true,
              })).unwrap();
              Alert.alert('Success', 'Export started. You will receive an email with the download link.');
            } catch (error) {
              Alert.alert('Error', 'Failed to export connections');
            }
          },
        },
        {
          text: 'JSON',
          onPress: async () => {
            try {
              await dispatch(exportConnections({
                format: 'json',
                includeNotes: true,
                includeTags: true,
              })).unwrap();
              Alert.alert('Success', 'Export started. You will receive an email with the download link.');
            } catch (error) {
              Alert.alert('Error', 'Failed to export connections');
            }
          },
        },
      ]
    );
  };

  const renderConnectionItem = ({ item: connection }: { item: Connection }) => (
    <TouchableOpacity
      style={styles.connectionItem}
      onPress={() => navigation.navigate('Profile', { userId: connection.connectedUser.userId })}
      delayLongPress={500}
      onLongPress={() => {
        Alert.alert(
          'Connection Options',
          `Options for ${connection.connectedUser.displayName}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Profile', onPress: () => navigation.navigate('Profile', { userId: connection.connectedUser.userId }) },
            { text: 'Send Message', onPress: () => navigation.navigate('Chat', { userId: connection.connectedUser.userId }) },
            { text: 'Remove Connection', style: 'destructive', onPress: () => handleRemoveConnection(connection) },
            { text: 'Block User', style: 'destructive', onPress: () => handleBlockUser(connection.connectedUser.userId, connection.connectedUser.displayName) },
          ]
        );
      }}
    >
      <View style={styles.avatarContainer}>
        {connection.connectedUser.profilePicture ? (
          <Image
            source={{ uri: connection.connectedUser.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {connection.connectedUser.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.connectionContent}>
        <Text style={styles.connectionName}>{connection.connectedUser.displayName}</Text>
        <Text style={styles.connectionTitle}>
          {connection.connectedUser.title} {connection.connectedUser.company && `at ${connection.connectedUser.company}`}
        </Text>
        {connection.mutualConnections > 0 && (
          <Text style={styles.mutualConnections}>
            {connection.mutualConnections} mutual connection{connection.mutualConnections !== 1 ? 's' : ''}
          </Text>
        )}
        <Text style={styles.connectionDate}>
          Connected {new Date(connection.connectedAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('Chat', { userId: connection.connectedUser.userId })}
        style={styles.messageButton}
      >
        <Icon name="message" size={20} color="#007bff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderConnectionRequest = ({ item: request }: { item: ConnectionRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.avatarContainer}>
        {request.fromUser.profilePicture ? (
          <Image
            source={{ uri: request.fromUser.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {request.fromUser.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.requestName}>{request.fromUser.displayName}</Text>
        <Text style={styles.requestTitle}>
          {request.fromUser.title} {request.fromUser.company && `at ${request.fromUser.company}`}
        </Text>
        {request.message && (
          <Text style={styles.requestMessage}>"{request.message}"</Text>
        )}
        <Text style={styles.requestDate}>
          {new Date(request.sentAt).toLocaleDateString()}
        </Text>

        {activeTab === 'received' && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.requestButton, styles.rejectButton]}
              onPress={() => handleRejectRequest(request.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.requestButton, styles.acceptButton]}
              onPress={() => handleAcceptRequest(request.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'sent' && (
          <TouchableOpacity
            style={[styles.requestButton, styles.cancelButton]}
            onPress={() => handleCancelRequest(request.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBlockedUser = ({ item }: { item: any }) => (
    <View style={styles.blockedItem}>
      <View style={styles.avatarContainer}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.blockedContent}>
        <Text style={styles.blockedName}>{item.displayName}</Text>
        <Text style={styles.blockedTitle}>
          {item.title} {item.company && `at ${item.company}`}
        </Text>
        <Text style={styles.blockedDate}>
          Blocked {new Date(item.blockedAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(item.userId, item.displayName)}
      >
        <Text style={styles.unblockButtonText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabButton = (
    tab: TabType,
    title: string,
    count?: number
  ) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowStatsModal(true)} style={styles.headerButton}>
            <Icon name="bar-chart" size={24} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportConnections} style={styles.headerButton}>
            <Icon name="file-download" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'connections' && (
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search connections..."
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="clear" size={20} color="#6c757d" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.tabContainer}>
        {renderTabButton('connections', 'Connections', connections.length)}
        {renderTabButton('received', 'Received', receivedRequests.length)}
        {renderTabButton('sent', 'Sent', sentRequests.length)}
        {renderTabButton('blocked', 'Blocked', blockedUsers.length)}
      </View>
    </View>
  );

  const renderStatsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStatsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Connection Stats</Text>
          <TouchableOpacity onPress={() => setShowStatsModal(false)}>
            <Icon name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{connectionStats?.totalConnections || 0}</Text>
            <Text style={styles.statLabel}>Total Connections</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{connectionStats?.pendingRequests || 0}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{connectionStats?.mutualConnections || 0}</Text>
            <Text style={styles.statLabel}>Mutual Connections</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{connectionStats?.recentConnections || 0}</Text>
            <Text style={styles.statLabel}>New This Month</Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'connections':
        return connections;
      case 'received':
        return receivedRequests;
      case 'sent':
        return sentRequests;
      case 'blocked':
        return blockedUsers;
      default:
        return [];
    }
  };

  const getCurrentRenderItem = () => {
    switch (activeTab) {
      case 'connections':
        return renderConnectionItem;
      case 'received':
      case 'sent':
        return renderConnectionRequest;
      case 'blocked':
        return renderBlockedUser;
      default:
        return renderConnectionItem;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'connections':
        return searchQuery ? 'No connections match your search' : 'You haven\'t made any connections yet. Start discovering people!';
      case 'received':
        return 'No pending connection requests';
      case 'sent':
        return 'No sent connection requests';
      case 'blocked':
        return 'No blocked users';
      default:
        return '';
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ErrorMessage message={error} onRetry={loadTabData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={getCurrentData()}
        renderItem={getCurrentRenderItem()}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          connectionsLoading || requestsLoading ? (
            <LoadingSpinner />
          ) : (
            <EmptyState
              icon={activeTab === 'connections' ? 'people' : activeTab === 'blocked' ? 'block' : 'person-add'}
              title="No Data"
              message={getEmptyMessage()}
              actionText={activeTab === 'connections' && !searchQuery ? 'Discover People' : undefined}
              onActionPress={activeTab === 'connections' && !searchQuery ? () => navigation.navigate('Discovery') : undefined}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007bff"
          />
        }
        contentContainerStyle={[
          getCurrentData().length === 0 && !connectionsLoading && !requestsLoading && styles.emptyContainer
        ]}
        showsVerticalScrollIndicator={false}
      />

      {renderStatsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1a1a1a',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeTabButtonText: {
    color: '#007bff',
  },
  badge: {
    marginLeft: 4,
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
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  connectionContent: {
    flex: 1,
  },
  requestContent: {
    flex: 1,
  },
  blockedContent: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  blockedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  connectionTitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  requestTitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  blockedTitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  mutualConnections: {
    fontSize: 12,
    color: '#007bff',
    marginBottom: 4,
  },
  connectionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requestDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  blockedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requestMessage: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc3545',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  messageButton: {
    padding: 8,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default ConnectionsScreen;