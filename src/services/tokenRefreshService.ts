/**
 * Automatic Token Refresh Service
 *
 * Handles automatic JWT token refresh logic with configurable timing,
 * retry mechanisms, and background refresh capabilities.
 */

import { JWTTokens } from '../types/auth';
import { authService } from './authService';
import { tokenStorage } from './tokenStorage';
import {
  validateTokens,
  getOptimalRefreshTime,
} from '../utils/tokenUtils';

// Token refresh events
export type TokenRefreshEvent =
  | 'refresh_started'
  | 'refresh_success'
  | 'refresh_failed'
  | 'token_expired'
  | 'refresh_scheduled'
  | 'refresh_cancelled';

// Token refresh listener
export type TokenRefreshListener = (
  event: TokenRefreshEvent,
  data?: any,
) => void;

// Refresh configuration
interface RefreshConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelayMs: number;
  minRefreshInterval: number; // seconds
  maxRefreshInterval: number; // seconds
}

/**
 * Automatic Token Refresh Service
 */
export class TokenRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private expirationTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private retryCount = 0;
  private listeners: TokenRefreshListener[] = [];
  private config: RefreshConfig = {
    enabled: true,
    maxRetries: 3,
    retryDelayMs: 5000, // 5 seconds
    minRefreshInterval: 60, // 1 minute
    maxRefreshInterval: 3600, // 1 hour
  };

  /**
   * Configure token refresh behavior
   */
  configure(config: Partial<RefreshConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Token refresh service configured:', this.config);
  }

  /**
   * Start automatic token refresh monitoring
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Token refresh service disabled');
      return;
    }

    try {
      const tokens = await tokenStorage.getTokens();

      if (!tokens) {
        console.log('No tokens found, refresh service not started');
        return;
      }

      this.scheduleRefresh(tokens);
      console.log('Token refresh service started');
    } catch (error) {
      console.error('Failed to start token refresh service:', error);
    }
  }

  /**
   * Stop automatic token refresh
   */
  stop(): void {
    this.clearTimers();
    this.retryCount = 0;
    this.isRefreshing = false;
    console.log('Token refresh service stopped');
  }

  /**
   * Schedule token refresh
   */
  private scheduleRefresh(tokens: JWTTokens): void {
    this.clearTimers();

    const validation = validateTokens(tokens);

    if (validation.isExpired) {
      console.log('Token already expired, triggering immediate refresh');
      this.performRefresh();
      return;
    }

    // Calculate refresh time
    let refreshTime = getOptimalRefreshTime(tokens);

    // Apply min/max constraints
    refreshTime = Math.max(this.config.minRefreshInterval, refreshTime);
    refreshTime = Math.min(this.config.maxRefreshInterval, refreshTime);

    console.log(`Scheduling token refresh in ${refreshTime} seconds`);

    // Schedule refresh
    this.refreshTimer = setTimeout(() => {
      this.performRefresh();
    }, refreshTime * 1000);

    // Schedule expiration warning
    if (validation.expiresIn && validation.expiresIn > 0) {
      this.expirationTimer = setTimeout(() => {
        this.emitEvent('token_expired');
      }, validation.expiresIn * 1000);
    }

    this.emitEvent('refresh_scheduled', { refreshIn: refreshTime });
  }

  /**
   * Perform token refresh
   */
  private async performRefresh(): Promise<void> {
    if (this.isRefreshing) {
      console.log('Token refresh already in progress');
      return;
    }

    this.isRefreshing = true;
    this.emitEvent('refresh_started');

    try {
      const response = await authService.refreshTokens();

      if (response.success && response.tokens) {
        this.retryCount = 0;
        this.scheduleRefresh(response.tokens);
        this.emitEvent('refresh_success', response.tokens);
        console.log('Token refresh successful');
      } else {
        throw new Error('Refresh response was not successful');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleRefreshError(error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle refresh errors with retry logic
   */
  private handleRefreshError(error: any): void {
    this.retryCount++;

    this.emitEvent('refresh_failed', {
      error: error.message,
      retryCount: this.retryCount,
    });

    if (this.retryCount < this.config.maxRetries) {
      console.log(
        `Retrying token refresh in ${this.config.retryDelayMs}ms (attempt ${
          this.retryCount + 1
        }/${this.config.maxRetries})`,
      );

      setTimeout(() => {
        this.performRefresh();
      }, this.config.retryDelayMs);
    } else {
      console.error('Max refresh retries exceeded, stopping refresh service');
      this.stop();

      // Emit final failure event
      this.emitEvent('refresh_failed', {
        error: 'Max retries exceeded',
        retryCount: this.retryCount,
        final: true,
      });
    }
  }

  /**
   * Force immediate token refresh
   */
  async forceRefresh(): Promise<boolean> {
    try {
      this.stop(); // Stop any scheduled refreshes
      await this.performRefresh();
      return true;
    } catch (error) {
      console.error('Forced refresh failed:', error);
      return false;
    }
  }

  /**
   * Check if refresh is needed and optionally perform it
   */
  async checkAndRefresh(): Promise<boolean> {
    try {
      const tokens = await tokenStorage.getTokens();

      if (!tokens) {
        return false;
      }

      const validation = validateTokens(tokens);

      if (validation.shouldRefresh || validation.isExpired) {
        console.log('Token refresh needed, performing refresh...');
        await this.performRefresh();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Check and refresh failed:', error);
      return false;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: TokenRefreshListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: TokenRefreshListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Clear all event listeners
   */
  clearEventListeners(): void {
    this.listeners = [];
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: TokenRefreshEvent, data?: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Token refresh event listener error:', error);
      }
    });
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    isActive: boolean;
    isRefreshing: boolean;
    retryCount: number;
    config: RefreshConfig;
  } {
    return {
      isActive: this.refreshTimer !== null || this.expirationTimer !== null,
      isRefreshing: this.isRefreshing,
      retryCount: this.retryCount,
      config: { ...this.config },
    };
  }
}

// Default instance
export const tokenRefreshService = new TokenRefreshService();

// Convenience functions
export const startTokenRefresh = () => tokenRefreshService.start();
export const stopTokenRefresh = () => tokenRefreshService.stop();
export const forceTokenRefresh = () => tokenRefreshService.forceRefresh();
export const checkAndRefreshToken = () => tokenRefreshService.checkAndRefresh();
