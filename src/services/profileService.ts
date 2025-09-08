/**
 * Profile Service
 * 
 * This service handles all profile-related API operations including CRUD operations,
 * photo uploads, search functionality, and profile analytics.
 */

import {
  ProfileFormData,
  ProfileUpdateData,
  ProfilePhotoData,
  ProfileResponse,
  ProfileListResponse,
  ProfilePhotoUploadResponse,
  ProfileSearchParams,
  ProfileStats,
  ProfileCompletionStatus,
  ProfileActivity,
  ProfileConnectionRequest,
  ProfileView,
  ProfileSettings,
} from '../types/profile';
import { AppConfig } from '../utils/config';

/**
 * HTTP Client for Profile API requests
 */
class ProfileAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = `${AppConfig.apiUrl}/api/profiles`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      timeout: AppConfig.apiTimeout,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Profile API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string, 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async patch<T>(
    endpoint: string, 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<T> {
    const uploadHeaders = {
      ...headers,
      // Don't set Content-Type for FormData - let the browser set it
    };
    delete uploadHeaders['Content-Type'];

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
    });
  }

  setAuthToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders.Authorization;
  }
}

/**
 * Main Profile Service Implementation
 */
export class ProfileService {
  private apiClient: ProfileAPIClient;

  constructor() {
    this.apiClient = new ProfileAPIClient();
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.apiClient.setAuthToken(token);
  }

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    this.apiClient.removeAuthToken();
  }

  /**
   * Create a new user profile
   */
  async createProfile(profileData: ProfileFormData): Promise<ProfileResponse> {
    try {
      const response = await this.apiClient.post<ProfileResponse>('/', {
        name: profileData.name.trim(),
        title: profileData.title.trim(),
        company: profileData.company.trim(),
        bio: profileData.bio?.trim() || null,
        email: profileData.email.toLowerCase().trim(),
        phone: profileData.phone?.trim() || null,
        location: profileData.location?.trim() || null,
        website: profileData.website?.trim() || null,
        socialLinks: profileData.socialLinks,
        skills: profileData.skills.map(skill => skill.trim()),
        isPublic: profileData.isPublic,
      });

      return response;
    } catch (error) {
      console.error('Create profile failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create profile'
      );
    }
  }

  /**
   * Update an existing profile
   */
  async updateProfile(
    profileId: string, 
    updateData: ProfileUpdateData
  ): Promise<ProfileResponse> {
    try {
      const sanitizedData: ProfileUpdateData = {};
      
      // Only include fields that are provided
      if (updateData.name !== undefined) {
        sanitizedData.name = updateData.name.trim();
      }
      if (updateData.title !== undefined) {
        sanitizedData.title = updateData.title.trim();
      }
      if (updateData.company !== undefined) {
        sanitizedData.company = updateData.company.trim();
      }
      if (updateData.bio !== undefined) {
        sanitizedData.bio = updateData.bio?.trim() || null;
      }
      if (updateData.email !== undefined) {
        sanitizedData.email = updateData.email.toLowerCase().trim();
      }
      if (updateData.phone !== undefined) {
        sanitizedData.phone = updateData.phone?.trim() || null;
      }
      if (updateData.location !== undefined) {
        sanitizedData.location = updateData.location?.trim() || null;
      }
      if (updateData.website !== undefined) {
        sanitizedData.website = updateData.website?.trim() || null;
      }
      if (updateData.socialLinks !== undefined) {
        sanitizedData.socialLinks = updateData.socialLinks;
      }
      if (updateData.skills !== undefined) {
        sanitizedData.skills = updateData.skills.map(skill => skill.trim());
      }
      if (updateData.isPublic !== undefined) {
        sanitizedData.isPublic = updateData.isPublic;
      }

      const response = await this.apiClient.patch<ProfileResponse>(
        `/${profileId}`, 
        sanitizedData
      );

      return response;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    }
  }

  /**
   * Get a profile by ID
   */
  async getProfile(profileId: string): Promise<ProfileResponse> {
    try {
      const response = await this.apiClient.get<ProfileResponse>(`/${profileId}`);
      return response;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile'
      );
    }
  }

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<ProfileResponse> {
    try {
      const response = await this.apiClient.get<ProfileResponse>('/me');
      return response;
    } catch (error) {
      console.error('Get current profile failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch current profile'
      );
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.delete<{ success: boolean; message: string }>(
        `/${profileId}`
      );
      return response;
    } catch (error) {
      console.error('Delete profile failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete profile'
      );
    }
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(
    profileId: string, 
    photo: ProfilePhotoData
  ): Promise<ProfilePhotoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      } as any);

      const response = await this.apiClient.uploadFile<ProfilePhotoUploadResponse>(
        `/${profileId}/photo`,
        formData
      );

      return response;
    } catch (error) {
      console.error('Upload profile photo failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload profile photo'
      );
    }
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(profileId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.delete<{ success: boolean; message: string }>(
        `/${profileId}/photo`
      );
      return response;
    } catch (error) {
      console.error('Delete profile photo failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete profile photo'
      );
    }
  }

  /**
   * Search profiles
   */
  async searchProfiles(params: ProfileSearchParams): Promise<ProfileListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.query) searchParams.append('query', params.query);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      
      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(`filters[${key}]`, v));
            } else {
              searchParams.append(`filters[${key}]`, value.toString());
            }
          }
        });
      }

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/search?${queryString}` : '/search';
      
      const response = await this.apiClient.get<ProfileListResponse>(endpoint);
      return response;
    } catch (error) {
      console.error('Search profiles failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search profiles'
      );
    }
  }

  /**
   * Get profile suggestions
   */
  async getProfileSuggestions(limit: number = 10): Promise<ProfileListResponse> {
    try {
      const response = await this.apiClient.get<ProfileListResponse>(
        `/suggestions?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get profile suggestions failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile suggestions'
      );
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(): Promise<ProfileStats> {
    try {
      const response = await this.apiClient.get<ProfileStats>('/stats');
      return response;
    } catch (error) {
      console.error('Get profile stats failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile statistics'
      );
    }
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletion(profileId: string): Promise<ProfileCompletionStatus> {
    try {
      const response = await this.apiClient.get<ProfileCompletionStatus>(
        `/${profileId}/completion`
      );
      return response;
    } catch (error) {
      console.error('Get profile completion failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile completion'
      );
    }
  }

  /**
   * Get profile activities
   */
  async getProfileActivities(
    profileId: string, 
    limit: number = 20
  ): Promise<ProfileActivity[]> {
    try {
      const response = await this.apiClient.get<ProfileActivity[]>(
        `/${profileId}/activities?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get profile activities failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile activities'
      );
    }
  }

  /**
   * Get profile views
   */
  async getProfileViews(
    profileId: string, 
    limit: number = 50
  ): Promise<ProfileView[]> {
    try {
      const response = await this.apiClient.get<ProfileView[]>(
        `/${profileId}/views?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get profile views failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile views'
      );
    }
  }

  /**
   * Record profile view
   */
  async recordProfileView(profileId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.post<{ success: boolean }>(
        `/${profileId}/views`
      );
      return response;
    } catch (error) {
      console.error('Record profile view failed:', error);
      // Don't throw for view recording failures
      return { success: false };
    }
  }

  /**
   * Get connection requests
   */
  async getConnectionRequests(): Promise<ProfileConnectionRequest[]> {
    try {
      const response = await this.apiClient.get<ProfileConnectionRequest[]>(
        '/connections/requests'
      );
      return response;
    } catch (error) {
      console.error('Get connection requests failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch connection requests'
      );
    }
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(
    profileId: string, 
    message?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.post<{ success: boolean; message: string }>(
        `/connections/request`,
        { profileId, message: message?.trim() || null }
      );
      return response;
    } catch (error) {
      console.error('Send connection request failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to send connection request'
      );
    }
  }

  /**
   * Respond to connection request
   */
  async respondToConnectionRequest(
    requestId: string, 
    accept: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.patch<{ success: boolean; message: string }>(
        `/connections/requests/${requestId}`,
        { status: accept ? 'accepted' : 'rejected' }
      );
      return response;
    } catch (error) {
      console.error('Respond to connection request failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to respond to connection request'
      );
    }
  }

  /**
   * Get profile settings
   */
  async getProfileSettings(profileId: string): Promise<ProfileSettings> {
    try {
      const response = await this.apiClient.get<ProfileSettings>(
        `/${profileId}/settings`
      );
      return response;
    } catch (error) {
      console.error('Get profile settings failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch profile settings'
      );
    }
  }

  /**
   * Update profile settings
   */
  async updateProfileSettings(
    profileId: string, 
    settings: Partial<ProfileSettings>
  ): Promise<ProfileSettings> {
    try {
      const response = await this.apiClient.patch<ProfileSettings>(
        `/${profileId}/settings`,
        settings
      );
      return response;
    } catch (error) {
      console.error('Update profile settings failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update profile settings'
      );
    }
  }

  /**
   * Export profile data
   */
  async exportProfileData(profileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/${profileId}/export`, {
        method: 'GET',
        headers: (this.apiClient as any).defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export profile data failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to export profile data'
      );
    }
  }

  /**
   * Validate profile data
   */
  async validateProfileData(profileData: ProfileFormData): Promise<{
    isValid: boolean;
    errors: Record<string, string>;
  }> {
    try {
      const response = await this.apiClient.post<{
        isValid: boolean;
        errors: Record<string, string>;
      }>('/validate', profileData);
      return response;
    } catch (error) {
      console.error('Validate profile data failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to validate profile data'
      );
    }
  }
}

// Default instance
export const profileService = new ProfileService();