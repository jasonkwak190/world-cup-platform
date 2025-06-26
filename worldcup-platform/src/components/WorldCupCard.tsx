import { Heart, MessageCircle, Share2, Play, Bookmark } from 'lucide-react';

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
  onPlay: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export default function WorldCupCard({
  id: _id,
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
  onPlay,
  onLike,
  onBookmark,
  onShare,
}: WorldCupCardProps) {
  // 이미지 URL 처리 함수 (WorldCupPreview와 동일한 로직)
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
        
        // Base64 이미지 유효성 검증
        if (image.startsWith('data:image/')) {
          // Base64 형식이 올바른지 확인
          const base64Data = image.split(',')[1];
          if (base64Data && base64Data.length > 100) {
            console.log('✅ Valid base64 image detected, length:', base64Data.length);
            return image;
          } else {
            console.error('❌ Invalid base64 image data');
            return '';
          }
        }
        
        return image;
      }
      
      if (image instanceof File) {
        return URL.createObjectURL(image);
      }
      
      if (image instanceof Blob) {
        return URL.createObjectURL(image);
      }
      
      console.error('Invalid image type:', typeof image, image);
      return '';
    } catch (error) {
      console.error('Error creating image URL:', error);
      return '';
    }
  };

  // 처리된 썸네일 URL 생성
  const thumbnailUrl = getImageUrl(thumbnail);
  
  // 디버깅을 위한 로그
  console.log('=== WorldCupCard Debug ===');
  console.log('ID:', _id);
  console.log('Title:', title);
  console.log('Original thumbnail:', thumbnail);
  console.log('Thumbnail type:', typeof thumbnail);
  console.log('Processed thumbnailUrl:', thumbnailUrl);
  console.log('ThumbnailUrl length:', thumbnailUrl?.length || 0);
  console.log('ThumbnailUrl starts with data:', thumbnailUrl?.startsWith('data:'));
  console.log('=== End WorldCupCard Debug ===');
  
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        {thumbnailUrl && thumbnailUrl.trim() !== '' && thumbnailUrl.length > 10 ? (
          <>
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover"
              style={{ 
                display: 'block',
                position: 'relative',
                zIndex: 1
              }}
              onError={(e) => {
                console.error('❌ Thumbnail onError triggered:', {
                  thumbnailUrl: thumbnailUrl.substring(0, 100) + '...',
                  naturalWidth: e.currentTarget.naturalWidth,
                  naturalHeight: e.currentTarget.naturalHeight,
                  complete: e.currentTarget.complete
                });
                
                // Base64 이미지인 경우 에러를 무시 (브라우저 버그일 수 있음)
                if (thumbnailUrl.startsWith('data:image/') && thumbnailUrl.length > 1000) {
                  console.log('🔄 Base64 image with onError - ignoring error and keeping visible');
                  e.currentTarget.style.display = 'block';
                  e.currentTarget.style.visibility = 'visible';
                  e.currentTarget.style.opacity = '1';
                  return;
                }
                
                // 진짜 에러인 경우에만 fallback 표시
                console.log('📝 Showing fallback for invalid thumbnail');
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-placeholder');
                  if (fallback) {
                    fallback.classList.remove('hidden');
                  }
                }
              }}
              onLoad={(e) => {
                console.log('✅ Thumbnail image loaded successfully:', {
                  naturalWidth: e.currentTarget.naturalWidth,
                  naturalHeight: e.currentTarget.naturalHeight,
                  src: e.currentTarget.src.substring(0, 50) + '...',
                  display: e.currentTarget.style.display,
                  opacity: e.currentTarget.style.opacity,
                  zIndex: e.currentTarget.style.zIndex
                });
                
                // 강제로 이미지를 최상위로 올리기
                e.currentTarget.style.zIndex = '100';
                e.currentTarget.style.position = 'relative';
                e.currentTarget.style.display = 'block';
                e.currentTarget.style.opacity = '1';
                
                console.log('🔧 Image forced to top layer');
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
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center z-50">
          <button
            onClick={onPlay}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3 shadow-lg"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
          {title}
        </h3>
        
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
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Play className="w-4 h-4 mr-1" />
              {participants.toLocaleString()}
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {comments}
            </span>
          </div>
          <div className="flex items-center">
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            {likes}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-stretch gap-2">
          <button
            onClick={onPlay}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center h-[40px]"
          >
            시작하기
          </button>
          <button
            onClick={onLike}
            className={`p-2.5 rounded-lg transition-colors w-[40px] h-[40px] flex items-center justify-center ${
              isLiked
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onBookmark}
            className={`p-2.5 rounded-lg transition-colors w-[40px] h-[40px] flex items-center justify-center ${
              isBookmarked
                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onShare}
            className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors w-[40px] h-[40px] flex items-center justify-center"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}