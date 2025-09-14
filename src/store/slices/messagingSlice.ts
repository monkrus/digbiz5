/**
 * Messaging Redux Slice
 *
 * Manages messaging state including chats, messages, real-time events,
 * and message notifications.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Chat,
  Message,
  SendMessageRequest,
  ChatParams,
  MessageParams,
  MessageNotification,
  MessageStats,
  MessageNotificationSettings,
  TypingIndicator,
  ConnectionStatus,
  MessageDeliveryStatus,
  CreateChatRequest,
  ArchiveChatRequest,
  MuteChatRequest,
  DeleteChatRequest,
  EditMessageRequest,
  DeleteMessageRequest,
  MessageSearchParams,
  MarkMessageReadRequest,
} from '../../types/messaging';
import messagingService from '../../services/messagingService';

interface MessagingState {
  // Chats
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;
  chatsMeta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
  } | null;

  // Current chat
  currentChatId: string | null;
  currentChat: Chat | null;

  // Messages
  messages: { [chatId: string]: Message[] };
  messagesLoading: boolean;
  messagesError: string | null;
  messagesMeta: { [chatId: string]: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    oldestMessageId?: string;
    newestMessageId?: string;
  } };

  // Real-time connection
  connectionStatus: ConnectionStatus;
  isReconnecting: boolean;

  // Typing indicators
  typingIndicators: { [chatId: string]: TypingIndicator[] };

  // Unread counts
  totalUnreadCount: number;
  unreadChats: { [chatId: string]: number };

  // Notifications
  notifications: MessageNotification[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  unreadNotificationCount: number;

  // Message stats
  stats: MessageStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Notification settings
  notificationSettings: MessageNotificationSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;

  // Search
  searchResults: Array<{
    message: Message;
    chat: Pick<Chat, 'id' | 'participantProfiles'>;
    matchHighlight?: string;
  }>;
  searchLoading: boolean;
  searchError: string | null;
  searchQuery: string;

  // Message actions
  sendingMessage: boolean;
  sendMessageError: string | null;
  editingMessage: boolean;
  editMessageError: string | null;
  deletingMessage: boolean;
  deleteMessageError: string | null;

  // Chat actions
  creatingChat: boolean;
  createChatError: string | null;
  archivingChat: boolean;
  archiveChatError: string | null;
  deletingChat: boolean;
  deleteChatError: string | null;

  // UI state
  selectedMessage: Message | null;
  replyToMessage: Message | null;
  messageInput: { [chatId: string]: string };
  viewMode: 'list' | 'bubbles';
  showOnlineStatus: boolean;
  enableSoundNotifications: boolean;

  // File uploads
  uploadingFile: boolean;
  uploadProgress: { [messageId: string]: number };
  uploadError: string | null;

  // Message drafts
  drafts: { [chatId: string]: string };

  // Read receipts
  readReceipts: { [messageId: string]: Array<{ userId: string; readAt: string }> };

  // Message delivery status
  messageDeliveryStatus: { [messageId: string]: MessageDeliveryStatus };
}

const initialState: MessagingState = {
  chats: [],
  chatsLoading: false,
  chatsError: null,
  chatsMeta: null,
  currentChatId: null,
  currentChat: null,
  messages: {},
  messagesLoading: false,
  messagesError: null,
  messagesMeta: {},
  connectionStatus: { isConnected: false, reconnectAttempts: 0 },
  isReconnecting: false,
  typingIndicators: {},
  totalUnreadCount: 0,
  unreadChats: {},
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  unreadNotificationCount: 0,
  stats: null,
  statsLoading: false,
  statsError: null,
  notificationSettings: null,
  settingsLoading: false,
  settingsError: null,
  searchResults: [],
  searchLoading: false,
  searchError: null,
  searchQuery: '',
  sendingMessage: false,
  sendMessageError: null,
  editingMessage: false,
  editMessageError: null,
  deletingMessage: false,
  deleteMessageError: null,
  creatingChat: false,
  createChatError: null,
  archivingChat: false,
  archiveChatError: null,
  deletingChat: false,
  deleteChatError: null,
  selectedMessage: null,
  replyToMessage: null,
  messageInput: {},
  viewMode: 'bubbles',
  showOnlineStatus: true,
  enableSoundNotifications: true,
  uploadingFile: false,
  uploadProgress: {},
  uploadError: null,
  drafts: {},
  readReceipts: {},
  messageDeliveryStatus: {},
};

// Async thunks
export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async (messageRequest: SendMessageRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.sendMessage(messageRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getChats = createAsyncThunk(
  'messaging/getChats',
  async (params: ChatParams = {}, { rejectWithValue }) => {
    try {
      const response = await messagingService.getChats(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadMoreChats = createAsyncThunk(
  'messaging/loadMoreChats',
  async (params: ChatParams, { rejectWithValue }) => {
    try {
      const response = await messagingService.getChats(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getMessages = createAsyncThunk(
  'messaging/getMessages',
  async (params: MessageParams, { rejectWithValue }) => {
    try {
      const response = await messagingService.getMessages(params);
      return { chatId: params.chatId, ...response };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadMoreMessages = createAsyncThunk(
  'messaging/loadMoreMessages',
  async (params: MessageParams, { rejectWithValue }) => {
    try {
      const response = await messagingService.getMessages(params);
      return { chatId: params.chatId, ...response };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'messaging/markMessagesAsRead',
  async (readRequest: MarkMessageReadRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.markMessagesAsRead(readRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createChat = createAsyncThunk(
  'messaging/createChat',
  async (createRequest: CreateChatRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.createChat(createRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const archiveChat = createAsyncThunk(
  'messaging/archiveChat',
  async (archiveRequest: ArchiveChatRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.archiveChat(archiveRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const muteChat = createAsyncThunk(
  'messaging/muteChat',
  async (muteRequest: MuteChatRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.muteChat(muteRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'messaging/deleteChat',
  async (deleteRequest: DeleteChatRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.deleteChat(deleteRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'messaging/editMessage',
  async (editRequest: EditMessageRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.editMessage(editRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messaging/deleteMessage',
  async (deleteRequest: DeleteMessageRequest, { rejectWithValue }) => {
    try {
      const response = await messagingService.deleteMessage(deleteRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const searchMessages = createAsyncThunk(
  'messaging/searchMessages',
  async (params: MessageSearchParams, { rejectWithValue }) => {
    try {
      const response = await messagingService.searchMessages(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getMessageStats = createAsyncThunk(
  'messaging/getMessageStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagingService.getMessageStats();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'messaging/updateNotificationSettings',
  async (settings: Partial<MessageNotificationSettings>, { rejectWithValue }) => {
    try {
      const response = await messagingService.updateNotificationSettings({ settings });
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  'messaging/uploadAttachment',
  async (params: { chatId: string; file: any }, { rejectWithValue }) => {
    try {
      const response = await messagingService.uploadAttachment(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    // Real-time connection
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    setReconnecting: (state, action: PayloadAction<boolean>) => {
      state.isReconnecting = action.payload;
    },

    // Current chat
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
      state.currentChat = action.payload
        ? state.chats.find(chat => chat.id === action.payload) || null
        : null;
    },

    // Messages
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (!state.messages[message.chatId]) {
        state.messages[message.chatId] = [];
      }

      // Add message if it doesn't exist
      const existingIndex = state.messages[message.chatId].findIndex(m => m.id === message.id);
      if (existingIndex === -1) {
        state.messages[message.chatId].push(message);
        state.messages[message.chatId].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      // Update chat's last message
      const chatIndex = state.chats.findIndex(chat => chat.id === message.chatId);
      if (chatIndex >= 0) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].updatedAt = message.createdAt;
      }

      // Update unread count if not current user's message
      // This would need to be enhanced with actual user ID check
    },

    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (state.messages[message.chatId]) {
        const messageIndex = state.messages[message.chatId].findIndex(m => m.id === message.id);
        if (messageIndex >= 0) {
          state.messages[message.chatId][messageIndex] = message;
        }
      }
    },

    removeMessage: (state, action: PayloadAction<{ chatId: string; messageId: string }>) => {
      const { chatId, messageId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
      }
    },

    // Typing indicators
    setTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
      const indicator = action.payload;
      if (!state.typingIndicators[indicator.chatId]) {
        state.typingIndicators[indicator.chatId] = [];
      }

      const existingIndex = state.typingIndicators[indicator.chatId].findIndex(
        t => t.userId === indicator.userId
      );

      if (indicator.isTyping) {
        if (existingIndex === -1) {
          state.typingIndicators[indicator.chatId].push(indicator);
        } else {
          state.typingIndicators[indicator.chatId][existingIndex] = indicator;
        }
      } else {
        if (existingIndex >= 0) {
          state.typingIndicators[indicator.chatId].splice(existingIndex, 1);
        }
      }
    },

    clearTypingIndicators: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.typingIndicators[chatId] = [];
    },

    // Message input
    setMessageInput: (state, action: PayloadAction<{ chatId: string; content: string }>) => {
      state.messageInput[action.payload.chatId] = action.payload.content;
    },

    clearMessageInput: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.messageInput[chatId];
    },

    // Drafts
    saveDraft: (state, action: PayloadAction<{ chatId: string; content: string }>) => {
      if (action.payload.content.trim()) {
        state.drafts[action.payload.chatId] = action.payload.content;
      } else {
        delete state.drafts[action.payload.chatId];
      }
    },

    clearDraft: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.drafts[chatId];
    },

    // UI state
    setSelectedMessage: (state, action: PayloadAction<Message | null>) => {
      state.selectedMessage = action.payload;
    },

    setReplyToMessage: (state, action: PayloadAction<Message | null>) => {
      state.replyToMessage = action.payload;
    },

    setViewMode: (state, action: PayloadAction<'list' | 'bubbles'>) => {
      state.viewMode = action.payload;
    },

    setShowOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.showOnlineStatus = action.payload;
    },

    setEnableSoundNotifications: (state, action: PayloadAction<boolean>) => {
      state.enableSoundNotifications = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },

    // Unread counts
    updateUnreadCount: (state, action: PayloadAction<{ chatId: string; count: number }>) => {
      const { chatId, count } = action.payload;
      const oldCount = state.unreadChats[chatId] || 0;
      state.unreadChats[chatId] = count;
      state.totalUnreadCount = state.totalUnreadCount - oldCount + count;
    },

    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      const oldCount = state.unreadChats[chatId] || 0;
      state.unreadChats[chatId] = 0;
      state.totalUnreadCount = Math.max(0, state.totalUnreadCount - oldCount);

      // Update chat unread count
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex >= 0) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },

    // Read receipts
    updateReadReceipts: (state, action: PayloadAction<{ messageId: string; receipts: Array<{ userId: string; readAt: string }> }>) => {
      state.readReceipts[action.payload.messageId] = action.payload.receipts;
    },

    // Message delivery status
    updateMessageDeliveryStatus: (state, action: PayloadAction<{ messageId: string; status: MessageDeliveryStatus }>) => {
      state.messageDeliveryStatus[action.payload.messageId] = action.payload.status;
    },

    // Upload progress
    setUploadProgress: (state, action: PayloadAction<{ messageId: string; progress: number }>) => {
      state.uploadProgress[action.payload.messageId] = action.payload.progress;
    },

    clearUploadProgress: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      delete state.uploadProgress[messageId];
    },

    // Clear errors
    clearMessagingErrors: (state) => {
      state.chatsError = null;
      state.messagesError = null;
      state.sendMessageError = null;
      state.editMessageError = null;
      state.deleteMessageError = null;
      state.createChatError = null;
      state.archiveChatError = null;
      state.deleteChatError = null;
      state.searchError = null;
      state.uploadError = null;
      state.notificationsError = null;
      state.settingsError = null;
      state.statsError = null;
    },

    // Reset state
    resetMessagingState: () => initialState,
  },
  extraReducers: (builder) => {
    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.sendMessageError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;

        // Add message to messages
        const message = action.payload.sentMessage;
        if (!state.messages[message.chatId]) {
          state.messages[message.chatId] = [];
        }
        state.messages[message.chatId].push(message);

        // Update or add chat
        const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.chat.id);
        if (chatIndex >= 0) {
          state.chats[chatIndex] = action.payload.chat;
        } else {
          state.chats.unshift(action.payload.chat);
        }

        // Clear message input
        delete state.messageInput[message.chatId];

        // Clear draft
        delete state.drafts[message.chatId];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.sendMessageError = action.payload as string;
      });

    // Get chats
    builder
      .addCase(getChats.pending, (state) => {
        state.chatsLoading = true;
        state.chatsError = null;
      })
      .addCase(getChats.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.chats = action.payload.chats;
        state.chatsMeta = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          totalCount: action.payload.pagination.total,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
        };

        // Update unread counts
        action.payload.chats.forEach(chat => {
          if (chat.unreadCount > 0) {
            state.unreadChats[chat.id] = chat.unreadCount;
          }
        });

        state.totalUnreadCount = Object.values(state.unreadChats).reduce((sum, count) => sum + count, 0);
      })
      .addCase(getChats.rejected, (state, action) => {
        state.chatsLoading = false;
        state.chatsError = action.payload as string;
      });

    // Load more chats
    builder
      .addCase(loadMoreChats.fulfilled, (state, action) => {
        state.chats = [...state.chats, ...action.payload.chats];
        state.chatsMeta = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          totalCount: action.payload.pagination.total,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
        };
      });

    // Get messages
    builder
      .addCase(getMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const chatId = action.payload.chatId;
        state.messages[chatId] = action.payload.messages;
        state.messagesMeta[chatId] = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
          oldestMessageId: action.payload.messages[0]?.id,
          newestMessageId: action.payload.messages[action.payload.messages.length - 1]?.id,
        };
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload as string;
      });

    // Load more messages
    builder
      .addCase(loadMoreMessages.fulfilled, (state, action) => {
        const chatId = action.payload.chatId;
        const existingMessages = state.messages[chatId] || [];
        const newMessages = action.payload.messages;

        // Prepend older messages
        state.messages[chatId] = [...newMessages, ...existingMessages];

        state.messagesMeta[chatId] = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
          oldestMessageId: newMessages[0]?.id || state.messagesMeta[chatId]?.oldestMessageId,
          newestMessageId: state.messagesMeta[chatId]?.newestMessageId || newMessages[newMessages.length - 1]?.id,
        };
      });

    // Mark messages as read
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        action.payload.readMessages.forEach(readMessage => {
          // Find and update message read status
          Object.values(state.messages).forEach(chatMessages => {
            const messageIndex = chatMessages.findIndex(m => m.id === readMessage.messageId);
            if (messageIndex >= 0) {
              const message = chatMessages[messageIndex];
              const existingRead = message.readBy.find(r => r.userId === 'currentUserId'); // Replace with actual user ID
              if (!existingRead) {
                message.readBy.push({
                  userId: 'currentUserId', // Replace with actual user ID
                  readAt: readMessage.readAt,
                });
              }
            }
          });
        });
      });

    // Create chat
    builder
      .addCase(createChat.pending, (state) => {
        state.creatingChat = true;
        state.createChatError = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.creatingChat = false;
        state.chats.unshift(action.payload.chat);

        if (action.payload.initialMessage) {
          const chatId = action.payload.chat.id;
          if (!state.messages[chatId]) {
            state.messages[chatId] = [];
          }
          state.messages[chatId].push(action.payload.initialMessage);
        }
      })
      .addCase(createChat.rejected, (state, action) => {
        state.creatingChat = false;
        state.createChatError = action.payload as string;
      });

    // Archive chat
    builder
      .addCase(archiveChat.pending, (state) => {
        state.archivingChat = true;
        state.archiveChatError = null;
      })
      .addCase(archiveChat.fulfilled, (state, action) => {
        state.archivingChat = false;
        const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.chat.id);
        if (chatIndex >= 0) {
          state.chats[chatIndex] = action.payload.chat;
        }
      })
      .addCase(archiveChat.rejected, (state, action) => {
        state.archivingChat = false;
        state.archiveChatError = action.payload as string;
      });

    // Mute chat
    builder
      .addCase(muteChat.fulfilled, (state, action) => {
        const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.chat.id);
        if (chatIndex >= 0) {
          state.chats[chatIndex] = action.payload.chat;
        }
      });

    // Delete chat
    builder
      .addCase(deleteChat.pending, (state) => {
        state.deletingChat = true;
        state.deleteChatError = null;
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.deletingChat = false;
        const deletedChatId = action.payload.deletedChatId;
        state.chats = state.chats.filter(chat => chat.id !== deletedChatId);
        delete state.messages[deletedChatId];
        delete state.messagesMeta[deletedChatId];
        delete state.messageInput[deletedChatId];
        delete state.drafts[deletedChatId];
        delete state.unreadChats[deletedChatId];
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.deletingChat = false;
        state.deleteChatError = action.payload as string;
      });

    // Edit message
    builder
      .addCase(editMessage.pending, (state) => {
        state.editingMessage = true;
        state.editMessageError = null;
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        state.editingMessage = false;
        const editedMessage = action.payload.editedMessage;
        if (state.messages[editedMessage.chatId]) {
          const messageIndex = state.messages[editedMessage.chatId].findIndex(m => m.id === editedMessage.id);
          if (messageIndex >= 0) {
            state.messages[editedMessage.chatId][messageIndex] = editedMessage;
          }
        }
      })
      .addCase(editMessage.rejected, (state, action) => {
        state.editingMessage = false;
        state.editMessageError = action.payload as string;
      });

    // Delete message
    builder
      .addCase(deleteMessage.pending, (state) => {
        state.deletingMessage = true;
        state.deleteMessageError = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.deletingMessage = false;
        const deletedMessageId = action.payload.deletedMessageId;

        // Remove message from all chats
        Object.keys(state.messages).forEach(chatId => {
          state.messages[chatId] = state.messages[chatId].filter(m => m.id !== deletedMessageId);
        });
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.deletingMessage = false;
        state.deleteMessageError = action.payload as string;
      });

    // Search messages
    builder
      .addCase(searchMessages.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.results;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });

    // Get message stats
    builder
      .addCase(getMessageStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(getMessageStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(getMessageStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload as string;
      });

    // Update notification settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.notificationSettings = action.payload.settings;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload as string;
      });

    // Upload attachment
    builder
      .addCase(uploadAttachment.pending, (state) => {
        state.uploadingFile = true;
        state.uploadError = null;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.uploadingFile = false;
        // The attachment would be handled when sending the message
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.uploadingFile = false;
        state.uploadError = action.payload as string;
      });
  },
});

export const {
  setConnectionStatus,
  setReconnecting,
  setCurrentChat,
  addMessage,
  updateMessage,
  removeMessage,
  setTypingIndicator,
  clearTypingIndicators,
  setMessageInput,
  clearMessageInput,
  saveDraft,
  clearDraft,
  setSelectedMessage,
  setReplyToMessage,
  setViewMode,
  setShowOnlineStatus,
  setEnableSoundNotifications,
  setSearchQuery,
  clearSearchResults,
  updateUnreadCount,
  clearUnreadCount,
  updateReadReceipts,
  updateMessageDeliveryStatus,
  setUploadProgress,
  clearUploadProgress,
  clearMessagingErrors,
  resetMessagingState,
} = messagingSlice.actions;

export default messagingSlice.reducer;