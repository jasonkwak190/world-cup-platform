'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  // 토큰 정리 및 강제 로그아웃 함수
  const handleTokenCleanup = async () => {
    try {
      console.log('🧹 Cleaning up invalid tokens...');
      
      // 1. 로컬 스토리지/세션 완전 클리어
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // 2. Supabase 관련 쿠키 삭제
        const cookiesToClear = [
          'supabase-auth-token',
          'sb-refresh-token', 
          'sb-access-token',
          'supabase.auth.token'
        ];
        
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
          document.cookie = `${cookieName}=; Max-Age=0; path=/`;
        });
      }
      
      // 3. Supabase 로그아웃 시도 (에러 무시)
      try {
        await signOutFromSupabase();
      } catch (supabaseError) {
        console.warn('Supabase signout failed during cleanup:', supabaseError);
      }
      
      console.log('✅ Token cleanup completed');
    } catch (error) {
      console.error('Token cleanup error:', error);
    }
  };

  // 컴포넌트 마운트 시 사용자 정보 확인 (Supabase + localStorage fallback)
  useEffect(() => {
    let isSubscribed = true; // Prevent state updates if component unmounts
    
    const initializeAuth = async () => {
      try {
        // 1. Supabase에서 현재 사용자 확인
        const supabaseUser = await getCurrentSupabaseUser();
        
        if (!isSubscribed) return; // Component unmounted, don't update state
        
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
        
        // 2. Supabase에 사용자가 없으면 로그아웃 상태로 설정
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Invalid Refresh Token 에러 처리
        if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
          console.warn('🔄 Invalid refresh token detected, clearing auth state');
          await handleTokenCleanup();
        }
        
        if (isSubscribed) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    initializeAuth();

    // Supabase Auth 상태 변경 감지
    let subscription: any = null;
    try {
      const authListener = onAuthStateChange((supabaseUser, event) => {
        if (!isSubscribed) return; // Prevent state updates if component unmounted
        
        // TOKEN_REFRESHED 이벤트에서 에러 발생 시 처리
        if (event === 'TOKEN_REFRESHED' && !supabaseUser) {
          console.warn('🔄 Token refresh failed, cleaning up...');
          handleTokenCleanup();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }
        
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
      
      // Safer subscription handling
      if (authListener && typeof authListener === 'object') {
        if (authListener.data && authListener.data.subscription) {
          subscription = authListener.data.subscription;
        } else if (authListener.subscription) {
          subscription = authListener.subscription;
        } else if (typeof authListener.unsubscribe === 'function') {
          subscription = authListener; // Sometimes the listener itself has unsubscribe method
        }
      }
    } catch (error) {
      console.error('Auth state change listener error:', error);
    }

    return () => {
      isSubscribed = false; // Prevent state updates after unmount
      try {
        if (subscription) {
          if (typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          } else if (typeof subscription === 'function') {
            subscription(); // Some subscriptions are functions that unsubscribe when called
          }
        }
      } catch (error) {
        console.error('Subscription unsubscribe error:', error);
      }
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

  // 로그아웃 처리 (안전한 방식)
  const handleLogout = async () => {
    try {
      console.log('🔓 Starting secure logout...');
      
      // 1. 즉시 로컬 상태 초기화 (더 빠른 UI 반응)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // 2. 토큰 완전 정리 (handleTokenCleanup 사용)
      await handleTokenCleanup();
      
      // 3. Next.js router로 안전한 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
      
      console.log('✅ Secure logout completed');
    } catch (error) {
      console.error('Logout error:', error);
      // 오류가 발생해도 로컬 상태는 강제 초기화
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // 강제 클리어 및 리다이렉트
      try {
        await handleTokenCleanup();
      } catch (cleanupError) {
        console.error('Cleanup error during forced logout:', cleanupError);
      }
      
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
      
      console.log('⚠️ Forced logout due to error');
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
      
      // Supabase에 사용자가 없으면 인증되지 않은 상태로 설정
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
      }));
      
    } catch (error) {
      console.error('Refresh user error:', error);
      
      // Invalid Refresh Token 에러 처리
      if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
        console.warn('🔄 Invalid refresh token during refresh, cleaning up...');
        await handleTokenCleanup();
        setAuthState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
        }));
      }
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