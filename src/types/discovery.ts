/**
 * User Discovery Types and Interfaces
 *
 * This file contains all TypeScript types and interfaces related to user discovery,
 * including search filters, discovery algorithms, and user matching.
 */

import { UserProfile } from './profile';
import { PaginationMeta } from './index';

export interface UserDiscoveryFilters {
  name?: string;
  company?: string;
  industry?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number; // in kilometers
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  startupStage?: StartupStage;
  skills?: string[];
  isRecent?: boolean; // joined recently
  isVerified?: boolean;
  isPublic?: boolean;
}

export type StartupStage =
  | 'idea'
  | 'mvp'
  | 'early-stage'
  | 'growth'
  | 'scale-up'
  | 'mature'
  | 'exit';

export interface UserDiscoveryParams {
  query?: string;
  filters?: UserDiscoveryFilters;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'name' | 'distance' | 'recent' | 'connections';
  sortOrder?: 'asc' | 'desc';
}

export interface DiscoveredUser extends Pick<UserProfile,
  'id' | 'userId' | 'name' | 'title' | 'company' | 'bio' | 'profilePhoto' | 'location' | 'skills' | 'isVerified'> {
  distance?: number; // in kilometers
  relevanceScore?: number;
  mutualConnections?: number;
  isRecent?: boolean; // joined recently
  startupStage?: StartupStage;
  industry?: string;
  connectionStatus?: 'none' | 'pending' | 'connected' | 'blocked';
}

export interface UserDiscoveryResponse {
  success: boolean;
  message: string;
  users: DiscoveredUser[];
  pagination: PaginationMeta;
  searchMeta?: {
    query?: string;
    totalResults: number;
    searchTime: number;
    appliedFilters: UserDiscoveryFilters;
  };
}

export interface LocationSearchParams {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  city?: string;
  state?: string;
  country?: string;
  radius?: number; // in kilometers
}

export interface RecentJoinsParams {
  days?: number; // default 7
  limit?: number; // default 20
  page?: number;
}

export interface RecentJoinsResponse {
  success: boolean;
  message: string;
  users: DiscoveredUser[];
  pagination: PaginationMeta;
}

export interface SuggestedConnection extends DiscoveredUser {
  suggestionReason: SuggestionReason[];
  suggestionScore: number;
}

export type SuggestionReason =
  | 'mutual_connections'
  | 'same_company'
  | 'same_industry'
  | 'same_location'
  | 'similar_skills'
  | 'startup_stage'
  | 'recent_activity'
  | 'profile_views';

export interface SuggestedConnectionsResponse {
  success: boolean;
  message: string;
  suggestions: SuggestedConnection[];
  pagination: PaginationMeta;
}

export interface SuggestedConnectionsParams {
  limit?: number;
  page?: number;
  includedReasons?: SuggestionReason[];
  excludedReasons?: SuggestionReason[];
  minScore?: number;
}

// Discovery analytics and tracking
export interface DiscoverySearchEvent {
  id: string;
  userId: string;
  query?: string;
  filters: UserDiscoveryFilters;
  resultsCount: number;
  searchTime: number;
  selectedResults: string[]; // user IDs that were clicked/viewed
  timestamp: string;
}

export interface DiscoveryInteraction {
  id: string;
  userId: string;
  targetUserId: string;
  action: 'view_profile' | 'send_connection' | 'save' | 'share';
  source: 'search' | 'suggestions' | 'recent_joins' | 'location_based';
  timestamp: string;
}

// Discovery preferences
export interface DiscoveryPreferences {
  userId: string;
  showInSearch: boolean;
  showInSuggestions: boolean;
  showInLocationBased: boolean;
  showInRecentJoins: boolean;
  maxDistance?: number; // in kilometers
  preferredIndustries: string[];
  preferredStartupStages: StartupStage[];
  blockedUserIds: string[];
}

// Search history
export interface SearchHistoryItem {
  id: string;
  userId: string;
  query?: string;
  filters: UserDiscoveryFilters;
  resultsCount: number;
  timestamp: string;
}

export interface SearchHistoryResponse {
  success: boolean;
  message: string;
  history: SearchHistoryItem[];
  pagination: PaginationMeta;
}

// Saved searches
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query?: string;
  filters: UserDiscoveryFilters;
  isActive: boolean; // for notifications
  createdAt: string;
  lastNotified?: string;
}

export interface SavedSearchResponse {
  success: boolean;
  message: string;
  searches: SavedSearch[];
}