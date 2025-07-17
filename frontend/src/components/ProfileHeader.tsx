'use client';

import { User, Settings, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  username: string;
  createdCount: number;
  bookmarkedCount: number;
  onBackClick?: () => void;
  onSettingsClick?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  createdCount,
  bookmarkedCount,
  onBackClick,
  onSettingsClick
}) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push('/');
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      router.push('/settings');
    }
  };

  return (
    <>
      {/* 홈 버튼 */}
      <button
        onClick={handleBackClick}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>홈으로 돌아가기</span>
      </button>

      {/* 헤더 섹션 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
              <p className="text-gray-500">
                월드컵 제작자 · {createdCount}개 제작 · {bookmarkedCount}개 북마크
              </p>
            </div>
          </div>
          <button
            onClick={handleSettingsClick}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>설정</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;