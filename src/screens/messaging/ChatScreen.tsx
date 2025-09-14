/**
 * Chat Screen
 *
 * Individual chat conversation interface with real-time messaging,
 * typing indicators, read receipts, and media attachments.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  uploadAttachment,
  startTyping,
  stopTyping,
} from '../../store/slices/messagingSlice';
import { Message, MessageType, ChatParticipant } from '../../types/messaging';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

const { width, height } = Dimensions.get('window');

interface ChatScreenProps {
  route: {
    params: {
      chatId: string;
      participant: ChatParticipant;
    };
  };
}

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId, participant } = route.params as ChatScreenProps['route']['params'];

  const [messageText, setMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const messageInputRef = useRef<TextInput>(null);

  const {
    messages,
    messagesLoading,
    messagesError,
    sendingMessage,
    connectionStatus,
    typingUsers,
  } = useSelector((state: RootState) => state.messaging);

  const currentMessages = messages[chatId] || [];
  const isTyping = typingUsers[chatId]?.some(
    userId => userId !== participant.userId
  );

  useEffect(() => {
    loadMessages();
    markAllMessagesAsRead();

    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        dispatch(stopTyping(chatId));
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      }, 100);
    }
  }, [currentMessages.length]);

  const loadMessages = useCallback(async () => {
    try {
      await dispatch(getMessages({
        chatId,
        limit: 50,
        page: 1,
      })).unwrap();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [dispatch, chatId]);

  const markAllMessagesAsRead = useCallback(async () => {
    try {
      await dispatch(markMessagesAsRead({
        chatId,
        markAllAsRead: true,
      })).unwrap();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [dispatch, chatId]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const messageContent = messageText.trim();
    setMessageText('');

    try {
      if (editingMessageId) {
        await dispatch(editMessage({
          messageId: editingMessageId,
          content: messageContent,
        })).unwrap();
        setEditingMessageId(null);
      } else {
        await dispatch(sendMessage({
          chatId,
          content: messageContent,
          messageType: 'text',
          replyToMessageId: replyToMessage?.id,
        })).unwrap();
        setReplyToMessage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setMessageText(messageContent);
    }

    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    dispatch(stopTyping(chatId));
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Start typing indicator
    dispatch(startTyping(chatId));

    // Set timeout to stop typing
    const timeout = setTimeout(() => {
      dispatch(stopTyping(chatId));
    }, 3000);
    setTypingTimeout(timeout);
  };

  const handleMessageLongPress = (message: Message) => {
    const isOwnMessage = message.senderId === participant.userId;
    const options = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reply', onPress: () => setReplyToMessage(message) },
    ];

    if (isOwnMessage) {
      options.push(
        { text: 'Edit', onPress: () => handleEditMessage(message) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(message.id) }
      );
    }

    Alert.alert('Message Options', '', options);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setMessageText(message.content);
    messageInputRef.current?.focus();
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for me',
          onPress: async () => {
            try {
              await dispatch(deleteMessage({ messageId, deleteForAll: false })).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
        {
          text: 'Delete for everyone',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteMessage({ messageId, deleteForAll: true })).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      'Send Attachment',
      'Choose attachment type',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => handleCameraPress() },
        { text: 'Photo Library', onPress: () => handlePhotoLibrary() },
        { text: 'Document', onPress: () => handleDocumentPicker() },
      ]
    );
  };

  const handleCameraPress = async () => {
    // TODO: Implement camera functionality
    console.log('Open camera');
  };

  const handlePhotoLibrary = async () => {
    // TODO: Implement photo library functionality
    console.log('Open photo library');
  };

  const handleDocumentPicker = async () => {
    // TODO: Implement document picker functionality
    console.log('Open document picker');
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message): boolean => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.sentAt).toDateString();
    const previousDate = new Date(previousMessage.sentAt).toDateString();

    return currentDate !== previousDate;
  };

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isOwnMessage = message.senderId === participant.userId;
    const previousMessage = index < currentMessages.length - 1 ? currentMessages[index + 1] : undefined;
    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(message.sentAt)}</Text>
          </View>
        )}

        <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
          <TouchableOpacity
            style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}
            onLongPress={() => handleMessageLongPress(message)}
            delayLongPress={500}
          >
            {message.replyToMessage && (
              <View style={styles.replyContainer}>
                <Text style={styles.replyText} numberOfLines={2}>
                  {message.replyToMessage.content}
                </Text>
              </View>
            )}

            {message.messageType === 'text' ? (
              <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                {message.content}
              </Text>
            ) : (
              <View style={styles.attachmentContainer}>
                <Icon
                  name={
                    message.messageType === 'image' ? 'image' :
                    message.messageType === 'file' ? 'attach-file' :
                    message.messageType === 'audio' ? 'audiotrack' : 'videocam'
                  }
                  size={24}
                  color={isOwnMessage ? '#ffffff' : '#007bff'}
                />
                <Text style={[styles.attachmentText, isOwnMessage && styles.ownMessageText]}>
                  {message.content}
                </Text>
              </View>
            )}

            {message.isEdited && (
              <Text style={[styles.editedText, isOwnMessage && styles.ownEditedText]}>
                (edited)
              </Text>
            )}
          </TouchableOpacity>

          <View style={[styles.messageInfo, isOwnMessage && styles.ownMessageInfo]}>
            <Text style={styles.messageTime}>{formatTime(message.sentAt)}</Text>
            {isOwnMessage && (
              <Icon
                name={
                  message.deliveryStatus === 'read' ? 'done-all' :
                  message.deliveryStatus === 'delivered' ? 'done-all' : 'done'
                }
                size={16}
                color={message.deliveryStatus === 'read' ? '#007bff' : '#6c757d'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
            <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
            <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderReplyBar = () => {
    if (!replyToMessage) return null;

    return (
      <View style={styles.replyBar}>
        <View style={styles.replyBarContent}>
          <Text style={styles.replyBarTitle}>Replying to {participant.displayName}</Text>
          <Text style={styles.replyBarMessage} numberOfLines={1}>
            {replyToMessage.content}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReplyToMessage(null)} style={styles.replyBarClose}>
          <Icon name="close" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#1a1a1a" />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        {participant.profilePicture ? (
          <Image source={{ uri: participant.profilePicture }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.defaultHeaderAvatar]}>
            <Text style={styles.headerAvatarText}>
              {participant.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{participant.displayName}</Text>
          <Text style={styles.headerStatus}>
            {participant.isOnline ? 'Online' : 'Last seen recently'}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: participant.userId })}>
        <Icon name="info-outline" size={24} color="#1a1a1a" />
      </TouchableOpacity>
    </View>
  );

  if (messagesError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ErrorMessage message={messagesError} onRetry={loadMessages} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}

        {/* Connection Status */}
        {!connectionStatus.isConnected && (
          <View style={styles.connectionBanner}>
            <Icon name="wifi-off" size={16} color="#dc3545" />
            <Text style={styles.connectionText}>Messages will be sent when connected</Text>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            messagesLoading ? <LoadingSpinner /> : (
              <EmptyState
                icon="chat"
                title="Start the conversation"
                message="Send a message to begin your conversation."
              />
            )
          }
          ListHeaderComponent={renderTypingIndicator}
          inverted
          contentContainerStyle={[
            styles.messagesList,
            currentMessages.length === 0 && !messagesLoading && styles.emptyMessagesList,
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Reply Bar */}
        {renderReplyBar()}

        {/* Input Area */}
        <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? 0 : 0 }]}>
          <TouchableOpacity onPress={handleAttachmentPress} style={styles.attachmentButton}>
            <Icon name="add" size={24} color="#007bff" />
          </TouchableOpacity>

          <TextInput
            ref={messageInputRef}
            style={styles.messageInput}
            value={messageText}
            onChangeText={handleTyping}
            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled,
            ]}
            disabled={!messageText.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <LoadingSpinner size="small" />
            ) : (
              <Icon
                name={editingMessageId ? "check" : "send"}
                size={20}
                color={messageText.trim() ? "#ffffff" : "#9ca3af"}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  defaultHeaderAvatar: {
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerStatus: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
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
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyMessagesList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    marginVertical: 2,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#007bff',
  },
  replyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  replyText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1a1a1a',
  },
  editedText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  ownEditedText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 16,
  },
  ownMessageInfo: {
    marginLeft: 0,
    marginRight: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#6c757d',
    marginRight: 4,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6c757d',
    marginHorizontal: 2,
  },
  replyBar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  replyBarContent: {
    flex: 1,
  },
  replyBarTitle: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  replyBarMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  replyBarClose: {
    padding: 8,
    marginRight: -8,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#1a1a1a',
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    marginBottom: 4,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f8f9fa',
  },
});

export default ChatScreen;