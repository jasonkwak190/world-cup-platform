'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Bookmark, Share2, Home, RotateCcw, BarChart, Flag, Clock, Trophy, User, Eye, ThumbsUp, MessageCircle, Star } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedRankingModal from '@/components/shared/EnhancedRankingModal';

// 테마별 스타일 정의
const themeStyles = {
  neon: {
    bg: 'bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900',
    text: 'text-cyan-400',
    accent: 'text-pink-400',
    card: 'bg-gray-900/50 border-cyan-400/50',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-cyan-400',
    winnerGlow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]'
  },
  paper: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100',
    text: 'text-amber-800',
    accent: 'text-orange-600',
    card: 'bg-white border-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    secondary: 'bg-amber-100 hover:bg-amber-200 text-amber-800',
    winnerGlow: 'shadow-lg'
  },
  comic: {
    bg: 'bg-gradient-to-br from-blue-100 to-purple-100',
    text: 'text-purple-800',
    accent: 'text-blue-600',
    card: 'bg-white border-purple-300',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
    winnerGlow: 'shadow-lg'
  },
  minimal: {
    bg: 'bg-gradient-to-br from-gray-50 to-white',
    text: 'text-gray-800',
    accent: 'text-gray-600',
    card: 'bg-white border-gray-300',
    button: 'bg-gray-800 hover:bg-gray-900 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    winnerGlow: 'shadow-lg'
  },
  gaming: {
    bg: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
    text: 'text-white',
    accent: 'text-purple-400',
    card: 'bg-gray-800/50 border-purple-400/50',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-purple-400',
    winnerGlow: 'shadow-[0_0_30px_rgba(147,51,234,0.3)]'
  }
};

interface TournamentResultProps {
  params: Promise<{
    id: string;
  }>;
}

interface WinnerStats {
  votes: number;
  winRate: number;
  totalMatches: number;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  isCreator: boolean;
  level: 'bronze' | 'silver' | 'gold' | 'vip';
  replies?: Comment[];
}

export default function TournamentResultPage({ params }: TournamentResultProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [worldcupId, setWorldcupId] = useState<string>('');
  const [theme, setTheme] = useState<string>('minimal');
  const [playTime, setPlayTime] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<string>('');
  const [worldcupData, setWorldcupData] = useState<any>(null);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [winnerStats, setWinnerStats] = useState<WinnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showRanking, setShowRanking] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [commentFilter, setCommentFilter] = useState<'likes' | 'recent'>('likes');
  const [showCommentForm, setShowCommentForm] = useState(false);

  // 사용자 레벨 아이콘 및 색상
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'vip':
        return <Star className="w-4 h-4 text-yellow-400 fill-current" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-600 fill-current" />;
      case 'silver':
        return <Star className="w-4 h-4 text-gray-400 fill-current" />;
      default:
        return <Star className="w-4 h-4 text-amber-600 fill-current" />;
    }
  };

  // 시간 포맷 함수
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 상대적 시간 포맷
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setWorldcupId(id);

        // URL 파라미터에서 정보 가져오기
        const themeParam = searchParams.get('theme') || 'minimal';
        const playTimeParam = searchParams.get('playTime') || '0';
        const winnerIdParam = searchParams.get('winner') || '';
        
        setTheme(themeParam);
        setPlayTime(parseInt(playTimeParam));
        setWinnerId(winnerIdParam);

        // 월드컵 데이터 로드
        const [worldcupResponse, winnerResponse] = await Promise.all([
          fetch(`/api/worldcups/${id}`),
          winnerIdParam ? fetch(`/api/worldcups/${id}/items/${winnerIdParam}`) : Promise.resolve(null)
        ]);

        if (!worldcupResponse.ok) {
          throw new Error('월드컵 데이터를 불러올 수 없습니다.');
        }

        const worldcupData = await worldcupResponse.json();
        setWorldcupData(worldcupData.worldcup);
        setLikes(worldcupData.worldcup.likes || 0);

        if (winnerResponse?.ok) {
          const winnerData = await winnerResponse.json();
          setWinnerData(winnerData);
          
          // 우승자 통계 시뮬레이션
          setWinnerStats({
            votes: Math.floor(Math.random() * 1000) + 100,
            winRate: Math.floor(Math.random() * 30) + 70,
            totalMatches: Math.floor(Math.random() * 50) + 20
          });
        }

        // 댓글 데이터 로드
        loadComments();
        
        // 좋아요/북마크 상태 확인
        if (isAuthenticated) {
          checkLikeBookmarkStatus();
        }

      } catch (err) {
        console.error('Failed to load result data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams, isAuthenticated]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const checkLikeBookmarkStatus = async () => {
    try {
      const [likeResponse, bookmarkResponse] = await Promise.all([
        fetch(`/api/worldcups/${worldcupId}/like`),
        fetch(`/api/worldcups/${worldcupId}/bookmark`)
      ]);
      
      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        setLiked(likeData.liked);
      }
      
      if (bookmarkResponse.ok) {
        const bookmarkData = await bookmarkResponse.json();
        setBookmarked(bookmarkData.bookmarked);
      }
    } catch (error) {
      console.error('Failed to check like/bookmark status:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/tournament-select/${worldcupId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('Failed to share:', error);
      alert('공유 중 오류가 발생했습니다.');
    }
  };

  const handleRestart = () => {
    router.push(`/tournament-select/${worldcupId}`);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || (!isAuthenticated && !guestName.trim())) {
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          guestName: !isAuthenticated ? guestName : undefined
        })
      });

      if (response.ok) {
        setCommentText('');
        setGuestName('');
        setShowCommentForm(false);
        loadComments();
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleReport = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('신고가 접수되었습니다.');
      }
    } catch (error) {
      console.error('Failed to report comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleGoHome}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentTheme = themeStyles[theme as keyof typeof themeStyles] || themeStyles.minimal;
  const sortedComments = [...comments].sort((a, b) => {
    if (commentFilter === 'likes') {
      return b.likes - a.likes;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className={`min-h-screen ${currentTheme.bg} py-8`}>
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className={`w-8 h-8 ${currentTheme.accent} mr-2`} />
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>토너먼트 결과</h1>
          </div>
          
          {/* 월드컵 제목 */}
          <h2 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>
            {worldcupData?.title}
          </h2>
          
          {worldcupData?.description && (
            <p className={`text-lg ${currentTheme.accent} mb-4`}>
              {worldcupData.description}
            </p>
          )}
        </div>

        {/* 우승자 정보 */}
        {winnerData && (
          <div className={`${currentTheme.card} border-2 rounded-xl p-6 mb-8 ${currentTheme.winnerGlow}`}>
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${currentTheme.text} mb-2`}>
                🏆 우승자
              </div>
            </div>
            
            <div 
              className="relative w-64 h-64 mx-auto mb-4 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setShowImageModal(true)}
            >
              {winnerData.image_url ? (
                <Image
                  src={winnerData.image_url}
                  alt={winnerData.title}
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${currentTheme.bg}`}>
                  <span className={`text-xl ${currentTheme.text}`}>이미지 없음</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className={`text-2xl font-bold ${currentTheme.text} mb-4`}>
                {winnerData.title}
              </h3>
              
              {/* 우승자 통계 */}
              {winnerStats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                      {winnerStats.votes}
                    </div>
                    <div className={`text-sm ${currentTheme.text}`}>받은 투표</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                      {winnerStats.winRate}%
                    </div>
                    <div className={`text-sm ${currentTheme.text}`}>승률</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                      {winnerStats.totalMatches}
                    </div>
                    <div className={`text-sm ${currentTheme.text}`}>총 경기</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 게임 정보 */}
        <div className={`${currentTheme.card} border-2 rounded-xl p-6 mb-8`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Clock className={`w-6 h-6 ${currentTheme.accent} mx-auto mb-2`} />
              <div className={`text-lg font-semibold ${currentTheme.text}`}>
                {formatTime(playTime)}
              </div>
              <div className={`text-sm ${currentTheme.accent}`}>소요 시간</div>
            </div>
            <div className="text-center">
              <User className={`w-6 h-6 ${currentTheme.accent} mx-auto mb-2`} />
              <div className={`text-lg font-semibold ${currentTheme.text}`}>
                {worldcupData?.creator_name || 'Unknown'}
              </div>
              <div className={`text-sm ${currentTheme.accent}`}>제작자</div>
            </div>
          </div>
        </div>

        {/* 좋아요/북마크 */}
        <div className={`${currentTheme.card} border-2 rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                liked 
                  ? 'bg-red-500 text-white' 
                  : `${currentTheme.secondary} border-2`
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                bookmarked 
                  ? 'bg-yellow-500 text-white' 
                  : `${currentTheme.secondary} border-2`
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              <span>북마크</span>
            </button>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleRestart}
            className={`${currentTheme.button} px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors`}
          >
            <RotateCcw className="w-5 h-5" />
            <span>다시 하기</span>
          </button>
          
          <button
            onClick={handleGoHome}
            className={`${currentTheme.secondary} border-2 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors`}
          >
            <Home className="w-5 h-5" />
            <span>홈으로</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowRanking(true)}
            className={`${currentTheme.secondary} border-2 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors`}
          >
            <BarChart className="w-5 h-5" />
            <span>랭킹 보기</span>
          </button>
          
          <button
            onClick={handleShare}
            className={`${currentTheme.secondary} border-2 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors`}
          >
            <Share2 className="w-5 h-5" />
            <span>공유하기</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className={`${currentTheme.card} border-2 rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${currentTheme.text}`}>
              댓글 ({comments.length})
            </h3>
            
            {/* 필터 */}
            <div className="flex space-x-2">
              <button
                onClick={() => setCommentFilter('likes')}
                className={`px-3 py-1 rounded text-sm ${
                  commentFilter === 'likes' 
                    ? currentTheme.button 
                    : currentTheme.secondary
                }`}
              >
                좋아요순
              </button>
              <button
                onClick={() => setCommentFilter('recent')}
                className={`px-3 py-1 rounded text-sm ${
                  commentFilter === 'recent' 
                    ? currentTheme.button 
                    : currentTheme.secondary
                }`}
              >
                최신순
              </button>
            </div>
          </div>

          {/* 댓글 작성 */}
          {!showCommentForm ? (
            <button
              onClick={() => setShowCommentForm(true)}
              className={`w-full p-3 rounded-lg ${currentTheme.secondary} border-2 ${currentTheme.text} text-left transition-colors`}
            >
              댓글을 작성해주세요...
            </button>
          ) : (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              {!isAuthenticated && (
                <input
                  type="text"
                  placeholder="닉네임"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <textarea
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className={`${currentTheme.button} px-4 py-2 rounded-lg transition-colors`}
                >
                  댓글 작성
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentForm(false)}
                  className={`${currentTheme.secondary} border-2 px-4 py-2 rounded-lg transition-colors`}
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <div key={comment.id} className={`p-4 rounded-lg ${currentTheme.bg} border ${comment.isCreator ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(comment.level)}
                    <span className={`font-semibold ${currentTheme.text}`}>
                      {comment.author}
                    </span>
                    {comment.isCreator && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full">
                        제작자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${currentTheme.accent}`}>
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => handleReport(comment.id)}
                      className={`p-1 rounded ${currentTheme.secondary} hover:bg-red-500 hover:text-white transition-colors`}
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className={`${currentTheme.text} mb-2`}>{comment.content}</p>
                <div className="flex items-center space-x-4">
                  <button className={`flex items-center space-x-1 ${currentTheme.accent} hover:text-red-500 transition-colors`}>
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes}</span>
                  </button>
                  <button className={`flex items-center space-x-1 ${currentTheme.accent} hover:text-blue-500 transition-colors`}>
                    <MessageCircle className="w-4 h-4" />
                    <span>답글</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      <AnimatePresence>
        {showImageModal && winnerData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={winnerData.image_url}
                alt={winnerData.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 리포트 기능 (추후 구현) */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => alert('리포트 기능은 추후 구현될 예정입니다.')}
          className={`p-3 rounded-full ${currentTheme.button} shadow-lg transition-colors`}
        >
          <Flag className="w-6 h-6" />
        </button>
      </div>

      {/* 랭킹 모달 */}
      <EnhancedRankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
        worldcupId={worldcupId}
        worldcupTitle={worldcupData?.title || ''}
        theme={theme}
      />
    </div>
  );
}