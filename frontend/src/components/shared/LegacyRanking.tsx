'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, BarChart3, TrendingUp, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { WorldCupItem } from '@/types/game';
import { LegacyItemStats, LegacyRankingData } from '@/types/legacyStats';
import { getLegacyRanking, formatSelectionRate, getPopularityColor, getSelectionBarWidth } from '@/utils/legacyStats';

interface LegacyRankingProps {
  tournamentTitle: string;
  worldcupId: string;
  winner: WorldCupItem;
  allItems: WorldCupItem[];
  onBack: () => void;
  onGoHome?: () => void;
  refreshTrigger?: number;
}

export default function LegacyRanking({ 
  tournamentTitle, 
  worldcupId,
  winner, 
  allItems, 
  onBack,
  onGoHome,
  refreshTrigger
}: LegacyRankingProps) {
  const [rankingData, setRankingData] = useState<LegacyRankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popularity' | 'selection_rate' | 'total_selections'>('popularity');

  // 레거시 스타일 랭킹 데이터 로드
  const loadLegacyRanking = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading legacy ranking for worldcup:', worldcupId);
      const data = await getLegacyRanking(worldcupId);
      console.log('📊 Legacy ranking loaded:', data);
      setRankingData(data);
    } catch (error) {
      console.error('❌ Failed to load legacy ranking:', error);
      setRankingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (worldcupId) {
      loadLegacyRanking();
    }
  }, [worldcupId, refreshTrigger]);

  // 정렬된 데이터
  const sortedStats = rankingData?.stats ? [...rankingData.stats].sort((a, b) => {
    switch (sortBy) {
      case 'selection_rate':
        return b.selection_rate - a.selection_rate;
      case 'total_selections':
        return b.total_selections - a.total_selections;
      default:
        return a.popularity_rank - b.popularity_rank;
    }
  }) : [];

  // 최대 선택률 (막대 그래프 정규화용)
  const maxSelectionRate = Math.max(...(rankingData?.stats.map(s => s.selection_rate) || [0]));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">레거시 스타일 랭킹 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-lg">돌아가기</span>
            </button>
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
              >
                <Home className="w-6 h-6" />
                <span className="text-lg">홈으로</span>
              </button>
            )}
            <button
              onClick={loadLegacyRanking}
              disabled={isLoading}
              className={`flex items-center space-x-2 text-white hover:text-gray-300 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-lg">새로고침</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">🏆 인기 랭킹</h1>
            <p className="text-gray-300">{tournamentTitle}</p>
            <p className="text-sm text-gray-400 mt-1">
              전체 사용자들이 얼마나 많이 선택했는지 보여주는 랭킹입니다
            </p>
          </div>
          
          <div className="w-32" />
        </motion.div>

        {/* 통계 요약 */}
        {rankingData?.summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white">총 플레이어</h3>
              <p className="text-2xl font-bold text-blue-400">{rankingData.summary.total_players.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white">총 대결수</h3>
              <p className="text-2xl font-bold text-green-400">{rankingData.summary.total_matches.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white">평균 선택률</h3>
              <p className="text-2xl font-bold text-yellow-400">{formatSelectionRate(rankingData.summary.avg_selection_rate)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white">1위 선택률</h3>
              <p className="text-2xl font-bold text-purple-400">{formatSelectionRate(rankingData.summary.most_popular_rate)}</p>
            </div>
          </motion.div>
        )}

        {/* 정렬 옵션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-4 mb-6"
        >
          <button
            onClick={() => setSortBy('popularity')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'popularity' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>인기순</span>
          </button>
          <button
            onClick={() => setSortBy('selection_rate')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'selection_rate' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>선택률순</span>
          </button>
          <button
            onClick={() => setSortBy('total_selections')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'total_selections' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>총 선택수</span>
          </button>
        </motion.div>

        {/* 랭킹 헤더 */}
        <div className="bg-gray-800/50 rounded-xl p-4 text-white font-semibold mb-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1 text-center">순위</div>
            <div className="col-span-4">참가자</div>
            <div className="col-span-3 text-center">선택률 (레거시 스타일)</div>
            <div className="col-span-2 text-center">선택횟수</div>
            <div className="col-span-2 text-center">총 등장</div>
          </div>
        </div>

        {/* 랭킹 리스트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {sortedStats.map((item, index) => (
            <motion.div
              key={item.item_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`${item.popularity_rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300' : 'bg-white border border-gray-200 hover:border-gray-300'} rounded-xl p-4 transition-all duration-200 hover:shadow-lg`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* 순위 */}
                <div className="col-span-1 flex justify-center">
                  {item.popularity_rank <= 3 ? (
                    <div className="flex items-center justify-center w-8 h-8">
                      {item.popularity_rank === 1 && <span className="text-2xl">🥇</span>}
                      {item.popularity_rank === 2 && <span className="text-2xl">🥈</span>}
                      {item.popularity_rank === 3 && <span className="text-2xl">🥉</span>}
                    </div>
                  ) : (
                    <span className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-600">
                      {item.popularity_rank}
                    </span>
                  )}
                </div>

                {/* 참가자 정보 */}
                <div className="col-span-4 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                        🎭
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">#{item.popularity_rank}위</p>
                  </div>
                </div>

                {/* 선택률 (레거시 스타일) */}
                <div className="col-span-3 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatSelectionRate(item.selection_rate)}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getPopularityColor(item.popularity_rank, sortedStats.length)}`}
                        style={{ width: `${getSelectionBarWidth(item.selection_rate, maxSelectionRate)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 선택횟수 */}
                <div className="col-span-2 text-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {item.total_selections.toLocaleString()}
                  </span>
                  <div className="text-xs text-gray-500">번 선택됨</div>
                </div>

                {/* 총 등장 */}
                <div className="col-span-2 text-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {item.total_appearances.toLocaleString()}
                  </span>
                  <div className="text-xs text-gray-500">번 등장</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 레거시 스타일 설명 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-3">📊 레거시 스타일 랭킹이란?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-2">
                <strong>선택률:</strong> 해당 선택지가 등장했을 때 사용자들이 선택한 비율
              </p>
              <p className="mb-2">
                <strong>계산법:</strong> (선택된 횟수 ÷ 등장한 횟수) × 100
              </p>
            </div>
            <div>
              <p className="mb-2">
                <strong>의미:</strong> 전체 사용자들의 집단 지성을 반영한 실제 선호도
              </p>
              <p className="mb-2">
                <strong>색상:</strong> 빨간색(인기) → 주황색 → 노란색 → 초록색 → 파란색(비인기)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}