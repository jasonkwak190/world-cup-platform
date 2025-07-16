/**
 * Autosave Cleanup Scheduler
 * 
 * This module provides utilities for scheduling and managing autosave cleanup operations.
 * It supports both manual cleanup and automated scheduling via cron jobs.
 */

export interface CleanupConfig {
  // Cleanup intervals in days
  expiredPlaySaves: number; // Default: 7 days
  oldDraftSaves: number; // Default: 30 days
  
  // Cleanup schedule (cron format)
  cronSchedule: string; // Default: '0 2 * * *' (daily at 2 AM)
  
  // Batch processing limits
  maxBatchSize: number; // Default: 100
  processingDelayMs: number; // Default: 1000ms
  
  // Retry configuration
  maxRetries: number; // Default: 3
  retryDelayMs: number; // Default: 5000ms
}

export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  expiredPlaySaves: 7,
  oldDraftSaves: 30,
  cronSchedule: '0 2 * * *', // Daily at 2 AM
  maxBatchSize: 100,
  processingDelayMs: 1000,
  maxRetries: 3,
  retryDelayMs: 5000,
};

export class AutosaveCleanupScheduler {
  private config: CleanupConfig;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private nextRunTime: Date | null = null;
  private cleanupStats: CleanupStats | null = null;

  constructor(config: Partial<CleanupConfig> = {}) {
    this.config = { ...DEFAULT_CLEANUP_CONFIG, ...config };
  }

  /**
   * Execute cleanup with retry logic
   */
  async executeCleanup(dryRun: boolean = false): Promise<CleanupResult> {
    if (this.isRunning) {
      throw new Error('Cleanup is already running');
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    try {
      const result = await this.performCleanupWithRetry(dryRun);
      this.cleanupStats = result.stats;
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Perform cleanup with retry logic
   */
  private async performCleanupWithRetry(dryRun: boolean): Promise<CleanupResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🧹 Starting cleanup attempt ${attempt}/${this.config.maxRetries}`);
        
        const result = await this.performCleanup(dryRun);
        
        console.log(`✅ Cleanup completed successfully on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`❌ Cleanup attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          console.log(`⏱️ Waiting ${this.config.retryDelayMs}ms before retry...`);
          await this.delay(this.config.retryDelayMs);
        }
      }
    }

    throw new Error(`Cleanup failed after ${this.config.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Perform the actual cleanup operation
   */
  private async performCleanup(dryRun: boolean): Promise<CleanupResult> {
    const startTime = Date.now();
    const stats: CleanupStats = {
      totalProcessed: 0,
      expiredPlaySaves: 0,
      oldDraftSaves: 0,
      orphanedSaves: 0,
      totalSizeFreed: 0,
      errors: [],
      processingTime: 0,
    };

    try {
      // Clean expired play saves
      console.log('🔄 Cleaning expired play saves...');
      const expiredPlayResult = await this.cleanupExpiredPlaySaves(dryRun);
      stats.expiredPlaySaves = expiredPlayResult.count;
      stats.totalSizeFreed += expiredPlayResult.sizeFreed;
      stats.totalProcessed += expiredPlayResult.count;

      // Clean old draft saves
      console.log('🔄 Cleaning old draft saves...');
      const oldDraftResult = await this.cleanupOldDraftSaves(dryRun);
      stats.oldDraftSaves = oldDraftResult.count;
      stats.totalSizeFreed += oldDraftResult.sizeFreed;
      stats.totalProcessed += oldDraftResult.count;

      // Clean orphaned saves
      console.log('🔄 Cleaning orphaned saves...');
      const orphanedResult = await this.cleanupOrphanedSaves(dryRun);
      stats.orphanedSaves = orphanedResult.count;
      stats.totalSizeFreed += orphanedResult.sizeFreed;
      stats.totalProcessed += orphanedResult.count;

      stats.processingTime = Date.now() - startTime;

      return {
        success: true,
        dryRun,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
      stats.processingTime = Date.now() - startTime;
      
      return {
        success: false,
        dryRun,
        stats,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean expired play saves
   */
  private async cleanupExpiredPlaySaves(dryRun: boolean): Promise<CleanupOperationResult> {
    const response = await fetch('/api/autosave/cleanup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'development',
      },
      body: JSON.stringify({
        type: 'expired',
        dryRun,
        maxAge: this.config.expiredPlaySaves * 24 * 60 * 60 * 1000, // Convert days to ms
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cleanup expired play saves: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      count: data.deleted_count || 0,
      sizeFreed: data.size_freed || 0,
    };
  }

  /**
   * Clean old draft saves
   */
  private async cleanupOldDraftSaves(dryRun: boolean): Promise<CleanupOperationResult> {
    const response = await fetch('/api/autosave/cleanup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'development',
      },
      body: JSON.stringify({
        type: 'old',
        dryRun,
        maxAge: this.config.oldDraftSaves * 24 * 60 * 60 * 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cleanup old draft saves: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      count: data.deleted_count || 0,
      sizeFreed: data.size_freed || 0,
    };
  }

  /**
   * Clean orphaned saves
   */
  private async cleanupOrphanedSaves(dryRun: boolean): Promise<CleanupOperationResult> {
    const response = await fetch('/api/autosave/cleanup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'development',
      },
      body: JSON.stringify({
        type: 'orphaned',
        dryRun,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cleanup orphaned saves: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      count: data.deleted_count || 0,
      sizeFreed: data.size_freed || 0,
    };
  }

  /**
   * Get cleanup status and statistics
   */
  getStatus(): CleanupStatus {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      config: this.config,
      stats: this.cleanupStats,
    };
  }

  /**
   * Calculate next run time based on cron schedule
   */
  calculateNextRunTime(): Date {
    // This is a simplified calculation - in production, use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM next day
    return tomorrow;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate cleanup configuration
   */
  static validateConfig(config: Partial<CleanupConfig>): string[] {
    const errors: string[] = [];
    
    if (config.expiredPlaySaves !== undefined && config.expiredPlaySaves < 1) {
      errors.push('expiredPlaySaves must be at least 1 day');
    }
    
    if (config.oldDraftSaves !== undefined && config.oldDraftSaves < 1) {
      errors.push('oldDraftSaves must be at least 1 day');
    }
    
    if (config.maxBatchSize !== undefined && config.maxBatchSize < 1) {
      errors.push('maxBatchSize must be at least 1');
    }
    
    if (config.maxRetries !== undefined && config.maxRetries < 1) {
      errors.push('maxRetries must be at least 1');
    }
    
    return errors;
  }
}

// Type definitions
export interface CleanupStats {
  totalProcessed: number;
  expiredPlaySaves: number;
  oldDraftSaves: number;
  orphanedSaves: number;
  totalSizeFreed: number;
  errors: string[];
  processingTime: number;
}

export interface CleanupResult {
  success: boolean;
  dryRun: boolean;
  stats: CleanupStats;
  timestamp: string;
  error?: string;
}

export interface CleanupOperationResult {
  count: number;
  sizeFreed: number;
}

export interface CleanupStatus {
  isRunning: boolean;
  lastRunTime: Date | null;
  nextRunTime: Date | null;
  config: CleanupConfig;
  stats: CleanupStats | null;
}

// Global scheduler instance
let globalScheduler: AutosaveCleanupScheduler | null = null;

/**
 * Get or create the global scheduler instance
 */
export function getGlobalScheduler(config?: Partial<CleanupConfig>): AutosaveCleanupScheduler {
  if (!globalScheduler) {
    globalScheduler = new AutosaveCleanupScheduler(config);
  }
  return globalScheduler;
}

/**
 * Execute cleanup manually
 */
export async function executeManualCleanup(dryRun: boolean = false): Promise<CleanupResult> {
  const scheduler = getGlobalScheduler();
  return scheduler.executeCleanup(dryRun);
}

/**
 * Get current cleanup status
 */
export function getCleanupStatus(): CleanupStatus {
  const scheduler = getGlobalScheduler();
  return scheduler.getStatus();
}