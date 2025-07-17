'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  secureGetUserWorldCups, 
  secureDeleteWorldCup, 
  secureGetWorldCupById,
  secureGetUserBookmarks,
  checkAuthStatus 
} from '@/lib/api/secure-api';
import ProfileHeader from '@/components/ProfileHeader';
import StatsDashboard from '@/components/StatsDashboard';
import TabNavigation from '@/components/TabNavigation';
import WorldCupList from '@/components/WorldCupList';

// 탭 타입 정의 (매직 스트링 제거)
const TAB_TYPES = {
  CREATED: 'created',
  BOOKMARKED: 'bookmarked',
} as const;

type TabType = typeof TAB_TYPES[keyof typeof TAB_TYPES];

// 최대 월드컵 생성 개수
const MAX_WORLDCUPS = 10;

// 에러 메시지 상수 (매직 스트링 제거)
const ERROR_MESSAGES = {
  AUTH_EXPIRED: '인증이 만료되었습니다. 다시 로그인해주세요.',
  AUTH_FAILED: '인증 확인 중 오류가 발생했습니다.',
  DELETE_FAILED: '월드컵 삭제 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
  LOAD_FAILED: 'Failed to load your data. Please try refreshing the page.',
} as const;

// 확인 메시지 상수 (매직 스트링 제거)
const CONFIRM_MESSAGES = {
  EDIT_WORLDCUP: (title: string) => `"${title}" 월드컵을 수정하시겠습니까?`,
  DELETE_FIRST: (title: string) => `정말로 "${title}" 월드컵을 삭제하시겠습니까?\\n\\n⚠️ 모든 게임 기록, 댓글, 통계가 함께 삭제됩니다.`,
  DELETE_FINAL: (title: string) => `⚠️ 최종 확인\\n\\n"${title}" 월드컵과 관련된 모든 데이터가 영구히 삭제됩니다.\\n\\n계속하시겠습니까?`,
} as const;

// 성공 메시지 상수 (매직 스트링 제거)
const SUCCESS_MESSAGES = {
  DELETE_SUCCESS: '월드컵이 성공적으로 삭제되었습니다.',
  DELETE_ERROR: '월드컵 삭제 중 오류가 발생했습니다.',
} as const;

interface MyWorldCup {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  createdAt: string;
  participants: number;
  comments: number;
  likes: number;
  items: any[];
  isPublic: boolean;
  category?: string;
}

export default function MyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(TAB_TYPES.CREATED);
  const [createdWorldCups, setCreatedWorldCups] = useState<MyWorldCup[]>([]);
  const [bookmarkedWorldCups, setBookmarkedWorldCups] = useState<MyWorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // useMemo로 계산된 값들 최적화
  const totalLikes = useMemo(() => 
    createdWorldCups.reduce((total, wc) => total + wc.likes, 0), 
    [createdWorldCups]
  );
  
  const totalParticipants = useMemo(() => 
    createdWorldCups.reduce((total, wc) => total + wc.participants, 0), 
    [createdWorldCups]
  );

  const loadMyData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // 🔒 SECURITY: Verify authentication before making API calls
      const authStatus = await checkAuthStatus();
      if (!authStatus.isAuthenticated) {
        console.error('User is not authenticated');
        router.push('/');
        return;
      }

      // 내가 만든 월드컵과 북마크한 월드컵 ID들을 병렬로 가져오기
      const [myWorldCups, bookmarkIds] = await Promise.all([
        secureGetUserWorldCups(user.id).catch(err => {
          console.error('Error loading user worldcups:', err);
          // 🔒 SECURITY: Don't expose detailed error messages to user
          throw new Error('Failed to load your tournaments');
        }),
        secureGetUserBookmarks(user.id).catch(err => {
          console.error('Error loading bookmarks:', err);
          // If bookmarks API doesn't exist yet, return empty array
          return [];
        })
      ]);

      console.log('✅ Loaded data:', { myWorldCups: myWorldCups.length, bookmarkIds: bookmarkIds.length });
      setCreatedWorldCups(myWorldCups);

      // 북마크한 월드컵들의 상세 정보 가져오기
      if (bookmarkIds.length > 0) {
        const bookmarkedDetails = await Promise.all(
          bookmarkIds.map(id => secureGetWorldCupById(id, false).catch(() => null))
        );
        const validBookmarks = bookmarkedDetails.filter(wc => wc !== null) as MyWorldCup[];
        setBookmarkedWorldCups(validBookmarks);
      }

    } catch (error) {
      console.error('Failed to load my data:', error);
      // 🔒 SECURITY: Show user-friendly error message
      alert(ERROR_MESSAGES.LOAD_FAILED);
      setCreatedWorldCups([]);
      setBookmarkedWorldCups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadMyData();
  }, [user, router, loadMyData]);

  const handlePlay = (id: string) => {
    // 🔒 SECURITY: Input validation and URL encoding
    if (!id) {
      console.error('Invalid play parameters');
      return;
    }

    router.push(`/play/${encodeURIComponent(id)}`);
  };

  // const handleLike = (id: string) => {
  //   // 좋아요 기능은 메인 페이지에서와 동일하게 구현
  //   console.log('Like worldcup:', id);
  // };

  const handleBookmark = (id: string) => {
    // 북마크 토글 기능
    console.log('Toggle bookmark:', id);
  };

  const handleEdit = async (id: string, title: string) => {
    // 🔒 SECURITY: Input validation
    if (!id || !title) {
      console.error('Invalid edit parameters');
      return;
    }

    if (confirm(CONFIRM_MESSAGES.EDIT_WORLDCUP(title))) {
      try {
        // 🔒 SECURITY: Re-verify authentication before navigation
        const authStatus = await checkAuthStatus();
        if (!authStatus.isAuthenticated) {
          alert(ERROR_MESSAGES.AUTH_EXPIRED);
          router.push('/');
          return;
        }

        // Navigate to edit page (edit page will handle ownership verification)
        router.push(`/edit/${encodeURIComponent(id)}`);
      } catch (error) {
        console.error('Failed to verify authentication for edit:', error);
        alert(ERROR_MESSAGES.AUTH_FAILED);
      }
    }
  };

  const handleDelete = async (id: string, title: string) => {
    // 🔒 SECURITY: Input validation
    if (!id || !title) {
      console.error('Invalid delete parameters');
      return;
    }

    // 이중 확인으로 실수 방지
    const firstConfirm = confirm(CONFIRM_MESSAGES.DELETE_FIRST(title));
    if (!firstConfirm) return;
    
    const secondConfirm = confirm(CONFIRM_MESSAGES.DELETE_FINAL(title));
    if (secondConfirm) {
      try {
        // 🔒 SECURITY: Re-verify authentication before deletion
        const authStatus = await checkAuthStatus();
        if (!authStatus.isAuthenticated) {
          alert(ERROR_MESSAGES.AUTH_EXPIRED);
          router.push('/');
          return;
        }

        console.log('🗑️ Starting secure worldcup deletion:', id);
        
        // 🔒 SECURITY: Use secure API with proper authentication and ownership verification
        const result = await secureDeleteWorldCup(id);
        
        if (result.success) {
          // 로컬 상태에서도 제거
          setCreatedWorldCups(prev => prev.filter(wc => wc.id !== id));
          alert(SUCCESS_MESSAGES.DELETE_SUCCESS);
        } else {
          console.error('Failed to delete worldcup');
          alert(SUCCESS_MESSAGES.DELETE_ERROR);
        }
        
      } catch (error) {
        console.error('Failed to delete worldcup:', error);
        // 🔒 SECURITY: Don't expose detailed error messages
        alert(ERROR_MESSAGES.DELETE_FAILED);
      }
    }
  };

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader
          username={user.username}
          createdCount={createdWorldCups.length}
          bookmarkedCount={bookmarkedWorldCups.length}
        />

        <StatsDashboard
          createdCount={createdWorldCups.length}
          totalLikes={totalLikes}
          totalParticipants={totalParticipants}
          bookmarkedCount={bookmarkedWorldCups.length}
        />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          createdCount={createdWorldCups.length}
          bookmarkedCount={bookmarkedWorldCups.length}
          tabTypes={TAB_TYPES}
        />

        {/* 콘텐츠 영역 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <WorldCupList
            worldcups={activeTab === TAB_TYPES.CREATED ? createdWorldCups : bookmarkedWorldCups}
            activeTab={activeTab}
            tabTypes={TAB_TYPES}
            onPlay={handlePlay}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBookmark={handleBookmark}
            maxWorldCups={MAX_WORLDCUPS}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}