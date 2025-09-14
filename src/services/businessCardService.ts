/**
 * Business Card Service
 *
 * This service handles all business card-related API operations including
 * CRUD operations, sharing, analytics, and card exchange functionality.
 */

import {
  BusinessCard,
  BusinessCardFormData,
  BusinessCardResponse,
  BusinessCardListResponse,
  ShareableCard,
  CardExchange,
  ExportOptions,
  ExportFormat,
  NetworkingEvent,
  ContactList,
} from '../types/businessCard';
import { AppConfig } from '../utils/config';

/**
 * HTTP Client for Business Card API requests
 */
class BusinessCardAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = `${AppConfig.apiUrl}/api/business-cards`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`Business Card API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
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
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>,
  ): Promise<T> {
    const uploadHeaders = {
      ...headers,
      // Don't set Content-Type for FormData - let the browser set it
    };
    delete uploadHeaders['Content-Type'];

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData as any, // FormData typing issue in React Native
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
 * Main Business Card Service Implementation
 */
export class BusinessCardService {
  private apiClient: BusinessCardAPIClient;

  constructor() {
    this.apiClient = new BusinessCardAPIClient();
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

  // ====== CARD CRUD OPERATIONS ======

  /**
   * Create a new business card
   */
  async createCard(
    cardData: BusinessCardFormData,
  ): Promise<BusinessCardResponse> {
    try {
      const response = await this.apiClient.post<BusinessCardResponse>(
        '/',
        cardData,
      );
      return response;
    } catch (error) {
      console.error('Create business card failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to create business card',
      );
    }
  }

  /**
   * Update an existing business card
   */
  async updateCard(
    cardId: string,
    cardData: Partial<BusinessCardFormData>,
  ): Promise<BusinessCardResponse> {
    try {
      const response = await this.apiClient.patch<BusinessCardResponse>(
        `/${cardId}`,
        cardData,
      );
      return response;
    } catch (error) {
      console.error('Update business card failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to update business card',
      );
    }
  }

  /**
   * Get a business card by ID
   */
  async getCard(cardId: string): Promise<BusinessCardResponse> {
    try {
      const response = await this.apiClient.get<BusinessCardResponse>(
        `/${cardId}`,
      );
      return response;
    } catch (error) {
      console.error('Get business card failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch business card',
      );
    }
  }

  /**
   * Get all business cards for current user
   */
  async getUserCards(
    page: number = 1,
    limit: number = 10,
  ): Promise<BusinessCardListResponse> {
    try {
      const response = await this.apiClient.get<BusinessCardListResponse>(
        `/user?page=${page}&limit=${limit}`,
      );
      return response;
    } catch (error) {
      console.error('Get user cards failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user cards',
      );
    }
  }

  /**
   * Delete a business card
   */
  async deleteCard(
    cardId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/${cardId}`);
      return response;
    } catch (error) {
      console.error('Delete business card failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to delete business card',
      );
    }
  }

  /**
   * Set a card as default
   */
  async setDefaultCard(cardId: string): Promise<BusinessCardResponse> {
    try {
      const response = await this.apiClient.patch<BusinessCardResponse>(
        `/${cardId}/set-default`,
      );
      return response;
    } catch (error) {
      console.error('Set default card failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to set default card',
      );
    }
  }

  // ====== CARD SHARING & QR CODES ======

  /**
   * Generate shareable card with QR code
   */
  async generateShareableCard(cardId: string): Promise<ShareableCard> {
    try {
      const response = await this.apiClient.post<ShareableCard>(
        `/${cardId}/share`,
      );
      return response;
    } catch (error) {
      console.error('Generate shareable card failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to generate shareable card',
      );
    }
  }

  /**
   * Get shared card by share code
   */
  async getSharedCard(shareCode: string): Promise<BusinessCard> {
    try {
      const response = await this.apiClient.get<{ card: BusinessCard }>(
        `/shared/${shareCode}`,
      );
      return response.card;
    } catch (error) {
      console.error('Get shared card failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch shared card',
      );
    }
  }

  /**
   * Record a card view for analytics
   */
  async recordCardView(
    cardId: string,
    viewerData?: { location?: string; device?: string },
  ): Promise<void> {
    try {
      await this.apiClient.post(`/${cardId}/views`, viewerData);
    } catch (error) {
      console.error('Record card view failed:', error);
      // Don't throw for view recording failures
    }
  }

  // ====== CARD TEMPLATES & THEMES ======

  /**
   * Get available themes
   */
  async getThemes(): Promise<any[]> {
    try {
      const response = await this.apiClient.get<{ themes: any[] }>('/themes');
      return response.themes;
    } catch (error) {
      console.error('Get themes failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch themes',
      );
    }
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<any[]> {
    try {
      const response = await this.apiClient.get<{ templates: any[] }>(
        '/templates',
      );
      return response.templates;
    } catch (error) {
      console.error('Get templates failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch templates',
      );
    }
  }

  // ====== CARD EXCHANGE & NETWORKING ======

  /**
   * Exchange cards with another user
   */
  async exchangeCards(
    toUserId: string,
    myCardId: string,
    method: string,
    location?: { latitude: number; longitude: number },
  ): Promise<CardExchange> {
    try {
      const response = await this.apiClient.post<CardExchange>('/exchange', {
        toUserId,
        cardId: myCardId,
        method,
        location,
      });
      return response;
    } catch (error) {
      console.error('Exchange cards failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to exchange cards',
      );
    }
  }

  /**
   * Get card exchange history
   */
  async getExchangeHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<CardExchange[]> {
    try {
      const response = await this.apiClient.get<{ exchanges: CardExchange[] }>(
        `/exchanges?page=${page}&limit=${limit}`,
      );
      return response.exchanges;
    } catch (error) {
      console.error('Get exchange history failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch exchange history',
      );
    }
  }

  /**
   * Confirm a card exchange
   */
  async confirmExchange(exchangeId: string): Promise<CardExchange> {
    try {
      const response = await this.apiClient.patch<CardExchange>(
        `/exchanges/${exchangeId}/confirm`,
      );
      return response;
    } catch (error) {
      console.error('Confirm exchange failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to confirm exchange',
      );
    }
  }

  // ====== CONTACT MANAGEMENT ======

  /**
   * Create a new contact list
   */
  async createContactList(
    name: string,
    tags: string[] = [],
  ): Promise<ContactList> {
    try {
      const response = await this.apiClient.post<ContactList>(
        '/contacts/lists',
        {
          name,
          tags,
        },
      );
      return response;
    } catch (error) {
      console.error('Create contact list failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to create contact list',
      );
    }
  }

  /**
   * Add card to contact list
   */
  async addToContactList(listId: string, cardId: string): Promise<void> {
    try {
      await this.apiClient.post(`/contacts/lists/${listId}/cards`, { cardId });
    } catch (error) {
      console.error('Add to contact list failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to add to contact list',
      );
    }
  }

  /**
   * Get user's contact lists
   */
  async getContactLists(): Promise<ContactList[]> {
    try {
      const response = await this.apiClient.get<{ lists: ContactList[] }>(
        '/contacts/lists',
      );
      return response.lists;
    } catch (error) {
      console.error('Get contact lists failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch contact lists',
      );
    }
  }

  // ====== ANALYTICS ======

  /**
   * Get card analytics
   */
  async getCardAnalytics(
    cardId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d',
  ): Promise<any> {
    try {
      const response = await this.apiClient.get<any>(
        `/${cardId}/analytics?period=${period}`,
      );
      return response;
    } catch (error) {
      console.error('Get card analytics failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch card analytics',
      );
    }
  }

  /**
   * Get overall user analytics
   */
  async getUserAnalytics(): Promise<any> {
    try {
      const response = await this.apiClient.get<any>('/analytics');
      return response;
    } catch (error) {
      console.error('Get user analytics failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch user analytics',
      );
    }
  }

  // ====== EXPORT & IMPORT ======

  /**
   * Export business card
   */
  async exportCard(cardId: string, options: ExportOptions): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams({
        format: options.format,
        includeQRCode: options.includeQRCode.toString(),
        includeAnalytics: options.includeAnalytics.toString(),
        ...(options.compression && { compression: options.compression }),
      });

      const response = await fetch(
        `${this.apiClient.baseURL}/${cardId}/export?${queryParams}`,
        {
          method: 'GET',
          headers: (this.apiClient as any).defaultHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export card failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to export card',
      );
    }
  }

  /**
   * Import business card from vCard or other formats
   */
  async importCard(file: File): Promise<BusinessCard> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.apiClient.uploadFile<{ card: BusinessCard }>(
        '/import',
        formData,
      );
      return response.card;
    } catch (error) {
      console.error('Import card failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to import card',
      );
    }
  }

  // ====== SEARCH & DISCOVERY ======

  /**
   * Search public business cards
   */
  async searchCards(
    query: string,
    filters?: {
      industry?: string[];
      location?: string;
      fundingStage?: string[];
    },
  ): Promise<BusinessCard[]> {
    try {
      const searchParams = new URLSearchParams({ query });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
          } else if (value) {
            searchParams.append(key, value);
          }
        });
      }

      const response = await this.apiClient.get<{ cards: BusinessCard[] }>(
        `/search?${searchParams.toString()}`,
      );
      return response.cards;
    } catch (error) {
      console.error('Search cards failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search cards',
      );
    }
  }

  /**
   * Get featured/trending cards
   */
  async getFeaturedCards(limit: number = 10): Promise<BusinessCard[]> {
    try {
      const response = await this.apiClient.get<{ cards: BusinessCard[] }>(
        `/featured?limit=${limit}`,
      );
      return response.cards;
    } catch (error) {
      console.error('Get featured cards failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch featured cards',
      );
    }
  }

  // ====== NETWORKING EVENTS ======

  /**
   * Get networking events
   */
  async getNetworkingEvents(): Promise<NetworkingEvent[]> {
    try {
      const response = await this.apiClient.get<{ events: NetworkingEvent[] }>(
        '/events',
      );
      return response.events;
    } catch (error) {
      console.error('Get networking events failed:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to fetch networking events',
      );
    }
  }

  /**
   * Join a networking event
   */
  async joinEvent(eventId: string): Promise<void> {
    try {
      await this.apiClient.post(`/events/${eventId}/join`);
    } catch (error) {
      console.error('Join event failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to join event',
      );
    }
  }
}

// Default instance
export const businessCardService = new BusinessCardService();
