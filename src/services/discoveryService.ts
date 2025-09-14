/**
 * Discovery Service
 *
 * This service handles user discovery functionality including search,
 * location-based discovery, suggestions, and recent joins.
 */

import {
  UserDiscoveryParams,
  UserDiscoveryResponse,
  LocationSearchParams,
  RecentJoinsParams,
  RecentJoinsResponse,
  SuggestedConnectionsParams,
  SuggestedConnectionsResponse,
  DiscoveredUser,
  SuggestedConnection,
  SuggestionReason,
  SearchHistoryResponse,
  SavedSearch,
  SavedSearchResponse,
  DiscoveryPreferences,
} from '../types/discovery';

class DiscoveryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://api.digbiz.com';
  }

  /**
   * Search for users based on various filters
   */
  async searchUsers(params: UserDiscoveryParams): Promise<UserDiscoveryResponse> {
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
        if (params.filters.industry) queryString.append('filters[industry]', params.filters.industry);
        if (params.filters.startupStage) queryString.append('filters[startupStage]', params.filters.startupStage);
        if (params.filters.isRecent !== undefined) queryString.append('filters[isRecent]', params.filters.isRecent.toString());
        if (params.filters.isVerified !== undefined) queryString.append('filters[isVerified]', params.filters.isVerified.toString());
        if (params.filters.isPublic !== undefined) queryString.append('filters[isPublic]', params.filters.isPublic.toString());

        if (params.filters.location) {
          if (params.filters.location.city) queryString.append('filters[location][city]', params.filters.location.city);
          if (params.filters.location.state) queryString.append('filters[location][state]', params.filters.location.state);
          if (params.filters.location.country) queryString.append('filters[location][country]', params.filters.location.country);
          if (params.filters.location.radius) queryString.append('filters[location][radius]', params.filters.location.radius.toString());
          if (params.filters.location.coordinates) {
            queryString.append('filters[location][latitude]', params.filters.location.coordinates.latitude.toString());
            queryString.append('filters[location][longitude]', params.filters.location.coordinates.longitude.toString());
          }
        }

        if (params.filters.skills) {
          params.filters.skills.forEach(skill => queryString.append('filters[skills][]', skill));
        }
      }

      const response = await fetch(`${this.baseUrl}/discovery/search?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: UserDiscoveryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Discover users based on location
   */
  async discoverByLocation(params: LocationSearchParams): Promise<UserDiscoveryResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.coordinates) {
        queryString.append('latitude', params.coordinates.latitude.toString());
        queryString.append('longitude', params.coordinates.longitude.toString());
      }
      if (params.city) queryString.append('city', params.city);
      if (params.state) queryString.append('state', params.state);
      if (params.country) queryString.append('country', params.country);
      if (params.radius) queryString.append('radius', params.radius.toString());

      const response = await fetch(`${this.baseUrl}/discovery/location?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Location discovery failed: ${response.statusText}`);
      }

      const data: UserDiscoveryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error discovering users by location:', error);
      throw error;
    }
  }

  /**
   * Get recently joined users
   */
  async getRecentJoins(params: RecentJoinsParams = {}): Promise<RecentJoinsResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.days) queryString.append('days', params.days.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.page) queryString.append('page', params.page.toString());

      const response = await fetch(`${this.baseUrl}/discovery/recent-joins?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Recent joins fetch failed: ${response.statusText}`);
      }

      const data: RecentJoinsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting recent joins:', error);
      throw error;
    }
  }

  /**
   * Get suggested connections based on various algorithms
   */
  async getSuggestedConnections(params: SuggestedConnectionsParams = {}): Promise<SuggestedConnectionsResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.page) queryString.append('page', params.page.toString());
      if (params.minScore) queryString.append('minScore', params.minScore.toString());

      if (params.includedReasons) {
        params.includedReasons.forEach(reason => queryString.append('includedReasons[]', reason));
      }
      if (params.excludedReasons) {
        params.excludedReasons.forEach(reason => queryString.append('excludedReasons[]', reason));
      }

      const response = await fetch(`${this.baseUrl}/discovery/suggestions?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Suggestions fetch failed: ${response.statusText}`);
      }

      const data: SuggestedConnectionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting suggested connections:', error);
      throw error;
    }
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(page: number = 1, limit: number = 20): Promise<SearchHistoryResponse> {
    try {
      const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/discovery/search-history?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Search history fetch failed: ${response.statusText}`);
      }

      const data: SearchHistoryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting search history:', error);
      throw error;
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/discovery/search-history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Clear search history failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }

  /**
   * Save a search for future reference and notifications
   */
  async saveSearch(searchData: Partial<SavedSearch>): Promise<{ success: boolean; message: string; search: SavedSearch }> {
    try {
      const response = await fetch(`${this.baseUrl}/discovery/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        throw new Error(`Save search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(): Promise<SavedSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/discovery/saved-searches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get saved searches failed: ${response.statusText}`);
      }

      const data: SavedSearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting saved searches:', error);
      throw error;
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/discovery/saved-searches/${searchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete saved search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  }

  /**
   * Update discovery preferences
   */
  async updateDiscoveryPreferences(preferences: Partial<DiscoveryPreferences>): Promise<{ success: boolean; message: string; preferences: DiscoveryPreferences }> {
    try {
      const response = await fetch(`${this.baseUrl}/discovery/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`Update preferences failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating discovery preferences:', error);
      throw error;
    }
  }

  /**
   * Get discovery preferences
   */
  async getDiscoveryPreferences(): Promise<{ success: boolean; message: string; preferences: DiscoveryPreferences }> {
    try {
      const response = await fetch(`${this.baseUrl}/discovery/preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get preferences failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting discovery preferences:', error);
      throw error;
    }
  }

  /**
   * Calculate similarity score between users (for suggestions algorithm)
   */
  calculateSimilarityScore(user1: DiscoveredUser, user2: DiscoveredUser): { score: number; reasons: SuggestionReason[] } {
    let score = 0;
    const reasons: SuggestionReason[] = [];

    // Company match (highest weight)
    if (user1.company && user2.company && user1.company.toLowerCase() === user2.company.toLowerCase()) {
      score += 30;
      reasons.push('same_company');
    }

    // Industry match (high weight)
    if (user1.industry && user2.industry && user1.industry.toLowerCase() === user2.industry.toLowerCase()) {
      score += 25;
      reasons.push('same_industry');
    }

    // Location proximity (medium-high weight)
    if (user1.location && user2.location) {
      if (user1.location.toLowerCase().includes(user2.location.toLowerCase()) ||
          user2.location.toLowerCase().includes(user1.location.toLowerCase())) {
        score += 20;
        reasons.push('same_location');
      }
    }

    // Startup stage match (medium weight)
    if (user1.startupStage && user2.startupStage && user1.startupStage === user2.startupStage) {
      score += 15;
      reasons.push('startup_stage');
    }

    // Skills overlap (dynamic weight based on overlap)
    if (user1.skills && user2.skills) {
      const commonSkills = user1.skills.filter(skill =>
        user2.skills?.some(s => s.toLowerCase() === skill.toLowerCase())
      );
      if (commonSkills.length > 0) {
        score += Math.min(commonSkills.length * 5, 20); // Cap skills score at 20
        reasons.push('similar_skills');
      }
    }

    // Mutual connections boost
    if (user2.mutualConnections && user2.mutualConnections > 0) {
      score += Math.min(user2.mutualConnections * 2, 10); // Cap at 10
      reasons.push('mutual_connections');
    }

    // Recent activity boost
    if (user2.isRecent) {
      score += 5;
      reasons.push('recent_activity');
    }

    return {
      score: Math.min(score, 100), // Cap at 100
      reasons
    };
  }

  /**
   * Generate personalized suggestions based on user profile and interactions
   */
  async generatePersonalizedSuggestions(
    currentUser: DiscoveredUser,
    candidateUsers: DiscoveredUser[],
    userInteractions?: any[]
  ): Promise<SuggestedConnection[]> {
    const suggestions: SuggestedConnection[] = [];

    for (const candidate of candidateUsers) {
      if (candidate.userId === currentUser.userId) continue;

      const { score, reasons } = this.calculateSimilarityScore(currentUser, candidate);

      // Apply interaction-based adjustments
      if (userInteractions) {
        const hasViewed = userInteractions.some(
          interaction => interaction.targetUserId === candidate.userId && interaction.action === 'view_profile'
        );
        if (hasViewed) {
          reasons.push('profile_views');
        }
      }

      // Only include users with a minimum similarity score
      if (score >= 15) {
        suggestions.push({
          ...candidate,
          suggestionReason: reasons,
          suggestionScore: score,
        });
      }
    }

    // Sort by suggestion score (descending)
    return suggestions.sort((a, b) => b.suggestionScore - a.suggestionScore);
  }

  /**
   * Calculate distance between two geographic points (Haversine formula)
   */
  calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Apply diversity filter to suggestions to ensure variety
   */
  diversifySuggestions(suggestions: SuggestedConnection[]): SuggestedConnection[] {
    const diversified: SuggestedConnection[] = [];
    const seenCompanies = new Set<string>();
    const seenIndustries = new Set<string>();

    for (const suggestion of suggestions) {
      let shouldAdd = true;

      // Limit suggestions from same company
      if (suggestion.company && seenCompanies.has(suggestion.company.toLowerCase())) {
        if (seenCompanies.size < 3) { // Allow some duplicates if we have few companies
          shouldAdd = true;
        } else {
          shouldAdd = false;
        }
      }

      // Limit suggestions from same industry
      if (suggestion.industry && seenIndustries.has(suggestion.industry.toLowerCase())) {
        if (seenIndustries.size < 5) { // Allow some duplicates if we have few industries
          shouldAdd = true;
        } else {
          shouldAdd = false;
        }
      }

      if (shouldAdd) {
        diversified.push(suggestion);
        if (suggestion.company) seenCompanies.add(suggestion.company.toLowerCase());
        if (suggestion.industry) seenIndustries.add(suggestion.industry.toLowerCase());

        // Limit total suggestions
        if (diversified.length >= 50) break;
      }
    }

    return diversified;
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
   * Get current user's location
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // This would use react-native-geolocation-service or similar
      // For now, return a placeholder
      return {
        latitude: 37.7749,
        longitude: -122.4194
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Track discovery interaction for analytics
   */
  async trackDiscoveryInteraction(interaction: {
    targetUserId: string;
    action: 'view_profile' | 'send_connection' | 'save' | 'share';
    source: 'search' | 'suggestions' | 'recent_joins' | 'location_based';
  }): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/discovery/interactions`, {
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
      console.error('Error tracking discovery interaction:', error);
      // Don't throw error for analytics tracking failure
    }
  }
}

export default new DiscoveryService();