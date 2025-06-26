'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, Crown, Trash2, Edit3, Copy, Download, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredWorldCups, deleteWorldCup, type StoredWorldCup } from '@/utils/storage';
import { isAdmin, updateUserProfile } from '@/utils/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ProfileImageUpload from '@/components/ProfileImageUpload';

function SettingsContent() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const [myWorldCups, setMyWorldCups] = useState<StoredWorldCup[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    worldcupId: string; 
    title: string 
  }>({ 
    isOpen: false, 
    worldcupId: '', 
    title: '' 
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 내가 만든 월드컵 목록 가져오기
  useEffect(() => {
    if (user) {
      const allWorldCups = getStoredWorldCups();
      const userWorldCups = allWorldCups.filter(wc => 
        wc.author === user.username || isAdmin(user)
      );
      setMyWorldCups(userWorldCups);
    }
  }, [user]);

  const handleDeleteWorldCup = (worldcup: StoredWorldCup) => {
    setDeleteModal({
      isOpen: true,
      worldcupId: worldcup.id,
      title: worldcup.title
    });
  };

  const confirmDelete = () => {
    try {
      deleteWorldCup(deleteModal.worldcupId);
      setMyWorldCups(prev => prev.filter(wc => wc.id !== deleteModal.worldcupId));
      setDeleteModal({ isOpen: false, worldcupId: '', title: '' });
    } catch (error) {
      console.error('Failed to delete worldcup:', error);
      alert('월드컵 삭제 중 오류가 발생했습니다.');
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, worldcupId: '', title: '' });
  };

  const handleEditWorldCup = (worldcupId: string) => {
    router.push(`/edit/${worldcupId}`);
  };

  const handleProfileImageChange = (imageData: string) => {
    if (user) {
      const result = updateUserProfile(user.id, { profileImage: imageData });
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        alert(result.error || '프로필 이미지 업데이트에 실패했습니다.');
      }
    }
  };

  const handleCopyLink = (worldcupId: string) => {
    const url = `${window.location.origin}/play/${worldcupId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(worldcupId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleExportData = () => {
    const userData = {
      profile: user,
      worldcups: myWorldCups,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `worldcup-data-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const totalParticipants = myWorldCups.reduce((sum, wc) => sum + wc.participants, 0);
    const totalLikes = myWorldCups.reduce((sum, wc) => sum + wc.likes, 0);
    const totalComments = myWorldCups.reduce((sum, wc) => sum + wc.comments, 0);
    
    return { totalParticipants, totalLikes, totalComments };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* 사용자 정보 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              사용자 정보
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 프로필 이미지 업로드 */}
              <div>
                <ProfileImageUpload
                  currentImage={user.profileImage}
                  onImageChange={handleProfileImageChange}
                  username={user.username}
                />
              </div>
              
              {/* 사용자 정보 */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                    {isAdmin(user) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <Crown className="w-3 h-3 mr-1" />
                        관리자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Mail className="w-4 h-4 mr-1" />
                    {user.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    가입일: {formatDate(user.createdAt)}
                  </div>
                </div>
                
                {/* 통계 정보 */}
                {myWorldCups.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      활동 통계
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-emerald-600">{myWorldCups.length}</div>
                        <div className="text-xs text-gray-500">만든 월드컵</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">{getTotalStats().totalParticipants.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">총 참여자</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-red-600">{getTotalStats().totalLikes.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">받은 좋아요</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 내가 만든 월드컵 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              내가 만든 월드컵 ({myWorldCups.length}개)
            </h2>
            
            {myWorldCups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-gray-500 mb-4">아직 만든 월드컵이 없습니다.</p>
                <button
                  onClick={() => router.push('/create')}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  첫 번째 월드컵 만들기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myWorldCups.map((worldcup) => (
                  <div key={worldcup.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {worldcup.thumbnail ? (
                            <img 
                              src={worldcup.thumbnail} 
                              alt={worldcup.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-xl">🏆</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{worldcup.title}</h3>
                            <p className="text-sm text-gray-500">
                              {worldcup.items.length}개 항목 · {worldcup.participants.toLocaleString()}명 참여
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(worldcup.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`/play/${worldcup.id}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="플레이"
                        >
                          <span className="text-sm">▶️</span>
                        </button>
                        <button
                          onClick={() => handleCopyLink(worldcup.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="링크 복사"
                        >
                          {copiedId === worldcup.id ? (
                            <span className="text-xs text-emerald-600 font-medium">✓</span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditWorldCup(worldcup.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorldCup(worldcup)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 편의 기능 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">편의 기능</h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportData}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                <span>데이터 내보내기</span>
              </button>
              
              <button
                onClick={() => router.push('/create')}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors font-medium"
              >
                <span>➕</span>
                <span>새 월드컵 만들기</span>
              </button>
            </div>
          </div>

          {/* 계정 관리 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">계정 관리</h2>
            
            <div className="space-y-4">
              <button
                onClick={logout}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}