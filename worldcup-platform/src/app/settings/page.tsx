'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Lock, 
  Bell, 
  Monitor, 
  Moon, 
  Sun, 
  Shield, 
  UserX, 
  Mail,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'privacy' | 'notifications'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 프로필 설정
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: ''
  });

  // 비밀번호 변경
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 기타 설정
  const [settings, setSettings] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    publicProfile: true,
    showMyWorldCups: true
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      // TODO: 프로필 업데이트 API 호출
      console.log('Saving profile:', profile);
      // 성공 알림
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 비밀번호 변경 API 호출
      console.log('Changing password');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // 성공 알림
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    setIsLoading(true);
    try {
      // TODO: 설정 저장 API 호출
      console.log('Saving settings:', settings);
      // 성공 알림
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDelete = async () => {
    setIsLoading(true);
    try {
      // TODO: 계정 삭제 API 호출
      console.log('Deleting account');
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'account', label: '계정', icon: Lock },
    { id: 'privacy', label: '개인정보', icon: Shield },
    { id: 'notifications', label: '알림', icon: Bell }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 홈 버튼 */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>홈으로 돌아가기</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-8">설정</h1>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 탭 메뉴 */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">프로필 정보</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">사용자명</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="자신을 소개해보세요..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleProfileSave}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? '저장 중...' : '프로필 저장'}</span>
                  </button>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-8">
                  {/* 비밀번호 변경 */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">비밀번호 변경</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {isLoading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>

                  {/* 로그아웃 */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">로그아웃</h3>
                    <p className="text-gray-600 mb-4">현재 세션에서 로그아웃합니다.</p>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>

                  {/* 계정 삭제 */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-red-600 mb-2">계정 삭제</h3>
                    <p className="text-gray-600 mb-4">
                      계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <UserX className="w-4 h-4" />
                        <span>계정 삭제</span>
                      </button>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-red-800 font-medium mb-2">정말로 계정을 삭제하시겠습니까?</h4>
                            <p className="text-red-700 text-sm mb-4">
                              이 작업은 되돌릴 수 없습니다. 모든 월드컵, 북마크, 설정이 영구적으로 삭제됩니다.
                            </p>
                            <div className="flex space-x-3">
                              <button
                                onClick={handleAccountDelete}
                                disabled={isLoading}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                {isLoading ? '삭제 중...' : '예, 삭제합니다'}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">개인정보 설정</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">공개 프로필</h3>
                        <p className="text-sm text-gray-500">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.publicProfile}
                          onChange={(e) => setSettings({ ...settings, publicProfile: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">내가 만든 월드컵 공개</h3>
                        <p className="text-sm text-gray-500">다른 사용자가 내가 만든 월드컵을 볼 수 있습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showMyWorldCups}
                          onChange={(e) => setSettings({ ...settings, showMyWorldCups: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">테마 설정</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'light', label: '라이트 모드', icon: Sun },
                        { value: 'dark', label: '다크 모드', icon: Moon },
                        { value: 'system', label: '시스템 설정 따름', icon: Monitor }
                      ].map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <label key={theme.value} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value={theme.value}
                              checked={settings.theme === theme.value}
                              onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                            />
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-900">{theme.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSettingsSave}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? '저장 중...' : '설정 저장'}</span>
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">알림 설정</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">이메일 알림</h3>
                        <p className="text-sm text-gray-500">새로운 댓글, 좋아요 등의 알림을 이메일로 받습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">푸시 알림</h3>
                        <p className="text-sm text-gray-500">브라우저 알림을 받습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.pushNotifications}
                          onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">마케팅 이메일</h3>
                        <p className="text-sm text-gray-500">새로운 기능, 이벤트 등의 소식을 받습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.marketingEmails}
                          onChange={(e) => setSettings({ ...settings, marketingEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSettingsSave}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? '저장 중...' : '알림 설정 저장'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}