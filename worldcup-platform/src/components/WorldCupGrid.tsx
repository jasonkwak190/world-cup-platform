'use client';

import { useState, useEffect } from 'react';
import WorldCupCard from './WorldCupCard';
import { getStoredWorldCups, updateWorldCupStats, type StoredWorldCup } from '@/utils/storage';
import { getWorldCups as getSupabaseWorldCups, updateWorldCupStats as updateSupabaseStats } from '@/utils/supabaseData';

// Mock 데이터 제거됨 - 이제 Supabase에서 실제 데이터 사용

interface WorldCupGridProps {
  category: string;
  sortBy: string;
}

export default function WorldCupGrid({ category: _category, sortBy: _sortBy }: WorldCupGridProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [storedWorldCups, setStoredWorldCups] = useState<StoredWorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 월드컵 데이터 로드 (캐싱 최적화)
  useEffect(() => {
    let isMounted = true;
    let lastLoadTime = 0;
    const CACHE_DURATION = 30000; // 30초 캐시
    
    const loadWorldCups = async (force = false) => {
      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!force && Date.now() - lastLoadTime < CACHE_DURATION) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        // 병렬로 데이터 로드
        const [supabaseWorldCups, localWorldCups] = await Promise.all([
          getSupabaseWorldCups(),
          Promise.resolve(getStoredWorldCups())
        ]);
        
        if (!isMounted) return; // 컴포넌트가 언마운트된 경우 중단
        
        console.log('📊 Data loaded - Supabase:', supabaseWorldCups.length, 'Local:', localWorldCups.length);
        
        // 중복 제거하여 데이터 합치기
        const worldCupMap = new Map();
        
        // Supabase 데이터 우선 추가
        supabaseWorldCups.forEach(wc => worldCupMap.set(wc.id, wc));
        
        // localStorage 데이터 추가 (중복되지 않는 것만)
        localWorldCups.forEach(wc => {
          if (!worldCupMap.has(wc.id)) {
            worldCupMap.set(wc.id, wc);
          }
        });
        
        const allWorldCups = Array.from(worldCupMap.values());
        setStoredWorldCups(allWorldCups);
        lastLoadTime = Date.now();
        
        console.log('✅ Total worldcups loaded:', allWorldCups.length);
        
      } catch (error) {
        console.error('Failed to load worldcups:', error);
        if (isMounted) {
          // 에러 발생시 localStorage 데이터라도 표시
          const localWorldCups = getStoredWorldCups();
          setStoredWorldCups(localWorldCups);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 초기 로드
    loadWorldCups();

    // 페이지 포커스시 새로고침 (throttled)
    let focusTimeout: NodeJS.Timeout;
    const handleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        loadWorldCups(false); // 캐시 적용된 로드
      }, 1000);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      isMounted = false;
      clearTimeout(focusTimeout);
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
      
      // 월드컵의 좋아요 수 업데이트 (Supabase + localStorage)
      const storedWorldCup = storedWorldCups.find(wc => wc.id === id);
      if (storedWorldCup) {
        const newLikes = isLiking ? storedWorldCup.likes + 1 : Math.max(0, storedWorldCup.likes - 1);
        
        // Supabase 업데이트만 수행
        updateSupabaseStats(id, { likes: newLikes });
        
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
    // 월드컵의 참여자 수 업데이트 (Supabase + localStorage)
    const storedWorldCup = storedWorldCups.find(wc => wc.id === id);
    if (storedWorldCup) {
      const newParticipants = storedWorldCup.participants + 1;
      
      // Supabase 업데이트만 수행
      updateSupabaseStats(id, { participants: newParticipants });
      
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

  // 저장된 월드컵 데이터만 표시 (Supabase에서 로드된 데이터)
  const allWorldCups = storedWorldCups;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">월드컵을 불러오는 중...</p>
        </div>
      </div>
    );
  }

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