/**
 * Connection Redux Slice
 *
 * Manages connection state including connection requests, connections list,
 * blocking/unblocking, and connection notifications.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Connection,
  ConnectionRequest,
  ConnectionRequestData,
  ConnectionParams,
  ConnectionRequestParams,
  ConnectionStats,
  ConnectionNotification,
  ConnectionActivity,
  ConnectionActionRequest,
  ConnectionRemovalRequest,
  BlockUserRequest,
  UnblockUserRequest,
  ConnectionStatus,
} from '../../types/connections';
import connectionService from '../../services/connectionService';

interface ConnectionState {
  // Connections
  connections: Connection[];
  connectionsLoading: boolean;
  connectionsError: string | null;
  connectionsMeta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
  } | null;

  // Connection requests
  connectionRequests: ConnectionRequest[];
  requestsLoading: boolean;
  requestsError: string | null;
  requestsMeta: {
    sent: number;
    received: number;
    pending: number;
  };

  // Connection stats
  stats: ConnectionStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Notifications
  notifications: ConnectionNotification[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  unreadNotificationCount: number;

  // Activity
  activity: ConnectionActivity[];
  activityLoading: boolean;
  activityError: string | null;

  // Blocked users
  blockedUsers: Array<{
    id: string;
    userId: string;
    name: string;
    profilePhoto?: string;
    blockedAt: string;
    reason?: string;
  }>;
  blockedUsersLoading: boolean;
  blockedUsersError: string | null;

  // Mutual connections
  mutualConnections: { [userId: string]: Connection[] };
  mutualConnectionsLoading: boolean;
  mutualConnectionsError: string | null;

  // Connection suggestions from mutuals
  mutualSuggestions: Array<{
    suggestedUser: any;
    mutualConnections: any[];
    mutualCount: number;
    suggestionScore: number;
  }>;
  mutualSuggestionsLoading: boolean;
  mutualSuggestionsError: string | null;

  // UI state
  selectedConnection: Connection | null;
  selectedRequest: ConnectionRequest | null;
  searchQuery: string;
  filters: {
    tags?: string[];
    hasNotes?: boolean;
    industry?: string;
  };
  viewMode: 'list' | 'grid';
  activeTab: 'connections' | 'requests' | 'suggestions' | 'blocked';

  // Connection status cache (for other users)
  connectionStatusCache: { [userId: string]: ConnectionStatus };

  // Action states
  sendingRequest: boolean;
  sendRequestError: string | null;
  handlingRequest: boolean;
  handleRequestError: string | null;
  removingConnection: boolean;
  removeConnectionError: string | null;
  blockingUser: boolean;
  blockUserError: string | null;
}

const initialState: ConnectionState = {
  connections: [],
  connectionsLoading: false,
  connectionsError: null,
  connectionsMeta: null,
  connectionRequests: [],
  requestsLoading: false,
  requestsError: null,
  requestsMeta: { sent: 0, received: 0, pending: 0 },
  stats: null,
  statsLoading: false,
  statsError: null,
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  unreadNotificationCount: 0,
  activity: [],
  activityLoading: false,
  activityError: null,
  blockedUsers: [],
  blockedUsersLoading: false,
  blockedUsersError: null,
  mutualConnections: {},
  mutualConnectionsLoading: false,
  mutualConnectionsError: null,
  mutualSuggestions: [],
  mutualSuggestionsLoading: false,
  mutualSuggestionsError: null,
  selectedConnection: null,
  selectedRequest: null,
  searchQuery: '',
  filters: {},
  viewMode: 'list',
  activeTab: 'connections',
  connectionStatusCache: {},
  sendingRequest: false,
  sendRequestError: null,
  handlingRequest: false,
  handleRequestError: null,
  removingConnection: false,
  removeConnectionError: null,
  blockingUser: false,
  blockUserError: null,
};

// Async thunks
export const sendConnectionRequest = createAsyncThunk(
  'connections/sendConnectionRequest',
  async (requestData: ConnectionRequestData, { rejectWithValue }) => {
    try {
      const response = await connectionService.sendConnectionRequest(requestData);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const handleConnectionRequest = createAsyncThunk(
  'connections/handleConnectionRequest',
  async (actionRequest: ConnectionActionRequest, { rejectWithValue }) => {
    try {
      const response = await connectionService.handleConnectionRequest(actionRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getConnections = createAsyncThunk(
  'connections/getConnections',
  async (params: ConnectionParams = {}, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnections(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadMoreConnections = createAsyncThunk(
  'connections/loadMoreConnections',
  async (params: ConnectionParams, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnections(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getConnectionRequests = createAsyncThunk(
  'connections/getConnectionRequests',
  async (params: ConnectionRequestParams = {}, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnectionRequests(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getConnectionStats = createAsyncThunk(
  'connections/getConnectionStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnectionStats();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getMutualConnections = createAsyncThunk(
  'connections/getMutualConnections',
  async (params: { userId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await connectionService.getMutualConnections(params.userId, params.limit);
      return { userId: params.userId, ...response };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const removeConnection = createAsyncThunk(
  'connections/removeConnection',
  async (removalRequest: ConnectionRemovalRequest, { rejectWithValue }) => {
    try {
      const response = await connectionService.removeConnection(removalRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const blockUser = createAsyncThunk(
  'connections/blockUser',
  async (blockRequest: BlockUserRequest, { rejectWithValue }) => {
    try {
      const response = await connectionService.blockUser(blockRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const unblockUser = createAsyncThunk(
  'connections/unblockUser',
  async (unblockRequest: UnblockUserRequest, { rejectWithValue }) => {
    try {
      const response = await connectionService.unblockUser(unblockRequest);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getBlockedUsers = createAsyncThunk(
  'connections/getBlockedUsers',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await connectionService.getBlockedUsers(params.page, params.limit);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getConnectionNotifications = createAsyncThunk(
  'connections/getConnectionNotifications',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnectionNotifications(params.page, params.limit);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  'connections/markNotificationsAsRead',
  async (notificationIds: string[], { rejectWithValue }) => {
    try {
      const response = await connectionService.markNotificationsAsRead({ notificationIds });
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getConnectionActivity = createAsyncThunk(
  'connections/getConnectionActivity',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnectionActivity(params.page, params.limit);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getMutualConnectionSuggestions = createAsyncThunk(
  'connections/getMutualConnectionSuggestions',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnectionSuggestionsFromMutuals(params.page, params.limit);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getConnectionStatus = createAsyncThunk(
  'connections/getConnectionStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await connectionService.getConnectionStatus(userId);
      return { userId, ...response };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const searchConnections = createAsyncThunk(
  'connections/searchConnections',
  async (params: { query?: string; filters?: any; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await connectionService.searchConnections(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateConnection = createAsyncThunk(
  'connections/updateConnection',
  async (params: { connectionId: string; updates: { tags?: string[]; notes?: string } }, { rejectWithValue }) => {
    try {
      const response = await connectionService.updateConnection(params.connectionId, params.updates);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const connectionSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedConnection: (state, action: PayloadAction<Connection | null>) => {
      state.selectedConnection = action.payload;
    },
    setSelectedRequest: (state, action: PayloadAction<ConnectionRequest | null>) => {
      state.selectedRequest = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'list' | 'grid'>) => {
      state.viewMode = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<'connections' | 'requests' | 'suggestions' | 'blocked'>) => {
      state.activeTab = action.payload;
    },
    clearConnectionError: (state) => {
      state.connectionsError = null;
      state.requestsError = null;
      state.sendRequestError = null;
      state.handleRequestError = null;
      state.removeConnectionError = null;
      state.blockUserError = null;
    },
    updateConnectionRequestInList: (state, action: PayloadAction<ConnectionRequest>) => {
      const index = state.connectionRequests.findIndex(req => req.id === action.payload.id);
      if (index >= 0) {
        state.connectionRequests[index] = action.payload;
      }
    },
    removeConnectionRequestFromList: (state, action: PayloadAction<string>) => {
      state.connectionRequests = state.connectionRequests.filter(req => req.id !== action.payload);
    },
    addNewConnectionToList: (state, action: PayloadAction<Connection>) => {
      state.connections = [action.payload, ...state.connections];
    },
    removeConnectionFromList: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter(conn => conn.id !== action.payload);
    },
    updateNotificationReadStatus: (state, action: PayloadAction<string[]>) => {
      state.notifications = state.notifications.map(notification =>
        action.payload.includes(notification.id)
          ? { ...notification, isRead: true }
          : notification
      );
      state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - action.payload.length);
    },
    cacheConnectionStatus: (state, action: PayloadAction<{ userId: string; status: ConnectionStatus }>) => {
      state.connectionStatusCache[action.payload.userId] = action.payload.status;
    },
    resetConnectionState: () => initialState,
  },
  extraReducers: (builder) => {
    // Send connection request
    builder
      .addCase(sendConnectionRequest.pending, (state) => {
        state.sendingRequest = true;
        state.sendRequestError = null;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.sendingRequest = false;
        state.connectionRequests = [action.payload.request, ...state.connectionRequests];
        state.requestsMeta.sent += 1;
        state.requestsMeta.pending += 1;
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.sendingRequest = false;
        state.sendRequestError = action.payload as string;
      });

    // Handle connection request
    builder
      .addCase(handleConnectionRequest.pending, (state) => {
        state.handlingRequest = true;
        state.handleRequestError = null;
      })
      .addCase(handleConnectionRequest.fulfilled, (state, action) => {
        state.handlingRequest = false;

        // Update the request in the list
        const requestIndex = state.connectionRequests.findIndex(req => req.id === action.payload.request.id);
        if (requestIndex >= 0) {
          state.connectionRequests[requestIndex] = action.payload.request;
        }

        // If accepted, update counts and potentially add to connections
        if (action.payload.request.status === 'accepted') {
          state.requestsMeta.pending = Math.max(0, state.requestsMeta.pending - 1);
        }
      })
      .addCase(handleConnectionRequest.rejected, (state, action) => {
        state.handlingRequest = false;
        state.handleRequestError = action.payload as string;
      });

    // Get connections
    builder
      .addCase(getConnections.pending, (state) => {
        state.connectionsLoading = true;
        state.connectionsError = null;
      })
      .addCase(getConnections.fulfilled, (state, action) => {
        state.connectionsLoading = false;
        state.connections = action.payload.connections;
        state.connectionsMeta = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          totalCount: action.payload.pagination.total,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
        };
      })
      .addCase(getConnections.rejected, (state, action) => {
        state.connectionsLoading = false;
        state.connectionsError = action.payload as string;
      });

    // Load more connections
    builder
      .addCase(loadMoreConnections.fulfilled, (state, action) => {
        state.connections = [...state.connections, ...action.payload.connections];
        state.connectionsMeta = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          totalCount: action.payload.pagination.total,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
        };
      });

    // Get connection requests
    builder
      .addCase(getConnectionRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(getConnectionRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.connectionRequests = action.payload.requests;

        // Update request counts
        state.requestsMeta.sent = action.payload.requests.filter(req => req.status === 'pending').length;
        state.requestsMeta.received = action.payload.requests.filter(req => req.status === 'pending').length;
        state.requestsMeta.pending = state.requestsMeta.sent + state.requestsMeta.received;
      })
      .addCase(getConnectionRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload as string;
      });

    // Get connection stats
    builder
      .addCase(getConnectionStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(getConnectionStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(getConnectionStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload as string;
      });

    // Get mutual connections
    builder
      .addCase(getMutualConnections.pending, (state) => {
        state.mutualConnectionsLoading = true;
        state.mutualConnectionsError = null;
      })
      .addCase(getMutualConnections.fulfilled, (state, action) => {
        state.mutualConnectionsLoading = false;
        state.mutualConnections[action.payload.userId] = action.payload.mutualConnections;
      })
      .addCase(getMutualConnections.rejected, (state, action) => {
        state.mutualConnectionsLoading = false;
        state.mutualConnectionsError = action.payload as string;
      });

    // Remove connection
    builder
      .addCase(removeConnection.pending, (state) => {
        state.removingConnection = true;
        state.removeConnectionError = null;
      })
      .addCase(removeConnection.fulfilled, (state, action) => {
        state.removingConnection = false;
        state.connections = state.connections.filter(conn => conn.id !== action.payload.removedConnection.id);
      })
      .addCase(removeConnection.rejected, (state, action) => {
        state.removingConnection = false;
        state.removeConnectionError = action.payload as string;
      });

    // Block user
    builder
      .addCase(blockUser.pending, (state) => {
        state.blockingUser = true;
        state.blockUserError = null;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.blockingUser = false;
        state.blockedUsers = [action.payload.blockedUser, ...state.blockedUsers];
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.blockingUser = false;
        state.blockUserError = action.payload as string;
      });

    // Unblock user
    builder
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter(user => user.userId !== action.payload.unblockedUser.userId);
      });

    // Get blocked users
    builder
      .addCase(getBlockedUsers.pending, (state) => {
        state.blockedUsersLoading = true;
        state.blockedUsersError = null;
      })
      .addCase(getBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsersLoading = false;
        state.blockedUsers = action.payload.blockedUsers;
      })
      .addCase(getBlockedUsers.rejected, (state, action) => {
        state.blockedUsersLoading = false;
        state.blockedUsersError = action.payload as string;
      });

    // Get connection notifications
    builder
      .addCase(getConnectionNotifications.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(getConnectionNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadNotificationCount = action.payload.unreadCount;
      })
      .addCase(getConnectionNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError = action.payload as string;
      });

    // Mark notifications as read
    builder
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const readIds = action.payload.readNotifications;
        state.notifications = state.notifications.map(notification =>
          readIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        );
        state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - readIds.length);
      });

    // Get connection activity
    builder
      .addCase(getConnectionActivity.pending, (state) => {
        state.activityLoading = true;
        state.activityError = null;
      })
      .addCase(getConnectionActivity.fulfilled, (state, action) => {
        state.activityLoading = false;
        state.activity = action.payload.activities;
      })
      .addCase(getConnectionActivity.rejected, (state, action) => {
        state.activityLoading = false;
        state.activityError = action.payload as string;
      });

    // Get mutual connection suggestions
    builder
      .addCase(getMutualConnectionSuggestions.pending, (state) => {
        state.mutualSuggestionsLoading = true;
        state.mutualSuggestionsError = null;
      })
      .addCase(getMutualConnectionSuggestions.fulfilled, (state, action) => {
        state.mutualSuggestionsLoading = false;
        state.mutualSuggestions = action.payload.suggestions;
      })
      .addCase(getMutualConnectionSuggestions.rejected, (state, action) => {
        state.mutualSuggestionsLoading = false;
        state.mutualSuggestionsError = action.payload as string;
      });

    // Get connection status
    builder
      .addCase(getConnectionStatus.fulfilled, (state, action) => {
        state.connectionStatusCache[action.payload.userId] = action.payload.status;
      });

    // Search connections
    builder
      .addCase(searchConnections.fulfilled, (state, action) => {
        state.connections = action.payload.connections;
        state.connectionsMeta = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.totalPages,
          totalCount: action.payload.pagination.total,
          hasNextPage: action.payload.pagination.page < action.payload.pagination.totalPages,
        };
      });

    // Update connection
    builder
      .addCase(updateConnection.fulfilled, (state, action) => {
        const connectionIndex = state.connections.findIndex(conn => conn.id === action.payload.connection.id);
        if (connectionIndex >= 0) {
          state.connections[connectionIndex] = action.payload.connection;
        }
      });
  },
});

export const {
  setSearchQuery,
  setFilters,
  updateFilters,
  clearFilters,
  setSelectedConnection,
  setSelectedRequest,
  setViewMode,
  setActiveTab,
  clearConnectionError,
  updateConnectionRequestInList,
  removeConnectionRequestFromList,
  addNewConnectionToList,
  removeConnectionFromList,
  updateNotificationReadStatus,
  cacheConnectionStatus,
  resetConnectionState,
} = connectionSlice.actions;

export default connectionSlice.reducer;