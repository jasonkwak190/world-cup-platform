'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, Award, ArrowLeft, BarChart3, TrendingUp, Home, X, ZoomIn } from 'lucide-react';
import { WorldCupItem } from '@/types/game';
import { generateRealRankingData, ItemStats } from '@/utils/gameStats';

interface TournamentRankingProps {
  tournamentTitle: string;
  worldcupId: string; // 월드컵 ID 추가 (통계 조회용)
  winner: WorldCupItem;
  allItems: WorldCupItem[];
  onBack: () => void;
  onGoHome?: () => void;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-8 h-8 text-yellow-500" />;
    case 2:
      return <Medal className="w-8 h-8 text-gray-400" />;
    case 3:
      return <Award className="w-8 h-8 text-orange-600" />;
    default:
      return <span className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-600">{rank}</span>;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300';
    case 3:
      return 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300';
    default:
      return 'bg-white border border-gray-200 hover:border-gray-300';
  }
};

export default function TournamentRanking({ 
  tournamentTitle, 
  worldcupId,
  winner, 
  allItems, 
  onBack,
  onGoHome
}: TournamentRankingProps) {
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'matches'>('rank');
  const [selectedImage, setSelectedImage] = useState<{ title: string; rank: number; image?: string } | null>(null);
  
  // 실제 통계 데이터 사용
  const rankingData = generateRealRankingData(worldcupId, winner);
  
  // 통계가 없는 경우 기본 데이터 생성 (첫 게임 등)
  const fallbackData = rankingData.length === 0 ? allItems.map((item, index) => ({
    id: item.id,
    title: item.title,
    image: item.image || item.image_url,
    totalAppearances: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    roundStats: {},
    championshipWins: 0,
    finalAppearances: 0,
    vsRecord: {},
    rank: index + 1,
    averageRoundReached: 0,
    bestRoundReached: '1라운드'
  } as ItemStats)) : rankingData;

  const sortedData = [...fallbackData].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'matches':
        return b.totalAppearances - a.totalAppearances;
      default:
        return a.rank - b.rank;
    }
  });

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
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">토너먼트 랭킹</h1>
            <p className="text-gray-300">{tournamentTitle}</p>
          </div>
          
          <div className="w-32" /> {/* Spacer for center alignment */}
        </motion.div>

        {/* Winner Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-8 mb-8 text-center"
        >
          <Trophy className="w-16 h-16 text-white mx-auto mb-4" />
          {winner.image && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-white/30">
              <img 
                src={winner.image} 
                alt={winner.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <h2 className="text-3xl font-bold text-white mb-2">🏆 우승자</h2>
          <h3 className="text-2xl font-bold text-white">{winner.title}</h3>
          {winner.description && (
            <p className="text-yellow-100 mt-2">{winner.description}</p>
          )}
        </motion.div>

        {/* Sort Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-4 mb-6"
        >
          <button
            onClick={() => setSortBy('rank')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'rank' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>순위순</span>
          </button>
          <button
            onClick={() => setSortBy('winRate')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'winRate' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>승률순</span>
          </button>
          <button
            onClick={() => setSortBy('matches')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'matches' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>경기수순</span>
          </button>
        </motion.div>

        {/* Ranking List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Header Row */}
          <div className="bg-gray-800/50 rounded-xl p-4 text-white font-semibold">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1 text-center">순위</div>
              <div className="col-span-4">참가자</div>
              <div className="col-span-2 text-center">도달 라운드</div>
              <div className="col-span-2 text-center">승률</div>
              <div className="col-span-2 text-center">전적</div>
              <div className="col-span-1 text-center">상태</div>
            </div>
          </div>

          {/* Ranking Items */}
          {sortedData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`${getRankStyle(item.rank)} rounded-xl p-4 transition-all duration-200 hover:shadow-lg`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  {getRankIcon(item.rank)}
                </div>

                {/* Participant Info */}
                <div className="col-span-4 flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer hover:scale-110 transition-transform relative group"
                    onClick={() => setSelectedImage({ title: item.title, rank: item.rank, image: item.image })}
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 이미지 로딩 실패 시 플레이스홀더 표시
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.ranking-fallback');
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div className={`ranking-fallback ${item.image ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl`}>
                      {item.rank === 1 ? '🎭' : '🎨'}
                    </div>
                    <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Best Round Reached */}
                <div className="col-span-2 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.championshipWins > 0 ? 'bg-yellow-100 text-yellow-800' :
                    item.bestRoundReached === '결승' ? 'bg-silver-100 text-gray-700' :
                    item.bestRoundReached === '준결승' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.championshipWins > 0 ? `우승 ${item.championshipWins}회` : item.bestRoundReached}
                  </span>
                </div>

                {/* Win Rate */}
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(item.winRate)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{Math.round(item.winRate)}%</span>
                  </div>
                </div>

                {/* Match Record */}
                <div className="col-span-2 text-center">
                  <span className="text-sm text-gray-700">
                    {item.totalWins}승 {item.totalLosses}패
                  </span>
                  <div className="text-xs text-gray-500">
                    (총 {item.totalAppearances}경기)
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  {item.rank === 1 && (
                    <span className="text-2xl">👑</span>
                  )}
                  {item.rank === 2 && (
                    <span className="text-2xl">🥈</span>
                  )}
                  {item.rank === 3 && (
                    <span className="text-2xl">🥉</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Statistics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">총 참가자</h3>
            <p className="text-3xl font-bold text-blue-400">{allItems.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">총 게임 수</h3>
            <p className="text-3xl font-bold text-green-400">
              {fallbackData.length > 0 ? Math.max(...fallbackData.map(item => item.totalAppearances)) : 0}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">최고 승률</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {fallbackData.length > 0 ? Math.round(Math.max(...fallbackData.map(item => item.winRate))) : 0}%
            </p>
          </div>
        </motion.div>

        {/* Image Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0 }}
                className="relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-4 -right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-2xl">
                  {selectedImage.image ? (
                    <img 
                      src={selectedImage.image} 
                      alt={selectedImage.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 이미지 로딩 실패 시 플레이스홀더 표시
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.modal-fallback');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }
                      }}
                    />
                  ) : null}
                  <div className={`modal-fallback ${selectedImage.image ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-9xl`}>
                    {selectedImage.rank === 1 ? '🎭' : '🎨'}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-white text-xl font-bold">{selectedImage.title}</h3>
                  <p className="text-gray-300">#{selectedImage.rank} 위</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}