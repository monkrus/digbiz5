/**
 * Connection Service
 *
 * This service handles all connection-related functionality including
 * sending/accepting connection requests, managing connection states,
 * and handling blocking/unblocking users.
 */

import {
  Connection,
  ConnectionRequest,
  ConnectionRequestData,
  ConnectionRequestResponse,
  ConnectionsResponse,
  ConnectionRequestsResponse,
  ConnectionParams,
  ConnectionRequestParams,
  MutualConnectionsResponse,
  ConnectionStatsResponse,
  ConnectionActionRequest,
  ConnectionActionResponse,
  ConnectionRemovalRequest,
  ConnectionRemovalResponse,
  BlockUserRequest,
  BlockUserResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  BlockedUsersResponse,
  ConnectionNotificationsResponse,
  NotificationReadRequest,
  NotificationReadResponse,
  ConnectionActivityResponse,
  ConnectionSuggestionsFromMutualsResponse,
  ConnectionExportRequest,
  ConnectionExportResponse,
  ConnectionSearchParams,
  ConnectionStatus,
} from '../types/connections';

class ConnectionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://api.digbiz.com';
  }

  /**
   * Send a connection request to another user
   */
  async sendConnectionRequest(requestData: ConnectionRequestData): Promise<ConnectionRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Send connection request failed: ${response.statusText}`);
      }

      const data: ConnectionRequestResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  /**
   * Handle connection request (accept, reject, cancel)
   */
  async handleConnectionRequest(actionRequest: ConnectionActionRequest): Promise<ConnectionActionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/requests/${actionRequest.requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          action: actionRequest.action,
          message: actionRequest.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Handle connection request failed: ${response.statusText}`);
      }

      const data: ConnectionActionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling connection request:', error);
      throw error;
    }
  }

  /**
   * Get user's connections
   */
  async getConnections(params: ConnectionParams = {}): Promise<ConnectionsResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.search) queryString.append('search', params.search);
      if (params.sortBy) queryString.append('sortBy', params.sortBy);
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder);

      if (params.tags) {
        params.tags.forEach(tag => queryString.append('tags[]', tag));
      }

      const response = await fetch(`${this.baseUrl}/connections?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get connections failed: ${response.statusText}`);
      }

      const data: ConnectionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting connections:', error);
      throw error;
    }
  }

  /**
   * Get connection requests (sent or received)
   */
  async getConnectionRequests(params: ConnectionRequestParams = {}): Promise<ConnectionRequestsResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.type) queryString.append('type', params.type);
      if (params.status) queryString.append('status', params.status);
      if (params.sortBy) queryString.append('sortBy', params.sortBy);
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder);

      const response = await fetch(`${this.baseUrl}/connections/requests?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get connection requests failed: ${response.statusText}`);
      }

      const data: ConnectionRequestsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting connection requests:', error);
      throw error;
    }
  }

  /**
   * Get mutual connections with another user
   */
  async getMutualConnections(userId: string, limit: number = 10): Promise<MutualConnectionsResponse> {
    try {
      const queryString = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/connections/mutual/${userId}?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get mutual connections failed: ${response.statusText}`);
      }

      const data: MutualConnectionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(): Promise<ConnectionStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get connection stats failed: ${response.statusText}`);
      }

      const data: ConnectionStatsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting connection stats:', error);
      throw error;
    }
  }

  /**
   * Remove a connection
   */
  async removeConnection(removalRequest: ConnectionRemovalRequest): Promise<ConnectionRemovalResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/${removalRequest.connectionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          reason: removalRequest.reason,
          blockUser: removalRequest.blockUser,
        }),
      });

      if (!response.ok) {
        throw new Error(`Remove connection failed: ${response.statusText}`);
      }

      const data: ConnectionRemovalResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockRequest: BlockUserRequest): Promise<BlockUserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(blockRequest),
      });

      if (!response.ok) {
        throw new Error(`Block user failed: ${response.statusText}`);
      }

      const data: BlockUserResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(unblockRequest: UnblockUserRequest): Promise<UnblockUserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(unblockRequest),
      });

      if (!response.ok) {
        throw new Error(`Unblock user failed: ${response.statusText}`);
      }

      const data: UnblockUserResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(page: number = 1, limit: number = 20): Promise<BlockedUsersResponse> {
    try {
      const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/connections/blocked?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get blocked users failed: ${response.statusText}`);
      }

      const data: BlockedUsersResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting blocked users:', error);
      throw error;
    }
  }

  /**
   * Get connection notifications
   */
  async getConnectionNotifications(page: number = 1, limit: number = 20): Promise<ConnectionNotificationsResponse> {
    try {
      const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/connections/notifications?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get connection notifications failed: ${response.statusText}`);
      }

      const data: ConnectionNotificationsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting connection notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(readRequest: NotificationReadRequest): Promise<NotificationReadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/notifications/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(readRequest),
      });

      if (!response.ok) {
        throw new Error(`Mark notifications as read failed: ${response.statusText}`);
      }

      const data: NotificationReadResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get connection activity history
   */
  async getConnectionActivity(page: number = 1, limit: number = 20): Promise<ConnectionActivityResponse> {
    try {
      const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/connections/activity?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get connection activity failed: ${response.statusText}`);
      }

      const data: ConnectionActivityResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting connection activity:', error);
      throw error;
    }
  }

  /**
   * Get connection suggestions based on mutual connections
   */
  async getConnectionSuggestionsFromMutuals(page: number = 1, limit: number = 10): Promise<ConnectionSuggestionsFromMutualsResponse> {
    try {
      const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/connections/suggestions/mutuals?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get mutual connection suggestions failed: ${response.statusText}`);
      }

      const data: ConnectionSuggestionsFromMutualsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting mutual connection suggestions:', error);
      throw error;
    }
  }

  /**
   * Export connections
   */
  async exportConnections(exportRequest: ConnectionExportRequest): Promise<ConnectionExportResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(exportRequest),
      });

      if (!response.ok) {
        throw new Error(`Export connections failed: ${response.statusText}`);
      }

      const data: ConnectionExportResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error exporting connections:', error);
      throw error;
    }
  }

  /**
   * Search connections with advanced filters
   */
  async searchConnections(params: ConnectionSearchParams): Promise<ConnectionsResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.query) queryString.append('query', params.query);
      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.sortBy) queryString.append('sortBy', params.sortBy);
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder);

      // Handle filters
      if (params.filters) {
        if (params.filters.name) queryString.append('filters[name]', params.filters.name);
        if (params.filters.company) queryString.append('filters[company]', params.filters.company);
        if (params.filters.title) queryString.append('filters[title]', params.filters.title);
        if (params.filters.location) queryString.append('filters[location]', params.filters.location);
        if (params.filters.industry) queryString.append('filters[industry]', params.filters.industry);
        if (params.filters.hasNotes !== undefined) queryString.append('filters[hasNotes]', params.filters.hasNotes.toString());
        if (params.filters.lastInteractionBefore) queryString.append('filters[lastInteractionBefore]', params.filters.lastInteractionBefore);
        if (params.filters.lastInteractionAfter) queryString.append('filters[lastInteractionAfter]', params.filters.lastInteractionAfter);

        if (params.filters.tags) {
          params.filters.tags.forEach(tag => queryString.append('filters[tags][]', tag));
        }
      }

      const response = await fetch(`${this.baseUrl}/connections/search?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Search connections failed: ${response.statusText}`);
      }

      const data: ConnectionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching connections:', error);
      throw error;
    }
  }

  /**
   * Update connection (add tags, notes)
   */
  async updateConnection(connectionId: string, updates: { tags?: string[]; notes?: string }): Promise<{ success: boolean; message: string; connection: Connection }> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Update connection failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  }

  /**
   * Get connection status with another user
   */
  async getConnectionStatus(userId: string): Promise<{ success: boolean; status: ConnectionStatus; connection?: Connection; request?: ConnectionRequest }> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get connection status failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting connection status:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string> {
    // This would typically get the token from AsyncStorage or a secure storage solution
    // For now, return a placeholder
    return 'auth_token_placeholder';
  }

  /**
   * Track connection interaction for analytics
   */
  async trackConnectionInteraction(interaction: {
    targetUserId?: string;
    requestId?: string;
    connectionId?: string;
    action: 'view_request' | 'send_request' | 'accept_request' | 'reject_request' | 'remove_connection' | 'block_user';
  }): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/connections/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...interaction,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error tracking connection interaction:', error);
      // Don't throw error for analytics tracking failure
    }
  }
}

export default new ConnectionService();