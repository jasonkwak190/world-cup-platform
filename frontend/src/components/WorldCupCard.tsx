import { Heart, MessageCircle, Share2, Play, Bookmark, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  onPlay,
  onLike,
  onBookmark,
  onShare,
  onViewRanking,
}: WorldCupCardProps) {
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
  if (process.env.NODE_ENV === 'development') {
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
  
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        {thumbnailUrl && thumbnailUrl.trim() !== '' && thumbnailUrl.length > 10 ? (
          <>
            {/* Optimized Image with Next.js Image component */}
            <Image 
              src={thumbnailUrl} 
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={false}
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              onError={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('❌ Thumbnail failed to load:', {
                    url: thumbnailUrl.substring(0, 100) + '...',
                    isSupabase: thumbnailUrl.includes('supabase'),
                    isBase64: thumbnailUrl.startsWith('data:image/')
                  });
                }
                
                // Show fallback on error
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-placeholder');
                  if (fallback) {
                    fallback.classList.remove('hidden');
                  }
                  e.currentTarget.style.display = 'none';
                }
              }}
              onLoad={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ Thumbnail loaded successfully with Next.js Image');
                }
              }}
            />
            <div className="fallback-placeholder hidden absolute inset-0 flex items-center justify-center bg-gray-900" style={{ zIndex: 5 }}>
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-white text-sm font-medium line-clamp-2">
                  {title}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-white text-sm font-medium line-clamp-2 max-w-full">
                {title}
              </div>
            </div>
          </div>
        )}
        {/* 플레이 버튼 오버레이 제거 - 썸네일이 잘 보이도록 */}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link href={`/worldcup/${id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors cursor-pointer">
            {title}
          </h3>
        </Link>
        
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span>{author}</span>
          <span className="mx-2">·</span>
          <span>{createdAt}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              <span>{participants.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{likes.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* 주요 버튼들 */}
          <div className="flex items-stretch gap-2">
            <button
              onClick={onPlay}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center h-[40px]"
            >
              시작하기
            </button>
            {onViewRanking && (
              <button
                onClick={() => {
                  console.log('📊 전체 랭킹 버튼 클릭 for worldcup:', id);
                  onViewRanking();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center h-[40px] gap-1.5"
              >
                <BarChart3 className="w-4 h-4" />
                전체 랭킹
              </button>
            )}
          </div>
          
          {/* 보조 버튼들 */}
          <div className="flex items-center gap-1">
            <button
              onClick={onLike}
              className={`p-2 rounded-lg transition-colors w-[32px] h-[32px] flex items-center justify-center ${
                isLiked
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onBookmark}
              disabled={!isLoggedIn}
              title={!isLoggedIn ? '북마크는 로그인 후 이용할 수 있습니다' : ''}
              className={`p-2 rounded-lg transition-colors w-[32px] h-[32px] flex items-center justify-center ${
                !isLoggedIn
                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                  : isBookmarked
                  ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => {
                console.log('🔗 Share button clicked for worldcup:', id);
                onShare();
              }}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors w-[32px] h-[32px] flex items-center justify-center"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}