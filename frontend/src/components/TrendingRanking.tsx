'use client';

import { TrendingUp, Crown, Users, AlertCircle } from 'lucide-react';
import { useTrending } from '@/hooks/useTrending';

function TrendingRankingContent() {
  const { data: trendingData, loading, error } = useTrending();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">인기 월드컵</h2>
        </div>
        
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg animate-pulse">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-gray-200 rounded mb-1 w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">인기 월드컵</h2>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">오류가 발생했습니다.</span>
        </div>
      </div>
    );
  }

  if (!trendingData || trendingData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">인기 월드컵</h2>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">아직 데이터가 없습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h2 className="text-base font-bold text-gray-900">인기 월드컵</h2>
      </div>
      
      <div className="space-y-2">
        {(trendingData || []).slice(0, 4).map((item) => {
          if (!item || !item.id) return null;
          
          return (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {(item.rank || 0) <= 3 ? (
                  <Crown className={`w-4 h-4 ${
                    item.rank === 1 ? 'text-yellow-500' :
                    item.rank === 2 ? 'text-gray-400' :
                    'text-amber-600'
                  }`} />
                ) : (
                  <span className="text-sm font-bold text-blue-600">{item.rank || 0}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  {item.isHot && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      HOT
                    </span>
                  )}
                  {item.isRising && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                      ↗
                    </span>
                  )}
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      NEW
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {item.title || 'Untitled'}
                </h3>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{(item.play_count || 0).toLocaleString()}회</span>
                </div>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
      
      <div className="mt-3 pt-2 border-t">
        <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium">
          더보기 →
        </button>
      </div>
    </div>
  );
}

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// 로딩 컴포넌트
function TrendingRankingLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h2 className="text-base font-bold text-gray-900">인기 월드컵</h2>
      </div>
      
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg animate-pulse">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded"></div>
            <div className="flex-1 min-w-0">
              <div className="h-3 bg-gray-200 rounded mb-1 w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 클라이언트 전용 렌더링을 위한 래퍼
function TrendingRankingWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <TrendingRankingLoading />;
  }

  return <TrendingRankingContent />;
}

export default TrendingRankingWrapper;