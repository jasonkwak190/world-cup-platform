'use client';

import { useState } from 'react';
import { Edit3, Trash2, Copy, Trophy, BookmarkCheck } from 'lucide-react';
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

interface WorldCupListProps {
  worldcups: MyWorldCup[];
  activeTab: string;
  tabTypes: Record<string, string>;
  onPlay: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  onBookmark: (id: string) => void;
  onCreateNew?: () => void;
  maxWorldCups?: number;
  isLoading?: boolean;
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

const WorldCupList: React.FC<WorldCupListProps> = ({
  worldcups,
  activeTab,
  tabTypes,
  onPlay,
  onEdit,
  onDelete,
  onBookmark,
  onCreateNew,
  maxWorldCups = 10,
  isLoading = false
}) => {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/play/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      if (worldcups.length >= maxWorldCups) {
        alert(`최대 ${maxWorldCups}개까지만 월드컵을 만들 수 있습니다.\\n기존 월드컵을 삭제한 후 새로 만들어주세요.`);
        return;
      }
      router.push('/create');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (worldcups.length === 0) {
    return (
      <div className="text-center py-12">
        {activeTab === tabTypes.CREATED ? (
          <>
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 만든 월드컵이 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 월드컵을 만들어보세요!</p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              월드컵 만들기 (0/{maxWorldCups})
            </button>
          </>
        ) : (
          <>
            <BookmarkCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">북마크한 월드컵이 없습니다</h3>
            <p className="text-gray-500 mb-6">관심 있는 월드컵을 북마크해보세요!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              월드컵 둘러보기
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {activeTab === tabTypes.CREATED && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">내가 만든 월드컵</h2>
          <button
            onClick={handleCreateNew}
            className={`px-4 py-2 rounded-lg transition-colors ${
              worldcups.length >= maxWorldCups 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={worldcups.length >= maxWorldCups}
          >
            새 월드컵 만들기 ({worldcups.length}/{maxWorldCups})
          </button>
        </div>
      )}

      {activeTab === tabTypes.BOOKMARKED && (
        <h2 className="text-lg font-semibold text-gray-900 mb-6">북마크한 월드컵</h2>
      )}

      <div className="space-y-4">
        {worldcups.map((worldcup) => (
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
                  {activeTab === tabTypes.CREATED ? (
                    <>
                      <span>📝 {worldcup.items.length}개 항목</span>
                      <span>🏷️ {getCategoryName(worldcup.category || 'misc')}</span>
                    </>
                  ) : (
                    <span>👤 {worldcup.author}</span>
                  )}
                  <span>📅 {worldcup.createdAt}</span>
                </div>
              </div>
              
              {/* 액션 버튼들 */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => onPlay(worldcup.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  플레이
                </button>

                {activeTab === tabTypes.CREATED ? (
                  <>
                    <button
                      onClick={() => onEdit(worldcup.id, worldcup.title)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm transition-colors border border-blue-200"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => onDelete(worldcup.id, worldcup.title)}
                      className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm transition-colors border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>삭제</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onBookmark(worldcup.id)}
                    className="flex items-center space-x-1 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg text-sm transition-colors border border-yellow-200"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>북마크 해제</span>
                  </button>
                )}

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
    </div>
  );
};

export default WorldCupList;