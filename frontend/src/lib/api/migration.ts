// Migration helper for transitioning from direct Supabase calls to API routes
// This helps maintain backward compatibility while migrating incrementally

import { cache } from '@/utils/cache';
import * as supabaseData from '@/utils/supabaseData';
import * as worldcupsApi from './worldcups';

// Feature flags for gradual migration
const FEATURE_FLAGS = {
  USE_API_FOR_LIST: process.env.NODE_ENV === 'production' || process.env.USE_API_MIGRATION === 'true',
  USE_API_FOR_DETAIL: process.env.NODE_ENV === 'production' || process.env.USE_API_MIGRATION === 'true',
  USE_API_FOR_STATS: process.env.NODE_ENV === 'production' || process.env.USE_API_MIGRATION === 'true',
  USE_API_FOR_VOTING: process.env.NODE_ENV === 'production' || process.env.USE_API_MIGRATION === 'true',
  USE_API_FOR_MUTATIONS: process.env.NODE_ENV === 'production' || process.env.USE_API_MIGRATION === 'true',
};

/**
 * Migrated getWorldCups function
 * Routes to API or legacy Supabase based on feature flag
 */
export async function getWorldCups(): Promise<any[]> {
  const cacheKey = 'worldcups_list_migrated';
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log('✅ Using cached worldcups data (migration)');
    return cachedData;
  }

  try {
    let worldcups;
    
    if (FEATURE_FLAGS.USE_API_FOR_LIST) {
      console.log('🔄 Using API route for worldcups list');
      const response = await worldcupsApi.getWorldCups({ limit: 12 });
      worldcups = response.worldcups;
    } else {
      console.log('🔄 Using legacy Supabase for worldcups list');
      worldcups = await supabaseData.getWorldCups();
    }

    // Cache the result
    cache.set(cacheKey, worldcups, 2 * 60 * 1000); // 2 minutes
    
    return worldcups;
  } catch (error) {
    console.error('Migration error in getWorldCups:', error);
    
    // Fallback to legacy method
    console.log('🔄 Falling back to legacy Supabase method');
    return await supabaseData.getWorldCups();
  }
}

/**
 * Migrated getWorldCupById function
 */
export async function getWorldCupById(id: string): Promise<any> {
  try {
    if (FEATURE_FLAGS.USE_API_FOR_DETAIL) {
      console.log('🔄 Using API route for worldcup detail');
      return await worldcupsApi.getWorldCupById(id);
    } else {
      console.log('🔄 Using legacy Supabase for worldcup detail');
      return await supabaseData.getWorldCupById(id);
    }
  } catch (error) {
    console.error('Migration error in getWorldCupById:', error);
    
    // Fallback to legacy method
    console.log('🔄 Falling back to legacy Supabase method');
    return await supabaseData.getWorldCupById(id);
  }
}

/**
 * Migrated updateWorldCupStats function
 */
export async function updateWorldCupStats(
  id: string, 
  stats: { participants?: number; likes?: number; comments?: number }
): Promise<boolean> {
  try {
    if (FEATURE_FLAGS.USE_API_FOR_STATS) {
      console.log('🔄 Using API route for stats update');
      
      // Convert legacy stats format to API format
      const promises = [];
      
      if (stats.participants !== undefined) {
        // For participants, we increment by 1 (assuming this is a play action)
        promises.push(worldcupsApi.updateWorldCupStats(id, 'increment_participants'));
      }
      
      if (stats.likes !== undefined) {
        promises.push(worldcupsApi.updateWorldCupStats(id, 'increment_likes', stats.likes));
      }
      
      if (stats.comments !== undefined) {
        promises.push(worldcupsApi.updateWorldCupStats(id, 'increment_comments', stats.comments));
      }
      
      await Promise.all(promises);
      return true;
    } else {
      console.log('🔄 Using legacy Supabase for stats update');
      return await supabaseData.updateWorldCupStats(id, stats);
    }
  } catch (error) {
    console.error('Migration error in updateWorldCupStats:', error);
    
    // Fallback to legacy method
    console.log('🔄 Falling back to legacy Supabase method');
    return await supabaseData.updateWorldCupStats(id, stats);
  }
}

/**
 * Migrated deleteWorldCup function
 */
export async function deleteWorldCup(id: string): Promise<{
  success: boolean;
  error?: string;
  storageErrors?: string[];
}> {
  try {
    if (FEATURE_FLAGS.USE_API_FOR_MUTATIONS) {
      console.log('🔄 Using API route for worldcup deletion');
      const result = await worldcupsApi.deleteWorldCup(id);
      return {
        success: true,
        // Add any additional data from API response
      };
    } else {
      console.log('🔄 Using legacy Supabase for worldcup deletion');
      return await supabaseData.deleteWorldCup(id);
    }
  } catch (error) {
    console.error('Migration error in deleteWorldCup:', error);
    
    // Fallback to legacy method
    console.log('🔄 Falling back to legacy Supabase method');
    return await supabaseData.deleteWorldCup(id);
  }
}

/**
 * Migrated getUserWorldCups function
 */
export async function getUserWorldCups(userId: string): Promise<any[]> {
  try {
    if (FEATURE_FLAGS.USE_API_FOR_LIST) {
      console.log('🔄 Using API route for user worldcups');
      return await worldcupsApi.getUserWorldCups(userId);
    } else {
      console.log('🔄 Using legacy Supabase for user worldcups');
      return await supabaseData.getUserWorldCups(userId);
    }
  } catch (error) {
    console.error('Migration error in getUserWorldCups:', error);
    
    // Fallback to legacy method
    console.log('🔄 Falling back to legacy Supabase method');
    return await supabaseData.getUserWorldCups(userId);
  }
}

/**
 * Migrated voting function
 */
export async function submitVote(
  worldcupId: string,
  winnerId: string,
  loserId: string,
  roundType?: string,
  sessionId?: string
): Promise<boolean> {
  try {
    if (FEATURE_FLAGS.USE_API_FOR_VOTING) {
      console.log('🔄 Using API route for voting');
      await worldcupsApi.submitVote(worldcupId, {
        winnerId,
        loserId,
        roundType: roundType as any,
        sessionId
      });
      return true;
    } else {
      console.log('🔄 Using legacy Supabase for voting');
      // Legacy voting logic would go here
      // For now, just return true as voting wasn't in the original supabaseData
      return true;
    }
  } catch (error) {
    console.error('Migration error in submitVote:', error);
    return false;
  }
}

/**
 * Performance monitoring for migration
 */
export class MigrationPerformanceMonitor {
  private static timings = new Map<string, number[]>();
  
  static startTiming(operation: string): number {
    return Date.now();
  }
  
  static endTiming(operation: string, startTime: number, method: 'api' | 'legacy'): void {
    const duration = Date.now() - startTime;
    const key = `${operation}_${method}`;
    
    if (!this.timings.has(key)) {
      this.timings.set(key, []);
    }
    
    this.timings.get(key)!.push(duration);
    
    // Keep only last 100 measurements
    if (this.timings.get(key)!.length > 100) {
      this.timings.get(key)!.shift();
    }
    
    // Log performance comparison
    if (this.timings.has(`${operation}_api`) && this.timings.has(`${operation}_legacy`)) {
      const apiTimes = this.timings.get(`${operation}_api`)!;
      const legacyTimes = this.timings.get(`${operation}_legacy`)!;
      
      const apiAvg = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      const legacyAvg = legacyTimes.reduce((a, b) => a + b, 0) / legacyTimes.length;
      
      console.log(`📊 Performance comparison for ${operation}:`, {
        apiAvg: `${apiAvg.toFixed(2)}ms`,
        legacyAvg: `${legacyAvg.toFixed(2)}ms`,
        improvement: `${((legacyAvg - apiAvg) / legacyAvg * 100).toFixed(1)}%`
      });
    }
  }
  
  static getStats(): Record<string, { avg: number; count: number }> {
    const stats: Record<string, { avg: number; count: number }> = {};
    
    for (const [key, timings] of this.timings.entries()) {
      stats[key] = {
        avg: timings.reduce((a, b) => a + b, 0) / timings.length,
        count: timings.length
      };
    }
    
    return stats;
  }
}

// Export flags for debugging
export const migrationFlags = FEATURE_FLAGS;

// Migration status helper
export function getMigrationStatus() {
  return {
    flags: FEATURE_FLAGS,
    stats: MigrationPerformanceMonitor.getStats(),
    environment: process.env.NODE_ENV,
    migrationEnabled: process.env.USE_API_MIGRATION === 'true'
  };
}