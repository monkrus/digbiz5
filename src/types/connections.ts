/**
 * Connection Management Types and Interfaces
 *
 * This file contains all TypeScript types and interfaces related to user connections,
 * including connection requests, states, and relationship management.
 */

import { UserProfile } from './profile';
import { PaginationMeta } from './index';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  connectedUser: Pick<UserProfile,
    'id' | 'userId' | 'name' | 'title' | 'company' | 'profilePhoto' | 'location' | 'isVerified'>;
  status: ConnectionStatus;
  connectionDate: string;
  lastInteraction?: string;
  mutualConnections?: number;
  tags?: string[]; // custom tags for organizing connections
  notes?: string; // private notes about the connection
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: Pick<UserProfile,
    'id' | 'userId' | 'name' | 'title' | 'company' | 'profilePhoto' | 'location' | 'isVerified'>;
  toUser: Pick<UserProfile,
    'id' | 'userId' | 'name' | 'title' | 'company' | 'profilePhoto' | 'location' | 'isVerified'>;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string; // requests expire after a certain time
}

export interface ConnectionRequestData {
  toUserId: string;
  message?: string;
}

export interface ConnectionRequestResponse {
  success: boolean;
  message: string;
  request: ConnectionRequest;
}

export interface ConnectionsResponse {
  success: boolean;
  message: string;
  connections: Connection[];
  pagination: PaginationMeta;
}

export interface ConnectionRequestsResponse {
  success: boolean;
  message: string;
  requests: ConnectionRequest[];
  pagination: PaginationMeta;
}

export interface ConnectionParams {
  page?: number;
  limit?: number;
  search?: string; // search by name or company
  tags?: string[];
  sortBy?: 'name' | 'company' | 'date' | 'last_interaction';
  sortOrder?: 'asc' | 'desc';
}

export interface ConnectionRequestParams {
  page?: number;
  limit?: number;
  type?: 'sent' | 'received';
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  sortBy?: 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface MutualConnectionsResponse {
  success: boolean;
  message: string;
  mutualConnections: Connection[];
  count: number;
  pagination?: PaginationMeta;
}

export interface ConnectionStatsResponse {
  success: boolean;
  message: string;
  stats: ConnectionStats;
}

export interface ConnectionStats {
  totalConnections: number;
  pendingSent: number;
  pendingReceived: number;
  recentConnections: number; // connections made in last 30 days
  mutualConnectionsAvg: number;
  connectionsByIndustry: { [industry: string]: number };
  connectionsByLocation: { [location: string]: number };
}

// Connection actions
export interface ConnectionActionRequest {
  requestId: string;
  action: 'accept' | 'reject' | 'cancel';
  message?: string; // optional message when accepting/rejecting
}

export interface ConnectionActionResponse {
  success: boolean;
  message: string;
  request: ConnectionRequest;
}

// Connection removal and blocking
export interface ConnectionRemovalRequest {
  connectionId: string;
  reason?: string;
  blockUser?: boolean; // also block the user
}

export interface ConnectionRemovalResponse {
  success: boolean;
  message: string;
  removedConnection: Connection;
}

export interface BlockUserRequest {
  userId: string;
  reason?: string;
}

export interface BlockUserResponse {
  success: boolean;
  message: string;
  blockedUser: {
    id: string;
    userId: string;
    name: string;
  };
}

export interface UnblockUserRequest {
  userId: string;
}

export interface UnblockUserResponse {
  success: boolean;
  message: string;
  unblockedUser: {
    id: string;
    userId: string;
    name: string;
  };
}

export interface BlockedUsersResponse {
  success: boolean;
  message: string;
  blockedUsers: Array<{
    id: string;
    userId: string;
    name: string;
    profilePhoto?: string;
    blockedAt: string;
    reason?: string;
  }>;
  pagination: PaginationMeta;
}

// Connection notifications
export interface ConnectionNotification {
  id: string;
  userId: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_rejected' | 'connection_removed';
  fromUser: Pick<UserProfile, 'id' | 'userId' | 'name' | 'profilePhoto'>;
  message?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: {
    requestId?: string;
    connectionId?: string;
  };
}

export interface ConnectionNotificationsResponse {
  success: boolean;
  message: string;
  notifications: ConnectionNotification[];
  unreadCount: number;
  pagination: PaginationMeta;
}

export interface NotificationReadRequest {
  notificationIds: string[];
}

export interface NotificationReadResponse {
  success: boolean;
  message: string;
  readNotifications: string[];
}

// Connection analytics
export interface ConnectionActivity {
  id: string;
  userId: string;
  type: 'sent_request' | 'accepted_request' | 'rejected_request' | 'removed_connection' | 'blocked_user';
  targetUserId: string;
  targetUser: Pick<UserProfile, 'id' | 'name' | 'company'>;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ConnectionActivityResponse {
  success: boolean;
  message: string;
  activities: ConnectionActivity[];
  pagination: PaginationMeta;
}

// Connection suggestions based on existing connections
export interface ConnectionSuggestionFromMutuals {
  suggestedUser: Pick<UserProfile,
    'id' | 'userId' | 'name' | 'title' | 'company' | 'profilePhoto' | 'location' | 'isVerified'>;
  mutualConnections: Array<Pick<UserProfile, 'id' | 'name' | 'company'>>;
  mutualCount: number;
  suggestionScore: number;
}

export interface ConnectionSuggestionsFromMutualsResponse {
  success: boolean;
  message: string;
  suggestions: ConnectionSuggestionFromMutuals[];
  pagination: PaginationMeta;
}

// Connection export/import
export interface ConnectionExportRequest {
  format: 'json' | 'csv' | 'vcard';
  includeDetails?: boolean;
}

export interface ConnectionExportResponse {
  success: boolean;
  message: string;
  exportUrl: string;
  expiresAt: string;
}

// Connection search and filtering
export interface ConnectionSearchFilters {
  name?: string;
  company?: string;
  title?: string;
  location?: string;
  tags?: string[];
  industry?: string;
  hasNotes?: boolean;
  lastInteractionBefore?: string;
  lastInteractionAfter?: string;
}

export interface ConnectionSearchParams {
  query?: string;
  filters?: ConnectionSearchFilters;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'company' | 'date' | 'last_interaction';
  sortOrder?: 'asc' | 'desc';
}