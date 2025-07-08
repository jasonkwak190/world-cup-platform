'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWorldCups } from '@/utils/supabaseData';
import { getUserBookmarks } from '@/utils/userInteractions';
import { getWorldCupById } from '@/utils/supabaseData';
import { supabase } from '@/lib/supabase';
// import WorldCupCard from '@/components/WorldCupCard';
import { User, BookmarkCheck, Trophy, Settings, Heart, ArrowLeft, Edit3, Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

// 카테고리 이름 매핑
const getCategoryName = (category: string) => {
  const categories: { [key: string]: string } = {
    'all': '전체',
    'celebrity': '연예인',
    'food': '음식',
    'travel': '여행',
    'anime': '애니메이션',
    'game': '게임',
    'movie': '영화',
    'music': '음악',
    'entertainment': '엔터테인먼트',
    'sports': '스포츠',
    'other': '기타',
  };
  return categories[category] || '기타';
};

export default function MyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'created' | 'bookmarked'>('created');
  const [createdWorldCups, setCreatedWorldCups] = useState<MyWorldCup[]>([]);
  const [bookmarkedWorldCups, setBookmarkedWorldCups] = useState<MyWorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMyData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // 내가 만든 월드컵과 북마크한 월드컵 ID들을 병렬로 가져오기
      const [myWorldCups, bookmarkIds] = await Promise.all([
        getUserWorldCups(user.id).catch(err => {
          console.error('Error loading user worldcups:', err);
          return [];
        }),
        getUserBookmarks(user.id).catch(err => {
          console.error('Error loading bookmarks:', err);
          return [];
        })
      ]);

      console.log('✅ Loaded data:', { myWorldCups: myWorldCups.length, bookmarkIds: bookmarkIds.length });
      setCreatedWorldCups(myWorldCups);

      // 북마크한 월드컵들의 상세 정보 가져오기
      if (bookmarkIds.length > 0) {
        const bookmarkedDetails = await Promise.all(
          bookmarkIds.map(id => getWorldCupById(id).catch(() => null))
        );
        const validBookmarks = bookmarkedDetails.filter(wc => wc !== null) as MyWorldCup[];
        setBookmarkedWorldCups(validBookmarks);
      }

    } catch (error) {
      console.error('Failed to load my data:', error);
      setCreatedWorldCups([]);
      setBookmarkedWorldCups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadMyData();
  }, [user, router, loadMyData]);

  const handlePlay = (id: string) => {
    router.push(`/play/${id}`);
  };

  // const handleLike = (id: string) => {
  //   // 좋아요 기능은 메인 페이지에서와 동일하게 구현
  //   console.log('Like worldcup:', id);
  // };

  const handleBookmark = (id: string) => {
    // 북마크 토글 기능
    console.log('Toggle bookmark:', id);
  };

  // const handleShare = (id: string) => {
  //   // 공유 기능
  //   const shareUrl = `${window.location.origin}/play/${id}`;
  //   navigator.clipboard.writeText(shareUrl);
  //   // Toast 알림은 나중에 추가
  // };

  const handleEdit = (id: string, title: string) => {
    if (confirm(`"${title}" 월드컵을 수정하시겠습니까?`)) {
      router.push(`/edit/${id}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    // 이중 확인으로 실수 방지
    const firstConfirm = confirm(`정말로 "${title}" 월드컵을 삭제하시겠습니까?\n\n⚠️ 모든 게임 기록, 댓글, 통계가 함께 삭제됩니다.`);
    if (!firstConfirm) return;
    
    const secondConfirm = confirm(`⚠️ 최종 확인\n\n"${title}" 월드컵과 관련된 모든 데이터가 영구히 삭제됩니다.\n\n계속하시겠습니까?`);
    if (secondConfirm) {
      try {
        console.log('Delete worldcup:', id);
        
        // 올바른 순서로 연관 데이터 삭제 (외래 키 제약 조건 고려)
        
        // 1. 먼저 해당 worldcup의 모든 items ID 가져오기
        const { data: worldcupItems } = await supabase
          .from('worldcup_items')
          .select('id')
          .eq('worldcup_id', id);

        const itemIds = worldcupItems?.map(item => item.id) || [];
        console.log('Found worldcup items:', itemIds);

        // 2. 관련 데이터 삭제 (순서대로)
        const deleteTasks = [
          // 게임 매치 삭제
          supabase.from('game_matches').delete().eq('worldcup_id', id),
          // 게임 세션 삭제  
          supabase.from('game_sessions').delete().eq('worldcup_id', id),
          // 게임 결과 삭제
          supabase.from('game_results').delete().eq('worldcup_id', id),
          // 댓글 삭제
          supabase.from('comments').delete().eq('worldcup_id', id),
          // 사용자 상호작용 삭제
          supabase.from('user_interactions').delete().eq('target_id', id).eq('target_type', 'worldcup')
        ];

        const tableNames = ['game_matches', 'game_sessions', 'game_results', 'comments', 'user_interactions'];
        
        // 순차적으로 삭제 (병렬로 하면 외래 키 순서 문제가 있을 수 있음)
        for (let i = 0; i < deleteTasks.length; i++) {
          const { error } = await deleteTasks[i];
          if (error) {
            console.warn(`Warning deleting from ${tableNames[i]}:`, error);
          } else {
            console.log(`✅ Successfully deleted from ${tableNames[i]}`);
          }
        }

        // 3. worldcup_items 삭제 (CASCADE로 인해 남은 참조들이 자동 정리됨)
        const { error: itemsError } = await supabase
          .from('worldcup_items')
          .delete()
          .eq('worldcup_id', id);

        if (itemsError) {
          console.error('CRITICAL ERROR deleting worldcup_items:', itemsError);
          throw new Error(`Failed to delete worldcup_items: ${itemsError.message}`);
        } else {
          console.log('✅ Successfully deleted from worldcup_items');
        }

        // 6. 최종적으로 월드컵 삭제
        const { error } = await supabase
          .from('worldcups')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Failed to delete worldcup:', error);
          alert(`월드컵 삭제 중 오류가 발생했습니다: ${error.message}`);
          return;
        }

        // 로컬 상태에서도 제거
        setCreatedWorldCups(prev => prev.filter(wc => wc.id !== id));
        alert('월드컵이 성공적으로 삭제되었습니다.');
        
      } catch (error) {
        console.error('Failed to delete worldcup:', error);
        alert('월드컵 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/play/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 홈 버튼 */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>홈으로 돌아가기</span>
        </button>

        {/* 헤더 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                <p className="text-gray-500">
                  월드컵 제작자 · {createdWorldCups.length}개 제작 · {bookmarkedWorldCups.length}개 북마크
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>설정</span>
            </button>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Trophy className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">제작한 월드컵</p>
                <p className="text-2xl font-bold text-gray-900">{createdWorldCups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 좋아요</p>
                <p className="text-2xl font-bold text-gray-900">
                  {createdWorldCups.reduce((total, wc) => total + wc.likes, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 참여자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {createdWorldCups.reduce((total, wc) => total + wc.participants, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookmarkCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">북마크</p>
                <p className="text-2xl font-bold text-gray-900">{bookmarkedWorldCups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'created'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>내가 만든 월드컵</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {createdWorldCups.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('bookmarked')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bookmarked'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>북마크한 월드컵</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {bookmarkedWorldCups.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">로딩 중...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'created' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">내가 만든 월드컵</h2>
                    <button
                      onClick={() => {
                        if (createdWorldCups.length >= 10) {
                          alert('최대 10개까지만 월드컵을 만들 수 있습니다.\n기존 월드컵을 삭제한 후 새로 만들어주세요.');
                          return;
                        }
                        router.push('/create');
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        createdWorldCups.length >= 10 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      disabled={createdWorldCups.length >= 10}
                    >
                      새 월드컵 만들기 ({createdWorldCups.length}/10)
                    </button>
                  </div>
                  
                  {createdWorldCups.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">아직 만든 월드컵이 없습니다</h3>
                      <p className="text-gray-500 mb-6">첫 번째 월드컵을 만들어보세요!</p>
                      <button
                        onClick={() => {
                          if (createdWorldCups.length >= 10) {
                            alert('최대 10개까지만 월드컵을 만들 수 있습니다.');
                            return;
                          }
                          router.push('/create');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        월드컵 만들기 (0/10)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {createdWorldCups.map((worldcup) => (
                        <div key={worldcup.id} className="bg-white rounded-lg border hover:shadow-md transition-shadow p-4">
                          <div className="flex items-center space-x-4">
                            {/* 썸네일 */}
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={worldcup.thumbnail}
                                alt={worldcup.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* 정보 */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{worldcup.title}</h3>
                              <p className="text-sm text-gray-600 truncate">{worldcup.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>👥 {worldcup.participants}명</span>
                                <span>❤️ {worldcup.likes}개</span>
                                <span>📝 {worldcup.items.length}개 항목</span>
                                <span>🏷️ {getCategoryName(worldcup.category || 'misc')}</span>
                                <span>📅 {worldcup.createdAt}</span>
                              </div>
                            </div>
                            
                            {/* 액션 버튼들 */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handlePlay(worldcup.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                              >
                                플레이
                              </button>
                              <button
                                onClick={() => handleEdit(worldcup.id, worldcup.title)}
                                className="flex items-center space-x-1 px-3 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm transition-colors border border-emerald-200"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>수정</span>
                              </button>
                              <button
                                onClick={() => handleDelete(worldcup.id, worldcup.title)}
                                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm transition-colors border border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>삭제</span>
                              </button>
                              <button
                                onClick={() => handleCopyLink(worldcup.id)}
                                className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm transition-colors border border-blue-200"
                              >
                                <Copy className="w-4 h-4" />
                                <span>복사</span>
                              </button>
                            </div>
                          </div>
                          
                          {copiedId === worldcup.id && (
                            <div className="mt-2 text-xs text-blue-600 text-center">
                              링크가 복사되었습니다!
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarked' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">북마크한 월드컵</h2>
                  
                  {bookmarkedWorldCups.length === 0 ? (
                    <div className="text-center py-12">
                      <BookmarkCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">북마크한 월드컵이 없습니다</h3>
                      <p className="text-gray-500 mb-6">관심 있는 월드컵을 북마크해보세요!</p>
                      <button
                        onClick={() => router.push('/')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        월드컵 둘러보기
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookmarkedWorldCups.map((worldcup) => (
                        <div key={worldcup.id} className="bg-white rounded-lg border hover:shadow-md transition-shadow p-4">
                          <div className="flex items-center space-x-4">
                            {/* 썸네일 */}
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={worldcup.thumbnail}
                                alt={worldcup.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* 정보 */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{worldcup.title}</h3>
                              <p className="text-sm text-gray-600 truncate">{worldcup.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>👥 {worldcup.participants}명</span>
                                <span>❤️ {worldcup.likes}개</span>
                                <span>👤 {worldcup.author}</span>
                                <span>📅 {worldcup.createdAt}</span>
                              </div>
                            </div>
                            
                            {/* 액션 버튼들 */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handlePlay(worldcup.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                              >
                                플레이
                              </button>
                              <button
                                onClick={() => handleBookmark(worldcup.id)}
                                className="flex items-center space-x-1 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg text-sm transition-colors border border-yellow-200"
                              >
                                <BookmarkCheck className="w-4 h-4" />
                                <span>북마크 해제</span>
                              </button>
                              <button
                                onClick={() => handleCopyLink(worldcup.id)}
                                className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm transition-colors border border-blue-200"
                              >
                                <Copy className="w-4 h-4" />
                                <span>복사</span>
                              </button>
                            </div>
                          </div>
                          
                          {copiedId === worldcup.id && (
                            <div className="mt-2 text-xs text-blue-600 text-center">
                              링크가 복사되었습니다!
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}