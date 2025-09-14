/**
 * Chats List Screen
 *
 * Main screen for displaying all user conversations with search,
 * filtering, and real-time updates.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import {
  getChats,
  archiveChat,
  muteChat,
  deleteChat,
  markMessagesAsRead,
} from '../../store/slices/messagingSlice';
import { Chat } from '../../types/messaging';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

const { width } = Dimensions.get('window');

const ChatsListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const {
    chats,
    chatsLoading,
    chatsError,
    unreadCount,
    connectionStatus,
  } = useSelector((state: RootState) => state.messaging);

  useEffect(() => {
    loadChats();
  }, [showArchived]);

  const loadChats = useCallback(async () => {
    try {
      await dispatch(getChats({
        includeArchived: showArchived,
        search: searchQuery || undefined,
        limit: 50,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      })).unwrap();
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }, [dispatch, showArchived, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await dispatch(getChats({
        includeArchived: showArchived,
        search: query.trim(),
        limit: 50,
      })).unwrap();
    } else {
      await loadChats();
    }
  }, [dispatch, showArchived, loadChats]);

  const handleChatPress = (chat: Chat) => {
    // Mark messages as read when opening chat
    if (chat.unreadCount > 0) {
      dispatch(markMessagesAsRead({
        chatId: chat.id,
        markAllAsRead: true,
      }));
    }

    // Navigate to chat screen
    navigation.navigate('Chat', {
      chatId: chat.id,
      participant: chat.participants.find(p => p.userId !== chat.currentUserId),
    });
  };

  const handleArchiveChat = async (chatId: string, archive: boolean) => {
    try {
      await dispatch(archiveChat({ chatId, archive })).unwrap();
      Alert.alert('Success', `Chat ${archive ? 'archived' : 'unarchived'} successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${archive ? 'archive' : 'unarchive'} chat`);
    }
  };

  const handleMuteChat = async (chatId: string, mute: boolean) => {
    try {
      await dispatch(muteChat({ chatId, mute })).unwrap();
      Alert.alert('Success', `Chat ${mute ? 'muted' : 'unmuted'} successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${mute ? 'mute' : 'unmute'} chat`);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteChat({ chatId, deleteForAll: false })).unwrap();
              Alert.alert('Success', 'Chat deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  };

  const formatLastMessage = (chat: Chat): string => {
    if (!chat.lastMessage) return 'No messages yet';

    const { content, messageType, senderId } = chat.lastMessage;
    const isFromCurrentUser = senderId === chat.currentUserId;
    const prefix = isFromCurrentUser ? 'You: ' : '';

    switch (messageType) {
      case 'text':
        return `${prefix}${content}`;
      case 'image':
        return `${prefix}📷 Image`;
      case 'file':
        return `${prefix}📎 File`;
      case 'audio':
        return `${prefix}🎵 Audio`;
      case 'video':
        return `${prefix}🎥 Video`;
      default:
        return `${prefix}${content}`;
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderChatItem = ({ item: chat }: { item: Chat }) => {
    const participant = chat.participants.find(p => p.userId !== chat.currentUserId);

    return (
      <TouchableOpacity
        style={[styles.chatItem, chat.unreadCount > 0 && styles.unreadChatItem]}
        onPress={() => handleChatPress(chat)}
        delayLongPress={500}
        onLongPress={() => {
          Alert.alert(
            'Chat Options',
            `Options for ${participant?.displayName}`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: chat.isArchived ? 'Unarchive' : 'Archive',
                onPress: () => handleArchiveChat(chat.id, !chat.isArchived),
              },
              {
                text: chat.isMuted ? 'Unmute' : 'Mute',
                onPress: () => handleMuteChat(chat.id, !chat.isMuted),
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDeleteChat(chat.id),
              },
            ]
          );
        }}
      >
        {/* Profile Image */}
        <View style={styles.avatarContainer}>
          {participant?.profilePicture ? (
            <Image
              source={{ uri: participant.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {participant?.displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {chat.participants.some(p => p.isOnline) && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        {/* Chat Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, chat.unreadCount > 0 && styles.unreadChatName]}>
              {participant?.displayName || 'Unknown User'}
            </Text>
            <View style={styles.chatMeta}>
              {chat.isMuted && <Icon name="volume-off" size={16} color="#6c757d" />}
              {chat.lastMessage && (
                <Text style={styles.timestamp}>
                  {formatTime(chat.lastMessage.sentAt)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, chat.unreadCount > 0 && styles.unreadLastMessage]}
              numberOfLines={1}
            >
              {formatLastMessage(chat)}
            </Text>

            {chat.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search conversations..."
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="clear" size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, !showArchived && styles.activeFilterTab]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[styles.filterTabText, !showArchived && styles.activeFilterTabText]}>
            Active
          </Text>
          {unreadCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, showArchived && styles.activeFilterTab]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.filterTabText, showArchived && styles.activeFilterTabText]}>
            Archived
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={showArchived ? "archive" : "chat"}
      title={showArchived ? "No Archived Chats" : "No Conversations"}
      message={showArchived
        ? "Your archived conversations will appear here."
        : "Start a conversation by connecting with someone from the discovery section."
      }
      actionText={!showArchived ? "Discover People" : undefined}
      onActionPress={!showArchived ? () => navigation.navigate('Discovery') : undefined}
    />
  );

  if (chatsError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          message={chatsError}
          onRetry={loadChats}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection Status */}
      {!connectionStatus.isConnected && (
        <View style={styles.connectionBanner}>
          <Icon name="wifi-off" size={16} color="#dc3545" />
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      )}

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={chatsLoading ? <LoadingSpinner /> : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007bff"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          chats.length === 0 && !chatsLoading && styles.emptyContainer
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeFilterTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeFilterTabText: {
    color: '#007bff',
  },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  unreadChatItem: {
    backgroundColor: '#f8f9ff',
  },
  avatarContainer: {
    position: 'relative',
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  unreadChatName: {
    fontWeight: '600',
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  unreadLastMessage: {
    color: '#495057',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default ChatsListScreen;