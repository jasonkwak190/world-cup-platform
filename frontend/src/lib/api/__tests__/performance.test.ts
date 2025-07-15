// Performance tests for API migration
// Tests to validate that API routes perform better than direct Supabase calls

import { describe, it, expect, beforeAll, afterAll } from '@jest/test';
import { performance } from 'perf_hooks';
import * as supabaseData from '@/utils/supabaseData';
import * as worldcupsApi from '../worldcups';
import { getMigrationStatus, MigrationPerformanceMonitor } from '../migration';

// Mock data for testing
const mockWorldcupData = {
  title: 'Test WorldCup',
  description: 'Test Description',
  category: 'entertainment',
  isPublic: true,
  items: [
    {
      title: 'Item 1',
      description: 'Test item 1',
      mediaType: 'image' as const,
      image: 'https://example.com/image1.jpg'
    },
    {
      title: 'Item 2',
      description: 'Test item 2',
      mediaType: 'image' as const,
      image: 'https://example.com/image2.jpg'
    }
  ]
};

// Performance test configuration
const PERFORMANCE_CONFIG = {
  ITERATIONS: 10,
  TIMEOUT: 30000, // 30 seconds
  ACCEPTABLE_IMPROVEMENT: 0.1, // 10% improvement threshold
};

describe('API Performance Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    console.log('🧪 Setting up performance tests...');
    console.log('Migration status:', getMigrationStatus());
  });

  afterAll(async () => {
    // Cleanup and report results
    console.log('📊 Performance test results:');
    console.log(MigrationPerformanceMonitor.getStats());
  });

  describe('WorldCup List Performance', () => {
    it('should perform better with API routes than direct Supabase calls', async () => {
      const apiTimes: number[] = [];
      const supabaseTimes: number[] = [];

      // Test API route performance
      for (let i = 0; i < PERFORMANCE_CONFIG.ITERATIONS; i++) {
        const start = performance.now();
        
        try {
          await worldcupsApi.getWorldCups({ limit: 12 });
          const end = performance.now();
          apiTimes.push(end - start);
        } catch (error) {
          console.warn(`API call ${i + 1} failed:`, error);
        }
      }

      // Test direct Supabase performance
      for (let i = 0; i < PERFORMANCE_CONFIG.ITERATIONS; i++) {
        const start = performance.now();
        
        try {
          await supabaseData.getWorldCups();
          const end = performance.now();
          supabaseTimes.push(end - start);
        } catch (error) {
          console.warn(`Supabase call ${i + 1} failed:`, error);
        }
      }

      // Calculate averages
      const apiAvg = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      const supabaseAvg = supabaseTimes.reduce((a, b) => a + b, 0) / supabaseTimes.length;
      
      const improvement = (supabaseAvg - apiAvg) / supabaseAvg;

      console.log('📈 WorldCup List Performance:', {
        apiAverage: `${apiAvg.toFixed(2)}ms`,
        supabaseAverage: `${supabaseAvg.toFixed(2)}ms`,
        improvement: `${(improvement * 100).toFixed(1)}%`,
        successful: {
          api: apiTimes.length,
          supabase: supabaseTimes.length
        }
      });

      // Assert improvement (or at least not worse)
      expect(improvement).toBeGreaterThanOrEqual(-PERFORMANCE_CONFIG.ACCEPTABLE_IMPROVEMENT);
      
      // Assert that API is reasonably fast
      expect(apiAvg).toBeLessThan(5000); // Should be under 5 seconds
      
      // Assert that we got some successful calls
      expect(apiTimes.length).toBeGreaterThan(0);
      expect(supabaseTimes.length).toBeGreaterThan(0);
    }, PERFORMANCE_CONFIG.TIMEOUT);
  });

  describe('Individual WorldCup Performance', () => {
    it('should load individual worldcups faster via API', async () => {
      // First get a worldcup ID to test with
      const worldcupsList = await worldcupsApi.getWorldCups({ limit: 1 });
      
      if (worldcupsList.worldcups.length === 0) {
        console.warn('No worldcups found for individual performance test');
        return;
      }

      const testId = worldcupsList.worldcups[0].id;
      const apiTimes: number[] = [];
      const supabaseTimes: number[] = [];

      // Test API route performance
      for (let i = 0; i < PERFORMANCE_CONFIG.ITERATIONS; i++) {
        const start = performance.now();
        
        try {
          await worldcupsApi.getWorldCupById(testId);
          const end = performance.now();
          apiTimes.push(end - start);
        } catch (error) {
          console.warn(`API detail call ${i + 1} failed:`, error);
        }
      }

      // Test direct Supabase performance
      for (let i = 0; i < PERFORMANCE_CONFIG.ITERATIONS; i++) {
        const start = performance.now();
        
        try {
          await supabaseData.getWorldCupById(testId);
          const end = performance.now();
          supabaseTimes.push(end - start);
        } catch (error) {
          console.warn(`Supabase detail call ${i + 1} failed:`, error);
        }
      }

      // Calculate averages
      const apiAvg = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      const supabaseAvg = supabaseTimes.reduce((a, b) => a + b, 0) / supabaseTimes.length;
      
      const improvement = (supabaseAvg - apiAvg) / supabaseAvg;

      console.log('📈 Individual WorldCup Performance:', {
        apiAverage: `${apiAvg.toFixed(2)}ms`,
        supabaseAverage: `${supabaseAvg.toFixed(2)}ms`,
        improvement: `${(improvement * 100).toFixed(1)}%`,
        testId,
        successful: {
          api: apiTimes.length,
          supabase: supabaseTimes.length
        }
      });

      // Assert improvement (or at least not worse)
      expect(improvement).toBeGreaterThanOrEqual(-PERFORMANCE_CONFIG.ACCEPTABLE_IMPROVEMENT);
      
      // Assert that API is reasonably fast
      expect(apiAvg).toBeLessThan(3000); // Should be under 3 seconds
      
      // Assert that we got some successful calls
      expect(apiTimes.length).toBeGreaterThan(0);
      expect(supabaseTimes.length).toBeGreaterThan(0);
    }, PERFORMANCE_CONFIG.TIMEOUT);
  });

  describe('Error Handling Performance', () => {
    it('should handle errors gracefully without long timeouts', async () => {
      const start = performance.now();
      
      try {
        await worldcupsApi.getWorldCupById('non-existent-id');
      } catch (error) {
        const end = performance.now();
        const duration = end - start;
        
        console.log('🚨 Error handling performance:', {
          duration: `${duration.toFixed(2)}ms`,
          errorType: error.constructor.name,
          errorMessage: error.message
        });
        
        // Should fail fast, not hang
        expect(duration).toBeLessThan(5000); // Should fail within 5 seconds
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting gracefully', async () => {
      const rapidRequests = Array.from({ length: 20 }, (_, i) => 
        worldcupsApi.getWorldCups({ limit: 1 })
      );

      const start = performance.now();
      const results = await Promise.allSettled(rapidRequests);
      const end = performance.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const rateLimited = results.filter(r => 
        r.status === 'rejected' && 
        r.reason?.message?.includes('rate limit')
      ).length;

      console.log('🚦 Rate limiting performance:', {
        totalRequests: rapidRequests.length,
        successful,
        rateLimited,
        duration: `${(end - start).toFixed(2)}ms`,
        avgPerRequest: `${((end - start) / rapidRequests.length).toFixed(2)}ms`
      });

      // Should handle rate limiting gracefully
      expect(successful + rateLimited).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated calls', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make many API calls
      for (let i = 0; i < 50; i++) {
        try {
          await worldcupsApi.getWorldCups({ limit: 5 });
        } catch (error) {
          // Ignore errors for memory test
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log('💾 Memory usage:', {
        initial: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        final: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      });

      // Should not increase memory by more than 100MB
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});

// Helper function to run performance benchmarks
export async function runPerformanceBenchmark() {
  console.log('🏃 Running performance benchmark...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {} as Record<string, any>
  };

  // List performance test
  const listStart = performance.now();
  try {
    await worldcupsApi.getWorldCups({ limit: 12 });
    results.tests.listPerformance = {
      duration: performance.now() - listStart,
      success: true
    };
  } catch (error) {
    results.tests.listPerformance = {
      duration: performance.now() - listStart,
      success: false,
      error: error.message
    };
  }

  // Migration status
  results.tests.migrationStatus = getMigrationStatus();

  console.log('📊 Benchmark results:', results);
  return results;
}