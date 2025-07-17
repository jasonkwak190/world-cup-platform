'use client';

import { useState, useEffect } from 'react';
import { Home, RotateCcw, Trophy, Share2, Maximize2, Heart, Bookmark, Flag } from 'lucide-react';
import { tournamentResult } from '../data.tsx';

export default function TournamentResultMinimalPage() {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">미니멀 엘레강스</h1>
          <p className="text-gray-600">세련되고 심플한 미니멀 디자인 토너먼트 결과 UI</p>
        </div>

        <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-gray-800 mb-3">Tournament Result</h3>
            <div className="w-24 h-0.5 bg-gray-300 mx-auto mb-4"></div>
            <p className="text-gray-500 font-light">{tournamentResult.tournament.category}</p>
            
            {/* 좋아요, 북마크, 신고하기 버튼 */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isLiked 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                <span className="text-sm font-light">{likeCount}</span>
              </button>
              
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isBookmarked 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-gray-900' : ''}`} />
                <span className="text-sm font-light">Save</span>
              </button>
              
              <button
                onClick={handleReport}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-500 hover:bg-gray-100 transition-all"
              >
                <Flag className="w-5 h-5" />
                <span className="text-sm font-light">Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
            {/* 우승자 이미지 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-80 h-80 rounded-full overflow-hidden border border-gray-200 shadow-lg cursor-pointer"
                     onClick={() => setImageExpanded(true)}>
                  <img
                    src={tournamentResult.winner.image}
                    alt={tournamentResult.winner.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white/80 rounded-full p-2 shadow-md">
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-800 mb-2">{tournamentResult.winner.name}</h3>
                <p className="text-gray-500 mb-4 font-light">{tournamentResult.winner.subtitle}</p>
                <div className="inline-block bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
                  Winner
                </div>
              </div>
            </div>

            {/* 통계 및 버튼 */}
            <div className="space-y-8">
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
                <h3 className="text-xl font-light text-gray-800 mb-6">Tournament Statistics</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-1 font-light">Tournament Type</div>
                    <div className="text-2xl text-gray-900 font-light">{tournamentResult.tournament.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1 font-light">Play Time</div>
                    <div className="text-2xl text-gray-900 font-light">{tournamentResult.tournament.playTime}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1 font-light">Total Votes</div>
                    <div className="text-2xl text-gray-900 font-light">{tournamentResult.winner.votes}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1 font-light">Win Rate</div>
                    <div className="text-2xl text-gray-900 font-light">{tournamentResult.winner.winRate}%</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('restart')}
                  disabled={loading.restart}
                  className={`p-4 rounded-full font-light transition-all duration-300 ${
                    loading.restart
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {loading.restart ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>Restart</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleAction('home')}
                  disabled={loading.home}
                  className={`p-4 rounded-full font-light transition-all duration-300 ${
                    loading.home
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading.home ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleAction('ranking')}
                  disabled={loading.ranking}
                  className={`p-4 rounded-full font-light transition-all duration-300 ${
                    loading.ranking
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {loading.ranking ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>Rankings</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleAction('share')}
                  disabled={loading.share}
                  className={`p-4 rounded-full font-light transition-all duration-300 ${
                    loading.share
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {loading.share ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
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