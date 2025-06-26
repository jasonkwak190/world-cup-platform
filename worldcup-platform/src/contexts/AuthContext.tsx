'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, logout } from '@/utils/auth';
import type { User, AuthState } from '@/types/user';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 컴포넌트 마운트 시 저장된 사용자 정보 확인
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const user = getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // 로그인 처리
  const handleLogin = (user: User) => {
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  // 로그아웃 처리
  const handleLogout = () => {
    logout(); // localStorage에서 사용자 정보 제거
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  // 사용자 정보 새로고침
  const refreshUser = () => {
    const user = getCurrentUser();
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  };

  // 사용자 정보 직접 업데이트
  const setUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    setUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}