/**
 * Messaging Service
 *
 * This service handles all messaging functionality including
 * real-time messaging, chat management, read receipts, and notifications.
 */

import {
  Chat,
  Message,
  SendMessageRequest,
  SendMessageResponse,
  ChatsResponse,
  MessagesResponse,
  ChatParams,
  MessageParams,
  MessageEvent,
  TypingIndicator,
  MessageNotificationsResponse,
  MarkMessageReadRequest,
  MarkMessageReadResponse,
  CreateChatRequest,
  CreateChatResponse,
  ArchiveChatRequest,
  ArchiveChatResponse,
  MuteChatRequest,
  MuteChatResponse,
  DeleteChatRequest,
  DeleteChatResponse,
  EditMessageRequest,
  EditMessageResponse,
  DeleteMessageRequest,
  DeleteMessageResponse,
  MessageSearchParams,
  MessageSearchResponse,
  MessageStatsResponse,
  MessageNotificationSettings,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsResponse,
  UploadAttachmentRequest,
  UploadAttachmentResponse,
  ConnectionStatus,
  MessageDeliveryStatus,
} from '../types/messaging';

class MessagingService {
  private baseUrl: string;
  private websocket: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private connectionStatus: ConnectionStatus = { isConnected: false, reconnectAttempts: 0 };
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://api.digbiz.com';
    this.initializeWebSocket();
  }

  /**
   * Initialize WebSocket connection for real-time messaging
   */
  private async initializeWebSocket(): Promise<void> {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/messaging';
      const token = await this.getAuthToken();

      this.websocket = new WebSocket(`${wsUrl}?token=${token}`);

      this.websocket.onopen = () => {
        this.connectionStatus.isConnected = true;
        this.connectionStatus.reconnectAttempts = 0;
        this.connectionStatus.lastConnected = new Date().toISOString();
        this.emit('connection_status_changed', this.connectionStatus);
      };

      this.websocket.onclose = () => {
        this.connectionStatus.isConnected = false;
        this.emit('connection_status_changed', this.connectionStatus);
        this.handleReconnection();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('connection_error', error);
      };

      this.websocket.onmessage = (event) => {
        try {
          const messageEvent: MessageEvent = JSON.parse(event.data);
          this.handleWebSocketMessage(messageEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(messageEvent: MessageEvent): void {
    switch (messageEvent.type) {
      case 'message_sent':
        this.emit('message_received', messageEvent.data);
        break;
      case 'message_read':
        this.emit('message_read', messageEvent.data);
        break;
      case 'message_edited':
        this.emit('message_edited', messageEvent.data);
        break;
      case 'message_deleted':
        this.emit('message_deleted', messageEvent.data);
        break;
      case 'typing_start':
        this.emit('typing_start', messageEvent.data);
        break;
      case 'typing_stop':
        this.emit('typing_stop', messageEvent.data);
        break;
      default:
        console.log('Unknown message event type:', messageEvent.type);
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleReconnection(): void {
    if (this.connectionStatus.reconnectAttempts < 5) {
      this.connectionStatus.reconnectAttempts++;
      const delay = Math.pow(2, this.connectionStatus.reconnectAttempts) * 1000; // Exponential backoff

      setTimeout(() => {
        this.initializeWebSocket();
      }, delay);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Send a message
   */
  async sendMessage(messageRequest: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(messageRequest),
      });

      if (!response.ok) {
        throw new Error(`Send message failed: ${response.statusText}`);
      }

      const data: SendMessageResponse = await response.json();

      // Emit real-time event
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'message_sent',
          chatId: data.chat.id,
          messageId: data.sentMessage.id,
          timestamp: new Date().toISOString(),
        }));
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get user's chats
   */
  async getChats(params: ChatParams = {}): Promise<ChatsResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.includeArchived !== undefined) queryString.append('includeArchived', params.includeArchived.toString());
      if (params.search) queryString.append('search', params.search);
      if (params.sortBy) queryString.append('sortBy', params.sortBy);
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder);

      const response = await fetch(`${this.baseUrl}/messaging/chats?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get chats failed: ${response.statusText}`);
      }

      const data: ChatsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting chats:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getMessages(params: MessageParams): Promise<MessagesResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.before) queryString.append('before', params.before);
      if (params.after) queryString.append('after', params.after);
      if (params.search) queryString.append('search', params.search);

      const response = await fetch(`${this.baseUrl}/messaging/chats/${params.chatId}/messages?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get messages failed: ${response.statusText}`);
      }

      const data: MessagesResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(readRequest: MarkMessageReadRequest): Promise<MarkMessageReadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/messages/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(readRequest),
      });

      if (!response.ok) {
        throw new Error(`Mark messages as read failed: ${response.statusText}`);
      }

      const data: MarkMessageReadResponse = await response.json();

      // Emit real-time event for each read message
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        data.readMessages.forEach(readMessage => {
          this.websocket!.send(JSON.stringify({
            type: 'message_read',
            messageId: readMessage.messageId,
            timestamp: readMessage.readAt,
          }));
        });
      }

      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Create a new chat
   */
  async createChat(createRequest: CreateChatRequest): Promise<CreateChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        throw new Error(`Create chat failed: ${response.statusText}`);
      }

      const data: CreateChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Archive/unarchive a chat
   */
  async archiveChat(archiveRequest: ArchiveChatRequest): Promise<ArchiveChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/chats/${archiveRequest.chatId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ archive: archiveRequest.archive }),
      });

      if (!response.ok) {
        throw new Error(`Archive chat failed: ${response.statusText}`);
      }

      const data: ArchiveChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error archiving chat:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute a chat
   */
  async muteChat(muteRequest: MuteChatRequest): Promise<MuteChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/chats/${muteRequest.chatId}/mute`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          mute: muteRequest.mute,
          muteUntil: muteRequest.muteUntil,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mute chat failed: ${response.statusText}`);
      }

      const data: MuteChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error muting chat:', error);
      throw error;
    }
  }

  /**
   * Delete a chat
   */
  async deleteChat(deleteRequest: DeleteChatRequest): Promise<DeleteChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/chats/${deleteRequest.chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ deleteForAll: deleteRequest.deleteForAll }),
      });

      if (!response.ok) {
        throw new Error(`Delete chat failed: ${response.statusText}`);
      }

      const data: DeleteChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(editRequest: EditMessageRequest): Promise<EditMessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/messages/${editRequest.messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ content: editRequest.content }),
      });

      if (!response.ok) {
        throw new Error(`Edit message failed: ${response.statusText}`);
      }

      const data: EditMessageResponse = await response.json();

      // Emit real-time event
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'message_edited',
          messageId: data.editedMessage.id,
          chatId: data.editedMessage.chatId,
          timestamp: new Date().toISOString(),
        }));
      }

      return data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(deleteRequest: DeleteMessageRequest): Promise<DeleteMessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/messages/${deleteRequest.messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ deleteForAll: deleteRequest.deleteForAll }),
      });

      if (!response.ok) {
        throw new Error(`Delete message failed: ${response.statusText}`);
      }

      const data: DeleteMessageResponse = await response.json();

      // Emit real-time event
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'message_deleted',
          messageId: data.deletedMessageId,
          timestamp: new Date().toISOString(),
        }));
      }

      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(params: MessageSearchParams): Promise<MessageSearchResponse> {
    try {
      const queryString = new URLSearchParams();

      queryString.append('query', params.query);
      if (params.chatId) queryString.append('chatId', params.chatId);
      if (params.fromUserId) queryString.append('fromUserId', params.fromUserId);
      if (params.messageType) queryString.append('messageType', params.messageType);
      if (params.dateFrom) queryString.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryString.append('dateTo', params.dateTo);
      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/messaging/search?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Search messages failed: ${response.statusText}`);
      }

      const data: MessageSearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(): Promise<MessageStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get message stats failed: ${response.statusText}`);
      }

      const data: MessageStatsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting message stats:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(updateRequest: UpdateNotificationSettingsRequest): Promise<UpdateNotificationSettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging/notifications/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(updateRequest),
      });

      if (!response.ok) {
        throw new Error(`Update notification settings failed: ${response.statusText}`);
      }

      const data: UpdateNotificationSettingsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Upload file attachment
   */
  async uploadAttachment(uploadRequest: UploadAttachmentRequest): Promise<UploadAttachmentResponse> {
    try {
      const formData = new FormData();
      formData.append('chatId', uploadRequest.chatId);
      formData.append('file', {
        uri: uploadRequest.file.uri,
        name: uploadRequest.file.name,
        type: uploadRequest.file.type,
      } as any);

      const response = await fetch(`${this.baseUrl}/messaging/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload attachment failed: ${response.statusText}`);
      }

      const data: UploadAttachmentResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Start typing indicator
   */
  startTyping(chatId: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'typing_start',
        chatId: chatId,
        timestamp: new Date().toISOString(),
      }));

      // Clear existing timeout for this chat
      const existingTimeout = this.typingTimeouts.get(chatId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set timeout to stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(chatId);
      }, 3000);

      this.typingTimeouts.set(chatId, timeout);
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'typing_stop',
        chatId: chatId,
        timestamp: new Date().toISOString(),
      }));

      // Clear timeout
      const timeout = this.typingTimeouts.get(chatId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(chatId);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
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
   * Track messaging interaction for analytics
   */
  async trackMessagingInteraction(interaction: {
    chatId?: string;
    messageId?: string;
    action: 'send_message' | 'read_message' | 'edit_message' | 'delete_message' | 'create_chat' | 'archive_chat' | 'mute_chat';
    messageType?: string;
  }): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/messaging/interactions`, {
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
      console.error('Error tracking messaging interaction:', error);
      // Don't throw error for analytics tracking failure
    }
  }
}

export default new MessagingService();