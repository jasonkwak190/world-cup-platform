'use client';

import { useState, useEffect } from 'react';
import WorldCupCard from './WorldCupCard';
import { getStoredWorldCups, updateWorldCupStats, type StoredWorldCup } from '@/utils/storage';

// Mock data - PIKU 스타일 데이터
const mockWorldCups = [
  {
    id: '1',
    title: '남자 아이돌 / 보이그룹 이상형 월드컵',
    description: '남자 아이돌/얼굴만 보고 판단해세요',
    thumbnail: '/placeholder.svg?v=1',
    author: '케이팝러버',
    createdAt: '2024-06-20',
    participants: 169900,
    comments: 1248,
    likes: 3420,
  },
  {
    id: '2',
    title: '[최신]걸그룹 이상형 월드컵 / 걸그룹 / 솔로 이상형 월드컵',
    description: '초고화질 음짤에 환장하는 사람이 만든 여돌 월드컵...! 제가 직접 만든 음짤 제외 모든 음짤은 원작자한테 크레딧이 있습니다.',
    thumbnail: '/placeholder.svg?v=2',
    author: '아이돌마니아',
    createdAt: '2024-06-19',
    participants: 1026400,
    comments: 5672,
    likes: 8934,
  },
  {
    id: '3',
    title: '남자 배우 이상형 월드컵',
    description: '국내외 남자 배우들의 대결! 누가 최고의 비주얼을 자랑할까요?',
    thumbnail: '/placeholder.svg?v=3',
    author: '드라마퀸',
    createdAt: '2024-06-18',
    participants: 199000,
    comments: 892,
    likes: 2341,
  },
  {
    id: '4',
    title: '[공포] 에니 남자 캐릭터 월드컵 1024강[남캐]',
    description: '애니메이션 속 매력적인 남자 캐릭터들의 대결! 1024강의 대규모 토너먼트',
    thumbnail: '/placeholder.svg?v=4',
    author: '애니메이터',
    createdAt: '2024-06-17',
    participants: 599000,
    comments: 2134,
    likes: 4567,
  },
  {
    id: '5',
    title: '과자 월드컵',
    description: '당신이 가장 좋아하는 과자는? 다양한 과자들의 맛있는 대결!',
    thumbnail: '/placeholder.svg?v=5',
    author: '과자러버',
    createdAt: '2024-06-16',
    participants: 399000,
    comments: 678,
    likes: 1892,
  },
  {
    id: '6',
    title: '매콤 새우깡',
    description: '매운맛 스낵의 제왕을 가려보세요! 얼마나 매운지 도전해보실래요?',
    thumbnail: '/placeholder.svg?v=6',
    author: '스낵마니아',
    createdAt: '2024-06-15',
    participants: 609000,
    comments: 445,
    likes: 1234,
  },
  {
    id: '7',
    title: '허니버터칩',
    description: '달콤하고 짭짤한 허니버터 맛의 최강자를 찾아보세요!',
    thumbnail: '/placeholder.svg?v=7',
    author: '칩러버',
    createdAt: '2024-06-14',
    participants: 234000,
    comments: 234,
    likes: 567,
  },
  {
    id: '8',
    title: '[2025] 음식 이상형 월드컵',
    description: '전 세계 맛있는 음식들의 대결! 당신의 최애 음식을 선택하세요',
    thumbnail: '/placeholder.svg?v=8',
    author: '푸드파이터',
    createdAt: '2024-06-13',
    participants: 512000,
    comments: 1890,
    likes: 3456,
  },
  {
    id: '9',
    title: '포켓몬 64강 대결 월드컵',
    description: '가장 인기 있는 포켓몬을 찾아보세요! 151마리 중 최강은?',
    thumbnail: '/placeholder.svg?v=9',
    author: '포켓몬마스터',
    createdAt: '2024-06-12',
    participants: 789000,
    comments: 2340,
    likes: 5678,
  },
  {
    id: '10',
    title: '전 세계 요리 65강 월드컵',
    description: '각국의 대표 요리들이 한자리에! 세계 요리의 최강자는?',
    thumbnail: '/placeholder.svg?v=10',
    author: '세계요리탐험가',
    createdAt: '2024-06-11',
    participants: 456000,
    comments: 1567,
    likes: 3890,
  },
];

interface WorldCupGridProps {
  category: string;
  sortBy: string;
}

export default function WorldCupGrid({ category: _category, sortBy: _sortBy }: WorldCupGridProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [storedWorldCups, setStoredWorldCups] = useState<StoredWorldCup[]>([]);

  // LocalStorage에서 월드컵 데이터 로드
  useEffect(() => {
    const loadStoredWorldCups = () => {
      try {
        const stored = getStoredWorldCups();
        setStoredWorldCups(stored);
        console.log('=== WorldCupGrid Debug ===');
        console.log('Loaded stored worldcups count:', stored.length);
        
        // localStorage 원본 데이터도 확인
        const rawData = localStorage.getItem('worldcups');
        console.log('Raw localStorage data exists:', !!rawData);
        console.log('Raw data length:', rawData?.length || 0);
        
        stored.forEach((wc, index) => {
          console.log(`🔍 Worldcup ${index} DETAILED ANALYSIS:`, {
            id: wc.id,
            title: wc.title,
            hasThumbnail: !!wc.thumbnail,
            thumbnailType: typeof wc.thumbnail,
            thumbnailLength: wc.thumbnail?.length || 0,
            thumbnailStartsWithData: wc.thumbnail?.startsWith('data:'),
            thumbnailStartsWithBlob: wc.thumbnail?.startsWith('blob:'),
            isValidBase64: wc.thumbnail?.startsWith('data:image/') && wc.thumbnail?.includes(','),
            base64HeaderExists: wc.thumbnail?.includes('data:image/'),
            base64DataExists: wc.thumbnail?.split(',')[1]?.length > 100,
            thumbnailSample: wc.thumbnail?.substring(0, 100) + '...'
          });
          
          // 썸네일이 있는데 표시 안 되는 경우 특별 체크
          if (wc.thumbnail && wc.thumbnail.length > 1000) {
            console.log(`✅ Worldcup ${index} has valid thumbnail data - investigating display issue`);
          } else if (wc.thumbnail) {
            console.log(`⚠️ Worldcup ${index} has thumbnail but seems too short:`, wc.thumbnail);
          } else {
            console.log(`❌ Worldcup ${index} has NO thumbnail data`);
          }
        });
        console.log('=== End WorldCupGrid Debug ===');
      } catch (error) {
        console.error('Failed to load stored worldcups:', error);
      }
    };

    loadStoredWorldCups();

    // storage 이벤트 리스너 추가 (다른 탭에서 월드컵이 생성될 때 업데이트)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'worldcups') {
        loadStoredWorldCups();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 페이지가 포커스를 받을 때마다 데이터 새로고침 (탭 전환 시)
    const handleFocus = () => {
      loadStoredWorldCups();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      const isLiking = !newSet.has(id);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      // 저장된 월드컵의 좋아요 수 업데이트
      const storedWorldCup = storedWorldCups.find(wc => wc.id === id);
      if (storedWorldCup) {
        const newLikes = isLiking ? storedWorldCup.likes + 1 : Math.max(0, storedWorldCup.likes - 1);
        updateWorldCupStats(id, { likes: newLikes });
        
        // 로컬 상태도 업데이트
        setStoredWorldCups(prev => 
          prev.map(wc => wc.id === id ? { ...wc, likes: newLikes } : wc)
        );
      }
      
      return newSet;
    });
  };

  const handleBookmark = (id: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePlay = (id: string) => {
    // 저장된 월드컵의 참여자 수 업데이트
    const storedWorldCup = storedWorldCups.find(wc => wc.id === id);
    if (storedWorldCup) {
      const newParticipants = storedWorldCup.participants + 1;
      updateWorldCupStats(id, { participants: newParticipants });
      
      // 로컬 상태도 업데이트
      setStoredWorldCups(prev => 
        prev.map(wc => wc.id === id ? { ...wc, participants: newParticipants } : wc)
      );
    }
    
    // Navigate to worldcup play page
    window.location.href = `/play/${id}`;
  };

  const handleShare = (id: string) => {
    console.log('Share worldcup:', id);
    // TODO: Implement share functionality
  };

  // 저장된 월드컵과 목 데이터를 합쳐서 표시
  const allWorldCups = [...storedWorldCups, ...mockWorldCups];

  return (
    <div>
      {allWorldCups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">아직 생성된 월드컵이 없습니다.</p>
          <a 
            href="/create" 
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            첫 번째 월드컵 만들기
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {allWorldCups.map((worldcup) => (
            <WorldCupCard
              key={worldcup.id}
              {...worldcup}
              isLiked={likedItems.has(worldcup.id)}
              isBookmarked={bookmarkedItems.has(worldcup.id)}
              onPlay={() => handlePlay(worldcup.id)}
              onLike={() => handleLike(worldcup.id)}
              onBookmark={() => handleBookmark(worldcup.id)}
              onShare={() => handleShare(worldcup.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}