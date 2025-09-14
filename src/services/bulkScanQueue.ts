/**
 * Bulk Scan Queue Service
 *
 * Manages bulk scanning operations with queue processing and progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ocrScannerService, ParsedCardData } from './ocrScannerService';
import { Contact } from '../types/contacts';
import { trackEvent } from './analyticsService';

export interface ScanQueueItem {
  id: string;
  imageUri: string;
  filename?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ParsedCardData;
  error?: string;
  addedAt: string;
  processedAt?: string;
  retryCount: number;
  priority: number;
}

export interface BulkScanJob {
  id: string;
  name: string;
  items: ScanQueueItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
  };
  settings: {
    maxConcurrency: number;
    maxRetries: number;
    autoSave: boolean;
    notifyOnComplete: boolean;
  };
}

export interface BulkScanProgress {
  jobId: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  processingItems: number;
  currentItem?: ScanQueueItem;
  estimatedTimeRemaining?: number;
  averageProcessingTime: number;
}

class BulkScanQueue {
  private static instance: BulkScanQueue;
  private jobs: Map<string, BulkScanJob> = new Map();
  private progressCallbacks: Map<string, (progress: BulkScanProgress) => void> =
    new Map();
  private isProcessing = false;
  private processingJob: string | null = null;

  private constructor() {
    this.loadPersistedJobs();
  }

  static getInstance(): BulkScanQueue {
    if (!BulkScanQueue.instance) {
      BulkScanQueue.instance = new BulkScanQueue();
    }
    return BulkScanQueue.instance;
  }

  /**
   * Create a new bulk scan job
   */
  async createJob(
    imageUris: string[],
    name?: string,
    settings?: Partial<BulkScanJob['settings']>,
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const items: ScanQueueItem[] = imageUris.map((uri, index) => ({
      id: `item_${jobId}_${index}`,
      imageUri: uri,
      filename: this.extractFilename(uri),
      status: 'pending',
      addedAt: new Date().toISOString(),
      retryCount: 0,
      priority: index, // First images have higher priority
    }));

    const job: BulkScanJob = {
      id: jobId,
      name: name || `Bulk Scan ${new Date().toLocaleDateString()}`,
      items,
      status: 'pending',
      startedAt: new Date().toISOString(),
      progress: {
        total: items.length,
        completed: 0,
        failed: 0,
        processing: 0,
      },
      settings: {
        maxConcurrency: 2,
        maxRetries: 3,
        autoSave: true,
        notifyOnComplete: true,
        ...settings,
      },
    };

    this.jobs.set(jobId, job);
    await this.persistJobs();

    trackEvent('bulk_scan_job_created', {
      jobId,
      itemCount: items.length,
      settings: job.settings,
    });

    return jobId;
  }

  /**
   * Start processing a job
   */
  async startJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (this.isProcessing) {
      throw new Error('Another job is already processing');
    }

    job.status = 'processing';
    this.isProcessing = true;
    this.processingJob = jobId;

    trackEvent('bulk_scan_job_started', { jobId, itemCount: job.items.length });

    try {
      await this.processJob(job);
    } catch (error) {
      job.status = 'failed';
      trackEvent('bulk_scan_job_failed', { jobId, error: error.message });
      throw error;
    } finally {
      this.isProcessing = false;
      this.processingJob = null;
      await this.persistJobs();
    }
  }

  /**
   * Pause a running job
   */
  async pauseJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'processing') {
      return;
    }

    job.status = 'paused';
    await this.persistJobs();

    trackEvent('bulk_scan_job_paused', { jobId });
  }

  /**
   * Resume a paused job
   */
  async resumeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') {
      return;
    }

    if (this.isProcessing) {
      throw new Error('Another job is already processing');
    }

    await this.startJob(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    if (job.status === 'processing') {
      job.status = 'paused'; // Will be stopped by the processor
    }

    // Mark pending items as failed
    job.items.forEach(item => {
      if (item.status === 'pending') {
        item.status = 'failed';
        item.error = 'Job cancelled';
      }
    });

    await this.persistJobs();
    trackEvent('bulk_scan_job_cancelled', { jobId });
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    this.progressCallbacks.delete(jobId);
    await this.persistJobs();

    trackEvent('bulk_scan_job_deleted', { jobId });
  }

  /**
   * Get job details
   */
  getJob(jobId: string): BulkScanJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BulkScanJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }

  /**
   * Subscribe to job progress updates
   */
  subscribeToProgress(
    jobId: string,
    callback: (progress: BulkScanProgress) => void,
  ): void {
    this.progressCallbacks.set(jobId, callback);
  }

  /**
   * Unsubscribe from job progress updates
   */
  unsubscribeFromProgress(jobId: string): void {
    this.progressCallbacks.delete(jobId);
  }

  /**
   * Get job results as contacts
   */
  getJobResults(jobId: string): Contact[] {
    const job = this.jobs.get(jobId);
    if (!job) {
      return [];
    }

    return job.items
      .filter(item => item.status === 'completed' && item.result)
      .map(item => ocrScannerService.convertToContact(item.result!));
  }

  /**
   * Process a job with concurrency control
   */
  private async processJob(job: BulkScanJob): Promise<void> {
    const pendingItems = job.items.filter(item => item.status === 'pending');
    const { maxConcurrency } = job.settings;

    // Process items in batches
    for (let i = 0; i < pendingItems.length; i += maxConcurrency) {
      if (job.status === 'paused') {
        break;
      }

      const batch = pendingItems.slice(i, i + maxConcurrency);
      const promises = batch.map(item => this.processItem(job, item));

      await Promise.allSettled(promises);

      // Update progress
      this.updateJobProgress(job);
      await this.persistJobs();
    }

    // Check if job is complete
    if (job.progress.completed + job.progress.failed === job.progress.total) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();

      trackEvent('bulk_scan_job_completed', {
        jobId: job.id,
        totalItems: job.progress.total,
        completedItems: job.progress.completed,
        failedItems: job.progress.failed,
        duration:
          new Date(job.completedAt).getTime() -
          new Date(job.startedAt).getTime(),
      });

      if (job.settings.notifyOnComplete) {
        // Send notification (implement based on your notification system)
        this.sendJobCompleteNotification(job);
      }
    }
  }

  /**
   * Process a single item
   */
  private async processItem(
    job: BulkScanJob,
    item: ScanQueueItem,
  ): Promise<void> {
    item.status = 'processing';
    item.processedAt = new Date().toISOString();

    try {
      const result = await ocrScannerService.processImage(item.imageUri);
      item.result = result;
      item.status = 'completed';

      trackEvent('bulk_scan_item_completed', {
        jobId: job.id,
        itemId: item.id,
        confidence: result.confidence,
      });
    } catch (error) {
      item.error = error.message;
      item.retryCount++;

      if (item.retryCount < job.settings.maxRetries) {
        item.status = 'pending'; // Will be retried
      } else {
        item.status = 'failed';
      }

      trackEvent('bulk_scan_item_failed', {
        jobId: job.id,
        itemId: item.id,
        error: error.message,
        retryCount: item.retryCount,
      });
    }
  }

  /**
   * Update job progress and notify subscribers
   */
  private updateJobProgress(job: BulkScanJob): void {
    const completed = job.items.filter(
      item => item.status === 'completed',
    ).length;
    const failed = job.items.filter(item => item.status === 'failed').length;
    const processing = job.items.filter(
      item => item.status === 'processing',
    ).length;

    job.progress = {
      total: job.items.length,
      completed,
      failed,
      processing,
    };

    // Calculate estimated time remaining
    const completedItems = completed + failed;
    const remainingItems = job.progress.total - completedItems;

    if (completedItems > 0 && job.startedAt) {
      const elapsedTime = Date.now() - new Date(job.startedAt).getTime();
      const averageTime = elapsedTime / completedItems;
      const estimatedTimeRemaining = remainingItems * averageTime;

      const progress: BulkScanProgress = {
        jobId: job.id,
        totalItems: job.progress.total,
        completedItems: completed,
        failedItems: failed,
        processingItems: processing,
        estimatedTimeRemaining,
        averageProcessingTime: averageTime,
      };

      // Notify subscriber
      const callback = this.progressCallbacks.get(job.id);
      if (callback) {
        callback(progress);
      }
    }
  }

  /**
   * Send job completion notification
   */
  private sendJobCompleteNotification(job: BulkScanJob): void {
    // Implement based on your notification system
    console.log(
      `Bulk scan job "${job.name}" completed with ${job.progress.completed} successful scans`,
    );
  }

  /**
   * Extract filename from URI
   */
  private extractFilename(uri: string): string {
    const parts = uri.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Persist jobs to storage
   */
  private async persistJobs(): Promise<void> {
    try {
      const jobsData = Array.from(this.jobs.entries());
      await AsyncStorage.setItem('bulk_scan_jobs', JSON.stringify(jobsData));
    } catch (error) {
      console.error('Failed to persist bulk scan jobs:', error);
    }
  }

  /**
   * Load persisted jobs from storage
   */
  private async loadPersistedJobs(): Promise<void> {
    try {
      const jobsData = await AsyncStorage.getItem('bulk_scan_jobs');
      if (jobsData) {
        const entries: [string, BulkScanJob][] = JSON.parse(jobsData);
        this.jobs = new Map(entries);

        // Reset processing status for jobs that were interrupted
        this.jobs.forEach(job => {
          if (job.status === 'processing') {
            job.status = 'paused';
          }
          job.items.forEach(item => {
            if (item.status === 'processing') {
              item.status = 'pending';
            }
          });
        });
      }
    } catch (error) {
      console.error('Failed to load persisted bulk scan jobs:', error);
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(
    maxAge: number = 7 * 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const cutoffDate = new Date(Date.now() - maxAge);

    const jobsToDelete: string[] = [];
    this.jobs.forEach((job, jobId) => {
      if (job.status === 'completed' && new Date(job.startedAt) < cutoffDate) {
        jobsToDelete.push(jobId);
      }
    });

    for (const jobId of jobsToDelete) {
      await this.deleteJob(jobId);
    }

    trackEvent('bulk_scan_jobs_cleaned', { deletedCount: jobsToDelete.length });
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(job => job.status === 'pending').length,
      processingJobs: jobs.filter(job => job.status === 'processing').length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      pausedJobs: jobs.filter(job => job.status === 'paused').length,
      totalItems: jobs.reduce((sum, job) => sum + job.progress.total, 0),
      completedItems: jobs.reduce(
        (sum, job) => sum + job.progress.completed,
        0,
      ),
      failedItems: jobs.reduce((sum, job) => sum + job.progress.failed, 0),
    };
  }
}

export const bulkScanQueue = BulkScanQueue.getInstance();
export default BulkScanQueue;
