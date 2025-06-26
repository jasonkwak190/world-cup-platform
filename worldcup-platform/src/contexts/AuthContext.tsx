'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, logout } from '@/utils/auth';
import { getCurrentSupabaseUser, signOutFromSupabase, onAuthStateChange } from '@/utils/supabaseAuth';
import type { User, AuthState } from '@/types/user';
import type { SupabaseUser } from '@/types/supabase';

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

  // 컴포넌트 마운트 시 사용자 정보 확인 (Supabase + localStorage fallback)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Supabase에서 현재 사용자 확인
        const supabaseUser = await getCurrentSupabaseUser();
        
        if (supabaseUser) {
          // Supabase 사용자를 기존 User 타입으로 변환
          const user: User = {
            id: supabaseUser.id,
            username: supabaseUser.username,
            email: supabaseUser.email,
            role: supabaseUser.role as 'user' | 'admin',
            createdAt: supabaseUser.created_at,
            profileImage: supabaseUser.profile_image_url || undefined
          };
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
        
        // 2. Supabase에 사용자가 없으면 localStorage 확인 (fallback)
        const localUser = getCurrentUser();
        setAuthState({
          user: localUser,
          isAuthenticated: !!localUser,
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

    // Supabase Auth 상태 변경 감지
    const { data: { subscription } } = onAuthStateChange((supabaseUser) => {
      if (supabaseUser) {
        const user: User = {
          id: supabaseUser.id,
          username: supabaseUser.username,
          email: supabaseUser.email,
          role: supabaseUser.role as 'user' | 'admin',
          createdAt: supabaseUser.created_at,
          profileImage: supabaseUser.profile_image_url || undefined
        };
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 로그인 처리
  const handleLogin = (user: User) => {
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  // 로그아웃 처리 (Supabase + localStorage)
  const handleLogout = async () => {
    try {
      // Supabase 로그아웃
      await signOutFromSupabase();
      
      // localStorage 로그아웃 (fallback)
      logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // 오류가 발생해도 로컬 상태는 초기화
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // 사용자 정보 새로고침 (Supabase + localStorage)
  const refreshUser = async () => {
    try {
      // Supabase에서 사용자 정보 확인
      const supabaseUser = await getCurrentSupabaseUser();
      
      if (supabaseUser) {
        const user: User = {
          id: supabaseUser.id,
          username: supabaseUser.username,
          email: supabaseUser.email,
          role: supabaseUser.role as 'user' | 'admin',
          createdAt: supabaseUser.created_at,
          profileImage: supabaseUser.profile_image_url || undefined
        };
        
        setAuthState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
        }));
        return;
      }
      
      // localStorage fallback
      const localUser = getCurrentUser();
      setAuthState(prev => ({
        ...prev,
        user: localUser,
        isAuthenticated: !!localUser,
      }));
      
    } catch (error) {
      console.error('Refresh user error:', error);
    }
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