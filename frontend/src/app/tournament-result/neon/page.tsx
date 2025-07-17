'use client';

import { useState, useEffect } from 'react';
import { Home, RotateCcw, Trophy, Share2, Maximize2, Heart, Bookmark, Flag, Crown } from 'lucide-react';
import { tournamentResult } from '../data.tsx';

export default function TournamentResultNeonPage() {
  const [isClient, setIsClient] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    restart: false,
    home: false,
    ranking: false,
    share: false
  });
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1247);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAction = (action: string) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    
    setTimeout(() => {
      setLoading(prev => ({ ...prev, [action]: false }));
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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleReport = () => {
    if (confirm('이 토너먼트를 신고하시겠습니까?')) {
      alert('신고가 접수되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">네온 사이버 스타일</h1>
          <p className="text-gray-400">미래적인 네온 디자인의 토너먼트 결과 UI</p>
        </div>

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
              
              {/* 좋아요, 북마크, 신고하기 버튼 */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono font-bold transition-all ${
                    isLiked 
                      ? 'bg-pink-400/20 border-pink-400 text-pink-400' 
                      : 'bg-gray-800/30 border-gray-600 text-gray-400 hover:border-pink-400 hover:text-pink-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>
                
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono font-bold transition-all ${
                    isBookmarked 
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' 
                      : 'bg-gray-800/30 border-gray-600 text-gray-400 hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>SAVE</span>
                </button>
                
                <button
                  onClick={handleReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 bg-gray-800/30 border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-400 font-mono font-bold transition-all"
                >
                  <Flag className="w-5 h-5" />
                  <span>REPORT</span>
                </button>
              </div>
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
                    disabled={loading.restart}
                    className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                      loading.restart
                        ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        : 'bg-cyan-400/10 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20'
                    }`}
                  >
                    {loading.restart ? (
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
                    disabled={loading.home}
                    className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                      loading.home
                        ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        : 'bg-pink-400/10 border-pink-400 text-pink-400 hover:bg-pink-400/20'
                    }`}
                  >
                    {loading.home ? (
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
                    disabled={loading.ranking}
                    className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                      loading.ranking
                        ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-400/10 border-yellow-400 text-yellow-400 hover:bg-yellow-400/20'
                    }`}
                  >
                    {loading.ranking ? (
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
                    disabled={loading.share}
                    className={`p-4 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                      loading.share
                        ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-400/10 border-purple-400 text-purple-400 hover:bg-purple-400/20'
                    }`}
                  >
                    {loading.share ? (
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
    </div>
  );
}