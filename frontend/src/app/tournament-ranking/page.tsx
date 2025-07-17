'use client';

import { useState, useEffect } from 'react';
import { Home, RotateCcw, Trophy, Share2, ArrowUpDown, Search, Filter, RefreshCw, Crown, Medal, Award } from 'lucide-react';
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
    appearances: 5
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

export default function TournamentRankingPage() {
  const [isClient, setIsClient] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({
    refresh: false,
    home: false,
    share: false
  });
  const [sortBy, setSortBy] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeDesign, setActiveDesign] = useState<number>(1);
  const [filteredData, setFilteredData] = useState(rankingData);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 검색어와 정렬 기준에 따라 데이터 필터링 및 정렬
    let filtered = rankingData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [searchTerm, sortBy, sortOrder]);

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
      
      // 실제 액션 처리
      switch(action) {
        case 'refresh':
          // 랭킹 새로고침
          break;
        case 'home':
          // 홈으로 이동
          break;
        case 'share':
          // 공유 기능
          break;
      }
    }, 2000);
  };

  const handleDesignChange = (designNumber: number) => {
    setActiveDesign(designNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 랭킹</h1>
          <p className="text-gray-600">참가자들의 순위를 확인하세요</p>
          
          <div className="flex justify-center gap-2 mt-4">
            <Link href="/tournament-ranking" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
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
            <Link href="/tournament-ranking/minimal" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              미니멀
            </Link>
            <Link href="/tournament-ranking/gaming" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
              게이밍
            </Link>
          </div>
        </div>

        {/* 디자인 1: 그라데이션 모던 스타일 */}
        {activeDesign === 1 && (
          <div className="mb-16">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-blue-900/30"></div>
              
              <div className="relative z-10">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">전체 랭킹</h2>
                      <p className="text-blue-200 text-sm">Tournament</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAction('refresh')}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <Link href="/" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                      <Home className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
                
                {/* 검색 및 필터 */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="참가자 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-200" />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSort('rank')}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        sortBy === 'rank' 
                          ? 'bg-white text-purple-600 border-white' 
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      순위
                    </button>
                    <button 
                      onClick={() => handleSort('name')}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        sortBy === 'name' 
                          ? 'bg-white text-purple-600 border-white' 
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      이름
                    </button>
                    <button 
                      onClick={() => handleSort('winRate')}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        sortBy === 'winRate' 
                          ? 'bg-white text-purple-600 border-white' 
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      승률
                    </button>
                    <button 
                      onClick={() => handleSort('points')}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        sortBy === 'points' 
                          ? 'bg-white text-purple-600 border-white' 
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      점수
                    </button>
                  </div>
                </div>
                
                {/* 테이블 헤더 */}
                <div className="bg-white/10 rounded-t-xl p-4 grid grid-cols-7 gap-4 text-blue-100 font-medium">
                  <div className="col-span-1">순위</div>
                  <div className="col-span-2">참가자</div>
                  <div className="col-span-1 text-center">우승 횟수</div>
                  <div className="col-span-1 text-center">전적</div>
                  <div className="col-span-1 text-center">등장 횟수</div>
                  <div className="col-span-1 text-center">승률</div>
                </div>
                
                {/* 랭킹 목록 */}
                <div className="rounded-b-xl overflow-hidden">
                  {filteredData.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`grid grid-cols-7 gap-4 p-4 items-center ${
                        index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
                      } hover:bg-white/20 transition-colors`}
                    >
                      <div className="col-span-1 flex items-center">
                        {item.rank <= 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.rank === 1 ? 'bg-yellow-400' : 
                            item.rank === 2 ? 'bg-gray-300' : 'bg-amber-600'
                          }`}>
                            {item.rank === 1 && <Crown className="w-4 h-4 text-yellow-800" />}
                            {item.rank === 2 && <Medal className="w-4 h-4 text-gray-600" />}
                            {item.rank === 3 && <Award className="w-4 h-4 text-amber-800" />}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                            {item.rank}
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-white font-medium">{item.name}</div>
                      </div>
                      
                      <div className="col-span-1 text-center text-white">
                        {item.winCount}회
                      </div>
                      
                      <div className="col-span-1 text-center text-white">
                        {item.winCount}승 {item.matchCount - item.winCount}패
                      </div>
                      
                      <div className="col-span-1 text-center text-white">
                        {item.appearances}회
                      </div>
                      
                      <div className="col-span-1 text-center">
                        <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                          <div 
                            className={`h-2 rounded-full ${
                              item.winRate >= 80 ? 'bg-green-400' :
                              item.winRate >= 60 ? 'bg-lime-400' :
                              item.winRate >= 40 ? 'bg-yellow-400' :
                              item.winRate >= 20 ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${item.winRate}%` }}
                          ></div>
                        </div>
                        <div className="text-white text-sm">{item.winRate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}