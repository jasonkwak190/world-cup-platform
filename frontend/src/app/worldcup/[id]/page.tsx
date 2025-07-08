'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWorldCupById } from '@/utils/supabaseData';
import { StoredWorldCup } from '@/utils/storage';
import { Play, Heart, Bookmark, Share2, User, Calendar, Trophy, /* MessageCircle, */ ArrowLeft, /* BarChart3 */ } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserLikes, 
  addLike, 
  removeLike,
  getUserBookmarks,
  addBookmark,
  removeBookmark
} from '@/utils/userInteractions';
import CommentSystem from '@/components/CommentSystem';
import { showToast } from '@/components/Toast';

export default function WorldCupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [worldcup, setWorldcup] = useState<StoredWorldCup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [currentCommentCount, setCurrentCommentCount] = useState(0);

  const worldcupId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    if (worldcupId) {
      loadWorldCup();
    }
  }, [worldcupId]);

  useEffect(() => {
    if (user && worldcup) {
      loadUserInteractions();
    }
  }, [user, worldcup]);

  const loadWorldCup = async () => {
    if (!worldcupId) return;
    
    try {
      setIsLoading(true);
      const data = await getWorldCupById(worldcupId);
      
      if (!data) {
        showToast('월드컵을 찾을 수 없습니다.', 'error');
        router.push('/');
        return;
      }
      
      setWorldcup(data);
      setCurrentCommentCount(data.comments || 0);
    } catch (error) {
      console.error('Failed to load worldcup:', error);
      showToast('월드컵을 불러오는데 실패했습니다.', 'error');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInteractions = async () => {
    if (!user || !worldcup) return;

    try {
      const [userLikes, userBookmarks] = await Promise.all([
        getUserLikes(user.id),
        getUserBookmarks(user.id)
      ]);

      setIsLiked(userLikes.includes(worldcup.id));
      setIsBookmarked(userBookmarks.includes(worldcup.id));
    } catch (error) {
      console.error('Failed to load user interactions:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    if (!worldcup || isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      
      if (isLiked) {
        const success = await removeLike(user.id, worldcup.id);
        if (success) {
          setIsLiked(false);
          setWorldcup(prev => prev ? { ...prev, likes: Math.max(0, prev.likes - 1) } : null);
          showToast('좋아요를 취소했습니다.', 'success');
        }
      } else {
        const success = await addLike(user.id, worldcup.id);
        if (success) {
          setIsLiked(true);
          setWorldcup(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
          showToast('좋아요를 눌렀습니다.', 'success');
        }
      }
    } catch (error) {
      console.error('Failed to handle like:', error);
      showToast('좋아요 처리에 실패했습니다.', 'error');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    if (!worldcup || isBookmarkLoading) return;

    try {
      setIsBookmarkLoading(true);
      
      if (isBookmarked) {
        const success = await removeBookmark(user.id, worldcup.id);
        if (success) {
          setIsBookmarked(false);
          showToast('북마크를 제거했습니다.', 'success');
        }
      } else {
        const success = await addBookmark(user.id, worldcup.id);
        if (success) {
          setIsBookmarked(true);
          showToast('북마크에 추가했습니다.', 'success');
        }
      }
    } catch (error) {
      console.error('Failed to handle bookmark:', error);
      showToast('북마크 처리에 실패했습니다.', 'error');
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    if (!worldcup) return;

    try {
      const shareUrl = `${window.location.origin}/worldcup/${worldcup.id}`;
      // const shareText = `${worldcup.title} - 이상형 월드컵에 참여해보세요!`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('링크가 클립보드에 복사되었습니다!', 'success');
      } else {
        const message = `다음 링크를 복사해서 공유하세요:\\n\\n${shareUrl}`;
        alert(message);
      }
    } catch (error) {
      console.error('Failed to share:', error);
      showToast('공유 중 오류가 발생했습니다.', 'error');
    }
  };

  const handlePlay = () => {
    if (worldcup) {
      router.push(`/play/${worldcup.id}`);
    }
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      'all': '전체',
      'celebrity': '연예인',
      'food': '음식',
      'travel': '여행',
      'anime': '애니메이션',
      'game': '게임',
      'movie': '영화',
      'music': '음악',
      'entertainment': '엔터테인먼트',
      'sports': '스포츠',
      'other': '기타',
    };
    return categories[category] || '기타';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">월드컵을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!worldcup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">월드컵을 찾을 수 없습니다</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 월드컵 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 썸네일 */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={worldcup.thumbnail}
                  alt={worldcup.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 정보 */}
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                    {getCategoryName(worldcup.category)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(worldcup.createdAt)}</span>
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{worldcup.title}</h1>
                <p className="text-gray-600">{worldcup.description}</p>
              </div>

              {/* 작성자 정보 */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-600">작성자: {worldcup.author}</span>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{worldcup.participants}</div>
                  <div className="text-sm text-gray-500">참여자</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{worldcup.likes}</div>
                  <div className="text-sm text-gray-500">좋아요</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{currentCommentCount}</div>
                  <div className="text-sm text-gray-500">댓글</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{worldcup.items.length}</div>
                  <div className="text-sm text-gray-500">항목</div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePlay}
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Play className="w-5 h-5" />
                  <span>게임 시작</span>
                </button>
                
                <button
                  onClick={handleLike}
                  disabled={isLikeLoading}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                    isLiked
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-600'
                  } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? '좋아요 취소' : '좋아요'}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={isBookmarkLoading}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                    isBookmarked
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300 hover:text-yellow-600'
                  } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>{isBookmarked ? '북마크 해제' : '북마크'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>공유</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 월드컵 항목 미리보기 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>월드컵 항목 ({worldcup.items.length}개)</span>
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {worldcup.items.slice(0, 12).map((item, _index) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3 text-center">
                {item.image && (
                  <div className="aspect-square bg-gray-200 rounded-lg mb-2 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
              </div>
            ))}
            
            {worldcup.items.length > 12 && (
              <div className="bg-gray-100 rounded-lg p-3 text-center flex items-center justify-center">
                <span className="text-sm text-gray-500">
                  +{worldcup.items.length - 12}개 더
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 댓글 시스템 */}
        <div id="comments">
          <CommentSystem 
            worldcupId={worldcup.id} 
            initialCommentCount={worldcup.comments}
            onCommentCountChange={setCurrentCommentCount}
          />
        </div>
      </div>
    </div>
  );
}