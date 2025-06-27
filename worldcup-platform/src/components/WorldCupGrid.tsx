'use client';

import { useState, useEffect } from 'react';
import WorldCupCard from './WorldCupCard';
import { getStoredWorldCups, updateWorldCupStats, type StoredWorldCup } from '@/utils/storage';
import { getWorldCups as getSupabaseWorldCups, updateWorldCupStats as updateSupabaseStats } from '@/utils/supabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserBookmarks, 
  addBookmark, 
  removeBookmark,
  getUserLikes,
  addLike,
  removeLike,
  getGuestLikes,
  addGuestLike,
  removeGuestLike,
  getMultipleWorldCupLikesCount
} from '@/utils/userInteractions';

// Mock 데이터 제거됨 - 이제 Supabase에서 실제 데이터 사용

interface WorldCupGridProps {
  category: string;
  sortBy: string;
}

export default function WorldCupGrid({ category: _category, sortBy: _sortBy }: WorldCupGridProps) {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [storedWorldCups, setStoredWorldCups] = useState<StoredWorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 월드컵 데이터 로드 (개선된 캐싱)
  useEffect(() => {
    let isMounted = true;
    let controller = new AbortController();
    
    // 전역 캐시 사용 (컴포넌트 언마운트 시에도 유지)
    const CACHE_KEY = 'worldcups_cache';
    const CACHE_DURATION = 60000; // 1분 캐시
    
    const loadWorldCups = async (force = false) => {
      try {
        // 캐시 확인
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (!force && cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('📦 Using cached worldcups data');
            setStoredWorldCups(data);
            setIsLoading(false);
            return;
          }
        }
        
        console.log('🔄 Loading fresh worldcups data...');
        setIsLoading(true);
        
        // AbortController로 중복 요청 방지
        if (controller.signal.aborted) return;
        
        // 병렬로 데이터 로드 with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const dataPromise = Promise.all([
          getSupabaseWorldCups(),
          Promise.resolve(getStoredWorldCups())
        ]);
        
        const [supabaseWorldCups, localWorldCups] = await Promise.race([
          dataPromise,
          timeoutPromise
        ]) as [any[], any[]];
        
        if (!isMounted || controller.signal.aborted) return;
        
        console.log('📊 Fresh data loaded - Supabase:', supabaseWorldCups.length, 'Local:', localWorldCups.length);
        
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
        
        // 캐시에 저장
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: allWorldCups,
          timestamp: Date.now()
        }));
        
        setStoredWorldCups(allWorldCups);
        console.log('✅ Total worldcups loaded and cached:', allWorldCups.length);
        
      } catch (error) {
        console.error('Failed to load worldcups:', error);
        if (isMounted && !controller.signal.aborted) {
          // 에러 발생시 localStorage 데이터라도 표시
          const localWorldCups = getStoredWorldCups();
          setStoredWorldCups(localWorldCups);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // 초기 로드
    loadWorldCups();

    // 페이지 포커스시 새로고침 (더 보수적으로)
    let focusTimeout: NodeJS.Timeout;
    let lastFocusTime = 0;
    
    const handleFocus = () => {
      const now = Date.now();
      // 최소 5초 간격으로만 포커스 이벤트 처리
      if (now - lastFocusTime < 5000) return;
      
      lastFocusTime = now;
      clearTimeout(focusTimeout);
      
      // 2초 후에 캐시된 데이터만 로드 (서버 요청 없음)
      focusTimeout = setTimeout(() => {
        if (isMounted && !controller.signal.aborted) {
          const cached = sessionStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data } = JSON.parse(cached);
            console.log('🔄 Refreshed from cache on focus');
            setStoredWorldCups(data);
          }
        }
      }, 2000);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 사용자 북마크 및 좋아요 데이터 로드
  useEffect(() => {
    const loadUserInteractions = async () => {
      try {
        if (user && user.id) {
          // 로그인한 사용자: Supabase에서 데이터 로드
          const [userBookmarks, userLikes] = await Promise.all([
            getUserBookmarks(user.id),
            getUserLikes(user.id)
          ]);
          
          setBookmarkedItems(new Set(userBookmarks));
          setLikedItems(new Set(userLikes));
          
          console.log('✅ User interactions loaded:', {
            bookmarks: userBookmarks.length,
            likes: userLikes.length
          });
        } else {
          // 비회원: localStorage에서 좋아요만 로드
          const guestLikes = getGuestLikes();
          setLikedItems(new Set(guestLikes));
          setBookmarkedItems(new Set()); // 북마크는 회원 전용
          
          console.log('📱 Guest likes loaded:', guestLikes.length);
        }
      } catch (error) {
        console.error('Failed to load user interactions:', error);
      }
    };

    loadUserInteractions();
  }, [user]);

  const handleLike = async (id: string) => {
    const isCurrentlyLiked = likedItems.has(id);
    const isLiking = !isCurrentlyLiked;

    // 즉시 UI 업데이트 (낙관적 업데이트)
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (isLiking) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });

    // 좋아요 수 즉시 업데이트 (표시용)
    setStoredWorldCups(prev => 
      prev.map(wc => wc.id === id ? { 
        ...wc, 
        likes: isLiking ? wc.likes + 1 : Math.max(0, wc.likes - 1) 
      } : wc)
    );

    try {
      console.log('🔄 handleLike called:', { 
        userId: user?.id, 
        worldcupId: id, 
        isLiking, 
        isAuthenticated: !!(user && user.id),
        userObject: user 
      });

      if (user && user.id) {
        // 회원: Supabase에 저장
        let success = false;
        if (isLiking) {
          success = await addLike(user.id, id);
        } else {
          success = await removeLike(user.id, id);
        }

        if (!success) {
          // 실패 시 상태 롤백
          console.error('❌ Failed to update like status, rolling back...');
          setLikedItems(prev => {
            const newSet = new Set(prev);
            if (isLiking) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return newSet;
          });
          
          // 좋아요 수도 롤백
          setStoredWorldCups(prev => 
            prev.map(wc => wc.id === id ? { 
              ...wc, 
              likes: isLiking ? Math.max(0, wc.likes - 1) : wc.likes + 1 
            } : wc)
          );
          return;
        }
        
        console.log(`✅ User ${isLiking ? 'liked' : 'unliked'} worldcup:`, id);
      } else {
        // 비회원: localStorage에 저장
        let success = false;
        if (isLiking) {
          success = addGuestLike(id);
          if (!success) {
            // 중복 좋아요인 경우 상태 롤백
            setLikedItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
            setStoredWorldCups(prev => 
              prev.map(wc => wc.id === id ? { 
                ...wc, 
                likes: Math.max(0, wc.likes - 1) 
              } : wc)
            );
            alert('이미 좋아요를 누른 월드컵입니다.');
            return;
          }
        } else {
          success = removeGuestLike(id);
        }

        if (!success) {
          // 실패 시 상태 롤백
          console.error('❌ Failed to update guest like status, rolling back...');
          setLikedItems(prev => {
            const newSet = new Set(prev);
            if (isLiking) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return newSet;
          });
          
          setStoredWorldCups(prev => 
            prev.map(wc => wc.id === id ? { 
              ...wc, 
              likes: isLiking ? Math.max(0, wc.likes - 1) : wc.likes + 1 
            } : wc)
          );
          return;
        }
        
        console.log(`📱 Guest ${isLiking ? 'liked' : 'unliked'} worldcup:`, id);
      }
      
    } catch (error) {
      console.error('Error handling like:', error);
      // 에러 발생 시에도 상태 롤백
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (isLiking) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
      
      setStoredWorldCups(prev => 
        prev.map(wc => wc.id === id ? { 
          ...wc, 
          likes: isLiking ? Math.max(0, wc.likes - 1) : wc.likes + 1 
        } : wc)
      );
    }
  };

  const handleBookmark = async (id: string) => {
    if (!user || !user.id) {
      // 비회원인 경우 로그인 요청
      alert('북마크 기능은 로그인 후 이용할 수 있습니다.');
      return;
    }

    const isCurrentlyBookmarked = bookmarkedItems.has(id);
    const isBookmarking = !isCurrentlyBookmarked;

    try {
      let success = false;
      if (isBookmarking) {
        success = await addBookmark(user.id, id);
      } else {
        success = await removeBookmark(user.id, id);
      }

      if (success) {
        setBookmarkedItems(prev => {
          const newSet = new Set(prev);
          if (isBookmarking) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
        
        console.log(`🔖 User ${isBookmarking ? 'bookmarked' : 'unbookmarked'} worldcup:`, id);
      } else {
        console.error('❌ Failed to update bookmark status');
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
    }
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
              isLoggedIn={!!(user && user.id)}
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