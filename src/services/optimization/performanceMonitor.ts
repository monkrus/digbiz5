/**
 * Performance Monitor Service
 *
 * Monitors app performance, memory usage, and provides optimization insights
 */

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: {
    average: number;
    p95: number;
    p99: number;
  };
  frameDrops: {
    count: number;
    percentage: number;
  };
  networkRequests: {
    total: number;
    failed: number;
    averageTime: number;
  };
  bundleSize: {
    js: number;
    assets: number;
    total: number;
  };
  crashRate: number;
  launchTime: number;
}

interface PerformanceAlert {
  id: string;
  type: 'memory' | 'performance' | 'network' | 'crash';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metrics: any;
  suggestions: string[];
}

interface MemoryLeakDetection {
  componentName: string;
  instances: number;
  memoryDelta: number;
  isLeak: boolean;
  confidence: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetrics = {
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    renderTime: { average: 0, p95: 0, p99: 0 },
    frameDrops: { count: 0, percentage: 0 },
    networkRequests: { total: 0, failed: 0, averageTime: 0 },
    bundleSize: { js: 0, assets: 0, total: 0 },
    crashRate: 0,
    launchTime: 0,
  };

  private alerts: PerformanceAlert[] = [];
  private componentInstances = new Map<string, number>();
  private memorySnapshots: Array<{ timestamp: number; usage: number }> = [];
  private renderTimes: number[] = [];
  private networkRequests: Array<{
    startTime: number;
    endTime?: number;
    failed: boolean;
  }> = [];
  private frameDropCounts: number[] = [];

  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  // Start monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupMemoryMonitoring();
    this.setupFrameDropMonitoring();
    this.setupNetworkMonitoring();

    // Periodic metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.detectPerformanceIssues();
    }, 5000); // Every 5 seconds

    console.log('Performance monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('Performance monitoring stopped');
  }

  // Memory monitoring
  private setupMemoryMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      this.collectMemoryMetrics();
    }, 2000);
  }

  private collectMemoryMetrics(): void {
    try {
      // In React Native, memory monitoring is limited
      // This would be implemented using native modules
      const memoryInfo = this.getMemoryInfo();

      this.metrics.memoryUsage = {
        used: memoryInfo.used,
        total: memoryInfo.total,
        percentage: (memoryInfo.used / memoryInfo.total) * 100,
      };

      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage: memoryInfo.used,
      });

      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots = this.memorySnapshots.slice(-100);
      }

      // Check for memory pressure
      if (this.metrics.memoryUsage.percentage > 85) {
        this.createAlert({
          type: 'memory',
          severity: 'high',
          message: 'High memory usage detected',
          metrics: this.metrics.memoryUsage,
          suggestions: [
            'Clear image cache',
            'Reduce component instances',
            'Optimize data structures',
          ],
        });
      }
    } catch (error) {
      console.error('Error collecting memory metrics:', error);
    }
  }

  // Frame drop monitoring
  private setupFrameDropMonitoring(): void {
    // Monitor frame drops using InteractionManager
    const { InteractionManager } = require('react-native');

    setInterval(() => {
      const startTime = Date.now();

      InteractionManager.runAfterInteractions(() => {
        const endTime = Date.now();
        const frameTime = endTime - startTime;

        // Expected frame time is 16.67ms (60 FPS)
        if (frameTime > 33) {
          // More than 2 frames
          this.frameDropCounts.push(frameTime);
        }

        // Calculate frame drop percentage
        const totalFrames = 60 * 5; // 5 seconds at 60 FPS
        const droppedFrames = this.frameDropCounts.length;

        this.metrics.frameDrops = {
          count: droppedFrames,
          percentage: (droppedFrames / totalFrames) * 100,
        };

        // Reset frame drop counts every 5 seconds
        this.frameDropCounts = [];
      });
    }, 5000);
  }

  // Network monitoring
  private setupNetworkMonitoring(): void {
    // Intercept fetch requests
    const originalFetch = global.fetch;

    global.fetch = async (...args) => {
      const requestStart = Date.now();
      const request: any = { startTime: requestStart, failed: false };

      this.networkRequests.push(request);

      try {
        const response = await originalFetch(...args);

        request.endTime = Date.now();

        if (!response.ok) {
          request.failed = true;
        }

        return response;
      } catch (error) {
        request.endTime = Date.now();
        request.failed = true;
        throw error;
      }
    };
  }

  // Render time tracking
  trackRenderTime(componentName: string, renderTime: number): void {
    this.renderTimes.push(renderTime);

    // Keep only last 100 render times
    if (this.renderTimes.length > 100) {
      this.renderTimes = this.renderTimes.slice(-100);
    }

    // Calculate render metrics
    this.metrics.renderTime = {
      average: this.calculateAverage(this.renderTimes),
      p95: this.calculatePercentile(this.renderTimes, 95),
      p99: this.calculatePercentile(this.renderTimes, 99),
    };

    // Check for slow renders
    if (renderTime > 100) {
      // 100ms threshold
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow render detected in ${componentName}`,
        metrics: { renderTime, componentName },
        suggestions: [
          'Use React.memo for component optimization',
          'Implement lazy loading',
          'Optimize expensive calculations',
        ],
      });
    }
  }

  // Component instance tracking for memory leak detection
  trackComponentMount(componentName: string): void {
    const currentCount = this.componentInstances.get(componentName) || 0;
    this.componentInstances.set(componentName, currentCount + 1);
  }

  trackComponentUnmount(componentName: string): void {
    const currentCount = this.componentInstances.get(componentName) || 0;
    if (currentCount > 0) {
      this.componentInstances.set(componentName, currentCount - 1);
    }
  }

  // Memory leak detection
  detectMemoryLeaks(): MemoryLeakDetection[] {
    const leaks: MemoryLeakDetection[] = [];

    for (const [
      componentName,
      instances,
    ] of this.componentInstances.entries()) {
      // If a component has more than 20 instances, it might be a leak
      if (instances > 20) {
        const memoryDelta = this.calculateMemoryDelta();

        leaks.push({
          componentName,
          instances,
          memoryDelta,
          isLeak: instances > 50, // High confidence if > 50 instances
          confidence: Math.min(instances / 50, 1),
        });
      }
    }

    return leaks;
  }

  // Bundle size analysis
  analyzeBundleSize(): void {
    // This would typically be done at build time
    const bundleAnalysis = {
      js: 2.5 * 1024 * 1024, // 2.5MB
      assets: 5.0 * 1024 * 1024, // 5MB
      total: 7.5 * 1024 * 1024, // 7.5MB
    };

    this.metrics.bundleSize = bundleAnalysis;

    // Check for large bundle size
    if (bundleAnalysis.total > 10 * 1024 * 1024) {
      // 10MB threshold
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: 'Large bundle size detected',
        metrics: bundleAnalysis,
        suggestions: [
          'Enable code splitting',
          'Implement dynamic imports',
          'Optimize images and assets',
          'Remove unused dependencies',
        ],
      });
    }
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];

    // Memory-based suggestions
    if (this.metrics.memoryUsage.percentage > 70) {
      suggestions.push('Implement image lazy loading');
      suggestions.push('Use VirtualizedList for large datasets');
      suggestions.push('Clear unused caches periodically');
    }

    // Render-based suggestions
    if (this.metrics.renderTime.average > 50) {
      suggestions.push('Use React.memo for expensive components');
      suggestions.push('Implement component memoization');
      suggestions.push('Optimize expensive calculations with useMemo');
    }

    // Network-based suggestions
    if (this.metrics.networkRequests.failed > 0) {
      suggestions.push('Implement request retry logic');
      suggestions.push('Add offline support');
      suggestions.push('Optimize API response sizes');
    }

    // Frame drop suggestions
    if (this.metrics.frameDrops.percentage > 5) {
      suggestions.push('Reduce animation complexity');
      suggestions.push('Use native driver for animations');
      suggestions.push('Implement frame-aware scheduling');
    }

    return suggestions;
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get alerts
  getAlerts(severity?: string): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
  }

  // Export performance report
  exportReport(): any {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      alerts: this.getAlerts(),
      memoryLeaks: this.detectMemoryLeaks(),
      optimizationSuggestions: this.getOptimizationSuggestions(),
      componentInstances: Object.fromEntries(this.componentInstances),
      memoryTrend: this.memorySnapshots.slice(-20), // Last 20 snapshots
    };
  }

  // Private utility methods
  private collectMetrics(): void {
    // Update network metrics
    const completedRequests = this.networkRequests.filter(req => req.endTime);
    const failedRequests = completedRequests.filter(req => req.failed);

    this.metrics.networkRequests = {
      total: completedRequests.length,
      failed: failedRequests.length,
      averageTime: this.calculateAverageRequestTime(completedRequests),
    };

    // Clean old network requests
    this.networkRequests = this.networkRequests.slice(-100);
  }

  private detectPerformanceIssues(): void {
    // Detect various performance issues
    const memoryLeaks = this.detectMemoryLeaks();

    memoryLeaks.forEach(leak => {
      if (leak.isLeak) {
        this.createAlert({
          type: 'memory',
          severity: 'high',
          message: `Memory leak detected in ${leak.componentName}`,
          metrics: leak,
          suggestions: [
            'Check component cleanup in useEffect',
            'Remove event listeners on unmount',
            'Clear timers and intervals',
          ],
        });
      }
    });
  }

  private createAlert(
    alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>,
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alertData,
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    console.warn('Performance Alert:', alert.message);
  }

  private getMemoryInfo(): { used: number; total: number } {
    // Mock implementation - would use native modules in real app
    return {
      used: Math.random() * 500 * 1024 * 1024, // Random 0-500MB
      total: 1024 * 1024 * 1024, // 1GB
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private calculateMemoryDelta(): number {
    if (this.memorySnapshots.length < 2) return 0;
    const recent = this.memorySnapshots.slice(-10);
    const older = this.memorySnapshots.slice(-20, -10);

    const recentAvg = this.calculateAverage(recent.map(s => s.usage));
    const olderAvg = this.calculateAverage(older.map(s => s.usage));

    return recentAvg - olderAvg;
  }

  private calculateAverageRequestTime(requests: any[]): number {
    if (requests.length === 0) return 0;
    const times = requests
      .filter(req => req.endTime)
      .map(req => req.endTime - req.startTime);
    return this.calculateAverage(times);
  }
}

export const performanceMonitor = new PerformanceMonitorService();
export default performanceMonitor;
