'use client';

import { useState, useEffect } from 'react';
import { Home, RotateCcw, Trophy, Share2, Play, Maximize2, Clock, Users, Star, Crown, Flame, Zap, Heart, Award, Medal, Target } from 'lucide-react';

// 샘플 결과 데이터
const tournamentResult = {
  winner: {
    id: 'winner1',
    name: 'IU',
    subtitle: '솔로 아티스트',
    image: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=600&h=600&fit=crop&crop=face',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // 샘플 유튜브 URL
    votes: 2847,
    winRate: 89.2
  },
  tournament: {
    type: '16강',
    totalParticipants: 16,
    playTime: '7분 32초',
    totalVotes: 3194,
    category: '최고의 K-POP 아이돌 월드컵'
  },
  stats: {
    totalMatches: 15,
    averageVoteTime: '2.3초',
    mostVotedMatch: 'IU vs NewJeans',
    closestMatch: 'BLACKPINK vs TWICE (52% vs 48%)'
  }
};

export default function TournamentResultPage() {
  const [isClient, setIsClient] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({
    restart: false,
    home: false,
    ranking: false,
    share: false
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAction = (action: string) => {
    setLoadingStates(prev => ({ ...prev, [action]: true }));
    
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [action]: false }));
      console.log(`Action: ${action}`);
      
      // 실제 액션 처리
      switch(action) {
        case 'restart':
          // 토너먼트 선택 페이지로 이동
          break;
        case 'home':
          // 홈으로 이동
          break;
        case 'ranking':
          // 랭킹 페이지로 이동
          break;
        case 'share':
          // 공유 기능
          break;
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 결과 디자인</h1>
          <p className="text-gray-600">5가지 독창적인 토너먼트 결과 UI 디자인</p>
        </div>

        {/* 디자인 1: 네온 사이버 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">1. 네온 사이버 스타일</h2>
          <div className="bg-black rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
            
            <div className="relative z-10">
              {/* 헤더 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-700 mb-4">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div className="text-4xl font-bold text-white font-mono">CHAMPION</div>
                  <Crown className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-cyan-400 font-mono text-sm">{tournamentResult.tournament.category}</p>
              </div>

              {/* 우승자 정보 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-80 h-80 rounded-2xl overflow-hidden border-4 border-yellow-400 shadow-lg shadow-yellow-400/25 relative group cursor-pointer"
                         onClick={() => setImageExpanded(true)}>
                      <img
                        src={tournamentResult.winner.image}
                        alt={tournamentResult.winner.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-yellow-400 font-mono text-2xl font-bold">{tournamentResult.winner.name}</div>
                        <div className="text-cyan-300 font-mono text-sm">{tournamentResult.winner.subtitle}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 통계 */}
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-cyan-400 font-mono text-lg font-bold mb-4">BATTLE STATS</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400 font-mono">{tournamentResult.tournament.type}</div>
                        <div className="text-xs text-gray-400 font-mono">TOURNAMENT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400 font-mono">{tournamentResult.tournament.playTime}</div>
                        <div className="text-xs text-gray-400 font-mono">PLAY TIME</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-400 font-mono">{tournamentResult.winner.votes}</div>
                        <div className="text-xs text-gray-400 font-mono">TOTAL VOTES</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 font-mono">{tournamentResult.winner.winRate}%</div>
                        <div className="text-xs text-gray-400 font-mono">WIN RATE</div>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAction('restart')}
                      disabled={loadingStates.restart}
                      className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                        loadingStates.restart
                          ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                          : 'bg-cyan-400/10 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20'
                      }`}
                    >
                      {loadingStates.restart ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <RotateCcw className="w-5 h-5" />
                          <span>RESTART</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('home')}
                      disabled={loadingStates.home}
                      className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                        loadingStates.home
                          ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                          : 'bg-pink-400/10 border-pink-400 text-pink-400 hover:bg-pink-400/20'
                      }`}
                    >
                      {loadingStates.home ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Home className="w-5 h-5" />
                          <span>HOME</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('ranking')}
                      disabled={loadingStates.ranking}
                      className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                        loadingStates.ranking
                          ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-400/10 border-yellow-400 text-yellow-400 hover:bg-yellow-400/20'
                      }`}
                    >
                      {loadingStates.ranking ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="w-5 h-5" />
                          <span>RANKING</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('share')}
                      disabled={loadingStates.share}
                      className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                        loadingStates.share
                          ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-400/10 border-purple-400 text-purple-400 hover:bg-purple-400/20'
                      }`}
                    >
                      {loadingStates.share ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Share2 className="w-5 h-5" />
                          <span>SHARE</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 디자인 2: 종이 찢기 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">2. 종이 찢기 스타일</h2>
          <div className="bg-amber-50 p-8 relative">
            
            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform -rotate-1">
                <h3 className="text-2xl font-bold text-amber-800 mb-1">🏆 토너먼트 우승자 🏆</h3>
                <p className="text-amber-600 text-sm">{tournamentResult.tournament.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 우승자 이미지 */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-dashed border-gray-300 relative transform rotate-1">
                  <div className="absolute -top-2 left-4 w-8 h-4 bg-white transform rotate-12"></div>
                  <div className="absolute -top-1 right-8 w-6 h-3 bg-white transform -rotate-12"></div>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300"></div>

                  <div className="relative">
                    <div className="w-80 h-80 rounded-lg overflow-hidden mb-4 border-2 border-gray-200 cursor-pointer"
                         onClick={() => setImageExpanded(true)}>
                      <img
                        src={tournamentResult.winner.image}
                        alt={tournamentResult.winner.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-white/80 rounded-full p-2">
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{tournamentResult.winner.name}</h3>
                      <p className="text-amber-600 mb-2">{tournamentResult.winner.subtitle}</p>
                      <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                        🎉 우승자!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 통계 및 버튼 */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 transform -rotate-1">
                  <h3 className="text-amber-800 text-lg font-bold mb-4">📊 토너먼트 결과</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-xl font-bold text-amber-800">{tournamentResult.tournament.type}</div>
                      <div className="text-xs text-amber-600">토너먼트</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-xl font-bold text-amber-800">{tournamentResult.tournament.playTime}</div>
                      <div className="text-xs text-amber-600">플레이 시간</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-xl font-bold text-amber-800">{tournamentResult.winner.votes}</div>
                      <div className="text-xs text-amber-600">총 득표</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-xl font-bold text-amber-800">{tournamentResult.winner.winRate}%</div>
                      <div className="text-xs text-amber-600">승률</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-md border border-amber-200 transform rotate-1">
                    <button
                      onClick={() => handleAction('restart')}
                      disabled={loadingStates.restart}
                      className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                        loadingStates.restart
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {loadingStates.restart ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>준비 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          <span>다시하기</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-md border border-amber-200 transform -rotate-1">
                    <button
                      onClick={() => handleAction('home')}
                      disabled={loadingStates.home}
                      className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                        loadingStates.home
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {loadingStates.home ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>이동 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Home className="w-4 h-4" />
                          <span>홈으로</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-md border border-amber-200 transform rotate-1">
                    <button
                      onClick={() => handleAction('ranking')}
                      disabled={loadingStates.ranking}
                      className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                        loadingStates.ranking
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {loadingStates.ranking ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>로딩 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" />
                          <span>랭킹 보기</span>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-md border border-amber-200 transform -rotate-1">
                    <button
                      onClick={() => handleAction('share')}
                      disabled={loadingStates.share}
                      className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                        loadingStates.share
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      {loadingStates.share ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>공유 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Share2 className="w-4 h-4" />
                          <span>결과 공유</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>    
    {/* 디자인 3: 만화책 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">3. 만화책 스타일</h2>
          <div className="bg-gradient-to-b from-blue-100 to-purple-100 p-8 rounded-3xl border-4 border-black relative overflow-hidden">
            
            <div className="absolute top-4 left-4 text-6xl font-black text-yellow-400 opacity-20 transform -rotate-12">WINNER!</div>
            <div className="absolute bottom-4 right-4 text-4xl font-black text-red-400 opacity-20 transform rotate-12">CHAMPION!</div>

            {/* 헤더 */}
            <div className="text-center mb-8 relative z-10">
              <div className="inline-block bg-yellow-300 p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
                <h3 className="text-2xl font-black text-black mb-1">🏆 ULTIMATE WINNER! 🏆</h3>
                <p className="text-black font-bold text-sm">{tournamentResult.tournament.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative z-10">
              {/* 우승자 이미지 */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] relative">
                  
                  <div className="absolute -top-8 left-4 bg-white border-2 border-black rounded-lg px-3 py-1">
                    <div className="text-xs font-bold text-black">CHAMPION!</div>
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                  </div>

                  <div className="relative">
                    <div className="w-80 h-80 rounded-xl overflow-hidden mb-4 border-4 border-black cursor-pointer"
                         onClick={() => setImageExpanded(true)}>
                      <img
                        src={tournamentResult.winner.image}
                        alt={tournamentResult.winner.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-yellow-400 border-2 border-black rounded-full p-2">
                        <Maximize2 className="w-4 h-4 text-black" />
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="text-2xl font-black text-black mb-1">{tournamentResult.winner.name}</h3>
                      <p className="text-purple-600 font-bold mb-3">{tournamentResult.winner.subtitle}</p>
                      <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-black border-2 border-black">
                        💥 ULTIMATE CHAMPION!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 통계 및 버튼 */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                  <h3 className="text-black text-lg font-black mb-4">📊 BATTLE RESULTS!</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-200 rounded-lg border-2 border-black">
                      <div className="text-xl font-black text-black">{tournamentResult.tournament.type}</div>
                      <div className="text-xs font-bold text-black">TOURNAMENT</div>
                    </div>
                    <div className="text-center p-3 bg-green-200 rounded-lg border-2 border-black">
                      <div className="text-xl font-black text-black">{tournamentResult.tournament.playTime}</div>
                      <div className="text-xs font-bold text-black">PLAY TIME</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-200 rounded-lg border-2 border-black">
                      <div className="text-xl font-black text-black">{tournamentResult.winner.votes}</div>
                      <div className="text-xs font-bold text-black">TOTAL VOTES</div>
                    </div>
                    <div className="text-center p-3 bg-pink-200 rounded-lg border-2 border-black">
                      <div className="text-xl font-black text-black">{tournamentResult.winner.winRate}%</div>
                      <div className="text-xs font-bold text-black">WIN RATE</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAction('restart')}
                    disabled={loadingStates.restart}
                    className={`p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black transition-all duration-300 ${
                      loadingStates.restart
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-400 text-black hover:bg-blue-500'
                    }`}
                  >
                    {loadingStates.restart ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>LOADING...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <RotateCcw className="w-5 h-5" />
                        <span>RESTART!</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction('home')}
                    disabled={loadingStates.home}
                    className={`p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black transition-all duration-300 ${
                      loadingStates.home
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-400 text-black hover:bg-green-500'
                    }`}
                  >
                    {loadingStates.home ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>LOADING...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Home className="w-5 h-5" />
                        <span>HOME!</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction('ranking')}
                    disabled={loadingStates.ranking}
                    className={`p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black transition-all duration-300 ${
                      loadingStates.ranking
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-400 text-black hover:bg-yellow-500'
                    }`}
                  >
                    {loadingStates.ranking ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>LOADING...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5" />
                        <span>RANKING!</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction('share')}
                    disabled={loadingStates.share}
                    className={`p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] font-black transition-all duration-300 ${
                      loadingStates.share
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-pink-400 text-black hover:bg-pink-500'
                    }`}
                  >
                    {loadingStates.share ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>LOADING...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <span>SHARE!</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 디자인 4: 미니멀 엘레강스 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">4. 미니멀 엘레강스</h2>
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
            
            {/* 헤더 */}
            <div className="text-center mb-12">
              <h3 className="text-4xl font-light text-gray-800 mb-3">Tournament Winner</h3>
              <div className="w-24 h-0.5 bg-gray-300 mx-auto mb-4"></div>
              <p className="text-gray-500 font-light">{tournamentResult.tournament.category}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* 우승자 이미지 */}
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-80 h-80 rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
                       onClick={() => setImageExpanded(true)}>
                    <img
                      src={tournamentResult.winner.image}
                      alt={tournamentResult.winner.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Maximize2 className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-3xl font-light text-gray-800 mb-2">{tournamentResult.winner.name}</h3>
                  <p className="text-gray-500 font-light mb-4">{tournamentResult.winner.subtitle}</p>
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                    <Crown className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Champion</span>
                  </div>
                </div>
              </div>

              {/* 통계 및 버튼 */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-light text-gray-800 mb-6">Tournament Statistics</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-gray-50 rounded-2xl">
                      <div className="text-2xl font-light text-gray-800 mb-1">{tournamentResult.tournament.type}</div>
                      <div className="text-sm text-gray-500">Tournament Size</div>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-2xl">
                      <div className="text-2xl font-light text-gray-800 mb-1">{tournamentResult.tournament.playTime}</div>
                      <div className="text-sm text-gray-500">Play Time</div>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-2xl">
                      <div className="text-2xl font-light text-gray-800 mb-1">{tournamentResult.winner.votes}</div>
                      <div className="text-sm text-gray-500">Total Votes</div>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-2xl">
                      <div className="text-2xl font-light text-gray-800 mb-1">{tournamentResult.winner.winRate}%</div>
                      <div className="text-sm text-gray-500">Win Rate</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAction('restart')}
                    disabled={loadingStates.restart}
                    className={`p-4 rounded-2xl font-light transition-all duration-300 ${
                      loadingStates.restart
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {loadingStates.restart ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <RotateCcw className="w-5 h-5" />
                        <span>Restart</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction('home')}
                    disabled={loadingStates.home}
                    className={`p-4 rounded-2xl font-light transition-all duration-300 ${
                      loadingStates.home
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {loadingStates.home ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Home className="w-5 h-5" />
                        <span>Home</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction('ranking')}
                    disabled={loadingStates.ranking}
                    className={`p-4 rounded-2xl font-light transition-all duration-300 ${
                      loadingStates.ranking
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {loadingStates.ranking ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5" />
                        <span>View Ranking</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction('share')}
                    disabled={loadingStates.share}
                    className={`p-4 rounded-2xl font-light transition-all duration-300 ${
                      loadingStates.share
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {loadingStates.share ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <span>Share Result</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 디자인 5: 게이밍 RGB 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">5. 게이밍 RGB 스타일</h2>
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8 rounded-3xl relative overflow-hidden">
            
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 via-green-500 via-yellow-500 to-red-500 animate-pulse"></div>
              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
              <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500 via-blue-500 via-green-500 via-yellow-500 to-red-500 animate-pulse"></div>
            </div>

            <div className="relative z-10">
              {/* 헤더 */}
              <div className="text-center mb-8">
                <h3 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  🏆 VICTORY ROYALE! 🏆
                </h3>
                <p className="text-gray-300 font-semibold">{tournamentResult.tournament.category}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 우승자 이미지 */}
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-80 h-80 rounded-2xl overflow-hidden border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-1 cursor-pointer group"
                         onClick={() => setImageExpanded(true)}>
                      <div className="w-full h-full rounded-xl overflow-hidden bg-gray-900">
                        <img
                          src={tournamentResult.winner.image}
                          alt={tournamentResult.winner.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-white mb-2 animate-pulse">{tournamentResult.winner.name}</h3>
                    <p className="text-gray-300 font-semibold mb-4">{tournamentResult.winner.subtitle}</p>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 px-4 py-2 rounded-full text-black font-bold animate-pulse">
                      <Crown className="w-5 h-5" />
                      <span>CHAMPION</span>
                    </div>
                  </div>
                </div>

                {/* 통계 및 버튼 */}
                <div className="space-y-6">
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-white text-lg font-bold mb-4 bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                      🎮 GAME STATS
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                        <div className="text-xl font-bold text-red-400">{tournamentResult.tournament.type}</div>
                        <div className="text-xs text-gray-300">TOURNAMENT</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                        <div className="text-xl font-bold text-yellow-400">{tournamentResult.tournament.playTime}</div>
                        <div className="text-xs text-gray-300">PLAY TIME</div>
                      </div>
                      <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                        <div className="text-xl font-bold text-green-400">{tournamentResult.winner.votes}</div>
                        <div className="text-xs text-gray-300">TOTAL VOTES</div>
                      </div>
                      <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <div className="text-xl font-bold text-blue-400">{tournamentResult.winner.winRate}%</div>
                        <div className="text-xs text-gray-300">WIN RATE</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAction('restart')}
                      disabled={loadingStates.restart}
                      className={`p-4 rounded-xl font-bold transition-all duration-300 ${
                        loadingStates.restart
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {loadingStates.restart ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <RotateCcw className="w-5 h-5" />
                          <span>🎮 RESTART</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('home')}
                      disabled={loadingStates.home}
                      className={`p-4 rounded-xl font-bold transition-all duration-300 ${
                        loadingStates.home
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
                      }`}
                    >
                      {loadingStates.home ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Home className="w-5 h-5" />
                          <span>🏠 HOME</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('ranking')}
                      disabled={loadingStates.ranking}
                      className={`p-4 rounded-xl font-bold transition-all duration-300 ${
                        loadingStates.ranking
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {loadingStates.ranking ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="w-5 h-5" />
                          <span>🏆 RANKING</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('share')}
                      disabled={loadingStates.share}
                      className={`p-4 rounded-xl font-bold transition-all duration-300 ${
                        loadingStates.share
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30'
                      }`}
                    >
                      {loadingStates.share ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Share2 className="w-5 h-5" />
                          <span>📤 SHARE</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 이미지 확대 모달 */}
        {imageExpanded && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
               onClick={() => setImageExpanded(false)}>
            <div className="relative max-w-4xl max-h-full">
              <img
                src={tournamentResult.winner.image}
                alt={tournamentResult.winner.name}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
              <button
                onClick={() => setImageExpanded(false)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-600 mb-6 text-lg">5가지 독창적인 디자인으로 토너먼트 결과를 멋지게 표현합니다</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">네온 사이버</span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">종이 찢기</span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">만화책</span>
            <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">미니멀</span>
            <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-purple-100 text-gray-800 rounded-lg text-sm font-medium">게이밍 RGB</span>
          </div>
        </div>
      </div>
    </div>
  );
}