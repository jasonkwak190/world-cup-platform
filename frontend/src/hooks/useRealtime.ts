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
  // Real-time is disabled - using manual refresh only
  const [stats, setStats] = useState<Map<string, RealtimeStats>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hasError, setHasError] = useState(false);

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

  // Subscribe to real-time updates - DISABLED to avoid connection errors
  useEffect(() => {
    if (!enabled || !worldcupId) {
      return;
    }

    // Real-time subscription is disabled to prevent console errors
    console.log(`Real-time subscription disabled for worldcup:${worldcupId}`);
    setIsConnected(false);
    setHasError(false);
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
    };
  }, [worldcupId, enabled, channel]);

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

// Hook for real-time online users count - DISABLED
export const useOnlineUsers = (worldcupId?: string) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // Real-time presence is disabled to avoid connection errors
    console.log(`Online users tracking disabled for ${worldcupId}`);
    setOnlineCount(0);
    setOnlineUsers([]);
  }, [worldcupId]);

  return { onlineCount, onlineUsers };
};