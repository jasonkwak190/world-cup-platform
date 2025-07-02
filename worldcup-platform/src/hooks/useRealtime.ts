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

  // Subscribe to real-time updates - DISABLED
  useEffect(() => {
    // Real-time is completely disabled to avoid console errors
    return;

    console.log('🔄 Setting up real-time stats subscription...');

    const channelName = worldcupId ? `worldcup:${worldcupId}` : 'worldcups:all';
    const realtimeChannel = supabase.channel(channelName);

    // Listen to worldcups table changes for main stats
    realtimeChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'worldcups',
        filter: worldcupId ? `id=eq.${worldcupId}` : undefined,
      }, (payload) => {
        console.log('📊 Real-time worldcup update:', payload);
        
        if (payload.new && typeof payload.new === 'object') {
          const record = payload.new as any;
          updateStats(record.id, {
            participants: record.participants || 0,
            comments: record.comments || 0,
            likes: record.likes || 0,
          });
        }
      })
      // Listen to user_likes for like count changes  
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_likes',
        filter: worldcupId ? `worldcup_id=eq.${worldcupId}` : undefined,
      }, (payload) => {
        console.log('❤️ Real-time like added:', payload);
        
        if (payload.new && typeof payload.new === 'object') {
          const record = payload.new as any;
          if (record.worldcup_id) {
            setStats(prev => {
              const newStats = new Map(prev);
              const current = newStats.get(record.worldcup_id);
              if (current) {
                newStats.set(record.worldcup_id, {
                  ...current,
                  likes: current.likes + 1,
                  lastUpdated: new Date().toISOString(),
                });
              }
              return newStats;
            });
          }
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'user_likes',
        filter: worldcupId ? `worldcup_id=eq.${worldcupId}` : undefined,
      }, (payload) => {
        console.log('💔 Real-time like removed:', payload);
        
        if (payload.old && typeof payload.old === 'object') {
          const record = payload.old as any;
          if (record.worldcup_id) {
            setStats(prev => {
              const newStats = new Map(prev);
              const current = newStats.get(record.worldcup_id);
              if (current) {
                newStats.set(record.worldcup_id, {
                  ...current,
                  likes: Math.max(0, current.likes - 1),
                  lastUpdated: new Date().toISOString(),
                });
              }
              return newStats;
            });
          }
        }
      })
      // Track connection status
      .on('system', {}, (status) => {
        console.log('🔗 Real-time connection status:', status);
        if (status.event === 'connected') {
          setIsConnected(true);
        } else if (status.event === 'disconnected' || status.event === 'error') {
          setIsConnected(false);
        }
      })
      .subscribe((status, error) => {
        console.log('📡 Real-time subscription status:', status);
        if (error) {
          console.warn('⚠️ Real-time subscription error:', error);
          setIsConnected(false);
          setHasError(true);
          // Fallback to manual refresh mode
          console.log('🔄 Switching to manual refresh mode');
        } else {
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'SUBSCRIBED') {
            setHasError(false);
          }
        }
      });

    setChannel(realtimeChannel);

    return () => {
      console.log('🔄 Cleaning up real-time subscription...');
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
  }, [worldcupId, enabled, updateStats]);

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

  // Send presence update (user is viewing/playing)
  const sendPresence = useCallback(async (worldcupId: string, action: 'viewing' | 'playing' | 'left') => {
    if (!channel) return;

    try {
      const presenceData = {
        worldcup_id: worldcupId,
        action,
        timestamp: new Date().toISOString(),
      };

      await channel.send({
        type: 'broadcast',
        event: 'presence_update',
        payload: presenceData,
      });

      console.log('📍 Sent presence update:', presenceData);
    } catch (error) {
      console.error('❌ Failed to send presence:', error);
    }
  }, [channel]);

  return {
    stats: Object.fromEntries(stats),
    isConnected,
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
    // Real-time presence is disabled
    return;

    const channel = supabase.channel(`presence:${worldcupId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
        setOnlineCount(users.length);
        console.log('👥 Online users synced:', users.length);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('👋 User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as online
          await channel.track({
            user_id: `user_${Date.now()}`,
            worldcup_id: worldcupId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [worldcupId]);

  return { onlineCount, onlineUsers };
};