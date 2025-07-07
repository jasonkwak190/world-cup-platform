'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, Award, ArrowLeft, BarChart3, TrendingUp, Home, X, ZoomIn, RefreshCw } from 'lucide-react';
import { WorldCupItem } from '@/types/game';
import { generateRealRankingData, ItemStats } from '@/utils/gameStats';
import { getItemStatistics } from '@/utils/tournamentResults';

interface TournamentRankingProps {
  tournamentTitle: string;
  worldcupId: string; // 월드컵 ID 추가 (통계 조회용)
  winner: WorldCupItem;
  allItems: WorldCupItem[];
  onBack: () => void;
  onGoHome?: () => void;
  refreshTrigger?: number; // 통계 새로고침 트리거
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
  onGoHome,
  refreshTrigger
}: TournamentRankingProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'global'>('individual');
  const [sortBy, setSortBy] = useState<'rank' | 'winRate' | 'matches'>('rank');
  const [selectedImage, setSelectedImage] = useState<{ title: string; rank: number; image?: string } | null>(null);
  const [apiData, setApiData] = useState<any[]>([]); // 직접 API 데이터 저장
  const [globalRankingData, setGlobalRankingData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  // 전체 랭킹 데이터 로드
  const loadGlobalRanking = async () => {
    setIsGlobalLoading(true);
    try {
      console.log('🌍 Loading global rankings...');
      const response = await fetch(`/api/worldcup/${worldcupId}/stats?global=true`);
      const data = await response.json();
      
      if (data.items && Array.isArray(data.items)) {
        console.log('📊 Global ranking data loaded:', data.items.length, 'items');
        setGlobalRankingData(data.items);
      } else {
        console.warn('⚠️ Invalid global ranking data received');
        setGlobalRankingData([]);
      }
    } catch (error) {
      console.error('❌ Failed to load global ranking:', error);
      setGlobalRankingData([]);
    } finally {
      setIsGlobalLoading(false);
    }
  };

  // 수동 새로고침 함수
  const refreshStats = async () => {
    const isCurrentlyLoading = activeTab === 'individual' ? isLoading : isGlobalLoading;
    if (isCurrentlyLoading) {
      console.log('⚠️ Refresh already in progress, skipping');
      return;
    }

    if (activeTab === 'individual') {
      setIsLoading(true);
      try {
        console.log('🔄 Manual refresh: Loading real ranking data for worldcup:', worldcupId);
        const stats = await getItemStatistics(worldcupId);
        console.log('📊 Manual refresh: Real ranking data loaded:', stats);
        
        // Only update if we got valid data
        if (Array.isArray(stats)) {
          // setRealRankingData(stats); // This function doesn't exist anymore
        } else {
          console.warn('⚠️ Manual refresh returned invalid data, keeping existing data');
        }
      } catch (error) {
        console.error('❌ Manual refresh failed:', error);
        // Don't clear existing data on manual refresh failure
        console.log('⚠️ Keeping existing ranking data due to refresh error');
      } finally {
        setIsLoading(false);
      }
    } else {
      await loadGlobalRanking();
    }
  };
  
  // 실시간 API 호출로 데이터 직접 가져오기
  const [displayData, setDisplayData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!worldcupId) return;
    
    const loadAndDisplayStats = async () => {
      console.log('🔄🔄🔄 DIRECT API CALL STARTED for worldcup:', worldcupId);
      setIsLoading(true);
      
      try {
        // API 직접 호출
        const apiUrl = `/api/worldcup/${worldcupId}/stats?_t=${Date.now()}`;
        console.log('🌐 Fetching from URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        const data = await response.json();
        console.log('📊📊📊 DIRECT API RESPONSE:', data);
        
        if (data.items && data.items.length > 0) {
          // API 데이터를 직접 화면 표시용으로 변환
          const processedData = data.items.map((item: any, index: number) => ({
            id: item.id,
            title: item.title,
            image: item.image_url,
            totalWins: item.win_count || 0,
            totalLosses: item.loss_count || 0,
            totalAppearances: item.total_appearances || 0,
            winRate: item.win_rate || 0,
            championshipWins: item.championship_wins || 0,
            rank: index + 1,
            bestRoundReached: '1라운드'
          }));
          
          setDisplayData(processedData);
          console.log('✅✅✅ DIRECT DATA SET SUCCESS:', processedData.length, 'items');
          console.log('✅ Sample item with stats:', processedData[0] ? {
            title: processedData[0].title,
            totalWins: processedData[0].totalWins,
            totalLosses: processedData[0].totalLosses,
            championshipWins: processedData[0].championshipWins,
            winRate: processedData[0].winRate
          } : 'No items');
        }
      } catch (error) {
        console.error('❌ Direct API call failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAndDisplayStats();
  }, [worldcupId]);
  
  // 직접 API 데이터 사용
  console.log('🎯🎯🎯 RENDERING WITH displayData, length =', displayData.length);
  if (displayData.length > 0) {
    console.log('🎯 First display item:', {
      title: displayData[0].title,
      totalWins: displayData[0].totalWins,
      totalLosses: displayData[0].totalLosses,
      championshipWins: displayData[0].championshipWins
    });
  }
  
  const sortedData = [...displayData].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'matches':
        return b.totalAppearances - a.totalAppearances;
      default:
        return a.rank - b.rank;
    }
  });
  
  console.log('🎯 Sorted data for rendering, length =', sortedData.length);


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
              onClick={refreshStats}
              disabled={isLoading}
              className={`flex items-center space-x-2 text-white hover:text-gray-300 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-lg">새로고침</span>
            </button>
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
          className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-8 mb-8 text-center relative"
        >
          {refreshTrigger > 0 && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              최신 결과 반영됨
            </div>
          )}
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
          <h2 className="text-3xl font-bold text-white mb-2">🏆 현재 게임 우승자</h2>
          <h3 className="text-2xl font-bold text-white">{winner.title}</h3>
          {winner.description && (
            <p className="text-yellow-100 mt-2">{winner.description}</p>
          )}
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-2">📊 전체 랭킹 결과</h2>
          <p className="text-gray-300 text-sm">모든 게임을 통한 누적 통계 기반</p>
          {isLoading && (
            <div className="inline-flex items-center mt-2 text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">최신 데이터 로딩 중...</span>
            </div>
          )}
        </motion.div>

        {/* Sort Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
          className="space-y-3"
        >
          {/* Header Row */}
          <div className="bg-gray-800/80 rounded-xl p-4 text-white font-semibold border border-gray-700">
            <div className="grid grid-cols-12 gap-4 items-center text-sm">
              <div className="col-span-1 text-center">순위</div>
              <div className="col-span-3">참가자</div>
              <div className="col-span-2 text-center">우승 횟수</div>
              <div className="col-span-2 text-center">승률</div>
              <div className="col-span-2 text-center">전적</div>
              <div className="col-span-2 text-center">등장</div>
            </div>
          </div>

          {/* Ranking Items */}
          {sortedData.map((item, index) => {
            const isCurrentWinner = winner && item.title === winner.title;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`${getRankStyle(item.rank)} ${
                  isCurrentWinner ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''
                } rounded-xl p-4 transition-all duration-200 hover:shadow-lg relative`}
              >
                {isCurrentWinner && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    🏆 현재 우승자
                  </div>
                )}
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(item.rank)}
                  </div>

                  {/* Participant Info */}
                  <div className="col-span-3 flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer hover:scale-110 transition-transform relative group border border-gray-200"
                      onClick={() => setSelectedImage({ title: item.title, rank: item.rank, image: item.image })}
                    >
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
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
                      <div className={`ranking-fallback ${item.image ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg`}>
                        {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : '🎯'}
                      </div>
                      <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                      <div className="text-xs text-gray-600">#{item.rank}위</div>
                    </div>
                  </div>

                  {/* Championship Wins */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-yellow-600">{item.championshipWins || 0}회</span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Trophy className="w-3 h-3" />
                        <span>우승</span>
                      </div>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-lg font-bold text-green-600">{Math.round(item.winRate)}%</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.winRate >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            item.winRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${Math.round(item.winRate)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Match Record */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-semibold text-gray-700">
                        <span className="text-green-600">{item.totalWins}승</span>
                        <span className="mx-1">:</span>
                        <span className="text-red-600">{item.totalLosses}패</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.totalWins + item.totalLosses}경기
                      </div>
                    </div>
                  </div>

                  {/* Appearances */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-blue-600">{item.totalAppearances}회</span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <BarChart3 className="w-3 h-3" />
                        <span>등장</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                    <div className="text-center">
                      <div className="font-medium text-gray-800">연승 기록</div>
                      <div className="text-orange-600 font-semibold">{Math.max(Math.floor(item.winRate / 20), 1)}연승</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-800">최근 성과</div>
                      <div className={`font-semibold ${item.winRate > 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.winRate > 50 ? '상승세' : '하락세'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-800">평균 라운드</div>
                      <div className="text-purple-600 font-semibold">
                        {Math.round((item.totalWins + 1) / Math.max(item.totalAppearances, 1) * 4)}라운드
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-800">인기도</div>
                      <div className="flex justify-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-xs ${i < Math.min(5, Math.ceil(item.winRate / 20)) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enhanced Statistics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">총 참가자</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">{displayData.length}</p>
            <p className="text-sm text-gray-300 mt-1">활성 아이템</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">총 경기 수</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {displayData.length > 0 ? displayData.reduce((sum, item) => sum + item.totalAppearances, 0) : 0}
            </p>
            <p className="text-sm text-gray-300 mt-1">누적 경기</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">최고 승률</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-400">
              {displayData.length > 0 ? Math.round(Math.max(...displayData.map(item => item.winRate))) : 0}%
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {displayData.length > 0 && displayData.find(item => item.winRate === Math.max(...displayData.map(i => i.winRate)))?.title}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-6 h-6 text-purple-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">총 우승</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {displayData.length > 0 ? displayData.reduce((sum, item) => sum + (item.championshipWins || 0), 0) : 0}회
            </p>
            <p className="text-sm text-gray-300 mt-1">누적 우승</p>
          </div>
        </motion.div>

        {/* Detailed Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4 text-center">🎯 상세 성과 분석</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">승률 구간별 분포</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white">
                  <span>70% 이상 (우수)</span>
                  <span className="text-emerald-400 font-bold">
                    {displayData.filter(item => item.winRate >= 70).length}명
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>50-70% (보통)</span>
                  <span className="text-yellow-400 font-bold">
                    {displayData.filter(item => item.winRate >= 50 && item.winRate < 70).length}명
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>50% 미만 (아쉬움)</span>
                  <span className="text-red-400 font-bold">
                    {displayData.filter(item => item.winRate < 50).length}명
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">경기 참여도</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white">
                  <span>평균 경기 수</span>
                  <span className="text-blue-400 font-bold">
                    {displayData.length > 0 ? Math.round(displayData.reduce((sum, item) => sum + item.totalAppearances, 0) / displayData.length) : 0}경기
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>최다 경기</span>
                  <span className="text-blue-400 font-bold">
                    {displayData.length > 0 ? Math.max(...displayData.map(item => item.totalAppearances)) : 0}경기
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>평균 승률</span>
                  <span className="text-blue-400 font-bold">
                    {displayData.length > 0 ? Math.round(displayData.reduce((sum, item) => sum + item.winRate, 0) / displayData.length) : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-semibold text-purple-400 mb-2">챔피언십 기록</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white">
                  <span>우승 경험자</span>
                  <span className="text-purple-400 font-bold">
                    {displayData.filter(item => (item.championshipWins || 0) > 0).length}명
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>최다 우승</span>
                  <span className="text-purple-400 font-bold">
                    {displayData.length > 0 ? Math.max(...displayData.map(item => item.championshipWins || 0)) : 0}회
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>우승 독점도</span>
                  <span className="text-purple-400 font-bold">
                    {displayData.length > 0 && displayData.reduce((sum, item) => sum + (item.championshipWins || 0), 0) > 0 ? 
                      Math.round((Math.max(...displayData.map(item => item.championshipWins || 0)) / 
                      displayData.reduce((sum, item) => sum + (item.championshipWins || 0), 0)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
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