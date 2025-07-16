#!/usr/bin/env node
/**
 * Autosave Cleanup Cron Job
 * 
 * This script is designed to be run as a cron job to periodically clean up
 * old autosave data. It can be scheduled to run daily or at any desired interval.
 * 
 * Usage:
 *   node scripts/cleanup-cron.js [--dry-run] [--config path/to/config.json]
 * 
 * Environment Variables:
 *   - CRON_SECRET: Secret key for authenticating cron requests
 *   - DATABASE_URL: Database connection string
 *   - CLEANUP_CONFIG: JSON string with cleanup configuration
 * 
 * Example cron schedule (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/cleanup-cron.js
 */

const { AutosaveCleanupScheduler, DEFAULT_CLEANUP_CONFIG } = require('../src/lib/autosave-scheduler');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const configIndex = args.indexOf('--config');
const configPath = configIndex !== -1 ? args[configIndex + 1] : null;

// Load configuration
function loadConfig() {
  let config = { ...DEFAULT_CLEANUP_CONFIG };
  
  // Load from file if specified
  if (configPath) {
    try {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configFile);
      config = { ...config, ...fileConfig };
      console.log(`📄 Loaded config from ${configPath}`);
    } catch (error) {
      console.error(`❌ Failed to load config from ${configPath}:`, error.message);
      process.exit(1);
    }
  }
  
  // Load from environment variable
  if (process.env.CLEANUP_CONFIG) {
    try {
      const envConfig = JSON.parse(process.env.CLEANUP_CONFIG);
      config = { ...config, ...envConfig };
      console.log('🌍 Loaded config from environment variable');
    } catch (error) {
      console.error('❌ Failed to parse CLEANUP_CONFIG environment variable:', error.message);
      process.exit(1);
    }
  }
  
  return config;
}

// Validate environment
function validateEnvironment() {
  const required = ['CRON_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

// Main cleanup function
async function main() {
  console.log('🧹 Starting autosave cleanup cron job...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🔄 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    console.log('⚙️ Configuration:', JSON.stringify(config, null, 2));
    
    // Validate configuration
    const configErrors = AutosaveCleanupScheduler.validateConfig(config);
    if (configErrors.length > 0) {
      console.error('❌ Configuration errors:', configErrors);
      process.exit(1);
    }
    
    // Create scheduler and execute cleanup
    const scheduler = new AutosaveCleanupScheduler(config);
    const result = await scheduler.executeCleanup(dryRun);
    
    // Log results
    console.log('📊 Cleanup Results:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Dry Run: ${result.dryRun}`);
    console.log(`  Timestamp: ${result.timestamp}`);
    console.log(`  Total Processed: ${result.stats.totalProcessed}`);
    console.log(`  Expired Play Saves: ${result.stats.expiredPlaySaves}`);
    console.log(`  Old Draft Saves: ${result.stats.oldDraftSaves}`);
    console.log(`  Orphaned Saves: ${result.stats.orphanedSaves}`);
    console.log(`  Size Freed: ${formatBytes(result.stats.totalSizeFreed)}`);
    console.log(`  Processing Time: ${result.stats.processingTime}ms`);
    
    if (result.stats.errors.length > 0) {
      console.log(`  Errors: ${result.stats.errors.length}`);
      result.stats.errors.forEach(error => console.log(`    - ${error}`));
    }
    
    if (!result.success) {
      console.error('❌ Cleanup failed:', result.error);
      process.exit(1);
    }
    
    console.log('✅ Cleanup completed successfully');
    
    // Log summary for monitoring
    logSummary(result);
    
  } catch (error) {
    console.error('❌ Cleanup cron job failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Format bytes for human readable output
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Log summary for monitoring systems
function logSummary(result) {
  const summary = {
    timestamp: result.timestamp,
    success: result.success,
    dryRun: result.dryRun,
    stats: result.stats,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    }
  };
  
  // Log as JSON for easy parsing by monitoring systems
  console.log('📋 CLEANUP_SUMMARY:', JSON.stringify(summary));
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});