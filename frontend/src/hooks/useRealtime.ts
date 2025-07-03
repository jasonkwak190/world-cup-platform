import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeStats {
  worldcupId: string;
  participants: number;
  comments: number;
  likes: number;
  isOnline: number;
  lastUpdated: string;
}

interface UseRealtimeStatsOptions {
  worldcupId?: string;
  enabled?: boolean;
}

export const useRealtimeStats = ({ worldcupId, enabled = false }: UseRealtimeStatsOptions = {}) => {
  // Real-time is completely disabled - using manual refresh only
  const [stats, setStats] = useState<Map<string, RealtimeStats>>(new Map());
  const [isConnected] = useState(false); // Always false
  const [channel] = useState<RealtimeChannel | null>(null); // Always null
  const [hasError] = useState(false); // Always false

  const updateStats = useCallback((id: string, updates: Partial<RealtimeStats>) => {
    setStats(prev => {
      const newStats = new Map(prev);
      const current = newStats.get(id) || {
        worldcupId: id,
        participants: 0,
        comments: 0,
        likes: 0,
        isOnline: 0,
        lastUpdated: new Date().toISOString(),
      };
      
      newStats.set(id, {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString(),
      });
      
      return newStats;
    });
  }, []);

  // Real-time subscription completely disabled - no useEffect needed

  // Manual refresh function
  const refreshStats = useCallback(async (id?: string) => {
    try {
      const query = supabase
        .from('worldcups')
        .select('id, participants, comments, likes');
      
      if (id) {
        query.eq('id', id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        data.forEach(record => {
          updateStats(record.id, {
            participants: record.participants || 0,
            comments: record.comments || 0,
            likes: record.likes || 0,
          });
        });
      }
    } catch (error) {
      console.error('❌ Failed to refresh stats:', error);
    }
  }, [updateStats]);

  // Get stats for a specific worldcup
  const getStats = useCallback((id: string) => {
    return stats.get(id);
  }, [stats]);

  // Send presence update (disabled)
  const sendPresence = useCallback(async (worldcupId: string, action: 'viewing' | 'playing' | 'left') => {
    console.log(`Presence update disabled: ${action} for ${worldcupId}`);
  }, []);

  return {
    stats: Object.fromEntries(stats),
    isConnected,
    hasError,
    getStats,
    updateStats,
    refreshStats,
    sendPresence,
  };
};

// Hook for real-time online users count - COMPLETELY DISABLED
export const useOnlineUsers = (worldcupId?: string) => {
  // Always return 0 - no state updates or effects
  return { onlineCount: 0, onlineUsers: [] };
};