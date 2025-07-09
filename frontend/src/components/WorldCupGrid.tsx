'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorldCupCard from './WorldCupCard';
import VirtualizedWorldCupGrid from './VirtualizedWorldCupGrid';
import { getStoredWorldCups, type StoredWorldCup } from '@/utils/storage';
import { getWorldCups as getSupabaseWorldCups } from '@/utils/supabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserBookmarks, 
  addBookmark, 
  removeBookmark,
  getUserLikes,
  addLike,
  removeLike
} from '@/utils/userInteractions';
import LoginPromptModal from './LoginPromptModal';
import RankingModal from './shared/RankingModal';
import { supabase } from '@/lib/supabase';
import { showToast } from './Toast';
// updateWorldCupCommentCount import 제거됨 - 사용되지 않음
import { onCommentCountChange } from '@/utils/commentEvents';
import { incrementPlayCount, onPlayCountChange, notifyPlayCountChange } from '@/utils/playCount';
import { withRetry } from '@/utils/supabaseConnection';

// Mock 데이터 제거됨 - 이제 Supabase에서 실제 데이터 사용

interface WorldCupGridProps {
  category: string;
  sortBy: string;
  searchQuery?: string;
}

export default function WorldCupGrid({ category: _category, sortBy: _sortBy, searchQuery = '' }: WorldCupGridProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [storedWorldCups, setStoredWorldCups] = useState<StoredWorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<() => void>(() => {});
  const [playLoadingStates, setPlayLoadingStates] = useState<Set<string>>(new Set());
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [selectedWorldCupForRanking, setSelectedWorldCupForRanking] = useState<{ id: string; title: string } | null>(null);

  // Supabase에서 월드컵 데이터 로드
  useEffect(() => {
    let isMounted = true;
    let autoRefreshTimer: NodeJS.Timeout | null = null;
    
    const loadWorldCups = async () => {
      try {
        console.log('🔄 Loading worldcups data...');
        setIsLoading(true);
        
        // 자동 새로고침 타이머 설정 (30초 후)
        autoRefreshTimer = setTimeout(() => {
          if (isMounted && isLoading) {
            console.warn('⚠️ Loading timeout detected, forcing page refresh...');
            window.location.reload();
          }
        }, 30000);
        
        // 재시도 로직과 함께 Supabase 데이터 로드
        const supabaseResult = await Promise.allSettled([
          withRetry(() => getSupabaseWorldCups(), 'Load worldcups from Supabase')
            .catch(error => {
              console.warn('⚠️ Supabase loading failed after retries:', error);
              return [];
            })
        ]);
        
        // localStorage는 빠르므로 타임아웃 없이 로드
        const localResult = await Promise.allSettled([
          Promise.resolve(getStoredWorldCups())
        ]);

        const supabaseWorldCups = supabaseResult[0].status === 'fulfilled' ? supabaseResult[0].value : [];
        const localWorldCups = localResult[0].status === 'fulfilled' ? localResult[0].value : [];

        if (supabaseResult[0].status === 'rejected') {
          console.warn('⚠️ Supabase loading failed:', supabaseResult[0].reason);
        }
        if (localResult[0].status === 'rejected') {
          console.warn('⚠️ LocalStorage loading failed:', localResult[0].reason);
        }
        
        if (!isMounted) return;
        
        console.log('📊 Data loaded - Supabase:', supabaseWorldCups.length, 'Local:', localWorldCups.length);
        
        // 데이터 합치기 (Supabase 우선, 댓글 수는 항상 Supabase 데이터 사용)
        const worldCupMap = new Map();
        supabaseWorldCups.forEach(wc => worldCupMap.set(wc.id, wc));
        localWorldCups.forEach(wc => {
          if (!worldCupMap.has(wc.id)) {
            worldCupMap.set(wc.id, wc);
          } else {
            // Supabase 데이터가 있어도 로컬 데이터의 일부 필드는 유지
            // 단, 댓글 수는 항상 Supabase 우선
            const existing = worldCupMap.get(wc.id);
            worldCupMap.set(wc.id, {
              ...wc,
              ...existing, // Supabase 데이터로 덮어쓰기
              comments: existing.comments // 댓글 수는 Supabase 최신 데이터 사용
            });
          }
        });
        
        const allWorldCups = Array.from(worldCupMap.values());
        
        if (isMounted) {
          // 댓글 수 로깅 추가
          const commentsDebug = allWorldCups.map(wc => ({
            title: wc.title,
            id: wc.id.substring(0, 8) + '...',
            comments: wc.comments
          }));
          console.log('📊 Loaded worldcups with comment counts:', commentsDebug);
          
          setStoredWorldCups(allWorldCups);
          setIsLoading(false);
          console.log('✅ Total worldcups loaded:', allWorldCups.length);
          
          // 성공적으로 로드되면 타이머 취소
          if (autoRefreshTimer) {
            clearTimeout(autoRefreshTimer);
            autoRefreshTimer = null;
          }
        }
        
      } catch (error) {
        console.error('Failed to load worldcups:', error);
        if (isMounted) {
          // 에러 발생시 빈 배열로 설정
          setStoredWorldCups([]);
          setIsLoading(false);
          
          // 에러 시에도 타이머 취소
          if (autoRefreshTimer) {
            clearTimeout(autoRefreshTimer);
            autoRefreshTimer = null;
          }
        }
      }
    };

    // 초기 로드 수행
    loadWorldCups();

    // 페이지 포커스 시 선택적 데이터 새로고침
    const handleFocus = () => {
      console.log('🔄 Page focused, checking if refresh needed...');
      // 5분 이상 지났을 때만 새로고침 (너무 빈번한 새로고침 방지)
      const lastLoad = localStorage.getItem('worldcups_last_load');
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      if (!lastLoad || parseInt(lastLoad) < fiveMinutesAgo) {
        console.log('🔄 Refreshing data after long absence...');
        loadWorldCups();
        localStorage.setItem('worldcups_last_load', Date.now().toString());
      } else {
        console.log('✅ Data is recent, skipping refresh');
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus(); // 동일한 로직 사용
      }
    };

    // 초기 로드 시간 기록
    localStorage.setItem('worldcups_last_load', Date.now().toString());

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (autoRefreshTimer) {
        clearTimeout(autoRefreshTimer);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 댓글 수 변경 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribe = onCommentCountChange(async (worldcupId: string, newCount: number) => {
      console.log(`🔄 Comment count updated for ${worldcupId}: ${newCount}`);
      
      // 먼저 로컬 상태 즉시 업데이트 (빠른 피드백)
      setStoredWorldCups(prev => 
        prev.map(wc => wc.id === worldcupId ? { ...wc, comments: newCount } : wc)
      );

      // 그 다음 Supabase에서 최신 데이터 가져와서 동기화 (정확성 보장)
      try {
        const { data, error } = await supabase
          .from('worldcups')
          .select('id, comments')
          .eq('id', worldcupId)
          .single();

        if (!error && data) {
          setStoredWorldCups(prev => 
            prev.map(wc => wc.id === worldcupId ? { ...wc, comments: data.comments } : wc)
          );
          console.log(`✅ Synced comment count for ${worldcupId}: ${data.comments}`);
        }
      } catch (error) {
        console.error('Error syncing comment count:', error);
      }
    });

    return unsubscribe;
  }, []);

  // 플레이 횟수 변경 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribe = onPlayCountChange(async (worldcupId: string, newCount: number) => {
      console.log(`🎮 Play count updated for ${worldcupId}: ${newCount}`);
      
      // 로컬 상태 즉시 업데이트
      setStoredWorldCups(prev => 
        prev.map(wc => wc.id === worldcupId ? { ...wc, participants: newCount } : wc)
      );
    });

    return unsubscribe;
  }, []);

  // 사용자 북마크 및 좋아요 데이터 로드
  useEffect(() => {
    const loadUserInteractions = async () => {
      try {
        if (user && user.id) {
          // 로그인한 사용자: Supabase에서 데이터 로드
          console.log('👤 Loading interactions for logged in user:', user.id);
          
          const [userBookmarks, userLikes] = await Promise.all([
            getUserBookmarks(user.id),
            getUserLikes(user.id)
          ]);
          
          setBookmarkedItems(new Set(userBookmarks));
          setLikedItems(new Set(userLikes));
          
          console.log('✅ User interactions loaded:', {
            userId: user.id,
            username: user.username,
            bookmarks: userBookmarks.length,
            likes: userLikes.length
          });
        } else if (user === null) {
          // 명시적으로 로그인하지 않은 사용자 (user가 null)
          console.log('👤 Guest user - no interactions loaded');
          setLikedItems(new Set()); // 비회원은 좋아요 표시 안함
          setBookmarkedItems(new Set()); // 북마크는 회원 전용
        }
        // user가 undefined인 경우 (아직 로딩 중)는 아무것도 하지 않음
      } catch (error) {
        console.error('Failed to load user interactions:', error);
        // 에러 발생시 기본값으로 초기화
        setLikedItems(new Set());
        setBookmarkedItems(new Set());
      }
    };

    loadUserInteractions();
  }, [user]);

  const handleLike = async (id: string) => {
    const isCurrentlyLiked = likedItems.has(id);
    const isLiking = !isCurrentlyLiked;

    console.log('🔄 handleLike called:', { 
      userId: user?.id, 
      worldcupId: id, 
      isLiking, 
      isAuthenticated: !!(user && user.id),
      userObject: user 
    });

    // 비회원인 경우 로그인 프롬프트 표시
    if (!user || !user.id) {
      console.log('❌ Guest user trying to like, showing login prompt');
      setLoginPromptAction(() => () => {
        // 로그인 후 실행될 함수를 저장
        console.log('📝 Setting up post-login action for like');
        // 실제 좋아요 처리는 로그인 후에 수행
      });
      setShowLoginPrompt(true);
      return;
    }

    // 즉시 UI 업데이트 (낙관적 업데이트) - 로그인한 사용자만
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (isLiking) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });

    // 좋아요 수 즉시 업데이트 (표시용) - 낙관적 업데이트
    setStoredWorldCups(prev => 
      prev.map(wc => wc.id === id ? { 
        ...wc, 
        likes: isLiking ? wc.likes + 1 : Math.max(0, wc.likes - 1) 
      } : wc)
    );

    try {
      // 회원: Supabase에 저장 (트리거가 자동으로 worldcups.likes 업데이트)
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
        
        if (isLiking) {
          alert('이미 좋아요를 누른 월드컵입니다.');
        }
        return;
      }
      
      console.log(`✅ User ${isLiking ? 'liked' : 'unliked'} worldcup:`, id);
      
      // 실제 데이터베이스에서 좋아요 수 다시 가져오기 (약간의 지연 후)
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('worldcups')
            .select('likes')
            .eq('id', id)
            .single();
          
          if (!error && data) {
            setStoredWorldCups(prev => 
              prev.map(wc => wc.id === id ? { 
                ...wc, 
                likes: data.likes || 0
              } : wc)
            );
            console.log('🔄 Updated likes count from database:', data.likes);
          }
        } catch (error) {
          console.error('Error refreshing likes count:', error);
        }
      }, 500);
      
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

  const handlePlay = async (id: string) => {
    // 로딩 상태 시작
    setPlayLoadingStates(prev => new Set([...prev, id]));
    
    try {
      // API를 통한 안전한 플레이 횟수 업데이트
      const result = await incrementPlayCount(id);
      
      if (result.success && result.playCount) {
        console.log(`✅ Play count updated: ${result.playCount}`);
        
        // 이벤트 발생으로 UI 업데이트
        notifyPlayCountChange(id, result.playCount);
      } else {
        // 중복 플레이 등의 경우에도 페이지는 이동
        if (result.error) {
          console.warn('Play count update warning:', result.error);
          // 사용자에게 알림은 하지 않고 조용히 처리
        }
      }
    } catch (error) {
      console.error('Failed to update play count:', error);
      // 에러가 발생해도 페이지 이동은 계속 진행
    }
    
    // Navigate to worldcup play page using Next.js router
    router.push(`/play/${id}`);
    
    // 페이지 이동 후 로딩 상태 정리 (약간의 지연 후)
    setTimeout(() => {
      setPlayLoadingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 1000);
  };

  const handleShare = async (id: string) => {
    console.log('🔗 Share worldcup called with ID:', id);
    console.log('📋 Available worldcups:', storedWorldCups.map(wc => ({ id: wc.id, title: wc.title })));
    
    try {
      const worldcup = storedWorldCups.find(wc => wc.id === id);
      if (!worldcup) {
        console.error('❌ WorldCup not found for sharing. ID:', id);
        showToast('공유할 월드컵을 찾을 수 없습니다.', 'error');
        return;
      }

      console.log('✅ Found worldcup for sharing:', { id: worldcup.id, title: worldcup.title });

      const shareUrl = `${window.location.origin}/play/${id}`;

      // 바로 클립보드에 복사 (Web Share API 제거)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('링크가 클립보드에 복사되었습니다!', 'success');
          console.log('✅ URL copied to clipboard');
          return;
        } catch (clipboardError) {
          console.log('❌ Clipboard API failed:', clipboardError);
        }
      }

      // Clipboard API가 지원되지 않는 경우 fallback
      const message = `다음 링크를 복사해서 공유하세요:\n\n${shareUrl}`;
      alert(message);
      console.log('📋 Fallback: URL displayed in alert');

    } catch (error) {
      console.error('❌ Error sharing worldcup:', error);
      alert('공유 중 오류가 발생했습니다.');
    }
  };

  // 로그인 프롬프트 모달 핸들러
  const handleLoginPromptLogin = () => {
    setShowLoginPrompt(false);
    // 헤더의 로그인 버튼을 클릭하는 것처럼 처리
    const loginButton = document.querySelector('[data-login-button]') as HTMLButtonElement;
    if (loginButton) {
      loginButton.click();
    } else {
      // 헤더 컴포넌트에 직접 접근할 수 없는 경우, 커스텀 이벤트 발생
      window.dispatchEvent(new CustomEvent('openLoginModal'));
    }
  };

  const handleLoginPromptClose = () => {
    setShowLoginPrompt(false);
    setLoginPromptAction(() => {});
  };

  // 전체 랭킹 보기 핸들러
  const handleViewRanking = (worldcupId: string, worldcupTitle: string) => {
    console.log('📊 Opening ranking modal for worldcup:', { id: worldcupId, title: worldcupTitle });
    setSelectedWorldCupForRanking({ id: worldcupId, title: worldcupTitle });
    setShowRankingModal(true);
  };

  const handleCloseRankingModal = () => {
    setShowRankingModal(false);
    setSelectedWorldCupForRanking(null);
  };

  // 저장된 월드컵 데이터 필터링 (카테고리 + 검색)
  const filteredWorldCups = storedWorldCups.filter(worldcup => {
    // 카테고리 필터
    if (_category !== 'all' && worldcup.category !== _category) {
      return false;
    }
    
    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        worldcup.title.toLowerCase().includes(query) ||
        (worldcup.description && worldcup.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const allWorldCups = filteredWorldCups;
  const useVirtualization = allWorldCups.length > 50; // Use virtualization for large datasets

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
    <>
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
        ) : useVirtualization ? (
          <VirtualizedWorldCupGrid
            category={_category}
            sortBy={_sortBy}
            searchQuery={searchQuery}
            items={allWorldCups}
            likedItems={likedItems}
            bookmarkedItems={bookmarkedItems}
            isLoggedIn={!!(user && user.id)}
            playLoadingStates={playLoadingStates}
            onPlay={handlePlay}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={handleShare}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {allWorldCups.map((worldcup) => (
              <WorldCupCard
                key={worldcup.id}
                {...worldcup}
                isLiked={likedItems.has(worldcup.id)}
                isBookmarked={bookmarkedItems.has(worldcup.id)}
                isLoggedIn={!!(user && user.id)}
                isPlayLoading={playLoadingStates.has(worldcup.id)}
                onPlay={() => handlePlay(worldcup.id)}
                onLike={() => handleLike(worldcup.id)}
                onBookmark={() => handleBookmark(worldcup.id)}
                onShare={() => handleShare(worldcup.id)}
                onViewRanking={() => handleViewRanking(worldcup.id, worldcup.title)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 로그인 프롬프트 모달 */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={handleLoginPromptClose}
        onLogin={handleLoginPromptLogin}
        message="좋아요를 하려면 로그인을 해야합니다."
      />

      {/* 전체 랭킹 모달 */}
      {selectedWorldCupForRanking && (
        <RankingModal
          isOpen={showRankingModal}
          onClose={handleCloseRankingModal}
          worldcupId={selectedWorldCupForRanking.id}
          worldcupTitle={selectedWorldCupForRanking.title}
        />
      )}
    </>
  );
}