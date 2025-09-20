/**
 * Sentry Integration Service
 *
 * Handles crash reporting, error tracking, and performance monitoring with Sentry
 */

// import * as Sentry from '@sentry/react-native';

interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  enableAutoSessionTracking?: boolean;
  enableNativeCrashHandling?: boolean;
  enableAppHangTracking?: boolean;
  enableOutOfMemoryTracking?: boolean;
  debug?: boolean;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

interface UserContext {
  id: string;
  email?: string;
  username?: string;
  subscription?: string;
  properties?: Record<string, any>;
}

interface CustomError extends Error {
  code?: string;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  fingerprint?: string[];
}

interface PerformanceTransaction {
  name: string;
  operation: string;
  startTimestamp?: number;
  endTimestamp?: number;
  data?: Record<string, any>;
  tags?: Record<string, string>;
}

class SentryIntegrationService {
  private isInitialized = false;
  private routingInstrumentation?: any;

  // Initialize Sentry
  initialize(config: SentryConfig): void {
    if (this.isInitialized) {
      console.warn('Sentry already initialized');
      return;
    }

    try {
      this.routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        debug: config.debug || false,
        enableAutoSessionTracking: config.enableAutoSessionTracking ?? true,
        enableNativeCrashHandling: config.enableNativeCrashHandling ?? true,
        enableAppHangTracking: config.enableAppHangTracking ?? true,
        enableOutOfMemoryTracking: config.enableOutOfMemoryTracking ?? true,
        tracesSampleRate: config.tracesSampleRate || 0.1,
        profilesSampleRate: config.profilesSampleRate || 0.1,

        // Performance monitoring
        integrations: [
          new Sentry.ReactNativeTracing({
            routingInstrumentation: this.routingInstrumentation,
            enableNativeFramesTracking: true,
            enableStallTracking: true,
            enableAppStartTracking: true,
            enableUserInteractionTracing: true,
          }),
        ],

        // Custom error handling
        beforeSend: (event, hint) => {
          return this.beforeSendHook(event, hint);
        },

        // Custom breadcrumb filtering
        beforeBreadcrumb: (breadcrumb, hint) => {
          return this.beforeBreadcrumbHook(breadcrumb, hint);
        },
      });

      this.isInitialized = true;
      this.setupGlobalErrorHandlers();

      console.log('Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  // Error Tracking
  captureError(
    error: Error | CustomError,
    context?: Record<string, any>,
  ): string {
    if (!this.isInitialized) {
      console.error('Sentry not initialized');
      return '';
    }

    return Sentry.withScope(scope => {
      // Set error context
      if (context) {
        scope.setContext('error_context', context);
      }

      // Set custom error properties
      if ('code' in error && error.code) {
        scope.setTag('error_code', error.code);
      }

      if ('severity' in error && error.severity) {
        scope.setLevel(this.mapSeverityToLevel(error.severity));
      }

      if ('fingerprint' in error && error.fingerprint) {
        scope.setFingerprint(error.fingerprint);
      }

      if ('context' in error && error.context) {
        Object.entries(error.context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      return Sentry.captureException(error);
    });
  }

  // Message Logging
  captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
    context?: Record<string, any>,
  ): string {
    if (!this.isInitialized) {
      console.log(message);
      return '';
    }

    return Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      return Sentry.captureMessage(message, level);
    });
  }

  // User Context
  setUser(user: UserContext): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription: user.subscription,
      ...user.properties,
    });
  }

  // Custom Tags and Context
  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;
    Sentry.setTag(key, value);
  }

  setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;
    Sentry.setContext(key, context);
  }

  setExtra(key: string, value: any): void {
    if (!this.isInitialized) return;
    Sentry.setExtra(key, value);
  }

  // Breadcrumbs
  addBreadcrumb(
    message: string,
    category?: string,
    level?: string,
    data?: Record<string, any>,
  ): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level: (level as any) || 'info',
      data,
      timestamp: Date.now() / 1000,
    });
  }

  // Performance Monitoring
  startTransaction(transaction: PerformanceTransaction): any {
    if (!this.isInitialized) return null;

    const sentryTransaction = Sentry.startTransaction({
      name: transaction.name,
      op: transaction.operation,
      data: transaction.data,
      tags: transaction.tags,
      startTimestamp: transaction.startTimestamp,
    });

    return sentryTransaction;
  }

  finishTransaction(transaction: any, data?: Record<string, any>): void {
    if (!transaction) return;

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        transaction.setData(key, value);
      });
    }

    transaction.finish();
  }

  // Navigation tracking
  getRoutingInstrumentation(): any {
    return this.routingInstrumentation;
  }

  // Network request tracking
  trackNetworkRequest(
    url: string,
    method: string,
    statusCode?: number,
    responseTime?: number,
    size?: number,
  ): void {
    if (!this.isInitialized) return;

    this.addBreadcrumb(
      `${method} ${url}`,
      'http',
      statusCode && statusCode >= 400 ? 'error' : 'info',
      {
        url,
        method,
        status_code: statusCode,
        response_time: responseTime,
        response_size: size,
      },
    );

    // Track as performance span for slow requests
    if (responseTime && responseTime > 1000) {
      const transaction = this.startTransaction({
        name: `${method} ${url}`,
        operation: 'http.client',
        data: {
          url,
          method,
          status_code: statusCode,
          response_time: responseTime,
        },
      });

      if (transaction) {
        transaction.setHttpStatus(statusCode || 0);
        this.finishTransaction(transaction);
      }
    }
  }

  // App lifecycle tracking
  trackAppStart(): void {
    if (!this.isInitialized) return;

    this.addBreadcrumb('App started', 'lifecycle', 'info');
    this.setTag('app_start', 'true');
  }

  trackAppBackground(): void {
    if (!this.isInitialized) return;
    this.addBreadcrumb('App backgrounded', 'lifecycle', 'info');
  }

  trackAppForeground(): void {
    if (!this.isInitialized) return;
    this.addBreadcrumb('App foregrounded', 'lifecycle', 'info');
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, context?: Record<string, any>): void {
    if (!this.isInitialized) return;

    this.addBreadcrumb(
      `Feature used: ${feature}`,
      'user_action',
      'info',
      context,
    );

    // Track as custom event for analytics
    this.captureMessage(`Feature used: ${feature}`, 'info', context);
  }

  // Error boundary integration
  createErrorBoundary(): any {
    if (!this.isInitialized) return null;
    return Sentry.ErrorBoundary;
  }

  // Memory and performance tracking
  trackMemoryUsage(usage: {
    used: number;
    total: number;
    percentage: number;
  }): void {
    if (!this.isInitialized) return;

    if (usage.percentage > 80) {
      this.captureMessage('High memory usage detected', 'warning', {
        memory_used: usage.used,
        memory_total: usage.total,
        memory_percentage: usage.percentage,
      });
    }

    this.setContext('memory_usage', usage);
  }

  trackRenderPerformance(componentName: string, renderTime: number): void {
    if (!this.isInitialized) return;

    if (renderTime > 100) {
      // Log slow renders
      this.addBreadcrumb(
        `Slow render: ${componentName}`,
        'performance',
        'warning',
        {
          component: componentName,
          render_time: renderTime,
        },
      );
    }

    // Track as performance measurement
    const transaction = this.startTransaction({
      name: `Render ${componentName}`,
      operation: 'ui.render',
      data: {
        component: componentName,
        render_time: renderTime,
      },
    });

    if (transaction) {
      this.finishTransaction(transaction);
    }
  }

  // Custom metrics
  setMetric(
    name: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
  ): void {
    if (!this.isInitialized) return;

    // Use Sentry's metrics API if available
    if (Sentry.metrics && Sentry.metrics.distribution) {
      Sentry.metrics.distribution(name, value, {
        unit: unit || 'none',
        tags,
      });
    }
  }

  // Release tracking
  setRelease(version: string, environment?: string): void {
    if (!this.isInitialized) return;

    Sentry.setTag('release', version);
    if (environment) {
      Sentry.setTag('environment', environment);
    }
  }

  // Privacy and data filtering
  private beforeSendHook(event: any, hint: any): any {
    // Filter sensitive data
    if (event.user?.email) {
      event.user.email = this.hashString(event.user.email);
    }

    // Remove sensitive context data
    if (event.contexts?.device?.model) {
      delete event.contexts.device.model;
    }

    // Filter out development errors in production
    if (event.environment === 'production' && event.level === 'debug') {
      return null;
    }

    return event;
  }

  private beforeBreadcrumbHook(breadcrumb: any, hint: any): any {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }

    // Sanitize URLs
    if (breadcrumb.data?.url) {
      breadcrumb.data.url = this.sanitizeUrl(breadcrumb.data.url);
    }

    return breadcrumb;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof (global as any).window !== 'undefined') {
      (global as any).window.addEventListener(
        'unhandledrejection',
        (event: any) => {
          this.captureError(
            new Error(`Unhandled Promise Rejection: ${event.reason}`),
            {
              type: 'unhandled_promise_rejection',
              reason: event.reason,
            },
          );
        },
      );
    }

    // Handle global errors
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.captureError(error, {
        type: 'global_error',
        is_fatal: isFatal,
      });

      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  private mapSeverityToLevel(severity: string): any {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'fatal';
      default:
        return 'error';
    }
  }

  private hashString(str: string): string {
    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters that might contain sensitive data
      urlObj.search = '';
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.isInitialized;
  }

  // Flush events (useful for testing)
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      console.error('Failed to flush Sentry events:', error);
      return false;
    }
  }

  // Close Sentry (cleanup)
  close(): void {
    if (!this.isInitialized) return;

    Sentry.close();
    this.isInitialized = false;
  }
}

export const sentryIntegration = new SentryIntegrationService();
export default sentryIntegration;
