'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
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
}

interface ToastState {
  isVisible: boolean;
  message: string;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onShowRanking }) => {
  const { getThemeClass } = useTheme();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '' });

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

  const getMaxRounds = (itemsCount: number) => {
    if (!itemsCount || itemsCount < 2) return 4;
    const powers = [4, 8, 16, 32, 64, 128, 256];
    const requiredRounds = powers.find(power => power >= itemsCount) || 256;
    return requiredRounds;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setToast({ isVisible: true, message: '게임 시작...' });
    
    setTimeout(() => {
      router.push(`/play/${tournament.id}`);
      setToast({ isVisible: false, message: '' });
    }, 800);
  };

  const handleRankingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShowRanking(tournament);
  };

  const isNew = new Date(tournament.created_at || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isHot = tournament.likes >= 20;

  return (
    <>
      <Link href={`/play/${tournament.id}`} className="group">
        <div className={`${getThemeClass('surface')} ${getThemeClass('card')} hover:shadow-lg transition-shadow duration-300`}>
          <div className="relative h-48">
            <Image
              src={tournament.thumbnail_url || '/placeholder.svg'}
              alt={tournament.title}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
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
          <div className="p-4">
            <h3 className={`text-lg font-semibold ${getThemeClass('text')} mb-1 line-clamp-1`}>
              {tournament.title}
            </h3>
            <p className={`${getThemeClass('textSecondary')} text-sm mb-3 line-clamp-2`}>
              {tournament.description}
            </p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-purple-500 mr-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {tournament.creator_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className={`${getThemeClass('text')} text-xs`}>
                  {tournament.creator_name || 'Unknown'}
                </span>
              </div>
              <div className={`flex items-center text-xs ${getThemeClass('textSecondary')}`}>
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatDate(tournament.created_at)}</span>
              </div>
            </div>
            
            {/* 카드 액션 버튼 */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handlePlayClick}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                플레이
              </button>
              <button
                onClick={handleRankingClick}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                랭킹
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* React 상태 기반 토스트 */}
      {toast.isVisible && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {toast.message}
        </div>
      )}
    </>
  );
};

export default TournamentCard;