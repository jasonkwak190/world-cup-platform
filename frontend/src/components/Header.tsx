'use client';

import { Search, Plus, User as UserIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import type { User } from '@/types/user';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  userWorldCupCount?: number;
}

export default function Header({ searchQuery = '', onSearchChange, userWorldCupCount = 0 }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout, login } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFromCreateButton, setIsFromCreateButton] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 사용자 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    // 커스텀 이벤트 리스너 - 다른 컴포넌트에서 로그인 모달 열기 요청
    const handleOpenLoginModal = () => {
      setIsFromCreateButton(false);
      setAuthMode('login');
      setIsAuthModalOpen(true);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  const handleAuthSuccess = (user: User) => {
    console.log('🎉 Header received auth success with user:', user);
    login(user); // AuthContext의 login 함수 호출
    setIsAuthModalOpen(false);
    console.log('✅ Auth modal closed, user should be logged in');
    
    // 로그인 성공 후 create 페이지로 이동 (만들기 버튼을 클릭했을 때만)
    if (isFromCreateButton) {
      setIsFromCreateButton(false);
      router.push('/create');
    }
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const handleLogout = async () => {
    try {
      console.log('🔓 Starting logout process...');
      await logout();
      setShowUserMenu(false);
      console.log('✅ Logout completed successfully');
      
      // 강제 새로고침으로 상태 초기화 (임시 해결책)
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const handleCreateClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 로그인되지 않은 경우 로그인 모달 표시
    if (!isAuthenticated) {
      setIsFromCreateButton(true);
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    
    // 월드컵 개수 제한 확인
    if (userWorldCupCount >= 10) {
      alert('최대 10개까지만 월드컵을 만들 수 있습니다.\n마이페이지에서 기존 월드컵을 삭제한 후 새로 만들어주세요.');
      return;
    }
    
    // 로딩 상태 시작
    setIsCreateLoading(true);
    
    try {
      // 로그인된 경우 create 페이지로 이동
      router.push('/create');
      
      // 페이지 이동 후 약간의 지연
      setTimeout(() => {
        setIsCreateLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsCreateLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  <Image 
                    src="/vs-logo.png" 
                    alt="VS Logo" 
                    width={80} 
                    height={40}
                    className="h-10"
                    style={{ width: "auto", height: "auto" }}
                    priority
                  />
                  WorldCup
                </Link>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="월드컵 검색..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleCreateClick}
                disabled={isCreateLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isCreateLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white`}
              >
                {isCreateLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>로딩 중...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>만들기</span>
                  </>
                )}
              </button>

              {/* Auth Section */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                  </button>
                  
                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <div className="py-1">
                        <Link 
                          href="/my" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>마이 페이지</span>
                        </Link>
                        <Link 
                          href="/settings" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <SettingsIcon className="w-4 h-4" />
                          <span>설정</span>
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>로그아웃</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    data-login-button
                    onClick={() => {
                      setIsFromCreateButton(false);
                      setAuthMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    로그인
                  </button>
                  <button 
                    onClick={() => {
                      setIsFromCreateButton(false);
                      setAuthMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchMode={handleSwitchAuthMode}
      />
    </>
  );
}