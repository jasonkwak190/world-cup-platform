'use client';

import { useState, useEffect } from 'react';
import { Home, RotateCcw, Trophy, Share2, Maximize2, Heart, Bookmark, Flag } from 'lucide-react';
import { tournamentResult } from '../data.tsx';

export default function TournamentResultPaperPage() {
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
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">종이 찢기 스타일</h1>
          <p className="text-amber-600">아날로그 감성의 종이 디자인 토너먼트 결과 UI</p>
        </div>

        <div className="bg-amber-50 p-8 relative">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform -rotate-1">
              <h3 className="text-2xl font-bold text-amber-800 mb-1">🏆 토너먼트 우승자 🏆</h3>
              <p className="text-amber-600 text-sm">{tournamentResult.tournament.category}</p>
            </div>
            
            {/* 좋아요, 북마크, 신고하기 버튼 */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="bg-white p-3 rounded-lg shadow-md border-2 border-dashed border-gray-300 transform rotate-1">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isLiked 
                      ? 'bg-red-100 text-red-600 border-2 border-dashed border-red-300' 
                      : 'bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-md border-2 border-dashed border-gray-300 transform -rotate-1">
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isBookmarked 
                      ? 'bg-yellow-100 text-yellow-600 border-2 border-dashed border-yellow-300' 
                      : 'bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300 hover:bg-yellow-50'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>저장</span>
                </button>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-md border-2 border-dashed border-gray-300 transform rotate-1">
                <button
                  onClick={handleReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300 hover:bg-red-50 hover:text-red-600 font-semibold transition-all"
                >
                  <Flag className="w-5 h-5" />
                  <span>신고</span>
                </button>
              </div>
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
                    disabled={loading.restart}
                    className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                      loading.restart
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {loading.restart ? (
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
                    disabled={loading.home}
                    className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                      loading.home
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {loading.home ? (
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
                    disabled={loading.ranking}
                    className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                      loading.ranking
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {loading.ranking ? (
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
                    disabled={loading.share}
                    className={`w-full p-3 rounded-lg font-semibold transition-all duration-300 ${
                      loading.share
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {loading.share ? (
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
    </div>
  );
}