import { Heart, MessageCircle, Share2, Play, Bookmark, BarChart3, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface WorldCupCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  author: string;
  createdAt: string;
  participants: number;
  comments: number;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isLoggedIn?: boolean; // 로그인 상태 추가
  isPlayLoading?: boolean; // 시작하기 버튼 로딩 상태
  onPlay: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onViewRanking?: () => void;
}

export default function WorldCupCard({
  id,
  title,
  description,
  thumbnail,
  author,
  createdAt,
  participants,
  comments,
  likes,
  isLiked = false,
  isBookmarked = false,
  isLoggedIn = false,
  isPlayLoading = false,
  onPlay,
  onLike,
  onBookmark,
  onShare,
  onViewRanking,
}: WorldCupCardProps) {
  const [showModal, setShowModal] = useState(false);

  // 이미지 URL 처리 함수 - Supabase URLs와 Base64 모두 지원
  const getImageUrl = (image: string | File | Blob | undefined | null): string => {
    try {
      if (!image) {
        return '';
      }
      
      if (typeof image === 'string') {
        // Accept all string URLs including blob: URLs and base64
        if (image.trim() === '') {
          return '';
        }
        
        // Supabase Storage URL 처리
        if (image.startsWith('https://') && image.includes('supabase')) {
          return image;
        }
        
        // Base64 이미지 유효성 검증
        if (image.startsWith('data:image/')) {
          const base64Data = image.split(',')[1];
          if (base64Data && base64Data.length > 100) {
            return image;
          } else {
            console.warn('❌ Invalid base64 image data');
            return '';
          }
        }
        
        // 기타 URL 형식
        if (image.startsWith('http') || image.startsWith('/') || image.startsWith('blob:')) {
          return image;
        }
        
        return '';
      }
      
      if (image instanceof File) {
        return URL.createObjectURL(image);
      }
      
      if (image instanceof Blob) {
        return URL.createObjectURL(image);
      }
      
      return '';
    } catch (error) {
      console.error('Error creating image URL:', error);
      return '';
    }
  };

  // 처리된 썸네일 URL 생성
  const thumbnailUrl = getImageUrl(thumbnail);
  
  // 간단한 디버깅 로그 (개발 환경에서만)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🖼️ WorldCupCard:', {
      id: id,
      title: title.substring(0, 30) + '...',
      comments: comments,  // 댓글 수 로깅 추가
      participants: participants,
      likes: likes,
      thumbnailType: typeof thumbnail,
      thumbnailRaw: thumbnail?.toString().substring(0, 100) + (thumbnail?.toString().length > 100 ? '...' : ''),
      thumbnailProcessed: thumbnailUrl?.substring(0, 100) + (thumbnailUrl?.length > 100 ? '...' : ''),
      thumbnailValid: !!thumbnailUrl && thumbnailUrl.length > 10,
      isSupabaseUrl: thumbnailUrl?.includes('supabase'),
      isBase64: thumbnailUrl?.startsWith('data:image/'),
      isPlaceholder: thumbnailUrl === '/placeholder.svg'
    });
  }

  const handleTextClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handlePlayClick = () => {
    // 토너먼트 선택 화면으로 바로 이동
    window.location.href = `/play/${id}`;
  };
  
  return (
    <>
      {/* card-designs의 럭셔리 모던 스타일 적용 */}
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-102 hover:shadow-3xl border border-gray-200/50 group w-full">
        <div className="p-6 relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-cyan-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

          {/* 썸네일 */}
          <div className="relative mb-6 rounded-xl overflow-hidden shadow-xl border-2 border-purple-200/30">
            {thumbnailUrl && thumbnailUrl.trim() !== '' && thumbnailUrl.length > 10 ? (
              <>
                <div className="relative w-full h-48 overflow-hidden">
                  <Image 
                    src={thumbnailUrl} 
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={false}
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  onError={(e) => {
                    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                      console.warn('❌ Thumbnail failed to load:', {
                        url: thumbnailUrl.substring(0, 100) + '...',
                        isSupabase: thumbnailUrl.includes('supabase'),
                        isBase64: thumbnailUrl.startsWith('data:image/')
                      });
                    }
                    
                    // Show fallback on error
                    const parent = e.currentTarget.parentElement?.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.fallback-placeholder');
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                      e.currentTarget.parentElement!.style.display = 'none';
                    }
                  }}
                  onLoad={(e) => {
                    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                      console.log('✅ Thumbnail loaded successfully with Next.js Image');
                    }
                  }}
                  />
                </div>
                <div className="fallback-placeholder hidden absolute inset-0 flex items-center justify-center bg-gray-900" style={{ zIndex: 5 }}>
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="text-white text-sm font-medium line-clamp-2">
                      {title}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                {/* Tournament 배지 제거됨 */}
              </>
            ) : (
              <img 
                src="/placeholder.svg" 
                alt={title}
                className="w-full h-48 object-cover bg-gray-900"
              />
            )}
          </div>

          {/* 제목 */}
          <div className="mb-4">
            <h3 
              className="text-gray-900 font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
              onClick={handleTextClick}
              title="클릭하여 상세 정보 보기"
            >
              {title}
              {title.length > 50 && <span className="text-purple-500 ml-1">...</span>}
            </h3>
            {description && (
              <p 
                className="text-gray-600 text-sm line-clamp-2 cursor-pointer hover:text-gray-800 transition-colors"
                onClick={handleTextClick}
                title="클릭하여 상세 정보 보기"
              >
                {description}
                {description.length > 100 && <span className="text-purple-500 ml-1">...</span>}
              </p>
            )}
          </div>

          {/* 작성자 정보 */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 mb-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* 기본 프로필 아이콘 - 실제 프로필 이미지가 없으므로 */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md border-2 border-white">
                  <span className="text-white text-xs font-bold">
                    {author.charAt(0).toUpperCase()}
                  </span>
                </div>
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
                  @{author.length > 12 ? author.substring(0, 12) + '...' : author}
                </p>
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {createdAt}
                </p>
              </div>
              {/* 보조 버튼들 - 프로필 오른쪽 */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={onLike}
                  className={`p-1.5 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center ${
                    isLiked
                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => {
                    console.log('🔖 Bookmark button clicked:', { id, isBookmarked, isLoggedIn });
                    onBookmark();
                  }}
                  disabled={!isLoggedIn}
                  title={!isLoggedIn ? '북마크는 로그인 후 이용할 수 있습니다' : ''}
                  className={`p-1.5 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center ${
                    !isLoggedIn
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                      : isBookmarked
                      ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={onShare}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 w-7 h-7 flex items-center justify-center"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 통계 */}
          <div className="bg-gray-50/50 rounded-lg p-3 mb-6 border border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-purple-600 font-bold text-lg">{participants.toLocaleString()}</div>
                <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                  <Play className="w-3 h-3" />
                  PLAYS
                </div>
              </div>
              <div>
                <div className="text-blue-600 font-bold text-lg">{comments}</div>
                <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  COMMENTS
                </div>
              </div>
              <div>
                <div className="text-pink-600 font-bold text-lg">{likes}</div>
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
              onClick={handlePlayClick}
              disabled={isPlayLoading}
              className={`font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 ${
                isPlayLoading
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              } text-white`}
            >
              {isPlayLoading ? (
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
            {onViewRanking ? (
              <button 
                onClick={onViewRanking}
                className="font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 shadow-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700"
              >
                <BarChart3 className="w-4 h-4" />
                Rank
              </button>
            ) : (
              <button 
                onClick={onShare}
                className="font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 shadow-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">월드컵 상세 정보</h3>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">제목</h4>
                  <p className="text-gray-700 leading-relaxed">{title}</p>
                </div>
                {description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">설명</h4>
                    <p className="text-gray-700 leading-relaxed">{description}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">작성자</h4>
                  <p className="text-gray-700">@{author}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">생성일</h4>
                  <p className="text-gray-700">{createdAt}</p>
                </div>
              </div>
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
    </>
  );
}