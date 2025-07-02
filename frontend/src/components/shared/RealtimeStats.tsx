'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, MessageCircle, Play, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeStats, useOnlineUsers } from '@/hooks/useRealtime';

interface RealtimeStatsProps {
  worldcupId: string;
  initialStats?: {
    participants?: number;
    comments?: number;
    likes?: number;
  };
  compact?: boolean;
  showOnlineUsers?: boolean;
}

export default function RealtimeStats({ 
  worldcupId, 
  initialStats = {}, 
  compact = false,
  showOnlineUsers = true 
}: RealtimeStatsProps) {
  // Enable real-time only if environment variable is set
  const realtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';
  
  const { stats, isConnected, getStats, sendPresence } = useRealtimeStats({ 
    worldcupId, 
    enabled: realtimeEnabled
  });
  // Disable online users until RLS is configured
  const { onlineCount } = useOnlineUsers(undefined); // Always disabled for now

  const currentStats = getStats(worldcupId) || {
    participants: initialStats.participants || 0,
    comments: initialStats.comments || 0,
    likes: initialStats.likes || 0,
    isOnline: onlineCount,
    lastUpdated: new Date().toISOString(),
  };

  // Send presence update when component mounts
  useEffect(() => {
    sendPresence(worldcupId, 'viewing');
    
    return () => {
      sendPresence(worldcupId, 'left');
    };
  }, [worldcupId, sendPresence]);

  // Animation variants
  const statVariants = {
    initial: { scale: 1 },
    updated: { 
      scale: [1, 1.1, 1],
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const StatItem = ({ 
    icon: Icon, 
    value, 
    label, 
    color = "text-gray-600",
    animated = false 
  }: {
    icon: any;
    value: number;
    label: string;
    color?: string;
    animated?: boolean;
  }) => (
    <motion.div 
      className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}
      variants={statVariants}
      animate={animated ? 'updated' : 'initial'}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="font-medium">{value.toLocaleString()}</span>
      {!compact && <span className="text-gray-500">{label}</span>}
    </motion.div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>

        {/* Stats */}
        <StatItem 
          icon={Play} 
          value={currentStats.participants} 
          label="플레이" 
          color="text-emerald-600"
        />
        <StatItem 
          icon={Heart} 
          value={currentStats.likes} 
          label="좋아요" 
          color="text-red-500"
        />
        <StatItem 
          icon={MessageCircle} 
          value={currentStats.comments} 
          label="댓글" 
          color="text-blue-500"
        />
        
        {showOnlineUsers && onlineCount > 0 && (
          <StatItem 
            icon={Users} 
            value={onlineCount} 
            label="온라인" 
            color="text-green-500"
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">실시간 통계</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? '실시간 연결됨' : '연결 끊김'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <StatItem 
            icon={Play} 
            value={currentStats.participants} 
            label="총 플레이 수" 
            color="text-emerald-600"
            animated={true}
          />
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <StatItem 
            icon={Heart} 
            value={currentStats.likes} 
            label="좋아요 수" 
            color="text-red-500"
            animated={true}
          />
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <StatItem 
            icon={MessageCircle} 
            value={currentStats.comments} 
            label="댓글 수" 
            color="text-blue-500"
            animated={true}
          />
        </div>

        {showOnlineUsers && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <StatItem 
              icon={Users} 
              value={onlineCount} 
              label="현재 접속" 
              color="text-green-500"
              animated={true}
            />
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        마지막 업데이트: {new Date(currentStats.lastUpdated).toLocaleTimeString()}
      </div>

      {/* Real-time Activity Feed */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              실시간으로 업데이트 중...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simplified version for cards
export function RealtimeStatsCard({ worldcupId, initialStats }: Omit<RealtimeStatsProps, 'compact'>) {
  return (
    <RealtimeStats
      worldcupId={worldcupId}
      initialStats={initialStats}
      compact={true}
      showOnlineUsers={false}
    />
  );
}

// Live activity indicator for game screen
export function LiveActivityIndicator({ worldcupId }: { worldcupId: string }) {
  const realtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';
  const { isConnected } = useRealtimeStats({ worldcupId, enabled: realtimeEnabled });
  const { onlineCount } = useOnlineUsers(realtimeEnabled ? worldcupId : undefined);

  if (!isConnected && onlineCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 bg-black/75 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2 z-50"
    >
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      {onlineCount > 1 && (
        <span>{onlineCount}명이 함께 보고 있어요</span>
      )}
      {onlineCount <= 1 && isConnected && (
        <span>실시간 연결됨</span>
      )}
    </motion.div>
  );
}