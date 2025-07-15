'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Play, BarChart3, User, Calendar, Trophy, Zap, Star, Shield, Gamepad2, Share2, Bookmark } from 'lucide-react';

// 샘플 데이터 (텍스트 확장 테스트용)
const sampleData = {
  id: '1',
  title: '최고의 K-POP 아이돌 월드컵 2024 - 4세대 대표 아이돌들의 치열한 대결과 팬들의 선택으로 만들어지는 궁극의 랭킹 시스템',
  description: '4세대 아이돌들의 치열한 대결! 당신의 최애를 선택해보세요. 이 월드컵은 다양한 그룹의 멤버들이 참여하며, 각각의 매력과 실력을 바탕으로 팬들의 투표를 통해 최종 우승자를 가리는 흥미진진한 토너먼트입니다.',
  thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  author: 'K-POP_Master_Ultimate_Fan_2024_Official',
  createdAt: '3일 전',
  participants: 12847,
  comments: 234,
  likes: 1456,
  profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face'
};

export default function CardDesignsPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(new Set());
  const [expandedText, setExpandedText] = useState<{[key: string]: boolean}>({});

  const toggleLike = (cardId: string) => {
    setLikedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const toggleBookmark = (cardId: string) => {
    setBookmarkedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const [showModal, setShowModal] = useState<{isOpen: boolean, title: string, content: string}>({
    isOpen: false,
    title: '',
    content: ''
  });
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set());

  const handleTextClick = () => {
    setShowModal({
      isOpen: true,
      title: '월드컵 상세 정보',
      content: `제목: ${sampleData.title}\n\n설명: ${sampleData.description}\n\n작성자: @${sampleData.author}\n\n생성일: ${sampleData.createdAt}`
    });
  };

  const closeModal = () => {
    setShowModal({
      isOpen: false,
      title: '',
      content: ''
    });
  };

  const handleButtonClick = (buttonId: string) => {
    setLoadingButtons(prev => new Set(prev).add(buttonId));
    
    // 2.5초 후 로딩 상태 해제
    setTimeout(() => {
      setLoadingButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(buttonId);
        return newSet;
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">월드컵 카드 디자인 테스트</h1>
          <p className="text-gray-600">다양한 스타일의 카드 디자인을 비교해보세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* 디자인 1: 럭셔리 모던 스타일 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">2. 럭셔리 모던</h2>
            <div 
              className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-102 hover:shadow-3xl border border-gray-200/50"
              onMouseEnter={() => setHoveredCard('luxury')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="p-6 relative overflow-hidden">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-cyan-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

                {/* 썸네일 */}
                <div className="relative mb-6 rounded-xl overflow-hidden shadow-xl border-2 border-purple-200/30">
                  <img 
                    src={sampleData.thumbnail} 
                    alt={sampleData.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm border border-purple-200 rounded-lg px-4 py-2">
                        <span className="text-purple-600 font-semibold flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          TOURNAMENT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 제목 */}
                <div className="mb-4">
                  <h3 
                    className="text-gray-900 font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={handleTextClick}
                    title="클릭하여 상세 정보 보기"
                  >
                    {sampleData.title}
                    <span className="text-purple-500 ml-1">...</span>
                  </h3>
                  <p 
                    className="text-gray-600 text-sm line-clamp-2 cursor-pointer hover:text-gray-800 transition-colors"
                    onClick={handleTextClick}
                    title="클릭하여 상세 정보 보기"
                  >
                    {sampleData.description}
                    <span className="text-purple-500 ml-1">...</span>
                  </p>
                </div>

                {/* 작성자 정보 */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 mb-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={sampleData.profileImage} 
                        alt={sampleData.author}
                        className="w-8 h-8 rounded-full shadow-md border-2 border-white"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white">
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-75"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p 
                        className="text-gray-900 font-medium text-sm cursor-pointer hover:text-purple-600 transition-colors truncate"
                        onClick={handleTextClick}
                        title="클릭하여 상세 정보 보기"
                      >
                        @{sampleData.author.length > 12 ? sampleData.author.substring(0, 12) + '...' : sampleData.author}
                      </p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {sampleData.createdAt}
                      </p>
                    </div>
                    {/* 보조 버튼들 - 프로필 오른쪽 */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleLike('luxury')}
                        className={`p-1.5 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center ${
                          likedCards.has('luxury')
                            ? 'text-red-500 bg-red-50 hover:bg-red-100'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedCards.has('luxury') ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={() => toggleBookmark('luxury')}
                        className={`p-1.5 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center ${
                          bookmarkedCards.has('luxury')
                            ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarkedCards.has('luxury') ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 통계 */}
                <div className="bg-gray-50/50 rounded-lg p-3 mb-6 border border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-purple-600 font-bold text-lg">{sampleData.participants.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                        <Play className="w-3 h-3" />
                        PLAYS
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-bold text-lg">{sampleData.comments}</div>
                      <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        COMMENTS
                      </div>
                    </div>
                    <div>
                      <div className="text-pink-600 font-bold text-lg">{sampleData.likes}</div>
                      <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" />
                        LIKES
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주요 버튼 */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleButtonClick('luxury-start')}
                    disabled={loadingButtons.has('luxury-start')}
                    className={`font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 ${
                      loadingButtons.has('luxury-start')
                        ? 'bg-purple-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    } text-white`}
                  >
                    {loadingButtons.has('luxury-start') ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleButtonClick('luxury-rank')}
                    disabled={loadingButtons.has('luxury-rank')}
                    className={`font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 shadow-sm ${
                      loadingButtons.has('luxury-rank')
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700'
                    }`}
                  >
                    {loadingButtons.has('luxury-rank') ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Rank
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 디자인 3: 럭셔리 다크 모던 스타일 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">3. 럭셔리 다크 모던</h2>
            <div 
              className="relative rounded-2xl p-1 shadow-2xl transform transition-all duration-300 hover:scale-102 hover:shadow-3xl"
              style={{
                background: hoveredCard === 'dark' 
                  ? 'linear-gradient(45deg, #ff0080, #00ff80, #0080ff, #ff8000, #ff0080)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                backgroundSize: hoveredCard === 'dark' ? '400% 400%' : 'auto',
                animation: hoveredCard === 'dark' ? 'rainbow-border 2s linear infinite' : 'none',
                padding: '2px'
              }}
              onMouseEnter={() => setHoveredCard('dark')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <style jsx>{`
                @keyframes rainbow-border {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}</style>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 relative overflow-hidden">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-900/30 to-cyan-900/30 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

                {/* 썸네일 */}
                <div className="relative mb-6 rounded-xl overflow-hidden shadow-xl border-2 border-amber-400/30">
                  <img 
                    src={sampleData.thumbnail} 
                    alt={sampleData.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-center">
                      <div className="bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-lg px-4 py-2">
                        <span className="text-amber-300 font-semibold flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          TOURNAMENT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 제목 */}
                <div className="mb-4">
                  <h3 
                    className="text-white font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-amber-300 transition-colors"
                    onClick={handleTextClick}
                    title="클릭하여 상세 정보 보기"
                  >
                    {sampleData.title}
                    <span className="text-amber-400 ml-1">...</span>
                  </h3>
                  <p 
                    className="text-slate-300 text-sm line-clamp-2 cursor-pointer hover:text-slate-200 transition-colors"
                    onClick={handleTextClick}
                    title="클릭하여 상세 정보 보기"
                  >
                    {sampleData.description}
                    <span className="text-amber-400 ml-1">...</span>
                  </p>
                </div>

                {/* 작성자 정보 */}
                <div className="bg-slate-700/50 rounded-lg p-3 mb-4 border border-slate-600/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={sampleData.profileImage} 
                        alt={sampleData.author}
                        className="w-8 h-8 rounded-full shadow-md border-2 border-amber-400/50"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-slate-900">
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-75"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p 
                        className="text-white font-medium text-sm cursor-pointer hover:text-amber-300 transition-colors truncate"
                        onClick={handleTextClick}
                        title="클릭하여 상세 정보 보기"
                      >
                        @{sampleData.author.length > 12 ? sampleData.author.substring(0, 12) + '...' : sampleData.author}
                      </p>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {sampleData.createdAt}
                      </p>
                    </div>
                    {/* 보조 버튼들 - 프로필 오른쪽 */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleLike('dark')}
                        className={`p-1.5 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center ${
                          likedCards.has('dark')
                            ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                            : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedCards.has('dark') ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={() => toggleBookmark('dark')}
                        className={`p-1.5 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center ${
                          bookmarkedCards.has('dark')
                            ? 'text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30'
                            : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarkedCards.has('dark') ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 통계 */}
                <div className="bg-slate-700/30 rounded-lg p-3 mb-6 border border-slate-600/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-amber-400 font-bold text-lg">{sampleData.participants.toLocaleString()}</div>
                      <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                        <Play className="w-3 h-3" />
                        PLAYS
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-400 font-bold text-lg">{sampleData.comments}</div>
                      <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        COMMENTS
                      </div>
                    </div>
                    <div>
                      <div className="text-red-400 font-bold text-lg">{sampleData.likes}</div>
                      <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" />
                        LIKES
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주요 버튼 */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleButtonClick('dark-start')}
                    disabled={loadingButtons.has('dark-start')}
                    className={`font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 ${
                      loadingButtons.has('dark-start')
                        ? 'bg-amber-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                    } text-black`}
                  >
                    {loadingButtons.has('dark-start') ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleButtonClick('dark-rank')}
                    disabled={loadingButtons.has('dark-rank')}
                    className={`font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-slate-500 shadow-lg shadow-slate-500/25 ${
                      loadingButtons.has('dark-rank')
                        ? 'bg-slate-500 cursor-not-allowed text-slate-300'
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'
                    }`}
                  >
                    {loadingButtons.has('dark-rank') ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Rank
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">어떤 디자인이 가장 마음에 드시나요? 텍스트를 클릭해서 확장 기능을 테스트해보세요!</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">1. 럭셔리 모던</span>
            <span className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-600">2. 럭셔리 다크 모던</span>
          </div>
        </div>
      </div>

      {/* 텍스트 확장 모달 */}
      {showModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{showModal.title}</h3>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {showModal.content}
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={closeModal}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}