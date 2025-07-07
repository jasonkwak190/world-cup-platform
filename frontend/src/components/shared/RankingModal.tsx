'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Trophy, Crown, Medal, Award } from 'lucide-react';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldcupId: string;
  worldcupTitle: string;
}

interface RankingItem {
  id: string;
  title: string;
  image_url?: string;
  win_count: number;
  loss_count: number;
  total_appearances: number;
  win_rate: number;
  championship_wins: number;
}

export default function RankingModal({ isOpen, onClose, worldcupId, worldcupTitle }: RankingModalProps) {
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRankingData = async () => {
    if (!worldcupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 RANKING MODAL: Loading data for worldcup:', worldcupId);
      
      const url = `/api/worldcup/${worldcupId}/stats?_t=${Date.now()}`;
      console.log('🌐 RANKING MODAL: Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      console.log('📡 RANKING MODAL: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 RANKING MODAL: Raw API response:', data);
      
      if (data.items && Array.isArray(data.items)) {
        console.log('✅ RANKING MODAL: Setting ranking data, count:', data.items.length);
        setRankingData(data.items);
        
        // 디버깅을 위한 상세 로그
        data.items.slice(0, 5).forEach((item: RankingItem, index: number) => {
          console.log(`🎯 RANKING MODAL: Item ${index + 1}:`, {
            title: item.title,
            wins: item.win_count,
            losses: item.loss_count,
            appearances: item.total_appearances,
            winRate: item.win_rate,
            championships: item.championship_wins
          });
        });
      } else {
        console.warn('⚠️ RANKING MODAL: Invalid data structure received');
        setError('데이터 구조가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('❌ RANKING MODAL: Error loading ranking data:', err);
      setError(err instanceof Error ? err.message : '랭킹 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && worldcupId) {
      loadRankingData();
    }
  }, [isOpen, worldcupId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300';
      case 3: return 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300';
      default: return 'bg-white border border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  전체 랭킹
                </h2>
                <p className="text-blue-100 mt-1">{worldcupTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadRankingData}
                  disabled={isLoading}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">랭킹 데이터 로딩 중...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={loadRankingData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            ) : rankingData.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-600">랭킹 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 헤더 */}
                <div className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded-lg font-semibold text-gray-700 text-sm">
                  <div className="col-span-1 text-center">순위</div>
                  <div className="col-span-4">참가자</div>
                  <div className="col-span-2 text-center">우승 횟수</div>
                  <div className="col-span-2 text-center">승률</div>
                  <div className="col-span-2 text-center">전적</div>
                  <div className="col-span-1 text-center">등장</div>
                </div>

                {/* 랭킹 아이템들 */}
                {rankingData.map((item, index) => {
                  const rank = index + 1;
                  return (
                    <div
                      key={item.id}
                      className={`${getRankStyle(rank)} rounded-lg p-3 transition-all duration-200 hover:shadow-md`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* 순위 */}
                        <div className="col-span-1 flex justify-center">
                          {getRankIcon(rank)}
                        </div>

                        {/* 참가자 정보 */}
                        <div className="col-span-4 flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden">
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
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg">
                                🎭
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                          </div>
                        </div>

                        {/* 우승 횟수 */}
                        <div className="col-span-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.championship_wins > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.championship_wins > 0 ? `${item.championship_wins}회` : '0회'}
                          </span>
                        </div>

                        {/* 승률 */}
                        <div className="col-span-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.round(item.win_rate || 0)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {Math.round(item.win_rate || 0)}%
                            </span>
                          </div>
                        </div>

                        {/* 전적 */}
                        <div className="col-span-2 text-center">
                          <span className="text-xs text-gray-700 font-medium">
                            {item.win_count || 0}승 {item.loss_count || 0}패
                          </span>
                        </div>

                        {/* 등장 횟수 */}
                        <div className="col-span-1 text-center">
                          <span className="text-xs text-gray-600">
                            {item.total_appearances || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}