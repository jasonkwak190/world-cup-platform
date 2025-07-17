'use client';

import { useState, useEffect } from 'react';
import { Home, Trophy, Share2, Search, Filter, RefreshCw, Crown, Medal, Award, Download, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';

// 샘플 랭킹 데이터
const rankingData = [
  {
    id: 1,
    rank: 1,
    name: 'Call Center Operator',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=600&fit=crop&crop=face',
    winCount: 1,
    matchCount: 2,
    winRate: 100,
    points: 2,
    appearances: 5,
    isWinner: true
  },
  {
    id: 2,
    rank: 2,
    name: 'MC',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=600&h=600&fit=crop&crop=face',
    winCount: 1,
    matchCount: 2,
    winRate: 100,
    points: 2,
    appearances: 4
  },
  {
    id: 3,
    rank: 3,
    name: 'Veterinarian',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=600&fit=crop&crop=face',
    winCount: 1,
    matchCount: 3,
    winRate: 67,
    points: 3,
    appearances: 6
  },
  {
    id: 4,
    rank: 4,
    name: 'Truck Driver',
    image: 'https://images.unsplash.com/photo-1618077360395-f6f33d01a93c?w=600&h=600&fit=crop&crop=face',
    winCount: 0,
    matchCount: 2,
    winRate: 50,
    points: 2,
    appearances: 3
  },
  {
    id: 5,
    rank: 5,
    name: 'Car Dealer',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop&crop=face',
    winCount: 0,
    matchCount: 2,
    winRate: 50,
    points: 2,
    appearances: 2
  }
];

// 토너먼트 정보
const tournamentInfo = {
  title: '최고의 직업 월드컵',
  participants: 16,
  totalMatches: 15,
  totalVotes: 3240,
  createdAt: '2024-07-10',
  creator: '직업탐구가'
};

export default function TournamentRankingMinimalPage() {
  const [isClient, setIsClient] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({
    refresh: false,
    home: false,
    share: false
  });
  const [sortBy, setSortBy] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredData, setFilteredData] = useState(rankingData);
  const [showFilters, setShowFilters] = useState(false);
  const [filterWinRate, setFilterWinRate] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 검색어와 정렬 기준에 따라 데이터 필터링 및 정렬
    let filtered = rankingData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      item.winRate >= filterWinRate
    );
    
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'rank') {
        return sortOrder === 'asc' ? a.rank - b.rank : b.rank - a.rank;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'winRate') {
        return sortOrder === 'asc' ? a.winRate - b.winRate : b.winRate - a.winRate;
      } else if (sortBy === 'points') {
        return sortOrder === 'asc' ? a.points - b.points : b.points - a.points;
      }
      return 0;
    });
    
    setFilteredData(filtered);
  }, [searchTerm, sortBy, sortOrder, filterWinRate]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleAction = (action: string) => {
    setLoadingStates(prev => ({ ...prev, [action]: true }));
    
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [action]: false }));
      console.log(`Action: ${action}`);
    }, 2000);
  };

  // 데이터 다운로드 함수
  const handleDownload = () => {
    const csvContent = [
      ['순위', '참가자', '우승 횟수', '등장 횟수', '승률', '점수'],
      ...rankingData.map(item => [
        item.rank,
        item.name,
        item.winCount,
        item.appearances,
        `${item.winRate}%`,
        item.points
      ])
    ].map(row => row.join(',')).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tournamentInfo.title}_랭킹.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 공유 함수
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${tournamentInfo.title} 랭킹`,
        text: `${tournamentInfo.title} 토너먼트 랭킹을 확인해보세요!`,
        url: window.location.href
      });
    } else {
      // 공유 API를 지원하지 않는 브라우저의 경우
      alert('URL이 클립보드에 복사되었습니다.');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 랭킹</h1>
          <p className="text-gray-600">미니멀 스타일</p>
          
          <div className="flex justify-center gap-2 mt-4">
            <Link href="/tournament-ranking" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              기본
            </Link>
            <Link href="/tournament-ranking/neon" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              네온
            </Link>
            <Link href="/tournament-ranking/paper" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              종이
            </Link>
            <Link href="/tournament-ranking/comic" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              만화
            </Link>
            <Link href="/tournament-ranking/minimal" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              미니멀
            </Link>
            <Link href="/tournament-ranking/gaming" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              게이밍
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50"></div>
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <h2 className="text-xl font-bold text-white">토너먼트 랭킹</h2>
                  <p className="text-gray-400 text-sm">{tournamentInfo.title}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction('refresh')}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                <Link href="/" className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all block">
                  <Home className="w-5 h-5" />
                </Link>
              </div>
            </div>
            
            {/* 검색 및 필터 */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="참가자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 rounded-lg transition-all bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  <span>필터</span>
                </button>
                
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg transition-all bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>내보내기</span>
                </button>
              </div>
            </div>
            
            {/* 필터 패널 */}
            {showFilters && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">고급 필터</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">최소 승률</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filterWinRate}
                      onChange={(e) => setFilterWinRate(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-right text-gray-300">{filterWinRate}%</div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">정렬 기준</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'rank', label: '순위' },
                        { key: 'winRate', label: '승률' },
                        { key: 'points', label: '점수' }
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => handleSort(option.key)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            sortBy === option.key
                              ? 'bg-yellow-500 text-black'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {option.label}
                          {sortBy === option.key && (
                            sortOrder === 'asc' ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 랭킹 테이블 */}
            <div className="overflow-hidden rounded-xl border border-gray-700">
              <div className="grid grid-cols-7 gap-4 p-4 bg-gray-800 text-gray-300 font-medium">
                <div className="col-span-1">순위</div>
                <div className="col-span-2">참가자</div>
                <div className="col-span-1 text-center">우승 횟수</div>
                <div className="col-span-1 text-center">전적</div>
                <div className="col-span-1 text-center">등장 횟수</div>
                <div className="col-span-1 text-center">승률</div>
              </div>
              
              <div className="divide-y divide-gray-700">
                {filteredData.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`grid grid-cols-7 gap-4 p-4 items-center ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                    } hover:bg-gray-700 transition-colors border-t border-gray-700`}
                  >
                    <div className="col-span-1">
                      {item.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.rank === 1 ? 'bg-yellow-500' : 
                          item.rank === 2 ? 'bg-gray-400' : 
                          'bg-amber-700'
                        }`}>
                          {item.rank === 1 && <Crown className="w-4 h-4 text-black" />}
                          {item.rank === 2 && <Medal className="w-4 h-4 text-black" />}
                          {item.rank === 3 && <Award className="w-4 h-4 text-black" />}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                          {item.rank}
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.matchCount}승 {item.matchCount - item.winCount}패</div>
                      </div>
                      {item.isWinner && (
                        <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg border border-yellow-500/30">
                          우승자
                        </span>
                      )}
                    </div>
                    
                    <div className="col-span-1 text-center text-gray-300">
                      {item.winCount}회
                    </div>
                    
                    <div className="col-span-1 text-center text-gray-300">
                      {item.winCount}승 {item.matchCount - item.winCount}패
                    </div>
                    
                    <div className="col-span-1 text-center text-blue-300">
                      {item.appearances}회
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div 
                          className={`h-2 rounded-full ${
                            item.winRate >= 80 ? 'bg-green-500' :
                            item.winRate >= 60 ? 'bg-lime-500' :
                            item.winRate >= 40 ? 'bg-yellow-500' :
                            item.winRate >= 20 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.winRate}%` }}
                        ></div>
                      </div>
                      <div className="text-gray-300 text-sm">{item.winRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 푸터 */}
            <div className="mt-6 text-center text-gray-500 text-xs">
              <p>토너먼트 생성일: {tournamentInfo.createdAt} | 제작자: {tournamentInfo.creator}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}