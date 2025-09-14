/**
 * Analytics Service
 *
 * Handles event tracking and analytics for the application
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  /**
   * Track an analytics event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // In a real implementation, this would send to analytics service
    if (__DEV__) {
      console.log('[Analytics]', eventName, properties);
    }
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get tracked events (for testing)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear tracked events
   */
  clearEvents(): void {
    this.events = [];
  }
}

export const analyticsService = new AnalyticsService();

// Convenience function for tracking events
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  analyticsService.trackEvent(eventName, properties);
};
