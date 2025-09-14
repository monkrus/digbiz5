/**
 * Messaging Types and Interfaces
 *
 * This file contains all TypeScript types and interfaces related to messaging,
 * including chats, messages, notifications, and real-time communication.
 */

import { UserProfile } from './profile';
import { PaginationMeta } from './index';

export interface Chat {
  id: string;
  participants: string[]; // user IDs
  participantProfiles: Array<Pick<UserProfile,
    'id' | 'userId' | 'name' | 'profilePhoto' | 'title' | 'company' | 'isVerified'>>;
  type: 'direct' | 'group'; // for now, only direct messaging
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    connectionId?: string; // if chat started from a connection
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderProfile: Pick<UserProfile, 'id' | 'userId' | 'name' | 'profilePhoto'>;
  content: string;
  type: 'text' | 'image' | 'file' | 'link' | 'contact' | 'system';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    linkTitle?: string;
    linkDescription?: string;
    linkImage?: string;
    contactData?: any;
  };
  readBy: MessageRead[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  replyToMessageId?: string;
  replyToMessage?: Pick<Message, 'id' | 'content' | 'senderProfile' | 'type'>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRead {
  userId: string;
  readAt: string;
}

export interface SendMessageRequest {
  chatId?: string; // if not provided, will create new chat
  recipientUserId?: string; // required if chatId not provided
  content: string;
  type?: 'text' | 'image' | 'file' | 'link' | 'contact';
  replyToMessageId?: string;
  metadata?: Message['metadata'];
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  sentMessage: Message;
  chat: Chat; // includes the chat info (new or existing)
}

export interface ChatsResponse {
  success: boolean;
  message: string;
  chats: Chat[];
  pagination: PaginationMeta;
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  messages: Message[];
  pagination: PaginationMeta;
}

export interface ChatParams {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
  search?: string; // search by participant name or last message
  sortBy?: 'lastMessage' | 'name' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface MessageParams {
  chatId: string;
  page?: number;
  limit?: number;
  before?: string; // message ID - get messages before this message
  after?: string; // message ID - get messages after this message
  search?: string; // search message content
}

// Real-time messaging events
export interface MessageEvent {
  type: 'message_sent' | 'message_read' | 'message_edited' | 'message_deleted' | 'typing_start' | 'typing_stop';
  chatId: string;
  userId: string;
  messageId?: string;
  data?: any;
  timestamp: string;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userProfile: Pick<UserProfile, 'id' | 'name' | 'profilePhoto'>;
  isTyping: boolean;
  timestamp: string;
}

// Message notifications
export interface MessageNotification {
  id: string;
  userId: string;
  type: 'new_message' | 'new_chat' | 'message_read';
  chatId: string;
  messageId?: string;
  fromUser: Pick<UserProfile, 'id' | 'userId' | 'name' | 'profilePhoto'>;
  content?: string; // preview of message content
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface MessageNotificationsResponse {
  success: boolean;
  message: string;
  notifications: MessageNotification[];
  unreadCount: number;
  pagination: PaginationMeta;
}

// Message read receipts
export interface MarkMessageReadRequest {
  messageIds: string[];
}

export interface MarkMessageReadResponse {
  success: boolean;
  message: string;
  readMessages: Array<{
    messageId: string;
    readAt: string;
  }>;
}

// Chat management
export interface CreateChatRequest {
  participantUserIds: string[];
  initialMessage?: string;
}

export interface CreateChatResponse {
  success: boolean;
  message: string;
  chat: Chat;
  initialMessage?: Message;
}

export interface ArchiveChatRequest {
  chatId: string;
  archive: boolean;
}

export interface ArchiveChatResponse {
  success: boolean;
  message: string;
  chat: Chat;
}

export interface MuteChatRequest {
  chatId: string;
  mute: boolean;
  muteUntil?: string; // ISO string, if not provided, mute indefinitely
}

export interface MuteChatResponse {
  success: boolean;
  message: string;
  chat: Chat;
}

export interface DeleteChatRequest {
  chatId: string;
  deleteForAll?: boolean; // if true, delete for all participants
}

export interface DeleteChatResponse {
  success: boolean;
  message: string;
  deletedChatId: string;
}

// Message editing and deletion
export interface EditMessageRequest {
  messageId: string;
  content: string;
}

export interface EditMessageResponse {
  success: boolean;
  message: string;
  editedMessage: Message;
}

export interface DeleteMessageRequest {
  messageId: string;
  deleteForAll?: boolean; // if true, delete for all participants
}

export interface DeleteMessageResponse {
  success: boolean;
  message: string;
  deletedMessageId: string;
}

// Message search
export interface MessageSearchParams {
  query: string;
  chatId?: string; // search within specific chat
  fromUserId?: string; // messages from specific user
  messageType?: Message['type'];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface MessageSearchResponse {
  success: boolean;
  message: string;
  results: Array<{
    message: Message;
    chat: Pick<Chat, 'id' | 'participantProfiles'>;
    matchHighlight?: string; // highlighted search match
  }>;
  pagination: PaginationMeta;
  searchMeta: {
    query: string;
    totalResults: number;
    searchTime: number;
  };
}

// Message analytics
export interface MessageStats {
  totalMessages: number;
  totalChats: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageResponseTime: number; // in minutes
  mostActiveChats: Array<{
    chat: Pick<Chat, 'id' | 'participantProfiles'>;
    messageCount: number;
  }>;
  messagesByType: { [type: string]: number };
}

export interface MessageStatsResponse {
  success: boolean;
  message: string;
  stats: MessageStats;
}

// Push notification settings for messages
export interface MessageNotificationSettings {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  muteAllChats: boolean;
  mutedChats: string[]; // chat IDs
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showMessagePreview: boolean;
}

export interface UpdateNotificationSettingsRequest {
  settings: Partial<MessageNotificationSettings>;
}

export interface UpdateNotificationSettingsResponse {
  success: boolean;
  message: string;
  settings: MessageNotificationSettings;
}

// File and media sharing
export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // for audio/video
  };
  uploadedAt: string;
}

export interface UploadAttachmentRequest {
  chatId: string;
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
}

export interface UploadAttachmentResponse {
  success: boolean;
  message: string;
  attachment: MessageAttachment;
  uploadUrl?: string; // if file needs to be uploaded to external service
}

// WebSocket/Real-time connection status
export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: string;
  reconnectAttempts: number;
  latency?: number; // in milliseconds
}

// Message delivery status
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageDeliveryInfo {
  messageId: string;
  status: MessageDeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
}