'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Clock, X, Play, BarChart, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface WorldCup {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  created_at?: string;
  creator_name?: string;
  participants: number;
  category: string;
  likes: number;
  comments: number;
  itemsCount?: number;
}

interface TournamentCardProps {
  tournament: WorldCup;
  onShowRanking: (tournament: WorldCup) => void;
  priority?: boolean;
}

interface ToastState {
  isVisible: boolean;
  message: string;
}

interface TextModalState {
  isOpen: boolean;
  title: string;
  content: string;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onShowRanking, priority = false }) => {
  const { getThemeClass } = useTheme();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '' });
  const [textModal, setTextModal] = useState<TextModalState>({ isOpen: false, title: '', content: '' });
  
  // Refs for checking text overflow
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const creatorRef = useRef<HTMLSpanElement>(null);
  
  // State for tracking text overflow
  const [isTextOverflowing, setIsTextOverflowing] = useState({
    title: false,
    description: false,
    creator: false
  });

  // Check text overflow after render
  useEffect(() => {
    const checkOverflow = (element: HTMLElement | null) => {
      if (!element) return false;
      return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    };

    setIsTextOverflowing({
      title: checkOverflow(titleRef.current),
      description: checkOverflow(descriptionRef.current),
      creator: checkOverflow(creatorRef.current)
    });
  }, [tournament.title, tournament.description, tournament.creator_name]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '날짜 미상';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '날짜 미상';
      
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return '오늘';
      } else if (diffDays === 1) {
        return '어제';
      } else if (diffDays < 30) {
        return `${diffDays}일 전`;
      } else {
        return date.toLocaleDateString('ko-KR');
      }
    } catch (error) {
      return '날짜 미상';
    }
  };

  const getMaxRounds = (itemCount?: number) => {
    if (!itemCount || itemCount <= 0) return 16;
    const rounds = Math.pow(2, Math.ceil(Math.log2(itemCount)));
    return Math.max(2, Math.min(128, rounds));
  };

  const showToast = (message: string) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 2000);
  };

  const handleTextClick = (type: 'title' | 'description' | 'creator', content: string, title: string) => {
    if (!isTextOverflowing[type]) return; // Only allow click if text is overflowing
    
    setTextModal({
      isOpen: true,
      title,
      content
    });
  };

  const handleThumbnailClick = () => {
    router.push(`/play/${tournament.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/play/${tournament.id}`);
  };

  const handleRankingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowRanking(tournament);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/play/${tournament.id}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('링크가 클립보드에 복사되었습니다!');
      } else {
        // Fallback for browsers that don't support clipboard API
        const message = `다음 링크를 복사해서 공유하세요:\n\n${shareUrl}`;
        alert(message);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('공유 중 오류가 발생했습니다.');
    }
  };

  const isNew = new Date(tournament.created_at || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isHot = tournament.likes >= 20;

  return (
    <>
      <div className={`${getThemeClass('surface')} ${getThemeClass('card')} hover:shadow-lg transition-shadow duration-300`}>
        {/* Thumbnail - Clickable for play */}
        <div className="relative h-48 cursor-pointer group overflow-hidden" onClick={handleThumbnailClick}>
          <Image
            src={tournament.thumbnail_url || '/placeholder.svg'}
            alt={tournament.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            priority={priority}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-4">
              <Play className="w-8 h-8 text-gray-800 fill-current" />
            </div>
          </div>

          {/* Tags */}
          {isHot && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              🔥 인기
            </div>
          )}
          {isNew && !isHot && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ✨ 신규
            </div>
          )}

          {/* Tournament info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center text-white text-xs space-x-1">
              <span className="bg-black/50 px-2 py-1 rounded-full">
                {getMaxRounds(tournament.itemsCount)}강
              </span>
              <span className="bg-black/50 px-2 py-1 rounded-full">
                {tournament.participants.toLocaleString()}명 참여
              </span>
              <span className="bg-black/50 px-2 py-1 rounded-full">
                ❤️ {tournament.likes}
              </span>
            </div>
          </div>
        </div>

        {/* Content area - NOT clickable for play */}
        <div className="p-4">
          {/* Title - Clickable only if overflowing */}
          <h3 
            ref={titleRef}
            className={`${getThemeClass('text')} font-semibold text-lg mb-2 line-clamp-2 ${
              isTextOverflowing.title ? 'cursor-pointer hover:text-blue-600' : ''
            }`}
            onClick={() => handleTextClick('title', tournament.title, '토너먼트 제목')}
            title={isTextOverflowing.title ? '클릭하여 전체 내용 보기' : ''}
          >
            {tournament.title}
          </h3>

          {/* Description - Clickable only if overflowing */}
          {tournament.description && (
            <p 
              ref={descriptionRef}
              className={`${getThemeClass('textSecondary')} text-sm mb-3 line-clamp-2 ${
                isTextOverflowing.description ? 'cursor-pointer hover:text-blue-600' : ''
              }`}
              onClick={() => handleTextClick('description', tournament.description, '토너먼트 설명')}
              title={isTextOverflowing.description ? '클릭하여 전체 내용 보기' : ''}
            >
              {tournament.description}
            </p>
          )}

          {/* Fixed height container to maintain consistent layout */}
          <div className={`${tournament.description ? 'mt-4' : 'mt-16'}`}>
            {/* Creator and date */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {(tournament.creator_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span 
                  ref={creatorRef}
                  className={`${getThemeClass('textSecondary')} text-xs truncate ${
                    isTextOverflowing.creator ? 'cursor-pointer hover:text-blue-600' : ''
                  }`}
                  onClick={() => handleTextClick('creator', tournament.creator_name || 'Unknown', '제작자')}
                  title={isTextOverflowing.creator ? '클릭하여 전체 내용 보기' : ''}
                >
                  {tournament.creator_name || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 ml-2">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatDate(tournament.created_at)}</span>
              </div>
            </div>

            {/* Action buttons - Icon only with hover effects */}
            <div className="flex items-center justify-center space-x-6">
              <button 
                onClick={handlePlayClick}
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-300 hover:scale-110"
                title="플레이"
              >
                <Play className="w-5 h-5 text-white fill-current" />
              </button>
              <button 
                onClick={handleRankingClick}
                className={`group flex items-center justify-center w-10 h-10 rounded-full ${getThemeClass('secondary')} hover:bg-gray-300 transition-all duration-300 hover:scale-110`}
                title="랭킹"
              >
                <BarChart className={`w-5 h-5 ${getThemeClass('text')}`} />
              </button>
              <button 
                onClick={handleShare}
                className={`group flex items-center justify-center w-10 h-10 rounded-full ${getThemeClass('secondary')} hover:bg-gray-300 transition-all duration-300 hover:scale-110`}
                title="공유"
              >
                <Share2 className={`w-5 h-5 ${getThemeClass('text')}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Text Modal */}
      {textModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${getThemeClass('surface')} rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl`}>
            <div className={`p-4 border-b ${getThemeClass('border')}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${getThemeClass('text')}`}>
                  {textModal.title}
                </h3>
                <button 
                  onClick={() => setTextModal({ isOpen: false, title: '', content: '' })}
                  className={`p-1 hover:bg-gray-100 rounded-full transition-colors ${getThemeClass('textSecondary')}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <p className={`${getThemeClass('text')} leading-relaxed whitespace-pre-wrap`}>
                {textModal.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.isVisible && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast.message}
        </div>
      )}
    </>
  );
};

export default TournamentCard;