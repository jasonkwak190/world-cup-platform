'use client';

import { useState, useEffect } from 'react';
import { Home, RotateCcw, Trophy, Share2, Maximize2, Heart, Bookmark, Flag } from 'lucide-react';
import { tournamentResult } from '../data.tsx';

export default function TournamentResultComicPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">만화책 스타일</h1>
          <p className="text-gray-600">팝아트 감성의 만화책 디자인 토너먼트 결과 UI</p>
        </div>

        <div className="bg-gradient-to-b from-blue-100 to-purple-100 p-8 rounded-3xl border-4 border-black relative overflow-hidden">
          <div className="absolute top-4 left-4 text-6xl font-black text-yellow-400 opacity-20 transform -rotate-12">WINNER!</div>
          <div className="absolute bottom-4 right-4 text-4xl font-black text-red-400 opacity-20 transform rotate-12">CHAMPION!</div>

          {/* 헤더 */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-block bg-yellow-300 p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
              <h3 className="text-2xl font-black text-black mb-1">🏆 ULTIMATE WINNER! 🏆</h3>
              <p className="text-black font-bold text-sm">{tournamentResult.tournament.category}</p>
            </div>
            
            {/* 좋아요, 북마크, 신고하기 버튼 */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-black transition-all shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 ${
                  isLiked 
                    ? 'bg-red-400 text-black' 
                    : 'bg-white text-black hover:bg-red-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>
              
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-black transition-all shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 ${
                  isBookmarked 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-white text-black hover:bg-yellow-100'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>SAVE!</span>
              </button>
              
              <button
                onClick={handleReport}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black bg-white text-black hover:bg-red-100 font-black transition-all shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1"
              >
                <Flag className="w-5 h-5" />
                <span>REPORT!</span>
              </button>
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
                <h3 className="text-xl font-black text-black mb-4">📊 TOURNAMENT STATS</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-100 rounded-xl border-2 border-black">
                    <div className="text-xl font-black text-black">{tournamentResult.tournament.type}</div>
                    <div className="text-xs font-bold text-blue-800">TOURNAMENT</div>
                  </div>
                  <div className="text-center p-3 bg-green-100 rounded-xl border-2 border-black">
                    <div className="text-xl font-black text-black">{tournamentResult.tournament.playTime}</div>
                    <div className="text-xs font-bold text-green-800">PLAY TIME</div>
                  </div>
                  <div className="text-center p-3 bg-red-100 rounded-xl border-2 border-black">
                    <div className="text-xl font-black text-black">{tournamentResult.winner.votes}</div>
                    <div className="text-xs font-bold text-red-800">TOTAL VOTES</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-100 rounded-xl border-2 border-black">
                    <div className="text-xl font-black text-black">{tournamentResult.winner.winRate}%</div>
                    <div className="text-xs font-bold text-yellow-800">WIN RATE</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('restart')}
                  disabled={loading.restart}
                  className={`p-4 rounded-2xl border-4 border-black font-black text-lg transition-all duration-300 shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 ${
                    loading.restart
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-400 text-black hover:bg-green-500'
                  }`}
                >
                  {loading.restart ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
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
                  disabled={loading.home}
                  className={`p-4 rounded-2xl border-4 border-black font-black text-lg transition-all duration-300 shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 ${
                    loading.home
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-400 text-black hover:bg-blue-500'
                  }`}
                >
                  {loading.home ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
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
                  disabled={loading.ranking}
                  className={`p-4 rounded-2xl border-4 border-black font-black text-lg transition-all duration-300 shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 ${
                    loading.ranking
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-yellow-400 text-black hover:bg-yellow-500'
                  }`}
                >
                  {loading.ranking ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
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
                  disabled={loading.share}
                  className={`p-4 rounded-2xl border-4 border-black font-black text-lg transition-all duration-300 shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 ${
                    loading.share
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-purple-400 text-black hover:bg-purple-500'
                  }`}
                >
                  {loading.share ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
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
    </div>
  );
}