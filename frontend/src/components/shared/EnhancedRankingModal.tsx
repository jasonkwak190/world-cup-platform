'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Trophy, Crown, Medal, Award, Search, Filter, Share2, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldcupId: string;
  worldcupTitle: string;
  theme?: string;
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

// 테마별 스타일
const themeStyles = {
  neon: {
    bg: 'bg-gray-900',
    text: 'text-cyan-400',
    accent: 'text-pink-400',
    card: 'bg-gray-800 border-cyan-400/50',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-cyan-400',
    input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
  },
  paper: {
    bg: 'bg-white',
    text: 'text-amber-800',
    accent: 'text-orange-600',
    card: 'bg-amber-50 border-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    secondary: 'bg-amber-100 hover:bg-amber-200 text-amber-800',
    input: 'bg-white border-amber-300 text-amber-800 placeholder-amber-400'
  },
  comic: {
    bg: 'bg-blue-50',
    text: 'text-purple-800',
    accent: 'text-blue-600',
    card: 'bg-white border-purple-300',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
    input: 'bg-white border-purple-300 text-purple-800 placeholder-purple-400'
  },
  minimal: {
    bg: 'bg-white',
    text: 'text-gray-800',
    accent: 'text-gray-600',
    card: 'bg-gray-50 border-gray-300',
    button: 'bg-gray-800 hover:bg-gray-900 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    input: 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
  },
  gaming: {
    bg: 'bg-gray-900',
    text: 'text-white',
    accent: 'text-purple-400',
    card: 'bg-gray-800 border-purple-400/50',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-purple-400',
    input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
  }
};

export default function EnhancedRankingModal({ 
  isOpen, 
  onClose, 
  worldcupId, 
  worldcupTitle,
  theme = 'minimal'
}: RankingModalProps) {
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'win_rate' | 'win_count' | 'total_appearances' | 'championship_wins'>('win_rate');
  const [filterBy, setFilterBy] = useState<'all' | 'winners' | 'high_rate'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const currentTheme = themeStyles[theme as keyof typeof themeStyles] || themeStyles.minimal;

  const loadRankingData = async () => {
    if (!worldcupId) {
      console.error('RANKING MODAL: No worldcupId provided');
      return;
    }
    
    console.log('RANKING MODAL: Starting to load data for worldcupId:', worldcupId);
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `/api/worldcups/${worldcupId}/stats?_t=${Date.now()}`;
      console.log('RANKING MODAL: Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      console.log('RANKING MODAL: Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('RANKING MODAL: API Response:', data);
      
      if (data.items) {
        console.log('RANKING MODAL: Setting ranking data:', data.items.length, 'items');
        setRankingData(data.items);
      } else {
        console.error('RANKING MODAL: No items in response:', data);
        throw new Error('Failed to load ranking data');
      }
    } catch (err) {
      console.error('RANKING MODAL: Error loading data:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎯 ENHANCED RANKING MODAL: useEffect triggered', { isOpen, worldcupId });
    if (isOpen) {
      console.log('🎯 ENHANCED RANKING MODAL: Modal is open, loading ranking data');
      loadRankingData();
    }
  }, [isOpen, worldcupId]);

  // 검색 및 필터링된 데이터
  const filteredAndSortedData = useMemo(() => {
    let filtered = rankingData;
    
    // 검색 필터링
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 카테고리 필터링
    switch (filterBy) {
      case 'winners':
        filtered = filtered.filter(item => item.championship_wins > 0);
        break;
      case 'high_rate':
        filtered = filtered.filter(item => item.win_rate >= 70);
        break;
      default:
        break;
    }
    
    // 정렬
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'win_count':
          return b.win_count - a.win_count;
        case 'total_appearances':
          return b.total_appearances - a.total_appearances;
        case 'championship_wins':
          return b.championship_wins - a.championship_wins;
        default:
          return b.win_rate - a.win_rate;
      }
    });
  }, [rankingData, searchQuery, sortBy, filterBy]);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/tournament-select/${worldcupId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('게임 링크가 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('Failed to share:', error);
      alert('공유 중 오류가 발생했습니다.');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-gray-400" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return currentTheme.card;
    }
  };

  console.log('🎯 ENHANCED RANKING MODAL: Render check', { 
    isOpen, 
    worldcupId, 
    worldcupTitle,
    theme,
    rankingDataLength: rankingData.length,
    isLoading,
    error 
  });
  
  if (!isOpen) {
    console.log('🎯 ENHANCED RANKING MODAL: Not rendering - modal is closed');
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${currentTheme.bg} rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${currentTheme.text} mb-1`}>
                  랭킹
                </h2>
                <p className={`${currentTheme.accent} text-sm`}>
                  {worldcupTitle}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className={`p-2 rounded-lg ${currentTheme.button} transition-colors`}
                  title="게임 링크 공유"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={loadRankingData}
                  disabled={isLoading}
                  className={`p-2 rounded-lg ${currentTheme.secondary} transition-colors`}
                  title="새로고침"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${currentTheme.secondary} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="선택지 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* 필터 토글 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme.secondary} transition-colors`}
              >
                <Filter className="w-5 h-5" />
                <span>필터</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 필터 옵션 */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 정렬 */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    정렬 기준
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`w-full p-2 rounded-lg border ${currentTheme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="win_rate">승률순</option>
                    <option value="win_count">승수순</option>
                    <option value="total_appearances">참여횟수순</option>
                    <option value="championship_wins">우승횟수순</option>
                  </select>
                </div>

                {/* 필터 */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    필터
                  </label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className={`w-full p-2 rounded-lg border ${currentTheme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="all">전체</option>
                    <option value="winners">우승 경험자</option>
                    <option value="high_rate">고승률 (70% 이상)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 컨텐츠 */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className={currentTheme.text}>랭킹 데이터를 불러오는 중...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className={`${currentTheme.text} mb-4`}>{error}</p>
                  <button
                    onClick={loadRankingData}
                    className={`${currentTheme.button} px-4 py-2 rounded-lg transition-colors`}
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            ) : filteredAndSortedData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className={currentTheme.text}>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${getRankStyle(index + 1)} transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* 순위 */}
                      <div className="flex items-center space-x-2 min-w-[60px]">
                        {getRankIcon(index + 1)}
                        <span className={`text-xl font-bold ${index < 3 ? 'text-white' : currentTheme.text}`}>
                          {index + 1}
                        </span>
                      </div>

                      {/* 이미지 */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Trophy className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${index < 3 ? 'text-white' : currentTheme.text}`}>
                          {item.title}
                        </h3>
                        <div className={`text-sm ${index < 3 ? 'text-white/80' : currentTheme.accent}`}>
                          승률 {item.win_rate.toFixed(1)}% • {item.win_count}승 {item.loss_count}패
                        </div>
                      </div>

                      {/* 통계 */}
                      <div className="text-right">
                        <div className={`text-lg font-bold ${index < 3 ? 'text-white' : currentTheme.text}`}>
                          {item.win_rate.toFixed(1)}%
                        </div>
                        <div className={`text-xs ${index < 3 ? 'text-white/80' : currentTheme.accent}`}>
                          {item.championship_wins}회 우승
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme.accent}`}>
                총 {filteredAndSortedData.length}개의 결과
              </span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleShare}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme.button} transition-colors`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>게임 공유</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}